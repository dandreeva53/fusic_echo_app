'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export default function Logbook() {
  const email = auth.currentUser?.email?.toLowerCase() || '';
  const [list, setList] = useState<any[]>([]);

  const [date, setDate] = useState('');
  const [indication, setIndication] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [bmi, setBmi] = useState('');
  const [summary, setSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [comments, setComments] = useState('');

  const load = async () => {
    if (!email) return;
    const q = query(collection(db, 'logbookEntries'), where('ownerUid','==',email));
    const snap = await getDocs(q);
    setList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { load(); }, [email]);

  const add = async () => {
    if (!email) return;
    await addDoc(collection(db, 'logbookEntries'), {
      ownerUid: email,
      date: new Date(date),
      indication,
      demographics: { age, gender, bmi },
      summary,
      notes, diagnosis, comments,
      views: {}, findings: {},
      directlyObserved: false,
      imageQuality: null,
      locked: false,
      createdAt: new Date(), updatedAt: new Date()
    });
    setDate(''); setIndication(''); setAge(''); setGender(''); setBmi(''); setSummary(''); setNotes(''); setDiagnosis(''); setComments('');
    await load();
  };

  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-semibold">Logbook</h2>
      <div className="card grid md:grid-cols-3 gap-2">
        <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <input className="input" placeholder="Indication" value={indication} onChange={e=>setIndication(e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <input className="input" placeholder="Age" value={age} onChange={e=>setAge(e.target.value)} />
          <input className="input" placeholder="Gender" value={gender} onChange={e=>setGender(e.target.value)} />
          <input className="input" placeholder="BMI" value={bmi} onChange={e=>setBmi(e.target.value)} />
        </div>
        <textarea className="input md:col-span-3" placeholder="Summary" value={summary} onChange={e=>setSummary(e.target.value)} />
        <input className="input" placeholder="Diagnosis" value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} />
        <input className="input" placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)} />
        <input className="input" placeholder="Comments" value={comments} onChange={e=>setComments(e.target.value)} />
        <button className="btn md:col-span-3" onClick={add}>Add entry</button>
      </div>

      <div className="grid gap-2">
        {list.map(e => (
          <div key={e.id} className="card">
            <div className="font-medium">{new Date(e.date.seconds? e.date.seconds*1000 : e.date).toLocaleDateString()} — {e.indication}</div>
            <div className="text-sm text-gray-600">Age {e.demographics?.age || '—'}, Gender {e.demographics?.gender || '—'}, BMI {e.demographics?.bmi || '—'}</div>
            <div className="text-sm">Diagnosis: {e.diagnosis || '—'}</div>
            <div className="text-sm">Notes: {e.notes || '—'}</div>
            <div className="text-sm">Comments: {e.comments || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
