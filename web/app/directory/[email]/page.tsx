'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProfileByEmail, type UserProfile } from '@/lib/users';

export default function UserDetail() {
  const { email } = useParams<{ email: string }>();
  const [u, setU] = useState<UserProfile | null>(null);

  useEffect(() => {
    (async () => setU(await getProfileByEmail(decodeURIComponent(email))))();
  }, [email]);

  if (!u) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4 space-y-4">
      <Link href="/directory" className="text-blue-600">← Back</Link>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-gray-200" />
        <div>
          <div className="text-2xl font-bold">{u.name}</div>
          <div className="text-gray-600">{u.email}</div>
        </div>
      </div>
      <div><span className="font-medium">Role:</span> {u.role}</div>
      <div><span className="font-medium">Accreditations:</span> {u.accreditations.join(', ') || '—'}</div>
      <div><span className="font-medium">About me:</span> {u.about || '—'}</div>
    </div>
  );
}
