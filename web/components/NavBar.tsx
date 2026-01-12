'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // Don't show navbar on welcome page
  if (pathname === '/') return null;

  async function handleSignOut() {
    await signOut(auth);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={user ? '/profile' : '/'} className="text-xl font-bold text-blue-600">
          ECHO Hub
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/directory" className="hover:text-blue-600 transition">Directory</Link>
              <Link href="/availability" className="hover:text-blue-600 transition">Availability</Link>
              <Link href="/logbook" className="hover:text-blue-600 transition">Logbook</Link>
              <Link href="/knowledge" className="hover:text-blue-600 transition">Knowledge</Link>
              <Link href="/profile" className="hover:text-blue-600 transition">
                {user.displayName || 'Profile'}
              </Link>
              <button
                className="rounded-lg bg-red-500 text-white px-4 py-2 text-sm font-medium hover:bg-red-600 transition"
                onClick={handleSignOut}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-600 transition">Login</Link>
              <Link href="/signup" className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}