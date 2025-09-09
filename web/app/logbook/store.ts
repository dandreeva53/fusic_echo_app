'use client';

export type Gender = 'M' | 'F' | 'Other';
export type ImageQuality = 'Good' | 'Acceptable' | 'Poor';

export type Scan = {
  id: string;
  createdAt: string;   // ISO
  diagnosis: string;
  age?: number;
  gender?: Gender;
  bmi?: number;
  notes?: string;
  comments?: string;

  // Summary/Details
  indications?: string;
  ventilation?: string;
  hr?: string;
  bp?: string;
  cvp?: string;
  cvSupport?: string;
  views?: ('PLAX' | 'PSAX' | 'AP4C' | 'SC4C' | 'IVC')[];
  imageQuality?: ImageQuality;

  // Findings (Yes/No/U/A)
  lvDilated?: 'Yes' | 'No' | 'U/A';
  lvImpaired?: 'Yes' | 'No' | 'U/A';
  lowPreload?: 'Yes' | 'No' | 'U/A';
  pericardialFluid?: 'Yes' | 'No' | 'U/A';
  pleuralFluid?: 'Yes' | 'No' | 'U/A';

  findingsSummary?: string;
};

const KEY = 'fusic-logbook-v1';

function read(): Scan[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Scan[]) : [];
  } catch {
    return [];
  }
}
function write(scans: Scan[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(scans));
}

export function listScans(): Scan[] {
  return read().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}
export function getScan(id: string): Scan | undefined {
  return read().find((s) => s.id === id);
}
export function addScan(s: Scan) {
  const all = read();
  all.push(s);
  write(all);
}
export function updateScan(id: string, patch: Partial<Scan>) {
  const all = read().map((s) => (s.id === id ? { ...s, ...patch } : s));
  write(all);
}
export function removeScan(id: string) {
  write(read().filter((s) => s.id !== id));
}
export function seedIfEmpty() {
  const all = read();
  if (all.length) return;
  const seed: Scan = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    diagnosis: 'Tamponade',
    age: 50,
    gender: 'F',
    notes: 'forgot to log',
    views: ['PLAX', 'PSAX', 'AP4C', 'SC4C', 'IVC'],
    imageQuality: 'Acceptable',
    pericardialFluid: 'Yes',
  };
  write([seed]);
}
