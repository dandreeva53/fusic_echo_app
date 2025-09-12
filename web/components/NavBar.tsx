'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">ECHO Hub</Link>
        <div className="flex items-center gap-4">
          <Link href="/directory" className="hover:underline">Users</Link>
          <Link href="/availability" className="hover:underline">Availability</Link>
          <Link href="/logbook" className="hover:underline">Logbook</Link>
          <Link href="/library" className="hover:underline">Library</Link>

          {user ? (
            <>
              <Link href="/profile" className="hover:underline">{user.displayName || user.email}</Link>
              <button
                className="rounded-lg border px-3 py-1 text-sm"
                onClick={() => signOut(auth)}
                title="Sign out"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">Login</Link>
              <Link href="/signup" className="rounded-lg border px-3 py-1 text-sm">Create profile</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
