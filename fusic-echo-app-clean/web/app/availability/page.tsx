'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function Availability() {
  const email = auth.currentUser?.email?.toLowerCase() || '';
  const [slots, setSlots] = useState<any[]>([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [cap, setCap] = useState(2);

  const load = async () => {
    if (!email) return;
    const q = query(collection(db, 'schedules', email, 'slots'));
    const snap = await getDocs(q);
    setSlots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { load(); }, [email]);

  const createSlot = async () => {
    if (!email) return;
    await addDoc(collection(db, 'schedules', email, 'slots'), {
      supervisorId: email,
      start: new Date(start),
      end: new Date(end),
      status: 'available',
      dailyCapForTrainee: Number(cap) || 2,
      createdAt: new Date(), updatedAt: new Date()
    });
    await load();
  };

  const setStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'schedules', email, 'slots', id), { status, updatedAt: new Date() });
    await load();
  };

  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-semibold">Your Availability (create slots)</h2>
      <div className="card grid md:grid-cols-4 gap-2">
        <input className="input" type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} />
        <input className="input" type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)} />
        <input className="input" type="number" min={1} value={cap} onChange={e=>setCap(parseInt(e.target.value||'2',10))} placeholder="Daily cap (default 2)" />
        <button className="btn" onClick={createSlot}>Add slot</button>
      </div>

      <div className="grid gap-2">
        {slots.map(s => (
          <div key={s.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">{new Date(s.start.seconds? s.start.seconds*1000 : s.start).toLocaleString()} → {new Date(s.end.seconds? s.end.seconds*1000 : s.end).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Status: {s.status} · Daily trainee cap: {s.dailyCapForTrainee ?? 2}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={()=>setStatus(s.id,'available')}>Available</button>
              <button className="btn" onClick={()=>setStatus(s.id,'blocked')}>Block</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
