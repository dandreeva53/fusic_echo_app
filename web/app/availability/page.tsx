'use client';
type Slot = { id:string; supervisor:string; start:string; end:string; status:'available'|'booked'|'blocked'; dailyCapForTrainee:number; bookedToday:number; };
const MOCK: Slot[] = [
  { id:'1', supervisor:'bob@uclh.nhs.uk', start:'2025-09-05T09:00:00Z', end:'2025-09-05T10:00:00Z', status:'available', dailyCapForTrainee:2, bookedToday:1 },
  { id:'2', supervisor:'bob@uclh.nhs.uk', start:'2025-09-05T10:00:00Z', end:'2025-09-05T11:00:00Z', status:'available', dailyCapForTrainee:1, bookedToday:1 },
];
export default function Availability() {
  return (
    <div className="grid gap-3">
      <h2 className="text-lg font-semibold">Availability</h2>
      {MOCK.map(s=>{
        const capReached = s.bookedToday >= s.dailyCapForTrainee;
        return (
          <div key={s.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">{new Date(s.start).toLocaleString()} → {new Date(s.end).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Supervisor: {s.supervisor} · Status: {s.status} · Cap per trainee: {s.dailyCapForTrainee}</div>
            </div>
            <button className="btn" disabled={s.status!=='available' || capReached}>
              {capReached ? 'Cap reached' : 'Book'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
