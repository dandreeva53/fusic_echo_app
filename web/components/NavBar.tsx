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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (pathname === '/') return null;

  async function handleSignOut() {
    await signOut(auth);
    setMobileMenuOpen(false);
    router.push('/');
  }

  const displayName = userProfile?.name || userEmail?.split('@')[0] || 'Profile';

  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={userEmail ? '/profile' : '/'} className="text-xl font-bold text-blue-600">
          ECHO Hub
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
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

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden flex flex-col gap-1 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-gray-800 transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-gray-800 transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-gray-800 transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="flex flex-col px-4 py-2">
            {userEmail ? (
              <>
                <Link href="/directory" className="py-3 border-b hover:bg-gray-50">Directory</Link>
                <Link href="/calendar" className="py-3 border-b hover:bg-gray-50">Calendar</Link>
                <Link href="/logbook" className="py-3 border-b hover:bg-gray-50">Logbook</Link>
                <Link href="/knowledge" className="py-3 border-b hover:bg-gray-50">Knowledge</Link>
                <Link href="/profile" className="py-3 border-b hover:bg-gray-50">
                  {displayName}
                </Link>
                <button
                  className="mt-3 rounded-lg bg-red-500 text-white px-4 py-2 text-sm font-medium hover:bg-red-600 transition"
                  onClick={handleSignOut}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="py-3 border-b hover:bg-gray-50">Login</Link>
                <Link href="/signup" className="mt-3 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition text-center">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}