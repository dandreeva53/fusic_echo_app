'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

export default function NavBar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Listen to auth changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
        setUserProfile(null);
      }
    });
    return () => unsub();
  }, []);

  // Listen to profile changes
  useEffect(() => {
    if (!userEmail) {
      setUserProfile(null);
      return;
    }

    const userDocRef = doc(db, 'users', userEmail);
    const unsub = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile(snapshot.data() as UserProfile);
      } else {
        setUserProfile(null);
      }
    });

    return () => unsub();
  }, [userEmail]);

  // Don't show navbar on welcome page
  if (pathname === '/') return null;

  async function handleSignOut() {
    await signOut(auth);
    router.push('/');
  }

  // Get display name - prioritize profile name, fall back to email
  const displayName = userProfile?.name || userEmail?.split('@')[0] || 'Profile';

  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={userEmail ? '/profile' : '/'} className="text-xl font-bold text-blue-600">
          ECHO Hub
        </Link>
        
        <div className="flex items-center gap-4">
          {userEmail ? (
            <>
              <Link href="/directory" className="hover:text-blue-600 transition">Directory</Link>
              <Link href="/calendar" className="hover:text-blue-600 transition">Calendar</Link>
              <Link href="/logbook" className="hover:text-blue-600 transition">Logbook</Link>
              <Link href="/knowledge" className="hover:text-blue-600 transition">Knowledge</Link>
              <Link href="/profile" className="hover:text-blue-600 transition">
                {displayName}
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