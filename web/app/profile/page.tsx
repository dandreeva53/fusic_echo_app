'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Profile() {
  const [me, setMe] = useState<any>(null);
  const email = auth.currentUser?.email?.toLowerCase() || '';

  useEffect(() => {
    if (!email) return;
    getDoc(doc(db, 'users', email)).then(s => setMe({ id: email, ...s.data() }));
  }, [email]);

  const save = async () => {
    if (!email) return;
    await setDoc(doc(db, 'users', email), me, { merge: true });
    alert('Saved');
  };

  if (!email) return <p>Please sign in.</p>;
  if (!me) return <p>Loading…</p>;

  return (
    <div className="card space-y-3">
      <h2 className="text-lg font-semibold">Your profile</h2>
      <label className="label">Name</label>
      <input className="input" value={me.name||''} onChange={e=>setMe({...me, name:e.target.value})} />

      <label className="label">Role</label>
      <select className="input" value={me.role||'fellow'} onChange={e=>setMe({...me, role:e.target.value})}>
        <option value="fellow">Fellow (trainee)</option>
        <option value="supervisor">Supervisor</option>
      </select>

      <fieldset className="grid grid-cols-3 gap-2">
        <label className="flex items-center gap-2"><input type="checkbox" checked={me.accreditations?.fusic||false} onChange={e=>setMe({...me, accreditations:{...me.accreditations, fusic:e.target.checked}})} />FUSIC</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={me.accreditations?.bseL1||false} onChange={e=>setMe({...me, accreditations:{...me.accreditations, bseL1:e.target.checked}})} />BSE L1</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={me.accreditations?.bseL2||false} onChange={e=>setMe({...me, accreditations:{...me.accreditations, bseL2:e.target.checked}})} />BSE L2</label>
      </fieldset>

      <button className="btn" onClick={save}>Save</button>
    </div>
  );
}
