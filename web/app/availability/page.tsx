'use client';

import { useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg, DateSelectArg, EventClickArg } from '@fullcalendar/interaction';

type Status = 'available' | 'unavailable' | 'oncall';
type Location = 'UCLH' | 'WMS' | 'GWB';

type Slot = {
  id: string;
  supervisor: string;       // email
  status: Status;
  location: Location;
  start: string;            // ISO
  end: string;              // ISO
  capacity: number;         // total seats for this slot
  bookings: number;         // how many trainees booked
};

const INITIAL: Slot[] = [
  {
    id: crypto.randomUUID(),
    supervisor: 'bob@uclh.nhs.uk',
    status: 'available',
    location: 'UCLH',
    start: new Date().toISOString(),
    end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    capacity: 2,
    bookings: 1
  }
];

export default function Availability() {
  const [slots, setSlots] = useState<Slot[]>(INITIAL);
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const calRef = useRef<FullCalendar | null>(null);

  // Modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Slot>>({
    status: 'available',
    location: 'UCLH',
    capacity: 2
  });

  const events = useMemo(() => {
    return slots.map((s) => ({
      id: s.id,
      start: s.start,
      end: s.end,
      title: shortTitle(s),
      backgroundColor: s.status === 'available' ? '#10b981' : s.status === 'oncall' ? '#60a5fa' : '#9ca3af',
      borderColor: 'transparent',
      textColor: 'white'
    }));
  }, [slots]);

  function shortTitle(s: Slot) {
    // like “Bob Pet…” (Glide style)
    const name = s.supervisor.split('@')[0];
    const label = name.length > 8 ? name.slice(0, 8) + '…' : name;
    return label;
  }

  function openCreateAt(startISO: string, endISO?: string) {
    setEditingId(null);
    setForm({
      supervisor: 'carol@uclh.nhs.uk',
      status: 'available',
      location: 'UCLH',
      start: startISO,
      end: endISO || new Date(new Date(startISO).getTime() + 60 * 60 * 1000).toISOString(),
      capacity: 2,
      bookings: 0
    });
    setOpen(true);
  }

  function onDateClick(arg: DateClickArg) {
    // Clicked a day cell (month) or time slot (day/week)
    const start = arg.date;
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    openCreateAt(start.toISOString(), end.toISOString());
  }

  function onSelect(arg: DateSelectArg) {
    openCreateAt(arg.start.toISOString(), arg.end.toISOString());
  }

  function onEventClick(arg: EventClickArg) {
    const s = slots.find((x) => x.id === arg.event.id);
    if (!s) return;
    setEditingId(s.id);
    setForm({ ...s });
    setOpen(true);
  }

  function saveSlot() {
    if (!form.start || !form.end || !form.supervisor || !form.status || !form.location || !form.capacity) return;

    if (editingId) {
      setSlots((prev) =>
        prev.map((s) => (s.id === editingId ? { ...(s as Slot), ...(form as Slot), id: editingId } : s))
      );
    } else {
      const newSlot: Slot = {
        id: crypto.randomUUID(),
        supervisor: form.supervisor!,
        status: form.status as Status,
        location: form.location as Location,
        start: form.start!,
        end: form.end!,
        capacity: Number(form.capacity),
        bookings: Number(form.bookings) || 0
      };
      setSlots((prev) => [newSlot, ...prev]);
    }
    setOpen(false);
  }

  function deleteSlot() {
    if (!editingId) return;
    setSlots((prev) => prev.filter((s) => s.id !== editingId));
    setOpen(false);
  }

  function book(id: string) {
    setSlots((prev) =>
      prev.map((s) => (s.id === id && s.bookings < s.capacity ? { ...s, bookings: s.bookings + 1 } : s))
    );
  }

  // bottom section list: only show available + capacity left
  const availableList = useMemo(
    () =>
      slots
        .filter((s) => s.status === 'available')
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [slots]
  );

  return (
    <div className="space-y-4">
      {/* Blue header like Glide */}
      <div className="bg-blue-500 text-white p-4">
        <h1 className="text-lg font-semibold">Availability</h1>
        <input className="mt-2 w-full rounded-lg px-3 py-2 text-black" placeholder="Search (not wired yet)" />
      </div>

      {/* View switcher */}
      <div className="px-4">
        <div className="inline-flex rounded-xl border bg-white shadow-sm overflow-hidden">
          <button
            className={`px-3 py-2 text-sm ${view === 'dayGridMonth' ? 'bg-gray-100' : ''}`}
            onClick={() => setView('dayGridMonth')}
          >
            Month
          </button>
          <button
            className={`px-3 py-2 text-sm ${view === 'timeGridWeek' ? 'bg-gray-100' : ''}`}
            onClick={() => setView('timeGridWeek')}
          >
            Week
          </button>
          <button
            className={`px-3 py-2 text-sm ${view === 'timeGridDay' ? 'bg-gray-100' : ''}`}
            onClick={() => setView('timeGridDay')}
          >
            Day
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="px-4">
        <div className="bg-white rounded-xl shadow p-2">
          <FullCalendar
            ref={calRef as any}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={view}
            datesSet={(arg) => setView(arg.view.type as any)}
            headerToolbar={false}
            selectable
            selectMirror
            dayMaxEventRows
            events={events}
            dateClick={onDateClick}
            select={onSelect}
            eventClick={onEventClick}
            height="auto"
          />
        </div>
      </div>

      {/* Bottom list of available slots */}
      <div className="px-4 pb-8 space-y-2">
        <h2 className="text-sm font-semibold">Available timeslots</h2>
        {availableList.length === 0 && <p className="text-sm text-gray-500">No available slots.</p>}

        {availableList.map((s) => {
          const left = s.capacity - s.bookings;
          const disabled = left <= 0;
          return (
            <div key={s.id} className="bg-white rounded-xl shadow px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {new Date(s.start).toLocaleString()} → {new Date(s.end).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  {s.supervisor} • {s.location} • Capacity: {s.capacity} • Booked: {s.bookings}
                </div>
              </div>
              <button className="btn" disabled={disabled} onClick={() => book(s.id)}>
                {disabled ? 'Full' : 'Book'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Create/Edit modal */}
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

            {/* Status pills */}
            <div className="space-x-2">
              {(['available', 'unavailable', 'oncall'] as Status[]).map((s) => (
                <button
                  key={s}
                  className={`px-3 py-1 rounded-full border ${form.status === s ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white'}`}
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                >
                  {s === 'available' ? 'Available to supervise' : s === 'unavailable' ? 'Unavailable' : 'On-call'}
                </button>
              ))}
            </div>

            {/* Location chips */}
            <div>
              <div className="font-medium mb-1">Location</div>
              <div className="space-x-2">
                {(['UCLH', 'WMS', 'GWB'] as Location[]).map((loc) => (
                  <button
                    key={loc}
                    className={`px-3 py-1 rounded-full border ${form.location === loc ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white'}`}
                    onClick={() => setForm((f) => ({ ...f, location: loc }))}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Start / End */}
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

            {/* Person chips (supervisor) */}
            <div>
              <div className="font-medium mb-1">Person</div>
              <div className="flex flex-wrap gap-2">
                {['bob@uclh.nhs.uk', 'carol@uclh.nhs.uk', 'melanie@uclh.nhs.uk', 'daria@uclh.nhs.uk'].map((p) => (
                  <button
                    key={p}
                    className={`px-3 py-1 rounded-full border ${form.supervisor === p ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white'}`}
                    onClick={() => setForm((f) => ({ ...f, supervisor: p }))}
                  >
                    {emailToName(p)}
                  </button>
                ))}
              </div>
            </div>

            {/* Capacity */}
            <div>
              <div className="font-medium mb-1">Bookings available (capacity)</div>
              <input
                type="number"
                min={1}
                className="input"
                value={form.capacity ?? 1}
                onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value || '1', 10) }))}
              />
            </div>

            {/* Danger zone */}
            {editingId && (
              <div className="pt-2">
                <button className="w-full text-red-600 border border-red-300 rounded-xl py-2" onClick={deleteSlot}>
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

/* ---------- helpers ---------- */
function emailToName(email: string) {
  const name = email.split('@')[0].replace('.', ' ');
  return name[0].toUpperCase() + name.slice(1);
}
function isoToLocal(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 16);
}
function localToIso(local: string) {
  if (!local) return '';
  // treat local as local time, convert to ISO
  const d = new Date(local);
  return d.toISOString();
}
