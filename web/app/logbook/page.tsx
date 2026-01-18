'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { Scan, watchScans, addScanFB } from './fb';
import { formatters, isoToLocal, localToIso } from '@/lib/dateUtils';
import { GENDERS } from '@/lib/constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SignatureCanvas from 'react-signature-canvas';

function LogbookClient() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Scan[]>([]);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Report form modal state
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedScans, setSelectedScans] = useState<Set<string>>(new Set());
  const traineeSignatureRef = useRef<SignatureCanvas>(null);

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

  // Helper to convert strokes to canvas for PDF
  function strokesToCanvas(strokesJson: string): HTMLCanvasElement | null {
    try {
      const strokes = JSON.parse(strokesJson);
      const canvas = document.createElement('canvas');
      canvas.width = 700;
      canvas.height = 250;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      strokes.forEach((stroke: any[]) => {
        if (stroke.length === 0) return;
        ctx.beginPath();
        stroke.forEach((point: any, index: number) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      });

      return canvas;
    } catch (err) {
      console.error('Error converting strokes:', err);
      return null;
    }
  }

  // Download Training Logbook PDF
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
        minCellHeight: 20,
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
              const mentorCanvas = strokesToCanvas(scan.signature.strokesJson);
              if (mentorCanvas) {
                const imageDataUrl = mentorCanvas.toDataURL('image/png');
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

  // Generate Logbook Report Form PDF
  function downloadLogbookReportForm() {
    if (selectedScans.size === 0) {
      alert('Please select at least one scan.');
      return;
    }

    // Get trainee signature
    const traineeStrokeData = traineeSignatureRef.current?.toData();
    if (!traineeStrokeData || traineeStrokeData.length === 0) {
      alert('Please add your trainee signature.');
      return;
    }

    const traineeCanvas = document.createElement('canvas');
    traineeCanvas.width = 700;
    traineeCanvas.height = 250;
    const traineeCtx = traineeCanvas.getContext('2d');
    if (traineeCtx) {
      traineeCtx.fillStyle = 'white';
      traineeCtx.fillRect(0, 0, traineeCanvas.width, traineeCanvas.height);
      traineeStrokeData.forEach((stroke: any[]) => {
        if (stroke.length === 0) return;
        traineeCtx.beginPath();
        stroke.forEach((point: any, index: number) => {
          if (index === 0) {
            traineeCtx.moveTo(point.x, point.y);
          } else {
            traineeCtx.lineTo(point.x, point.y);
          }
        });
        traineeCtx.strokeStyle = 'black';
        traineeCtx.lineWidth = 2;
        traineeCtx.lineCap = 'round';
        traineeCtx.lineJoin = 'round';
        traineeCtx.stroke();
      });
    }
    const traineeSignatureUrl = traineeCanvas.toDataURL('image/png');

    // Get selected scans in order
    const scansToExport = list.filter(s => selectedScans.has(s.id!));

    // Create PDF for each selected scan
    scansToExport.forEach((scan, index) => {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      // Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Logbook report form', margin, 20);

      // Section 1: Demographics and Operator
      let yPos = 30;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      // Demographics table
      doc.rect(margin, yPos, pageWidth - 2 * margin, 10);
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPos, 60, 10, 'F');
      doc.text('Demographics (e.g Age, Gender, BMI)', margin + 2, yPos + 6);
      
      doc.rect(margin + 60, yPos, 80, 10);
      const demographics = `${scan.age || '—'}, ${scan.gender || '—'}, BMI: ${scan.bmi || '—'}`;
      doc.text(demographics, margin + 62, yPos + 6);
      
      doc.setFillColor(200, 200, 200);
      doc.rect(margin + 140, yPos, 30, 10, 'F');
      doc.text('Operator', margin + 142, yPos + 6);
      doc.rect(margin + 170, yPos, pageWidth - 2 * margin - 170, 10);

      // Indication for Scan
      yPos += 10;
      doc.rect(margin, yPos, 60, 10);
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPos, 60, 10, 'F');
      doc.text('Indication for Scan', margin + 2, yPos + 6);
      doc.setFont('helvetica', 'normal');
      doc.rect(margin + 60, yPos, pageWidth - 2 * margin - 60, 10);
      doc.text(scan.indications || '—', margin + 62, yPos + 6);

      // Ventilation row
      yPos += 10;
      doc.rect(margin, yPos, 60, 10);
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPos, 60, 10, 'F');
      doc.text('Ventilation', margin + 2, yPos + 6);
      
      const ventColWidth = (pageWidth - 2 * margin - 60) / 3;
      doc.rect(margin + 60, yPos, ventColWidth, 10);
      if (scan.ventilation === 'IPPV') doc.setFont('helvetica', 'bold');
      doc.text('IPPV', margin + 60 + ventColWidth / 2 - 5, yPos + 6);
      doc.setFont('helvetica', 'normal');
      
      doc.rect(margin + 60 + ventColWidth, yPos, ventColWidth, 10);
      if (scan.ventilation === 'PSV') doc.setFont('helvetica', 'bold');
      doc.text('PSV', margin + 60 + ventColWidth * 1.5 - 4, yPos + 6);
      doc.setFont('helvetica', 'normal');
      
      doc.rect(margin + 60 + ventColWidth * 2, yPos, ventColWidth, 10);
      if (scan.ventilation === 'SPONT') doc.setFont('helvetica', 'bold');
      doc.text('SPONT', margin + 60 + ventColWidth * 2.5 - 7, yPos + 6);
      doc.setFont('helvetica', 'normal');

      // Vital Signs
      yPos += 10;
      doc.rect(margin, yPos, 60, 10);
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPos, 60, 10, 'F');
      doc.text('Vital Signs', margin + 2, yPos + 6);
      
      const vsColWidth = (pageWidth - 2 * margin - 60) / 3;
      doc.rect(margin + 60, yPos, vsColWidth, 10);
      doc.text(`HR: ${scan.hr || '—'}`, margin + 62, yPos + 6);
      doc.rect(margin + 60 + vsColWidth, yPos, vsColWidth, 10);
      doc.text(`BP: ${scan.bp || '—'}`, margin + 62 + vsColWidth, yPos + 6);
      doc.rect(margin + 60 + vsColWidth * 2, yPos, vsColWidth, 10);
      doc.text(`CVP: ${scan.cvp || '—'}`, margin + 62 + vsColWidth * 2, yPos + 6);

      // CV Support
      yPos += 10;
      doc.rect(margin, yPos, 60, 10);
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPos, 60, 10, 'F');
      doc.text('CV Support', margin + 2, yPos + 6);
      doc.rect(margin + 60, yPos, pageWidth - 2 * margin - 60, 10);
      doc.text(scan.cvSupport || '—', margin + 62, yPos + 6);

      // Views
      yPos += 10;
      doc.rect(margin, yPos, 60, 10);
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPos, 60, 10, 'F');
      doc.text('Views', margin + 2, yPos + 6);
      
      const viewWidth = (pageWidth - 2 * margin - 60) / 5;
      const scanViews = scan.views || [];
      ['PLAX', 'PSAX', 'AP4C', 'SC4C', 'IVC'].forEach((view, i) => {
        doc.rect(margin + 60 + i * viewWidth, yPos, viewWidth, 10);
        if (scanViews.includes(view as any)) doc.setFont('helvetica', 'bold');
        doc.text(view, margin + 60 + i * viewWidth + viewWidth / 2 - 5, yPos + 6);
        doc.setFont('helvetica', 'normal');
      });

      // Image Quality
      yPos += 10;
      doc.rect(margin, yPos, 60, 10);
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPos, 60, 10, 'F');
      doc.text('Image Quality', margin + 2, yPos + 6);
      
      const iqWidth = (pageWidth - 2 * margin - 60) / 3;
      doc.rect(margin + 60, yPos, iqWidth, 10);
      if (scan.imageQuality === 'Good') doc.setFont('helvetica', 'bold');
      doc.text('Good', margin + 60 + iqWidth / 2 - 5, yPos + 6);
      doc.setFont('helvetica', 'normal');
      
      doc.rect(margin + 60 + iqWidth, yPos, iqWidth, 10);
      if (scan.imageQuality === 'Acceptable') doc.setFont('helvetica', 'bold');
      doc.text('Acceptable', margin + 60 + iqWidth * 1.5 - 8, yPos + 6);
      doc.setFont('helvetica', 'normal');
      
      doc.rect(margin + 60 + iqWidth * 2, yPos, iqWidth, 10);
      if (scan.imageQuality === 'Poor') doc.setFont('helvetica', 'bold');
      doc.text('Poor', margin + 60 + iqWidth * 2.5 - 4, yPos + 6);
      doc.setFont('helvetica', 'normal');

      // Findings section
      yPos += 15;
      doc.rect(margin, yPos, pageWidth - 2 * margin, 10);
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Findings', pageWidth / 2, yPos + 6, { align: 'center' });

      // Findings rows
      const findings = [
        ['LV dilated?', scan.lvDilated],
        ['LV significantly impaired?', scan.lvImpaired],
        ['RV dilated?', scan.rvDilated],
        ['RV significantly impaired?', scan.rvImpaired],
        ['Evidence of low preload?', scan.lowPreload],
        ['Pericardial fluid?', scan.pericardialFluid],
        ['Pleural fluid', scan.pleuralFluid],
      ];

      yPos += 10;
      doc.setFont('helvetica', 'normal');
      findings.forEach(([label, value]) => {
        const findWidth = (pageWidth - 2 * margin - 120) / 3;
        doc.rect(margin, yPos, 120, 10);
        doc.text(label, margin + 2, yPos + 6);
        
        doc.rect(margin + 120, yPos, findWidth, 10);
        if (value === 'Yes') doc.setFont('helvetica', 'bold');
        doc.text('Yes', margin + 120 + findWidth / 2 - 4, yPos + 6);
        doc.setFont('helvetica', 'normal');
        
        doc.rect(margin + 120 + findWidth, yPos, findWidth, 10);
        if (value === 'No') doc.setFont('helvetica', 'bold');
        doc.text('No', margin + 120 + findWidth * 1.5 - 3, yPos + 6);
        doc.setFont('helvetica', 'normal');
        
        doc.rect(margin + 120 + findWidth * 2, yPos, findWidth, 10);
        if (value === 'U/A') doc.setFont('helvetica', 'bold');
        doc.text('U/A', margin + 120 + findWidth * 2.5 - 3, yPos + 6);
        doc.setFont('helvetica', 'normal');
        
        yPos += 10;
      });

      // Summary of findings
      doc.rect(margin, yPos, pageWidth - 2 * margin, 40);
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPos, 60, 10, 'F');
      doc.text('Summary of findings', margin + 2, yPos + 6);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.text('(to include conclusion, clinical correlation, suggested actions', margin + 2, yPos + 15);
      doc.text('and requirement for referral?)', margin + 2, yPos + 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const summaryText = scan.findingsSummary || '—';
      doc.text(summaryText, margin + 62, yPos + 6, { maxWidth: pageWidth - 2 * margin - 65 });

      // Signatures
      yPos += 40;
      doc.rect(margin, yPos, (pageWidth - 2 * margin) / 2, 20);
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPos, 60, 10, 'F');
      doc.text('Trainee signature', margin + 2, yPos + 6);
      
      // Add trainee signature
      if (traineeSignatureUrl) {
        doc.addImage(traineeSignatureUrl, 'PNG', margin + 2, yPos + 10, 55, 8);
      }

      doc.rect(margin + (pageWidth - 2 * margin) / 2, yPos, (pageWidth - 2 * margin) / 2, 20);
      doc.setFillColor(200, 200, 200);
      doc.rect(margin + (pageWidth - 2 * margin) / 2, yPos, 60, 10, 'F');
      doc.text('Mentor Signature', margin + (pageWidth - 2 * margin) / 2 + 2, yPos + 6);
      
      // Add mentor signature if exists
      if (scan.signature?.strokesJson) {
        const mentorCanvas = strokesToCanvas(scan.signature.strokesJson);
        if (mentorCanvas) {
          const mentorUrl = mentorCanvas.toDataURL('image/png');
          doc.addImage(mentorUrl, 'PNG', margin + (pageWidth - 2 * margin) / 2 + 2, yPos + 10, 55, 8);
        }
      }

      // Mentor feedback
      yPos += 20;
      doc.rect(margin, yPos, pageWidth - 2 * margin, 20);
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, yPos, 60, 10, 'F');
      doc.text('Mentor feedback', margin + 2, yPos + 6);
      if (scan.signature?.note) {
        doc.setFont('helvetica', 'normal');
        doc.text(scan.signature.note, margin + 62, yPos + 6, { maxWidth: pageWidth - 2 * margin - 65 });
      }

      // Page number at bottom
      doc.setFontSize(12);
      doc.text((index + 1).toString(), pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Save individual PDF
      doc.save(`logbook-report-${index + 1}.pdf`);
    });

    setReportOpen(false);
    setSelectedScans(new Set());
    traineeSignatureRef.current?.clear();
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
                  setShowDownloadMenu(false);
                  setReportOpen(true);
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

      {/* Report Form Modal */}
      {reportOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Generate Logbook Report Form</h2>
              <button className="text-blue-600" onClick={() => setReportOpen(false)}>
                Cancel
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Select scans to include:</h3>
                <button
                  onClick={() => {
                    if (selectedScans.size === list.length) {
                      setSelectedScans(new Set());
                    } else {
                      setSelectedScans(new Set(list.map(s => s.id!)));
                    }
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {selectedScans.size === list.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-3">
                {/* Signed scans */}
                {list.filter(s => s.signature).length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
                      Signed by Supervisor
                    </div>
                    {list.filter(s => s.signature).map((scan) => (
                      <label key={scan.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded bg-blue-50">
                        <input
                          type="checkbox"
                          checked={selectedScans.has(scan.id!)}
                          onChange={(e) => {
                            const newSet = new Set(selectedScans);
                            if (e.target.checked) {
                              newSet.add(scan.id!);
                            } else {
                              newSet.delete(scan.id!);
                            }
                            setSelectedScans(newSet);
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm flex-1">
                          {formatters.dateTime.format(new Date(scan.createdAt))} - {scan.diagnosis}
                        </span>
                        <span className="text-xs text-blue-600">✓ Signed</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Not signed scans */}
                {list.filter(s => !s.signature).length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
                      Not Signed by Supervisor
                    </div>
                    {list.filter(s => !s.signature).map((scan) => (
                      <label key={scan.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedScans.has(scan.id!)}
                          onChange={(e) => {
                            const newSet = new Set(selectedScans);
                            if (e.target.checked) {
                              newSet.add(scan.id!);
                            } else {
                              newSet.delete(scan.id!);
                            }
                            setSelectedScans(newSet);
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">
                          {formatters.dateTime.format(new Date(scan.createdAt))} - {scan.diagnosis}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Trainee Signature *</h3>
              <div className="border rounded-xl">
                <SignatureCanvas
                  ref={traineeSignatureRef}
                  penColor="black"
                  canvasProps={{
                    width: 700,
                    height: 250,
                    className: 'w-full h-[250px] rounded-xl',
                  }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <button
                  className="px-3 py-1 rounded-xl border text-sm"
                  onClick={() => traineeSignatureRef.current?.clear()}
                >
                  Clear Signature
                </button>
                <p className="text-xs text-gray-500">Sign with your pointer or finger</p>
              </div>
            </div>

            <button
              onClick={downloadLogbookReportForm}
              className="w-full rounded-xl bg-blue-600 py-3 text-white font-medium"
            >
              Generate PDF Report{selectedScans.size > 0 ? ` (${selectedScans.size} scan${selectedScans.size > 1 ? 's' : ''})` : ''}
            </button>
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