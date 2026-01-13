'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg, DateSelectArg, EventClickArg } from '@fullcalendar/interaction';
import { formatters, withOrdinal, TZ } from '@/lib/dateUtils';
import type { Status, Location, Slot } from '@/types';
import { STATUSES, LOCATIONS, EVENTLOCATION, STATUS_LABELS } from '@/lib/constants';
import { emailToName, capitalize, addHours } from '@/lib/utils';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query as firestoreQuery, orderBy } from 'firebase/firestore';
import type { UserProfile } from '@/types';

/* ---------- helpers ---------- */
function toIsoLocal(d: Date) { 
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString(); 
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
  const onDateClick = useCallback((arg: DateClickArg) => {
    const start = arg.date;
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    openCreate(toIsoLocal(start), toIsoLocal(end));
  }, [currentUserEmail, users]);

  const onSelect = useCallback((arg: DateSelectArg) => {
    openCreate(arg.start.toISOString(), arg.end.toISOString());
  }, [currentUserEmail, users]);

  const onEventClick = useCallback((arg: EventClickArg) => {
    const s = slots.find((x) => x.id === arg.event.id);
    if (!s) return;
    setEditingId(s.id);
    setForm({ ...s });
    setOpen(true);
  }, [slots]);

  // Modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Slot>>({ 
    status: 'available', 
    location: 'UCLH', 
    capacity: 2 
  });

  function openCreate(startISO: string, endISO?: string) {
    setEditingId(null);
    setForm({ 
      supervisor: currentUserEmail || users[0]?.email || '',
      status: 'available', 
      location: 'UCLH', 
      start: startISO, 
      end: endISO || toIsoLocal(addHours(new Date(startISO), 1)), 
      capacity: 2, 
      bookings: 0 
    });
    setOpen(true);
  }

  function saveSlot() {
    if (!form.start || !form.end || !form.status) return;
    
    // Validation based on status
    if (form.status === 'event') {
      if (!form.title?.trim()) return;
    } else {
      if (!form.supervisor || !form.location) return;
      if (form.status === 'available' && !form.capacity) return;
    }

    if (editingId) {
      setSlots((prev) => prev.map((s) => 
        s.id === editingId ? { ...(s as Slot), ...(form as Slot), id: editingId } : s
      ));
    } else {
      const newSlot: Slot = {
        id: crypto.randomUUID(),
        supervisor: form.supervisor || '',
        status: form.status as Status,
        location: form.location as Location,
        start: form.start!,
        end: form.end!,
        capacity: form.status === 'available' ? Number(form.capacity) : 0,
        bookings: 0,
        title: form.status === 'event' ? form.title : undefined,
      };
      setSlots((prev) => [newSlot, ...prev]);
    }
    setOpen(false);
  }

  function deleteSlot() { 
    if (!editingId) return; 
    setSlots((p) => p.filter((s) => s.id !== editingId)); 
    setOpen(false); 
  }

  function book(id: string) { 
    setSlots((p) => p.map((s) => 
      (s.id === id && s.bookings < s.capacity ? { ...s, bookings: s.bookings + 1 } : s)
    )); 
  }

  // Only show "available to supervise" slots in the list
  const availableList = useMemo(
    () => slots
      .filter(filterFn)
      .filter((s) => s.status === 'available')
      .sort((a, b) => +new Date(a.start) - +new Date(b.start)),
    [slots, filterFn]
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
            timeZone={TZ}
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

      <div className="px-4 pb-8 space-y-2">
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
                <div className="text-sm text-gray-600">{s.location}</div>
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
                  {users.length === 0 ? (
                    <p className="text-sm text-gray-500">Loading users...</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {users.map((user) => (
                        <button
                          key={user.email}
                          type="button"
                          className={`px-3 py-1 rounded-full border ${
                            form.supervisor === user.email
                              ? 'bg-blue-50 border-blue-400 text-blue-700'
                              : 'bg-white'
                          }`}
                          onClick={() => setForm((f) => ({ ...f, supervisor: user.email }))}
                        >
                          {user.name}
                          {user.email === currentUserEmail && ' (You)'}
                        </button>
                      ))}
                    </div>
                  )}
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