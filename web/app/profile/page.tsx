'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';
import { watchMyProfile } from '@/lib/users';

function getInitials(fullName: string | undefined | null) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0][0] ?? '?').toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Profile() {
  const [me, setMe] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      if (!u) { setMe(null); return; }
      const unsub = watchMyProfile(setMe);
      return () => unsub();
    });
    return () => unsubAuth();
  }, []);

  if (!me) {
    return (
      <div className="p-6">
        <p className="mb-3">You’re not signed in.</p>
        <Link href="/login" className="text-blue-600 underline">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-4">
        <div
        className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center
                  text-2xl font-semibold text-blue-700 select-none"
        title={me.name}
          >
            {getInitials(me.name)}
          </div>
        <div>
          <h1 className="text-2xl font-bold">{me.name}</h1>
          <div className="text-gray-600">{me.email}</div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div><span className="font-medium">Role:</span> {me.role}</div>
        <div><span className="font-medium">Accreditations:</span> {me.accreditations.join(', ') || '—'}</div>
        <div><span className="font-medium">About me:</span> {me.about || '—'}</div>
      </div>

      <Link href="/profile/edit" className="mt-6 inline-block rounded-xl bg-blue-600 text-white py-3 px-4 font-semibold">
        Edit profile
      </Link>
    </div>
  );
}

