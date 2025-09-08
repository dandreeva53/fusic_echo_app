'use client';
import { useMemo, useState } from 'react';

type User = {
  name: string;
  email: string;
  role: 'supervisor'|'fellow';
  accreditations: { fusic?: boolean; bseL1?: boolean; bseL2?: boolean };
};
const MOCK: User[] = [
  { name: 'Bob Peters', email: 'bob@uclh.nhs.uk', role: 'supervisor', accreditations: { fusic:true, bseL1:true } },
  { name: 'Carol Smith', email: 'carol@uclh.nhs.uk', role: 'fellow', accreditations: { fusic:true } },
];

export default function Directory() {
  const [q,setQ] = useState('');
  const [role,setRole] = useState<'all'|'supervisor'|'fellow'>('all');

  const filtered = useMemo(()=>MOCK.filter(u=>{
    const matchRole = role==='all' || u.role===role;
    const matchQ = [u.name,u.email].join(' ').toLowerCase().includes(q.toLowerCase());
    return matchRole && matchQ;
  }),[q,role]);

  return (
    <div className="grid gap-3">
      <h2 className="text-lg font-semibold">Directory</h2>
      <div className="flex gap-2">
        <input className="input" placeholder="Search name/email" value={q} onChange={e=>setQ(e.target.value)} />
        <select className="input" value={role} onChange={e=>setRole(e.target.value as any)}>
          <option value="all">All</option>
          <option value="supervisor">Supervisors</option>
          <option value="fellow">Fellows</option>
        </select>
      </div>
      {filtered.map(u=>(
        <div key={u.email} className="card">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{u.name} <span className="text-xs text-gray-500">({u.role})</span></div>
              <div className="text-sm">{u.email}</div>
            </div>
            <div className="text-xs text-gray-700">
              {['FUSIC','BSE L1','BSE L2'].filter((label,i)=>{
                const key = (['fusic','bseL1','bseL2'] as const)[i];
                return u.accreditations[key];
              }).join(' • ') || '—'}
            </div>
          </div>
        </div>
      ))}
      {filtered.length===0 && <p className="text-sm text-gray-500">No matches.</p>}
    </div>
  );
}
