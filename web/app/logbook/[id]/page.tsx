'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import SignatureCanvas from 'react-signature-canvas';
import { auth } from '@/lib/firebase';
import type { Scan } from '@/lib/types';
import { getScanOnce, updateScanFB, deleteScanFB } from '../fb';
import { formatters, isoToLocal, localToIso } from '@/lib/dateUtils';
import { GENDERS, VIEWS, IMAGE_QUALITIES, YES_NO_UA } from '@/lib/constants';
import { toStr } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function DetailClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [scan, setScan] = useState<Scan | null>(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<Partial<Scan>>({});

  // Signature modal state
  const [sigOpen, setSigOpen] = useState(false);
  const [sigNote, setSigNote] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const sigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    (async () => {
      const s = await getScanOnce(params.id);
      if (!s) {
        router.replace('/logbook');
        return;
      }
      setScan(s);
      setForm(s);
    })();
  }, [params.id, router]);

  if (!scan) return <LoadingSpinner message="Loading scan record..." />;

async function doSave() {
  if (!scan?.id) return; // or throw new Error('No scan loaded');

  await updateScanFB(scan.id, form);
  const fresh = await getScanOnce(scan.id);
  setScan(fresh);
  setEdit(false);
}


async function doCopy() {
  if (!scan) return; // or alert('Scan not loaded yet');

  const text = buildCopyText(scan);
  await navigator.clipboard.writeText(text);
  alert('Details copied to clipboard');
}

