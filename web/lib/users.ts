'use client';

import type { Role, Accreditation, UserProfile } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';

export async function createOrUpdateProfile(p: UserProfile) {
  const ref = doc(db, 'users', p.email);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, { ...p, updatedAt: serverTimestamp() } as any);
  } else {
    await setDoc(ref, { ...p, createdAt: serverTimestamp(), updatedAt: serverTimestamp() } as any);
  }
}

export async function getMyEmail(): Promise<string> {
  const u = auth.currentUser;
  if (!u?.email) throw new Error('Not signed in');
  return u.email;
}

export function watchMyProfile(cb: (u: UserProfile | null) => void) {
  const u = auth.currentUser;
  if (!u?.email) return () => {};
  const ref = doc(db, 'users', u.email);
  return onSnapshot(ref, (snap) => cb(snap.exists() ? (snap.data() as UserProfile) : null));
}

export async function getProfileByEmail(email: string) {
  const ref = doc(db, 'users', email);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
