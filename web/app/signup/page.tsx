'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Accreditation, Role, UserProfile, createOrUpdateProfile } from '@/lib/users';

const ROLES: Role[] = ['Supervisor', 'Fellow'];
const ACCS: Accreditation[] = ['FUSIC', 'BSE Level 1', 'BSE Level 2'];

export default function Signup() {
  const r = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [role, setRole] = useState<Role>('Fellow');
  const [accs, setAccs] = useState<Accreditation[]>([]);
  const [about, setAbout] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);
      if (name) await updateProfile(cred.user, { displayName: name });
      const profile: UserProfile = {
        email: email.trim(),
        name: name.trim() || email.split('@')[0],
        role,
        accreditations: accs,
        about,
      };
      await createOrUpdateProfile(profile);
      r.push('/profile'); // go to your profile view
    } catch (e: any) {
      setErr(e.message ?? 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  }

  function toggleAcc(a: Accreditation) {
    setAccs((prev) => (prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]));
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create profile</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input className="w-full border rounded-lg px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="w-full border rounded-lg px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">Use your nhs.net email if you have one.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" className="w-full border rounded-lg px-3 py-2" value={pw} onChange={e=>setPw(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select className="w-full border rounded-lg px-3 py-2" value={role} onChange={e=>setRole(e.target.value as Role)}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Accreditations</label>
          <div className="flex flex-wrap gap-2">
            {ACCS.map(a => (
              <button type="button" key={a}
                onClick={()=>toggleAcc(a)}
                className={`px-3 py-1 rounded-full border ${accs.includes(a)?'bg-blue-50 border-blue-400 text-blue-700':'bg-white'}`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">About me</label>
          <textarea className="w-full border rounded-lg px-3 py-2" rows={3} value={about} onChange={e=>setAbout(e.target.value)} />
        </div>

        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button disabled={loading} className="w-full rounded-xl bg-blue-600 text-white py-3 font-semibold">
          {loading ? 'Creating…' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
