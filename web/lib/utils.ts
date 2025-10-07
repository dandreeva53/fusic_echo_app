// lib/utils.ts

export function emailToName(email: string): string {
  return email.split('@')[0].replace('.', ' ');
}

export function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function toStr(x: any): string {
  return x ?? '—';
}

export function addHours(d: Date, h: number): Date {
  const n = new Date(d);
  n.setHours(n.getHours() + h);
  return n;
}