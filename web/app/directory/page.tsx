'use client';
import Link from 'next/link';
import { useState, useMemo } from 'react';

import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/users';

const [users, setUsers] = useState<UserProfile[]>([]);

useEffect(() => {
  const qRef = query(collection(db, 'users'), orderBy('name'));
  const unsub = onSnapshot(qRef, (snap) => {
    const out: UserProfile[] = [];
    snap.forEach((d) => out.push(d.data() as UserProfile));
    setUsers(out);
  });
  return () => unsub();
}, []);

type User = {
  name: string;
  email: string;
  role: 'Supervisor' | 'Fellow';
  accreditations: string[];
  about?: string;
};

export default function Directory() {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    return MOCK.filter(u =>
      [u.name, u.email].join(' ').toLowerCase().includes(q.toLowerCase())
    );
  }, [q]);

  const grouped = useMemo(() => {
    return {
      Supervisor: filtered.filter(u => u.role === 'Supervisor'),
      Fellow: filtered.filter(u => u.role === 'Fellow'),
    };
  }, [filtered]);

  return (
    <div>
      <div className="bg-blue-500 text-white p-4">
        <h1 className="text-lg font-semibold">ECHO group</h1>
        <input
          className="mt-2 w-full rounded-lg px-3 py-2 text-black"
          placeholder="Search"
          value={q}
          onChange={e=>setQ(e.target.value)}
        />
      </div>

      <div className="p-4 space-y-6">
        {Object.entries(grouped).map(([role, users]) => (
          <div key={role}>
            <h2 className="text-sm font-semibold mb-2">{role}</h2>
            <div className="space-y-3">
              {users.map(u=>(
                <Link key={u.email} href={`/directory/${encodeURIComponent(u.email)}`}>
                  <div className="bg-white rounded-xl shadow px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </div>
                    <span className="text-gray-400">›</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
