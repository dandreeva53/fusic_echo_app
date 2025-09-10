'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      r.push('/profile');
    } catch (e: any) {
      setErr(e.message ?? 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    if (!email) return setErr('Enter your email above, then click Reset.');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      alert('Password reset email sent.');
    } catch (e: any) {
      setErr(e.message ?? 'Could not send reset email');
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      <form onSubmit={signin} className="space-y-4">
        <input type="email" className="w-full border rounded-lg px-3 py-2" placeholder="Email"
               value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="w-full border rounded-lg px-3 py-2" placeholder="Password"
               value={pw} onChange={e=>setPw(e.target.value)} />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button disabled={loading} className="w-full rounded-xl bg-blue-600 text-white py-3 font-semibold">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="mt-3 flex items-center justify-between">
        <button onClick={reset} className="text-blue-600 text-sm">Forgot password?</button>
        <Link href="/signup" className="text-sm underline">Create profile</Link>
      </div>
    </div>
  );
}
