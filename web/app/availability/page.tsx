'use client';

import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg, DateSelectArg, EventClickArg } from '@fullcalendar/interaction';

// robust way to get the CalendarApi regardless of ref shape
function getApiFromRef(ref: any) {
  if (!ref?.current) return null;
  const r: any = ref.current;
  return r.getApi?.() ?? r.calendar ?? null;
}

/* ---------- types ---------- */
type Status = 'available' | 'unavailable' | 'oncall';
type Location = 'UCLH' | 'WMS' | 'GWB';
type Slot = {
  id: string;
  supervisor: string;
  status: Status;
  location: Location;
  start: string;
  end: string;
  capacity: number;
  bookings: number;
};

/* ---------- constants & formatters ---------- */
const TZ = 'Europe/London';
const fmtTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });
const fmtTitle = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: TZ });
const fmtListDate = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ });
const fmtAxis = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TZ,
});

/* ---------- page component (client only) ---------- */
function AvailabilityClient() {
  const [slots, setSlots] = useState<Slot[]>([
    mkSlot('bob@uclh.nhs.uk', 'available', 'UCLH', 2, 0, 9, 10),
    mkSlot('carol@uclh.nhs.uk', 'oncall', 'WMS', 1, 0, 10, 11),
    mkSlot('melanie@uclh.nhs.uk', 'unavailable', 'GWB', 1, 0, 13, 14),
  ]);
  const [query, setQuery] = useState('');
  const calRef = useRef<any>(null);
  const [viewTitle, setViewTitle] = useState<string>('');

  const filterFn = (s: Slot) => {
    if (!query.trim()) return true;
    const name = emailToName(s.supervisor);
    return (name + ' ' + s.supervisor).toLowerCase().includes(query.toLowerCase());
  };

const events = useMemo(() => {
  return slots.filter(filterFn).map((s) => ({
    id: s.id,
    start: s.start,
    end: s.end,
    title: `${fmtTime.format(new Date(s.start))} ${cap(emailToName(s.supervisor))}`,
    color: s.status === 'available' ? '#16a34a' : s.status === 'oncall' ? '#f59e0b' : '#ef4444', // bg+border
    textColor: 'white',
  }));
}, [slots, query]);


  function onDateClick(arg: DateClickArg) {
    const start = arg.date;
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    openCreate(toIsoLocal(start), toIsoLocal(end));
  }
  function onSelect(arg: DateSelectArg) { openCreate(arg.start.toISOString(), arg.end.toISOString()); }
  function onEventClick(arg: EventClickArg) {
    const s = slots.find((x) => x.id === arg.event.id); if (!s) return;
    setEditingId(s.id); setForm({ ...s }); setOpen(true);
  }
  function datesSet(arg: any) { setViewTitle(fmtTitle.format(arg.view.currentStart)); }


  // modal state + CRUD
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Slot>>({ status: 'available', location: 'UCLH', capacity: 2 });

  function openCreate(startISO: string, endISO?: string) {
    setEditingId(null);
    setForm({ supervisor: 'carol@uclh.nhs.uk', status: 'available', location: 'UCLH', start: startISO, end: endISO || toIsoLocal(addHours(new Date(startISO), 1)), capacity: 2, bookings: 0 });
    setOpen(true);
  }
  function saveSlot() {
    if (!form.start || !form.end || !form.supervisor || !form.status || !form.location || !form.capacity) return;
    if (editingId) {
      setSlots((prev) => prev.map((s) => (s.id === editingId ? { ...(s as Slot), ...(form as Slot), id: editingId } : s)));
    } else {
      setSlots((prev) => [{
        id: crypto.randomUUID(),
        supervisor: form.supervisor!, status: form.status as Status, location: form.location as Location,
        start: form.start!, end: form.end!, capacity: Number(form.capacity), bookings: Number(form.bookings) || 0,
      }, ...prev]);
    }
    setOpen(false);
  }
  function deleteSlot() { if (!editingId) return; setSlots((p)=>p.filter((s)=>s.id!==editingId)); setOpen(false); }
  function book(id: string) { setSlots((p)=>p.map((s)=> (s.id===id && s.bookings<s.capacity ? {...s, bookings:s.bookings+1}:s))); }

  const availableList = useMemo(
    () => slots.filter(filterFn).filter((s)=>s.status==='available')
              .sort((a,b)=>+new Date(a.start)-+new Date(b.start)),
    [slots, query]
  );

  return (
    <div className="space-y-4">
      <div className="bg-blue-500 text-white p-4">
        <h1 className="text-lg font-semibold">Availability</h1>
        <input className="mt-2 w-full rounded-lg px-3 py-2 text-black" placeholder="Search by supervisor"
               value={query} onChange={(e)=>setQuery(e.target.value)} />
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

          /* ✅ put title + prev/next + view switcher INSIDE the calendar */
          headerToolbar={{
            left: 'prev,next',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}

          /* ✅ hide FC’s built-in event time (we show our own “09:00 Bob”) */
          displayEventTime={false}

          /* ✅ clean weekday labels (no numbers like “04 Sun”) */
          dayHeaderFormat={{ weekday: 'short' }}

          /* ✅ 24h slot labels in week/day views */
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          /* 24h axis labels forced to Europe/London */
          slotLabelContent={(arg) => fmtAxis.format(arg.date)}

          /* handlers (unchanged) */
          dateClick={onDateClick}
          select={onSelect}
          eventClick={onEventClick}
          />
        </div>
      </div>

      <div className="px-4 pb-8 space-y-2">
        <h2 className="text-sm font-semibold">Available timeslots</h2>
        {availableList.length===0 && <p className="text-sm text-gray-500">No available slots.</p>}
        {availableList.map((s)=>{
          const left = s.capacity - s.bookings; const disabled = left<=0;
          return (
            <div key={s.id} className="bg-white rounded-xl shadow px-4 py-3">
              <div className="text-sm text-gray-700">{withOrdinal(fmtListDate, new Date(s.start))}</div>
              <div className="font-semibold">{fmtTime.format(new Date(s.start))} - {fmtTime.format(new Date(s.end))}</div>
              <div className="text-sm text-gray-700">{cap(emailToName(s.supervisor))} — {statusLabel(s.status)}</div>
              <div className="mt-1 flex items-center justify-between">
                <div className="text-sm text-gray-600">{s.location}</div>
                <button className="btn" disabled={disabled} onClick={()=>book(s.id)}>{disabled?'Full':'Book'}</button>
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <button className="text-blue-600" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="text-blue-600 font-semibold" onClick={saveSlot}>Submit</button>
            </div>

            <div className="space-x-2">
              {(['available','unavailable','oncall'] as Status[]).map((s)=>(
                <button key={s}
                  className={`px-3 py-1 rounded-full border ${form.status===s?'bg-blue-50 border-blue-400 text-blue-700':'bg-white'}`}
                  onClick={()=>setForm((f)=>({...f, status:s}))}>
                  {statusLabel(s)}
                </button>
              ))}
            </div>

            <div>
              <div className="font-medium mb-1">Location</div>
              <div className="space-x-2">
                {(['UCLH','WMS','GWB'] as Location[]).map((loc)=>(
                  <button key={loc}
                    className={`px-3 py-1 rounded-full border ${form.location===loc?'bg-blue-50 border-blue-400 text-blue-700':'bg-white'}`}
                    onClick={()=>setForm((f)=>({...f, location:loc}))}>
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <div className="font-medium mb-1">Start time</div>
                <input type="datetime-local" className="input"
                       value={isoToLocal(form.start)}
                       onChange={(e)=>setForm((f)=>({...f, start: localToIso(e.target.value)}))}/>
              </div>
              <div>
                <div className="font-medium mb-1">End time</div>
                <input type="datetime-local" className="input"
                       value={isoToLocal(form.end)}
                       onChange={(e)=>setForm((f)=>({...f, end: localToIso(e.target.value)}))}/>
              </div>
            </div>

            <div>
              <div className="font-medium mb-1">Person</div>
              <div className="flex flex-wrap gap-2">
                {['bob@uclh.nhs.uk','carol@uclh.nhs.uk','melanie@uclh.nhs.uk','daria@uclh.nhs.uk'].map((p)=>(
                  <button key={p}
                    className={`px-3 py-1 rounded-full border ${form.supervisor===p?'bg-blue-50 border-blue-400 text-blue-700':'bg-white'}`}
                    onClick={()=>setForm((f)=>({...f, supervisor:p}))}>
                    {cap(emailToName(p))}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="font-medium mb-1">Bookings available (capacity)</div>
              <input type="number" min={1} className="input"
                     value={form.capacity ?? 1}
                     onChange={(e)=>setForm((f)=>({...f, capacity: parseInt(e.target.value||'1',10)}))}/>
            </div>

            {editingId && (
              <div className="pt-2">
                <button className="w-full text-red-600 border border-red-300 rounded-xl py-2" onClick={deleteSlot}>Delete</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */
function emailToName(email: string) { return email.split('@')[0].replace('.', ' '); }
function cap(s: string) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function addHours(d: Date, h: number) { const n = new Date(d); n.setHours(n.getHours()+h); return n; }
function toIsoLocal(d: Date) { return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString(); }
function isoToLocal(iso?: string) { if (!iso) return ''; const d = new Date(iso); const z = new Date(d.getTime()-d.getTimezoneOffset()*60000); return z.toISOString().slice(0,16); }
function localToIso(local: string) { return local ? new Date(local).toISOString() : ''; }
function statusLabel(s: Status) { return s==='available'?'Available to supervise': s==='oncall'?'On-call':'Unavailable'; }
function withOrdinal(baseFmt: Intl.DateTimeFormat, date: Date) {
  const day = parseInt(new Intl.DateTimeFormat('en-GB', { day:'numeric', timeZone: TZ }).format(date), 10);
  const ord = (n:number)=>(n%10===1&&n%100!==11?'st':n%10===2&&n%100!==12?'nd':n%10===3&&n%100!==13?'rd':'th');
  const parts = baseFmt.formatToParts(date);
  return parts.map(p=> p.type==='day' ? `${day}${ord(day)}` : p.value).join('');
}
function mkSlot(supervisor: string, status: Status, location: Location, cap: number, booked: number, startH: number, endH: number): Slot {
  const d = new Date(); d.setHours(0,0,0,0);
  const start = new Date(d); start.setHours(startH,0,0,0);
  const end = new Date(d); end.setHours(endH,0,0,0);
  return { id: crypto.randomUUID(), supervisor, status, location, start: start.toISOString(), end: end.toISOString(), capacity: cap, bookings: booked };
}

/* 👉 export the page as client-only */
export default dynamic(() => Promise.resolve(AvailabilityClient), { ssr: false });
