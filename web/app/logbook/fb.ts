'use client';

import type { Scan, YesNoUA, Gender, ImageQuality } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc,
  serverTimestamp, setDoc, query, orderBy
} from 'firebase/firestore';

function stripUndefined<T>(obj: T): T {
  // JSON.stringify drops undefined values recursively
  return JSON.parse(JSON.stringify(obj));
}

export function requireEmail(): string {
  const u = auth.currentUser;
  if (!u || !u.email) throw new Error('Not signed in');
  return u.email;
}

function userScansCol(userEmail: string) {
  return collection(db, 'users', userEmail, 'scans');
}

export function watchScans(cb: (scans: Scan[]) => void) {
  const email = requireEmail();
  const q = query(userScansCol(email), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const out: Scan[] = [];
    snap.forEach((d) => out.push({ id: d.id, ...(d.data() as any) }));
    cb(out);
  });
}

export async function addScanFB(scan: Scan) {
  const email = requireEmail();
  const cleaned = stripUndefined(scan);
  await addDoc(userScansCol(email), cleaned as any);
}

export async function updateScanFB(scanId: string, patch: Partial<Scan>) {
  const email = requireEmail();
  const cleaned = stripUndefined(patch);
  await updateDoc(doc(db, 'users', email, 'scans', scanId), cleaned as any);
}

export async function deleteScanFB(scanId: string) {
  const email = requireEmail();
  await deleteDoc(doc(db, 'users', email, 'scans', scanId));
}

export async function getScanOnce(scanId: string) {
  return new Promise<Scan | null>((resolve) => {
    const email = requireEmail();
    const unsub = onSnapshot(doc(db, 'users', email, 'scans', scanId), (d) => {
      unsub();
      resolve(d.exists() ? ({ id: d.id, ...(d.data() as any) }) : null);
    });
  });
}
