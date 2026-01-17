'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { Scan, watchScans, addScanFB } from './fb';
import { formatters, isoToLocal, localToIso } from '@/lib/dateUtils';
import { GENDERS } from '@/lib/constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function LogbookClient() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Scan[]>([]);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(() => {
      try {
        const unsub = watchScans(setItems);
        return () => unsub();
      } catch {
        // not signed in
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
    supervised: false,
  });

  const list = useMemo(() => {
    const filtered = items.filter((s) => {
      const hay = `${s.diagnosis} ${s.notes ?? ''} ${s.comments ?? ''} ${s.age ?? ''} ${s.gender ?? ''}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
    
    // Sort: supervised scans first, then by date
    return filtered.sort((a, b) => {
      // If one is supervised and the other isn't, supervised comes first
      if (a.supervised && !b.supervised) return -1;
      if (!a.supervised && b.supervised) return 1;
      // Otherwise sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [items, q]);

  async function save() {
    if (!form.diagnosis || !form.createdAt) return;

    const next: Scan = {
      createdAt: form.createdAt!,
      diagnosis: form.diagnosis!.trim(),
      age: form.age !== undefined && form.age !== null ? Number(form.age) : undefined,
      gender: (form.gender as any) ?? 'Other',
      bmi: form.bmi !== undefined && form.bmi !== null ? Number(form.bmi) : undefined,
      notes: form.notes?.trim() || null,
      comments: form.comments?.trim() || null,
      supervised: form.supervised ?? false,
    };

    await addScanFB(next);
    setOpen(false);
    setForm({
      createdAt: new Date().toISOString(),
      diagnosis: '',
      gender: 'F',
      supervised: false,
    });
  }

// Helper function to convert JSON-encoded strokes to image data URL for PDF
function strokesToDataUrl(strokesJson: string): string {
  try {
    const strokes = JSON.parse(strokesJson);
    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Error converting strokes to image:', err);
    return '';
  }
}

// Download Training Logbook PDF (updated to use strokesJson)
function downloadTrainingLogbook() {
  // Filter: only scans with signatures (both supervised and unsupervised)
  const scansWithSigs = list.filter(s => s.signature);
  
  if (scansWithSigs.length === 0) {
    alert('No scans with signatures to download.');
    return;
  }

  const doc = new jsPDF('landscape');
  
  // Title
  doc.setFontSize(16);
  doc.text('Training Logbook', 14, 15);
  
  // Prepare table data
  const tableData = scansWithSigs.map((scan, index) => {
    const dateOnly = new Date(scan.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return [
      (index + 1).toString(), // Study No.
      dateOnly, // Date only (DD/MM/YYYY)
      scan.diagnosis || '—',
      scan.findingsSummary || '—',
      '', // Placeholder for signature image
    ];
  });

  // Create table
  autoTable(doc, {
    startY: 25,
    head: [['Study No.', 'Date', 'Diagnosis', 'Summary of Findings', 'Mentor Signature']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },

    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 30 },
      2: { cellWidth: 50 },
      3: { cellWidth: 100 },
      4: { cellWidth: 70 },
    },

    styles: {
      fontSize: 9,
      cellPadding: 3,
    },

    didParseCell: (data) => {
      if (data.section === 'body') {
        const scan = scansWithSigs[data.row.index];
        if (scan?.supervised) {
          data.cell.styles.fillColor = [219, 234, 254]; // light blue
        }
      }
    },

    didDrawCell: (data) => {
      // Add signature images in the last column
      if (data.section === 'body' && data.column.index === 4) {
        const scan = scansWithSigs[data.row.index];
        if (scan.signature?.strokesJson) {
          try {
            // Convert strokes to image
            const imageDataUrl = strokesToDataUrl(scan.signature.strokesJson);
            if (imageDataUrl) {
              doc.addImage(
                imageDataUrl,
                'PNG',
                data.cell.x + 2,
                data.cell.y + 2,
                data.cell.width - 4,
                data.cell.height - 4
              );
            }
          } catch (err) {
            console.error('Error adding signature image:', err);
          }
        }
      }
    },
  });

  doc.save('training-logbook.pdf');
  setShowDownloadMenu(false);
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
          <Link
            key={s.id}
            href={`/logbook/${s.id}`}
            className={`block p-4 hover:bg-gray-50 ${s.supervised ? 'bg-blue-50' : ''}`}
          >
            <div className="text-sm text-blue-600">
              {formatters.dateTime.format(new Date(s.createdAt))}
              {s.supervised && (
                <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  Supervised
                </span>
              )}
            </div>

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
        {list.length === 0 && (
          <div className="p-6 text-center text-gray-500">No scans yet.</div>
        )}
      </div>

      {/* Download with dropdown menu */}
      <div className="p-4 relative">
        <button
          onClick={() => setShowDownloadMenu(!showDownloadMenu)}
          className="w-full rounded-xl bg-blue-600 py-3 text-white font-medium shadow"
        >
          ⬇️ Download
        </button>
        
        {showDownloadMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDownloadMenu(false)}
            />
            
            {/* Menu */}
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-lg border z-50 overflow-hidden">
              <button
                onClick={downloadTrainingLogbook}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b"
              >
                📄 Training Logbook
              </button>
              <button
                onClick={() => {
                  alert('Logbook Report Form - Coming soon!');
                  setShowDownloadMenu(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50"
              >
                📋 Logbook Report Form
              </button>
            </div>
          </>
        )}
      </div>

      {/* Add modal */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl p-4 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <button className="text-blue-600" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="text-blue-600 font-semibold" onClick={save}>
                Save
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Date & time</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border px-3 py-2"
                  value={isoToLocal(form.createdAt)}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, createdAt: localToIso(e.target.value) }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Diagnosis</label>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="e.g., Tamponade"
                  value={form.diagnosis ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.supervised ?? false}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, supervised: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">Supervised scan</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Age</label>
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
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
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
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">BMI</label>
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
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2"
                  value={form.notes ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Comments</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2"
                  value={form.comments ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* helpers */
function ageGenderBmi(s: Scan) {
  const age = s.age ? `${s.age}` : '';
  const g = s.gender ?? '';
  const ag = [age, g].filter(Boolean).join('');
  const bmi = s.bmi ? ` BMI ${s.bmi}` : '';
  return (ag || bmi) ? `${ag}${bmi}` : '—';
}

export default dynamic(() => Promise.resolve(LogbookClient), { ssr: false });