'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type FullCalendarType from '@fullcalendar/react';
const FullCalendar = dynamic(
  async () => (await import('@fullcalendar/react')).default,
  { ssr: false }
) as unknown as typeof FullCalendarType;
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import { formatters, withOrdinal, TZ } from '@/lib/dateUtils';
import type { Status, Location, Slot } from '@/lib/types';
import { STATUSES, LOCATIONS, EVENTLOCATION, STATUS_LABELS } from '@/lib/constants';
import { emailToName, capitalize, addHours } from '@/lib/utils';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import {
  collection,
  onSnapshot,
  query as firestoreQuery,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  deleteDoc as deleteDocFS,
  getDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';

/* ---------- helpers ---------- */
function toIsoLocal(d: Date) { 
  // Convert to ISO string maintaining local timezone
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function isoToLocal(iso?: string) { 
  if (!iso) return ''; 
  const d = new Date(iso); 
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); 
  return z.toISOString().slice(0, 16); 
}

function localToIso(local: string) { 
  return local ? new Date(local).toISOString() : ''; 
}

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/* ---------- main component ---------- */
function CalendarClient() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const calRef = useRef<any>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const memoizedSlots = useMemo(() => slots, [slots]);

  // Load all users from Firebase with error handling
  useEffect(() => {
    const qRef = firestoreQuery(collection(db, 'users'), orderBy('name'));
    const unsub = onSnapshot(
      qRef, 
      (snap) => {
        const loadedUsers: UserProfile[] = [];
        snap.forEach((d) => loadedUsers.push(d.data() as UserProfile));
        setUsers(loadedUsers);
      },
      (error) => {
        console.error('Error loading users:', error);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
  const qRef = firestoreQuery(collection(db, 'slots'), orderBy('start', 'asc'));
  const unsub = onSnapshot(
    qRef,
    (snap) => {
      const loaded: Slot[] = [];
      snap.forEach((d) => loaded.push({ id: d.id, ...(d.data() as Omit<Slot, 'id'>) }));
      setSlots(loaded);
    },
    (error) => console.error('Error loading slots:', error)
  );
  return () => unsub();
  }, []);

  // Get current user email with error handling
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(
      (user) => {
        if (user?.email) {
          setCurrentUserEmail(user.email);
        }
      },
      (error) => {
        console.error('Auth error:', error);
      }
    );
    return () => unsub();
  }, []);

  // Create a map of emails to names for efficient lookup
  const emailToNameMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(user => {
      map.set(user.email, user.name);
    });
    return map;
  }, [users]);

  // Optimized filter function
  const filterFn = useCallback((s: Slot) => {
    if (!debouncedQuery.trim()) return true;
    const name = emailToNameMap.get(s.supervisor) || emailToName(s.supervisor);
    const title = s.title || '';
    const searchText = `${name} ${s.supervisor} ${title}`.toLowerCase();
    return searchText.includes(debouncedQuery.toLowerCase());
  }, [debouncedQuery, emailToNameMap]);

  // Memoized events for calendar
  const events = useMemo(() => {
    return slots.filter(filterFn).map((s) => {
      let displayTitle = '';
      let color = '#16a34a'; // green for available

      if (s.status === 'event') {
        displayTitle = s.title || 'Event';
        color = '#3b82f6'; // blue for events
      } else {
        const supervisorName = emailToNameMap.get(s.supervisor) || emailToName(s.supervisor);
        displayTitle = `${formatters.time.format(new Date(s.start))} ${capitalize(supervisorName)}`;
        color = s.status === 'available' ? '#16a34a' : '#ef4444'; // green or red
      }

      return {
        id: s.id,
        start: s.start,
        end: s.end,
        title: displayTitle,
        color: color,
        textColor: 'white',
      };
    });
  }, [slots, filterFn, emailToNameMap]);

  // Calendar event handlers
  const onDateClick = useCallback((arg: { date: Date; dateStr: string; allDay: boolean }) => {
    const start = arg.date;
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    openCreate(toIsoLocal(start), toIsoLocal(end));
  }, [currentUserEmail, users]);

  const onSelect = useCallback((arg: { start: Date; end: Date; allDay: boolean }) => {
    openCreate(arg.start.toISOString(), arg.end.toISOString());
  }, [currentUserEmail, users]);

  const onEventClick = useCallback((arg: EventClickArg) => {
  const s = slots.find((x) => x.id === arg.event.id);
  if (!s) return;

    // Allow editing only if you created it (or if you decide events are editable by everyone)
  if (s.status !== 'event' && s.supervisor !== currentUserEmail) {
    alert("You can’t edit someone else’s slot.");
    return;
  }
  // If it's a supervise/unavailable slot, keep supervisor as whoever owns it.
  // (If you truly want it always to be the signed-in user, force it here,
  // but that would "steal" ownership when clicking others' slots.)
  setEditingId(s.id);
  setForm({ ...s });
  setOpen(true);
  }, [slots, currentUserEmail]);

  // Modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Slot>>({ 
    status: 'available', 
    location: 'UCLH', 
    capacity: 2 
  });

