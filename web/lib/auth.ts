import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function ensureUserDoc(email: string, name: string) {
  const ref = doc(db, 'users', email.toLowerCase());
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: email.toLowerCase(),
      name,
      role: 'fellow',
      accreditations: { fusic: false, bseL1: false, bseL2: false },
      bookingCapPerDay: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });
  }
}

export async function register(email: string, password: string, name: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await ensureUserDoc(email, name || email);
  return cred.user;
}

export async function signin(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}
