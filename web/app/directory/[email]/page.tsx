'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProfileByEmail } from '@/lib/users';
import type { UserProfile } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function getInitials(fullName: string | undefined | null) {
  if (!fullName) return '?';
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';

  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return `${first}${last}`.toUpperCase();
}

export default function UserDetail() {
  const { email } = useParams<{ email: string }>();
  const [u, setU] = useState<UserProfile | null>(null);

  useEffect(() => {
    (async () => setU(await getProfileByEmail(decodeURIComponent(email))))();
  }, [email]);

  if (!u) return <LoadingSpinner message="Loading profile..." />;

  const initials = getInitials(u.name);

  return (
    <div className="p-4 space-y-4">
      <Link href="/directory" className="text-blue-600">← Back</Link>

      <div className="flex items-center gap-4">
        <div
          className="h-20 w-20 rounded-full bg-blue-200 flex items-center justify-center
                     text-2xl font-semibold text-blue-700 select-none"
          aria-label={`Avatar initials: ${initials}`}
          title={u.name}
        >
          {initials}
        </div>

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
