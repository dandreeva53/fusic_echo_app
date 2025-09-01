'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Directory() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      setUsers(snap.docs.map(d => d.data()));
    });
  }, []);

  return (
    <div className="grid gap-3">
      <h2 className="text-lg font-semibold">Directory</h2>
      {users.map(u => (
        <div key={u.email} className="card">
          <div className="font-medium">{u.name} <span className="text-xs text-gray-500">({u.role})</span></div>
          <div className="text-sm">{u.email}</div>
          <div className="text-sm">Accreditations: {['fusic','bseL1','bseL2'].filter(k=>u.accreditations?.[k]).join(', ') || '—'}</div>
        </div>
      ))}
    </div>
  );
}
