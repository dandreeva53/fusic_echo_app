'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';

function getInitials(fullName: string | undefined | null) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0][0] ?? '?').toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function DirectoryPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    const qRef = query(collection(db, 'users'), orderBy('name'));
    const unsub = onSnapshot(qRef, (snap) => {
      const out: UserProfile[] = [];
      snap.forEach((d) => out.push(d.data() as UserProfile));
      setUsers(out);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term
      ? users.filter(
          (u) =>
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            (u.role || '').toLowerCase().includes(term)
        )
      : users;
    return list;
  }, [users, q]);

  const supervisors = filtered.filter((u) => u.role === 'Supervisor');
  const fellows = filtered.filter((u) => u.role === 'Fellow');

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">ECHO group</h1>
      <input
        className="w-full rounded-lg border px-3 py-2 mb-4"
        placeholder="Search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <Section title="Supervisor">
        {supervisors.map((u) => (
          <UserRow key={u.email} user={u} />
        ))}
        {supervisors.length === 0 && <Empty />}
      </Section>

      <Section title="Fellow">
        {fellows.map((u) => (
          <UserRow key={u.email} user={u} />
        ))}
        {fellows.length === 0 && <Empty />}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="font-semibold mb-2">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function UserRow({ user }: { user: UserProfile }) {
  const initials = getInitials(user.name);

  return (
    <Link
      href={`/directory/${encodeURIComponent(user.email)}`}
      className="block rounded-xl border p-3 hover:bg-gray-50"
    >
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-lg bg-blue-200 flex items-center justify-center
                     font-semibold text-blue-700 select-none"
          aria-label={`Avatar initials: ${initials}`}
          title={user.name}
        >
          {initials}
        </div>

        <div className="flex-1">
          <div className="font-semibold">{user.name}</div>
          <div className="text-gray-600 text-sm">{user.email}</div>
        </div>

        <div className="text-gray-400 text-xl">›</div>
      </div>
    </Link>
  );
}

function Empty() {
  return <div className="text-gray-500 text-sm">No users</div>;
}