function openCreate(startISO: string, endISO?: string) {
  if (!currentUserEmail) {
    alert('You must be signed in to create a slot');
    return;
  }

  setEditingId(null);
  setForm({
    supervisor: currentUserEmail, // <- locked to signed-in user
    status: 'available',
    location: 'UCLH',
    start: startISO,
    end: endISO || toIsoLocal(addHours(new Date(startISO), 1)),
    capacity: 2,
    bookings: 0,
    bookedBy: [],
  });
  setOpen(true);
}

async function saveSlot() {
  if (!form.start || !form.end || !form.status) return;

  // Validate
  if (form.status === 'event') {
    if (!form.title?.trim()) return;
  } else {
    if (!currentUserEmail) {
      alert('You must be signed in to create/edit a slot');
      return;
    }
    if (!form.location) return;
    if (form.status === 'available' && !form.capacity) return;

    // Lock supervisor to signed-in user
    form.supervisor = currentUserEmail;
  }
  
  if (!currentUserEmail) {
  alert('You must be signed in');
  return;
  }

  try {
        const payloadBase: Omit<Slot, 'id' | 'title'> = {
      supervisor: currentUserEmail, // ✅ always set, even for events
      status: form.status as Status,
      location: (form.location as Location) || 'UCLH',
      start: form.start!,
      end: form.end!,
      capacity: form.status === 'available' ? Number(form.capacity) : 0,
      bookings: form.bookings ? Number(form.bookings) : 0,
      bookedBy: form.bookedBy || [],
      };

    // Only add title for events (never write undefined)
    const payload =
      form.status === 'event'
        ? { ...payloadBase, title: (form.title || 'Event').trim() }
        : payloadBase;

    if (editingId) {
      await updateDoc(doc(db, 'slots', editingId), payload as any);
    } else {
      const ref = doc(collection(db, 'slots'));
      await setDoc(ref, payload as any);
    }

    setOpen(false);
  } catch (e) {
    console.error('Save slot failed:', e);
    alert((e as any)?.message || 'Could not save slot. Check console for details.');
  }
}

async function deleteSlot() {
  if (!editingId) return;
  try {
    await deleteDocFS(doc(db, 'slots', editingId));
    setOpen(false);
  } catch (e) {
    console.error('Delete failed:', e);
    alert('Could not delete slot.');
  }
}


async function deleteSlotById(id: string) {
  try {
    await deleteDocFS(doc(db, 'slots', id));
  } catch (e) {
    console.error('Delete failed:', e);
    alert('Could not delete slot.');
  }
}


async function book(id: string) {
  if (!currentUserEmail) {
    alert('You must be signed in to book');
    return;
  }

  const ref = doc(db, 'slots', id);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const s = snap.data() as Slot;

    const bookedBy = s.bookedBy || [];
    if (bookedBy.includes(currentUserEmail)) {
      alert('You have already booked this slot');
      return;
    }

    if (s.bookings >= s.capacity) {
      alert('Slot is full');
      return;
    }

    await updateDoc(ref, {
      bookings: increment(1),
      bookedBy: arrayUnion(currentUserEmail),
    });
  } catch (e) {
    console.error('Booking failed:', e);
    alert('Could not book slot.');
  }
}