async function doDelete() {
  if (!scan?.id) return;

  if (!confirm('Delete this record?')) return;

  await deleteScanFB(scan.id);
  router.replace('/logbook');
}


  // Save/Replace signature handler - STORES STROKES AS JSON STRING
  async function saveSignature() {
    if (!scan) return;
    const u = auth.currentUser;
    if (!u || !u.email) {
      alert('You must be signed in to sign.');
      return;
    }

    // Validate supervisor name is provided
    if (!supervisorName.trim()) {
      alert('Please enter the supervisor name.');
      return;
    }

    // Get stroke data
    const strokeData = sigRef.current?.toData();
    if (!strokeData || strokeData.length === 0) {
      alert('Please add a signature.');
      return;
    }

    // Convert to JSON string to avoid nested array issue in Firestore
    const sig = {
      byEmail: u.email,
      supervisorName: supervisorName.trim(),
      at: new Date().toISOString(),
      strokesJson: JSON.stringify(strokeData), // Store as JSON string
      note: sigNote || undefined,
    };

    // Replace existing signature with new one
    await updateScanFB(scan.id!, { signature: sig });

    const fresh = await getScanOnce(scan.id!);
    setScan(fresh);
    setSigNote('');
    setSupervisorName('');
    sigRef.current?.clear();
    setSigOpen(false);
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className={`p-4 ${scan.supervised ? 'bg-blue-500' : 'bg-blue-500'} text-white`}>
        <div className="flex items-center gap-3">
          <Link href="/logbook" className="text-2xl">
            ←
          </Link>
          <div>
            <div className="text-lg font-semibold">Scan Record</div>
            <div className="text-sm opacity-90">
              {scan.diagnosis} — {formatters.dateTime.format(new Date(scan.createdAt))}
              {scan.supervised && (
                <span className="ml-2 bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                  Supervised
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          className="rounded-xl bg-gray-100 py-3 font-medium"
          onClick={() => setEdit(true)}
        >
          ✏️ Edit Record
        </button>
        <button className="rounded-xl bg-gray-100 py-3 font-medium" onClick={doCopy}>
          📋 Copy Details
        </button>
        <button
          className="rounded-xl bg-gray-100 py-3 font-medium text-red-600"
          onClick={doDelete}
        >
          🗑️ Delete
        </button>
        <button
          className="rounded-xl bg-gray-100 py-3 font-medium"
          onClick={() => setSigOpen(true)}
        >
          ✏️ {scan.signature ? 'Replace' : 'Add'} Supervisor Signature
        </button>
      </div>

      {/* Summary */}
      <Section title="Summary">
        <Row k="Operator" v={auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Not available'} />
        <Row k="Date" v={formatters.dateTime.format(new Date(scan.createdAt))} />
        <Row k="Indication for scan" v={toStr(scan.indications)} />
        <Row k="Age" v={toStr(scan.age)} />
        <Row k="Gender" v={toStr(scan.gender)} />
        <Row k="Diagnosis" v={toStr(scan.diagnosis)} />
        <Row k="Supervised" v={scan.supervised ? 'Yes' : 'No'} />
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
        <Row k="RV dilated?" v={toStr(scan.rvDilated)} />
        <Row k="RV significantly impaired?" v={toStr(scan.rvImpaired)} />
        <Row k="Evidence of low preload?" v={toStr(scan.lowPreload)} />
        <Row k="Pericardial fluid?" v={toStr(scan.pericardialFluid)} />
        <Row k="Pleural fluid?" v={toStr(scan.pleuralFluid)} />
        <Block label="Summary of findings" value={toStr(scan.findingsSummary)} />
        <Block label="Personal notes" value={toStr(scan.notes)} />
      </Section>

      {/* Supervisor signature - RENDER FROM STROKES */}
      {scan.signature && (
        <Section title="Supervisor Signature">
          <div className="px-4 py-3 space-y-2">
            <div className="text-sm text-gray-700">
              {scan.signature.supervisorName} —{' '}
              {new Date(scan.signature.at).toLocaleString('en-GB')}
            </div>
            {scan.signature.note && (
              <div className="text-sm text-gray-600">Feedback: {scan.signature.note}</div>
            )}
            <SignatureDisplay strokesJson={scan.signature.strokesJson} />
          </div>
        </Section>
      )}

      {/* Edit modal */}
      {edit && (
        <EditModal
          form={form}
          setForm={setForm}
          onCancel={() => setEdit(false)}
          onSave={doSave}
        />
      )}

      {/* Signature modal */}
      {sigOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <button className="text-blue-600" onClick={() => setSigOpen(false)}>
                Cancel
              </button>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded-xl border"
                  onClick={() => sigRef.current?.clear()}
                >
                  Clear
                </button>
                <button className="text-blue-600 font-semibold" onClick={saveSignature}>
                  Save
                </button>
              </div>
            </div>

            {scan.signature && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm">
                ⚠️ This will replace the existing signature by {scan.signature.supervisorName}
              </div>
            )}

            <div>
              <div className="text-sm font-medium mb-1">Supervisor name *</div>
              <input
                className="w-full rounded-lg border px-3 py-2"
                placeholder="e.g. Dr. Smith"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
              />
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Feedback (optional)</div>
              <input
                className="w-full rounded-lg border px-3 py-2"
                placeholder="e.g. reviewed findings, acceptable images"
                value={sigNote}
                onChange={(e) => setSigNote(e.target.value)}
              />
            </div>

            <div className="rounded-xl border">
              <SignatureCanvas
                ref={sigRef}
                penColor="black"
                canvasProps={{
                  width: 700,
                  height: 250,
                  className: 'w-full h-[250px] rounded-xl',
                }}
              />
            </div>
            <div className="text-xs text-gray-500">
              Sign with your pointer or finger (touchscreen)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Component to display signature from JSON-encoded strokes */
function SignatureDisplay({ strokesJson }: { strokesJson: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !strokesJson) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const strokes = JSON.parse(strokesJson);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw strokes
      strokes.forEach((stroke: any[]) => {
        if (stroke.length === 0) return;

        ctx.beginPath();
        stroke.forEach((point: any, index: number) => {
          const x = point.x;
          const y = point.y;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      });
    } catch (err) {
      console.error('Error rendering signature:', err);
    }
  }, [strokesJson]);

  return (
    <canvas
      ref={canvasRef}
      width={700}
      height={250}
      style={{ width: '400px', height: '143px' }}
      className="border rounded"
    />
  );
}

/* UI helpers */
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

function Block({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-sm font-medium mb-1">{label}</div>
      <div className="rounded-xl border p-3 min-h-[64px]">{value}</div>
    </div>
  );
}

/* Edit modal */
function EditModal({
  form,
  setForm,
  onCancel,
  onSave,
}: {
  form: Partial<Scan>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Scan>>>;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl p-4 space-y-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between">
          <button className="text-blue-600" onClick={onCancel}>
            Cancel
          </button>
          <button className="text-blue-600 font-semibold" onClick={onSave}>
            Save
          </button>
        </div>

        <h3 className="text-center text-lg font-semibold">Summary</h3>
        <Field label="Date & time">
          <input
            type="datetime-local"
            className="w-full rounded-lg border px-3 py-2"
            value={isoToLocal(form.createdAt)}
            onChange={(e) =>
              setForm((f) => ({ ...f, createdAt: localToIso(e.target.value) }))
            }
          />
        </Field>

        <Field label="Supervised scan">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.supervised ?? false}
              onChange={(e) => setForm((f) => ({ ...f, supervised: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm">This scan was supervised</span>
          </label>
        </Field>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Age">
            <input
              type="number"
              className="w-full rounded-lg border px-3 py-2"
              value={form.age ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  age: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
          </Field>
          <Field label="Gender">
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`px-3 py-2 rounded-full border ${
                    form.gender === g
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'bg-white'
                  }`}
                  onClick={() => setForm((f) => ({ ...f, gender: g }))}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <Field label="BMI">
          <input
            type="number"
            step="0.1"
            className="w-full rounded-lg border px-3 py-2"
            value={form.bmi ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                bmi: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </Field>

        <Field label="Indications for scan">
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={form.indications ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, indications: e.target.value }))}
          />
        </Field>

        <Field label="Diagnosis">
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={form.diagnosis ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))}
          />
        </Field>

        <h3 className="text-center text-lg font-semibold">Details</h3>
        <Field label="Ventilation">
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={form.ventilation ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, ventilation: e.target.value }))}
          />
        </Field>

        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="HR">
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={form.hr ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, hr: e.target.value }))}
            />
          </Field>
          <Field label="BP">
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={form.bp ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, bp: e.target.value }))}
            />
          </Field>
          <Field label="CVP">
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={form.cvp ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, cvp: e.target.value }))}
            />
          </Field>
        </div>

        <Field label="CV support">
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={form.cvSupport ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, cvSupport: e.target.value }))}
          />
        </Field>

        <Field label="Views">
          <div className="flex flex-wrap gap-2">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                className={`px-3 py-1 rounded-full border ${
                  form.views?.includes(v)
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'bg-white'
                }`}
                onClick={() =>
                  setForm((f) => {
                    const cur = new Set(f.views ?? []);
                    cur.has(v) ? cur.delete(v) : cur.add(v);
                    return { ...f, views: Array.from(cur) as any };
                  })
                }
              >
                {v}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Image quality">
          <div className="flex gap-2">
            {IMAGE_QUALITIES.map((q) => (
              <button
                key={q}
                className={`px-3 py-1 rounded-full border ${
                  form.imageQuality === q
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'bg-white'
                }`}
                onClick={() => setForm((f) => ({ ...f, imageQuality: q }))}
              >
                {q}
              </button>
            ))}
          </div>
        </Field>

        <h3 className="text-center text-lg font-semibold">Findings</h3>
        {(
          [
            ['LV dilated?', 'lvDilated'],
            ['LV significantly impaired?', 'lvImpaired'],
            ['RV dilated?', 'rvDilated'],
            ['RV significantly impaired?', 'rvImpaired'],
            ['Evidence of low preload?', 'lowPreload'],
            ['Pericardial fluid?', 'pericardialFluid'],
            ['Pleural fluid?', 'pleuralFluid'],
          ] as const
        ).map(([label, key]) => (
          <Field key={key} label={label}>
            <TriToggle
              value={(form as any)[key]}
              onChange={(v) => setForm((f) => ({ ...f, [key]: v as any }))}
            />
          </Field>
        ))}

        <Field label="Summary of findings">
          <textarea
            rows={4}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Please include conclusion, clinical correlation, suggested actions and requirement for referral?"
            value={form.findingsSummary ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, findingsSummary: e.target.value }))}
          />
        </Field>

        <Field label="Personal notes">
          <textarea
            rows={3}
            className="w-full rounded-lg border px-3 py-2"
            value={form.notes ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </Field>
      </div>
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

function TriToggle({
  value,
  onChange,
}: {
  value?: 'Yes' | 'No' | 'U/A';
  onChange: (v: 'Yes' | 'No' | 'U/A') => void;
}) {
  return (
    <div className="flex gap-2">
      {YES_NO_UA.map((v) => (
        <button
          key={v}
          className={`px-3 py-1 rounded-full border ${
            value === v ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white'
          }`}
          onClick={() => onChange(v)}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function buildCopyText(s: Scan) {
  const lines = [
    `Scan Record — ${s.diagnosis} — ${new Date(s.createdAt).toLocaleString('en-GB')}`,
    `Supervised: ${s.supervised ? 'Yes' : 'No'}`,
    `Age: ${toStr(s.age)}  Gender: ${toStr(s.gender)}  BMI: ${toStr(s.bmi)}`,
    `Ventilation: ${toStr(s.ventilation)}  HR: ${toStr(s.hr)}  BP: ${toStr(s.bp)}  CVP: ${toStr(
      s.cvp
    )}  CV support: ${toStr(s.cvSupport)}`,
    `Views: ${(s.views ?? []).join(', ')}`,
    `Image quality: ${toStr(s.imageQuality)}`,
    `Findings: LV dilated ${toStr(s.lvDilated)}, LV impaired ${toStr(
      s.lvImpaired
    )}, RV dilated ${toStr(s.rvDilated)}, RV impaired ${toStr(
      s.rvImpaired
    )}, Low preload ${toStr(s.lowPreload)}, Pericardial fluid ${toStr(
      s.pericardialFluid
    )}, Pleural fluid ${toStr(s.pleuralFluid)}`,
    `Summary: ${toStr(s.findingsSummary)}`,
    `Notes: ${toStr(s.notes)}`,
  ];
  return lines.join('\n');
}

export default dynamic(() => Promise.resolve(DetailClient), { ssr: false });