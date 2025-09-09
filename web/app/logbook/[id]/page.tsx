'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Scan, getScan, updateScan, removeScan } from '../store';

const TZ = 'Europe/London';
const fmtDateTime = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false, timeZone: TZ,
});

function DetailClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [scan, setScan] = useState<Scan | null>(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<Partial<Scan>>({});

  useEffect(() => {
    const s = getScan(params.id);
    if (!s) { router.replace('/logbook'); return; }
    setScan(s);
  }, [params.id, router]);

  useEffect(() => {
    if (!scan) return;
    setForm(scan);
  }, [scan]);

  if (!scan) return null;

  function doSave() {
    updateScan(scan.id, form);
    const updated = getScan(scan.id)!;
    setScan(updated);
    setEdit(false);
  }
  async function doCopy() {
    const text = buildCopyText(scan);
    await navigator.clipboard.writeText(text);
    alert('Details copied to clipboard');
  }
  function doDelete() {
    if (!confirm('Delete this record?')) return;
    removeScan(scan.id);
    router.replace('/logbook');
  }

  return (
    <div className="pb-24">
      {/* Header-style title */}
      <div className="bg-blue-500 text-white p-4">
        <div className="flex items-center gap-3">
          <Link href="/logbook" className="text-2xl">←</Link>
          <div>
            <div className="text-lg font-semibold">Scan Record</div>
            <div className="text-sm opacity-90">
              {scan.diagnosis} — {fmtDateTime.format(new Date(scan.createdAt))}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <button className="rounded-xl bg-gray-100 py-3 font-medium" onClick={() => setEdit(true)}>✏️ Edit Record</button>
        <button className="rounded-xl bg-gray-100 py-3 font-medium" onClick={doCopy}>📋 Copy Details</button>
        <button className="rounded-xl bg-gray-100 py-3 font-medium text-red-600" onClick={doDelete}>🗑️ Delete</button>
      </div>

      {/* Summary */}
      <Section title="Summary">
        <Row k="User Email" v="you@example.com" />
        <Row k="Date" v={fmtDateTime.format(new Date(scan.createdAt))} />
        <Row k="Age" v={toStr(scan.age)} />
        <Row k="Gender" v={toStr(scan.gender)} />
        <Row k="Diagnosis" v={toStr(scan.diagnosis)} />
      </Section>

      {/* Details */}
      <Section title="Details">
        <Row k="Ventilation" v={toStr(scan.ventilation)} />
        <Row k="HR" v={toStr(scan.hr)} />
        <Row k="BP" v={toStr(scan.bp)} />
        <Row k="CVP" v={toStr(scan.cvp)} />
        <Row k="CV support" v={toStr(scan.cvSupport)} />
        <Row k="Views" v={(scan.views ?? []).join(', ')} />
        <Row k="Image quality" v={toStr(scan.imageQuality)} />
      </Section>

      {/* Findings */}
      <Section title="Findings">
        <Row k="LV dilated?" v={toStr(scan.lvDilated)} />
        <Row k="LV significantly impaired?" v={toStr(scan.lvImpaired)} />
        <Row k="Evidence of low preload?" v={toStr(scan.lowPreload)} />
        <Row k="Pericardial fluid?" v={toStr(scan.pericardialFluid)} />
        <Row k="Pleural fluid?" v={toStr(scan.pleuralFluid)} />
        <div className="px-4 py-3">
          <div className="text-sm font-medium mb-1">Summary of findings</div>
          <div className="rounded-xl border p-3 min-h-[64px]">{toStr(scan.findingsSummary)}</div>
        </div>
        <div className="px-4 py-3">
          <div className="text-sm font-medium mb-1">Personal notes</div>
          <div className="rounded-xl border p-3 min-h-[64px]">{toStr(scan.notes)}</div>
        </div>
      </Section>

      {/* Edit modal */}
      {edit && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-4 space-y-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <button className="text-blue-600" onClick={() => setEdit(false)}>Cancel</button>
              <button className="text-blue-600 font-semibold" onClick={doSave}>Save</button>
            </div>

            <h3 className="text-center text-lg font-semibold">Summary</h3>
            <Field label="Date & time">
              <input type="datetime-local" className="w-full rounded-lg border px-3 py-2"
                value={isoToLocal(form.createdAt)} onChange={(e)=>setForm((f)=>({...f, createdAt: localToIso(e.target.value)}))}/>
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Age"><input type="number" className="w-full rounded-lg border px-3 py-2"
                value={form.age ?? ''} onChange={(e)=>setForm((f)=>({...f, age: e.target.value? Number(e.target.value): undefined}))}/></Field>
              <Field label="Gender">
                <div className="flex gap-2">
                  {(['F','M','Other'] as const).map((g)=>(
                    <button key={g} type="button"
                      className={`px-3 py-2 rounded-full border ${form.gender===g?'bg-blue-50 border-blue-400 text-blue-700':'bg-white'}`}
                      onClick={()=>setForm((f)=>({...f, gender:g}))}>{g}</button>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="BMI"><input type="number" step="0.1" className="w-full rounded-lg border px-3 py-2"
              value={form.bmi ?? ''} onChange={(e)=>setForm((f)=>({...f, bmi: e.target.value? Number(e.target.value): undefined}))}/></Field>
            <Field label="Indications for scan"><input className="w-full rounded-lg border px-3 py-2"
              value={form.indications ?? ''} onChange={(e)=>setForm((f)=>({...f, indications: e.target.value}))}/></Field>
            <Field label="Diagnosis"><input className="w-full rounded-lg border px-3 py-2"
              value={form.diagnosis ?? ''} onChange={(e)=>setForm((f)=>({...f, diagnosis: e.target.value}))}/></Field>

            <h3 className="text-center text-lg font-semibold">Details</h3>
            <Field label="Ventilation"><input className="w-full rounded-lg border px-3 py-2"
              value={form.ventilation ?? ''} onChange={(e)=>setForm((f)=>({...f, ventilation: e.target.value}))}/></Field>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="HR"><input className="w-full rounded-lg border px-3 py-2"
                value={form.hr ?? ''} onChange={(e)=>setForm((f)=>({...f, hr: e.target.value}))}/></Field>
              <Field label="BP"><input className="w-full rounded-lg border px-3 py-2"
                value={form.bp ?? ''} onChange={(e)=>setForm((f)=>({...f, bp: e.target.value}))}/></Field>
              <Field label="CVP"><input className="w-full rounded-lg border px-3 py-2"
                value={form.cvp ?? ''} onChange={(e)=>setForm((f)=>({...f, cvp: e.target.value}))}/></Field>
            </div>
            <Field label="CV support"><input className="w-full rounded-lg border px-3 py-2"
              value={form.cvSupport ?? ''} onChange={(e)=>setForm((f)=>({...f, cvSupport: e.target.value}))}/></Field>

            <Field label="Views">
              <div className="flex flex-wrap gap-2">
                {(['PLAX','PSAX','AP4C','SC4C','IVC'] as const).map(v=>(
                  <button key={v} type="button"
                    className={`px-3 py-1 rounded-full border ${form.views?.includes(v)?'bg-blue-50 border-blue-400 text-blue-700':'bg-white'}`}
                    onClick={()=>setForm((f)=> {
                      const cur = new Set(f.views ?? []);
                      cur.has(v) ? cur.delete(v) : cur.add(v);
                      return { ...f, views: Array.from(cur) as any };
                    })}>
                    {v}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Image quality">
              <div className="flex gap-2">
                {(['Good','Acceptable','Poor'] as const).map(q=>(
                  <button key={q} className={`px-3 py-1 rounded-full border ${form.imageQuality===q?'bg-blue-50 border-blue-400 text-blue-700':'bg-white'}`}
                    onClick={()=>setForm((f)=>({...f, imageQuality:q}))}>{q}</button>
                ))}
              </div>
            </Field>

            <h3 className="text-center text-lg font-semibold">Findings</h3>
            {([
              ['LV dilated?', 'lvDilated'],
              ['LV significantly impaired?', 'lvImpaired'],
              ['Evidence of low preload?', 'lowPreload'],
              ['Pericardial fluid?', 'pericardialFluid'],
              ['Pleural fluid?', 'pleuralFluid'],
            ] as const).map(([label, key])=>(
              <Field key={key} label={label}>
                <TriToggle value={(form as any)[key]} onChange={(v)=>setForm((f)=>({...f, [key]: v as any}))}/>
              </Field>
            ))}

            <Field label="Summary of findings">
              <textarea rows={4} className="w-full rounded-lg border px-3 py-2"
                placeholder="Please include conclusion, clinical correlation, suggested actions and requirement for referral?"
                value={form.findingsSummary ?? ''} onChange={(e)=>setForm((f)=>({...f, findingsSummary: e.target.value}))}/>
            </Field>

            <Field label="Personal notes">
              <textarea rows={3} className="w-full rounded-lg border px-3 py-2"
                value={form.notes ?? ''} onChange={(e)=>setForm((f)=>({...f, notes: e.target.value}))}/>
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

/* UI primitives */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pb-2">
      <h2 className="px-4 pt-2 text-lg font-semibold">{title}</h2>
      <div className="mt-2 divide-y">{children}</div>
    </section>
  );
}
function Row({ k, v }: { k: string; v: string | number | undefined | null }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <div className="text-gray-600">{k}</div>
      <div className="font-medium">{v ?? '—'}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-medium mb-1">{label}</div>
      {children}
    </div>
  );
}
function TriToggle({ value, onChange }: { value?: 'Yes' | 'No' | 'U/A'; onChange: (v: 'Yes' | 'No' | 'U/A') => void }) {
  return (
    <div className="flex gap-2">
      {(['Yes','No','U/A'] as const).map(v=>(
        <button key={v} className={`px-3 py-1 rounded-full border ${value===v?'bg-blue-50 border-blue-400 text-blue-700':'bg-white'}`}
          onClick={()=>onChange(v)}>{v}</button>
      ))}
    </div>
  );
}

/* helpers */
function toStr(x: any) { return x ?? '—'; }
function isoToLocal(iso?: string) { if (!iso) return ''; const d=new Date(iso); const z=new Date(d.getTime()-d.getTimezoneOffset()*60000); return z.toISOString().slice(0,16); }
function localToIso(local: string) { return local ? new Date(local).toISOString() : ''; }
function buildCopyText(s: Scan) {
  const lines = [
    `Scan Record — ${s.diagnosis} — ${new Date(s.createdAt).toLocaleString('en-GB')}`,
    `Age: ${toStr(s.age)}  Gender: ${toStr(s.gender)}  BMI: ${toStr(s.bmi)}`,
    `Ventilation: ${toStr(s.ventilation)}  HR: ${toStr(s.hr)}  BP: ${toStr(s.bp)}  CVP: ${toStr(s.cvp)}  CV support: ${toStr(s.cvSupport)}`,
    `Views: ${(s.views ?? []).join(', ')}`,
    `Image quality: ${toStr(s.imageQuality)}`,
    `Findings: LV dilated ${toStr(s.lvDilated)}, LV impaired ${toStr(s.lvImpaired)}, Low preload ${toStr(s.lowPreload)}, Pericardial fluid ${toStr(s.pericardialFluid)}, Pleural fluid ${toStr(s.pleuralFluid)}`,
    `Summary: ${toStr(s.findingsSummary)}`,
    `Notes: ${toStr(s.notes)}`,
  ];
  return lines.join('\n');
}

export default dynamic(() => Promise.resolve(DetailClient), { ssr: false });
