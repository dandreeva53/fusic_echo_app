'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { createOrUpdateProfile, watchMyProfile } from '@/lib/users';
import type { Accreditation, Role, UserProfile } from '@/types';
import { ROLES, ACCREDITATIONS } from '@/lib/constants';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function EditProfile() {
  const r = useRouter();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      if (!u) return;
      const unsub = watchMyProfile(setMe);
      return () => unsub();
    });
    return () => unsubAuth();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    setLoading(true);
    setErr(null);
    try {
      await createOrUpdateProfile(me);
      r.push('/profile');
    } catch (e: any) {
      setErr(e.message ?? 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  if (!me) return <LoadingSpinner message="Loading profile..." />;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input disabled className="w-full border rounded-lg px-3 py-2 bg-gray-100" value={me.email} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input className="w-full border rounded-lg px-3 py-2" value={me.name}
                 onChange={(e)=>setMe({...me, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select className="w-full border rounded-lg px-3 py-2" value={me.role}
                  onChange={(e)=>setMe({...me, role: e.target.value as Role})}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Accreditations</label>
          <div className="flex flex-wrap gap-2">
            {ACCREDITATIONS.map(a => {
              const on = me.accreditations.includes(a);
              return (
                <button key={a} type="button"
                  className={`px-3 py-1 rounded-full border ${on?'bg-blue-50 border-blue-400 text-blue-700':'bg-white'}`}
                  onClick={()=> setMe({
                    ...me,
                    accreditations: on ? me.accreditations.filter(x=>x!==a) : [...me.accreditations, a],
                  })}>
                  {a}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">About me</label>
          <textarea rows={3} className="w-full border rounded-lg px-3 py-2" value={me.about ?? ''}
                    onChange={(e)=>setMe({...me, about: e.target.value})}/>
        </div>

        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button disabled={loading} className="w-full rounded-xl bg-blue-600 text-white py-3 font-semibold">
          {loading ? 'Saving…' : 'Submit'}
        </button>
      </form>
    </div>
  );
}