async function unbook(id: string) {
  if (!currentUserEmail) {
    alert('You must be signed in to unbook');
    return;
  }

  const ref = doc(db, 'slots', id);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const s = snap.data() as Slot;
    const bookedBy = s.bookedBy || [];
    if (!bookedBy.includes(currentUserEmail)) return;

    await updateDoc(ref, {
      bookings: increment(-1),
      bookedBy: arrayRemove(currentUserEmail),
    });
  } catch (e) {
    console.error('Unbook failed:', e);
    alert('Could not unbook slot.');
  }
}



  // Available slots (not booked by current user, not created by current user)
  const availableList = useMemo(
    () => memoizedSlots
      .filter(filterFn)
      .filter((s) => s.status === 'available')
      .filter((s) => s.supervisor !== currentUserEmail)
      .filter((s) => !s.bookedBy?.includes(currentUserEmail))
      .sort((a, b) => +new Date(a.start) - +new Date(b.start)),
    [memoizedSlots, filterFn, currentUserEmail]
  );

  // Booked slots (booked by current user)
  const bookedList = useMemo(
    () => slots
      .filter(filterFn)
      .filter((s) => s.status === 'available')
      .filter((s) => s.bookedBy?.includes(currentUserEmail))
      .sort((a, b) => +new Date(a.start) - +new Date(b.start)),
    [slots, filterFn, currentUserEmail]
  );

  // Created slots (created by current user)
  const createdList = useMemo(
    () => slots
      .filter(filterFn)
      .filter((s) => s.status === 'available')
      .filter((s) => s.supervisor === currentUserEmail)
      .sort((a, b) => +new Date(a.start) - +new Date(b.start)),
    [slots, filterFn, currentUserEmail]
  );

  return (
    <div className="space-y-4">
      <div className="bg-blue-500 text-white p-4">
        <h1 className="text-lg font-semibold">Calendar</h1>
        <input 
          className="mt-2 w-full rounded-lg px-3 py-2 text-black" 
          placeholder="Search by supervisor or event"
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
        />
      </div>

      <div className="px-4">
        <div className="bg-white rounded-xl shadow p-2">
          <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            timeZone="local"
            height="auto"
            selectable
            selectMirror
            dayMaxEventRows
            events={events}
            headerToolbar={{
              left: 'prev,next',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            displayEventTime={false}
            dayHeaderFormat={{ weekday: 'short' }}
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            slotLabelContent={(arg) => formatters.axis.format(arg.date)}
            dateClick={onDateClick}
            select={onSelect}
            eventClick={onEventClick}
          />
        </div>
      </div>

      {/* Available timeslots */}
      <div className="px-4 pb-4 space-y-2">
        <h2 className="text-sm font-semibold">Available timeslots</h2>
        {availableList.length === 0 && (
          <p className="text-sm text-gray-500">No available slots.</p>
        )}
        {availableList.map((s) => {
          const left = s.capacity - s.bookings;
          const disabled = left <= 0;
          const supervisorName = emailToNameMap.get(s.supervisor) || emailToName(s.supervisor);
          
          return (
            <div key={s.id} className="bg-white rounded-xl shadow px-4 py-3">
              <div className="text-sm text-gray-700">
                {withOrdinal(formatters.listDate, new Date(s.start))}
              </div>
              <div className="font-semibold">
                {formatters.time.format(new Date(s.start))} - {formatters.time.format(new Date(s.end))}
              </div>
              <div className="text-sm text-gray-700">
                {capitalize(supervisorName)} — {STATUS_LABELS[s.status]}
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {s.location} • {left} {left === 1 ? 'space' : 'spaces'} available
                </div>
                <button 
                  className="btn" 
                  disabled={disabled} 
                  onClick={() => book(s.id)}
                >
                  {disabled ? 'Full' : 'Book'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booked slots */}
      <div className="px-4 pb-4 space-y-2">
        <h2 className="text-sm font-semibold">Booked</h2>
        {bookedList.length === 0 && (
          <p className="text-sm text-gray-500">You haven't booked any slots yet.</p>
        )}
        {bookedList.map((s) => {
          const supervisorName = emailToNameMap.get(s.supervisor) || emailToName(s.supervisor);
          
          return (
            <div key={s.id} className="bg-green-50 rounded-xl shadow px-4 py-3 border border-green-200">
              <div className="text-sm text-gray-700">
                {withOrdinal(formatters.listDate, new Date(s.start))}
              </div>
              <div className="font-semibold">
                {formatters.time.format(new Date(s.start))} - {formatters.time.format(new Date(s.end))}
              </div>
              <div className="text-sm text-gray-700">
                {capitalize(supervisorName)} — {STATUS_LABELS[s.status]}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {s.location}
              </div>
              <div className="mt-2 flex justify-end">
                <button className="btn" onClick={() => unbook(s.id)}>
                  Unbook
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Created slots */}
      <div className="px-4 pb-8 space-y-2">
        <h2 className="text-sm font-semibold">Created by you</h2>
        {createdList.length === 0 && (
          <p className="text-sm text-gray-500">You haven't created any slots yet.</p>
        )}
        {createdList.map((s) => {
          const bookedUsers = s.bookedBy || [];
          
          return (
            <div key={s.id} className="bg-blue-50 rounded-xl shadow px-4 py-3 border border-blue-200">
              <div className="text-sm text-gray-700">
                {withOrdinal(formatters.listDate, new Date(s.start))}
              </div>
              <div className="font-semibold">
                {formatters.time.format(new Date(s.start))} - {formatters.time.format(new Date(s.end))}
              </div>
              <div className="text-sm text-gray-700">
                {STATUS_LABELS[s.status]} — {s.location}
              </div>
              <div className="mt-2">
                <div className="text-xs font-semibold text-gray-600 uppercase">
                  Bookings ({s.bookings}/{s.capacity})
                </div>
                {bookedUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-1">No bookings yet</p>
                ) : (
                  <div className="mt-1 space-y-1">
                    {bookedUsers.map((email) => {
                      const name = emailToNameMap.get(email) || emailToName(email);
                      return (
                        <div key={email} className="text-sm">
                          • {capitalize(name)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  className="text-red-600 border border-red-300 rounded-xl px-3 py-1"
                  onClick={() => deleteSlotById(s.id)}
                >
                  Delete slot
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <button className="text-blue-600" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="text-blue-600 font-semibold" onClick={saveSlot}>
                Submit
              </button>
            </div>

            <div className="space-x-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  className={`px-3 py-1 rounded-full border ${
                    form.status === s
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'bg-white'
                  }`}
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {/* Event-specific fields */}
            {form.status === 'event' && (
              <>
                <div>
                  <div className="font-medium mb-1">Event Title *</div>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Enter event title"
                    value={form.title || ''}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <div className="font-medium mb-1">Location (optional)</div>
                  <div className="space-x-2">
                    {EVENTLOCATION.map((loc) => (
                      <button
                        key={loc}
                        className={`px-3 py-1 rounded-full border ${
                          form.location === loc
                            ? 'bg-blue-50 border-blue-400 text-blue-700'
                            : 'bg-white'
                        }`}
                        onClick={() => setForm((f) => ({ ...f, location: loc }))}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Supervisor-specific fields */}
            {form.status !== 'event' && (
              <>
                <div>
                  <div className="font-medium mb-1">Location</div>
                  <div className="space-x-2">
                    {LOCATIONS.map((loc) => (
                      <button
                        key={loc}
                        className={`px-3 py-1 rounded-full border ${
                          form.location === loc
                            ? 'bg-blue-50 border-blue-400 text-blue-700'
                            : 'bg-white'
                        }`}
                        onClick={() => setForm((f) => ({ ...f, location: loc }))}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-1">Person</div>
                  <div className="text-sm text-gray-700">
                    {(emailToNameMap.get(currentUserEmail) || emailToName(currentUserEmail)) ? (
                      <>
                        {capitalize(emailToNameMap.get(currentUserEmail) || emailToName(currentUserEmail))} (You)
                      </>
                    ) : (
                      'You'
                    )}
                  </div>
                </div>


                {/* Only show capacity for "available to supervise" */}
                {form.status === 'available' && (
                  <div>
                    <div className="font-medium mb-1">Bookings available (capacity)</div>
                    <input
                      type="number"
                      min={1}
                      className="input"
                      value={form.capacity ?? 1}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, capacity: parseInt(e.target.value || '1', 10) }))
                      }
                    />
                  </div>
                )}
              </>
            )}

            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <div className="font-medium mb-1">Start time</div>
                <input
                  type="datetime-local"
                  className="input"
                  value={isoToLocal(form.start)}
                  onChange={(e) => setForm((f) => ({ ...f, start: localToIso(e.target.value) }))}
                />
              </div>
              <div>
                <div className="font-medium mb-1">End time</div>
                <input
                  type="datetime-local"
                  className="input"
                  value={isoToLocal(form.end)}
                  onChange={(e) => setForm((f) => ({ ...f, end: localToIso(e.target.value) }))}
                />
              </div>
            </div>

            {editingId && (
              <div className="pt-2">
                <button
                  className="w-full text-red-600 border border-red-300 rounded-xl py-2"
                  onClick={deleteSlot}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* Export the page as client-only */
export default dynamic(() => Promise.resolve(CalendarClient), { ssr: false });