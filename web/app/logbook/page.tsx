'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { Scan, watchScans, addScanFB } from './fb';

const TZ = 'Europe/London';
const fmtDateTime = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false, timeZone: TZ,
});

function LogbookClient() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Scan[]>([]);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(() => {
      try {
        const unsub = watchScans(setItems);
        // clean up when user/logs out
        return () => unsub();
      } catch {
        // not signed in; no-op
      }
    });
    return () => unsubAuth();
  }, []);

  // modal state
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Scan>>({
    createdAt: new Date().toISOString(),
    diagnosis: '',
    gender: 'F',
  });

  const list = useMemo(() => {
    const filtered = items.filter((s) => {
      const hay = `${s.diagnosis} ${s.notes ?? ''} ${s.comments ?? ''} ${s.age ?? ''} ${s.gender ?? ''}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
    return filtered;
  }, [items, q]);

  async function save() {
    if (!form.diagnosis || !form.createdAt) return;
    const next: Scan = {
      createdAt: form.createdAt!,
      diagnosis: form.diagnosis!,
      age: form.age ? Number(form.age) : undefined,
      gender: (form.gender as any) ?? 'Other',
      bmi: form.bmi ? Number(form.bmi) : undefined,
      notes: form.notes?.trim(),
      comments: form.comments?.trim(),
      signatures: [],
      };
      await addScanFB(next);
      setOpen(false);
    }


  return (
    <div className="pb-20">
      {/* Header */}
      <div className="relative bg-blue-500 text-white p-4">
        <h1 className="text-lg font-semibold">ECHO Scan Activity</h1>
        <input
          className="mt-2 w-full rounded-lg px-3 py-2 text-black"
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          aria-label="Add scan"
          onClick={() => setOpen(true)}
          className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white text-blue-600 text-2xl leading-none shadow flex items-center justify-center"
          title="Add"
        >
          +
        </button>
      </div>

      {/* List with chevrons */}
      <div className="divide-y">
        {list.map((s, i) => (
          <Link key={s.id} href={`/logbook/${s.id}`} className="block p-4 hover:bg-gray-50">
            <div className="text-sm text-blue-600">{fmtDateTime.format(new Date(s.createdAt))}</div>

            <div className="mt-1 flex items-start gap-3">
              <div className="mt-1 text-gray-400 select-none">{i + 1}.</div>
              <div className="flex-1">
                <div className="font-semibold">{s.diagnosis}</div>
                <div className="text-gray-600">{ageGenderBmi(s)}</div>
                {s.notes ? <div className="text-gray-500 truncate">{s.notes}</div> : null}
              </div>
              <div className="mt-1 text-gray-400">›</div>
            </div>
          </Link>
        ))}
        {list.length === 0 && <div className="p-6 text-center text-gray-500">No scans yet.</div>}
      </div>

      {/* Download placeholder */}
      <div className="p-4">
        <button disabled className="w-full rounded-xl bg-blue-600 py-3 text-white font-medium shadow disabled:opacity-60">⬇️ Download</button>
      </div>

      {/* Add modal (same as before, trimmed to keep short) */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <button className="text-blue-600" onClick={() => setOpen(false)}>Cancel</button>
              <button className="text-blue-600 font-semibold" onClick={save}>Save</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Date & time</label>
                <input type="datetime-local" className="w-full rounded-lg border px-3 py-2"
                  value={isoToLocal(form.createdAt)} onChange={(e)=>setForm((f)=>({...f, createdAt: localToIso(e.target.value)}))}/>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Diagnosis</label>
                <input className="w-full rounded-lg border px-3 py-2" placeholder="e.g., Tamponade"
                  value={form.diagnosis ?? ''} onChange={(e)=>setForm((f)=>({...f, diagnosis: e.target.value}))}/>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Age</label>
                <input type="number" className="w-full rounded-lg border px-3 py-2"
                  value={form.age ?? ''} onChange={(e)=>setForm((f)=>({...f, age: e.target.value? Number(e.target.value): undefined}))}/>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <div className="flex gap-2">
                  {(['F','M','Other'] as Gender[]).map((g)=>(
                    <button key={g} type="button"
                      className={`px-3 py-2 rounded-full border ${form.gender===g?'bg-blue-50 border-blue-400 text-blue-700':'bg-white'}`}
                      onClick={()=>setForm((f)=>({...f, gender:g}))}>{g}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">BMI</label>
                <input type="number" step="0.1" className="w-full rounded-lg border px-3 py-2"
                  value={form.bmi ?? ''} onChange={(e)=>setForm((f)=>({...f, bmi: e.target.value? Number(e.target.value): undefined}))}/>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea rows={3} className="w-full rounded-lg border px-3 py-2"
                  value={form.notes ?? ''} onChange={(e)=>setForm((f)=>({...f, notes:e.target.value}))}/>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Comments</label>
                <textarea rows={3} className="w-full rounded-lg border px-3 py-2"
                  value={form.comments ?? ''} onChange={(e)=>setForm((f)=>({...f, comments:e.target.value}))}/>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* helpers */
function isoToLocal(iso?: string) { if (!iso) return ''; const d=new Date(iso); const z=new Date(d.getTime()-d.getTimezoneOffset()*60000); return z.toISOString().slice(0,16); }
function localToIso(local: string) { return local ? new Date(local).toISOString() : ''; }
function ageGenderBmi(s: Scan) {
  const age = s.age ? `${s.age}` : '';
  const g = s.gender ?? '';
  const ag = [age, g].filter(Boolean).join('');
  const bmi = s.bmi ? ` BMI ${s.bmi}` : '';
  return (ag || bmi) ? `${ag}${bmi}` : '—';
}

export default dynamic(() => Promise.resolve(LogbookClient), { ssr: false });
