export const TZ = 'Europe/London';

export const formatters = {
  time: new Intl.DateTimeFormat('en-GB', { 
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ 
  }),
  dateTime: new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: TZ,
  }),
  title: new Intl.DateTimeFormat('en-GB', { 
    month: 'short', year: 'numeric', timeZone: TZ 
  }),
  listDate: new Intl.DateTimeFormat('en-GB', { 
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ 
  }),
  axis: new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ,
  }),
};

// Helper functions
export function isoToLocal(iso?: string) { 
  if (!iso) return ''; 
  const d = new Date(iso); 
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); 
  return z.toISOString().slice(0, 16); 
}

export function localToIso(local: string) { 
  return local ? new Date(local).toISOString() : ''; 
}

export function withOrdinal(baseFmt: Intl.DateTimeFormat, date: Date) {
  const day = parseInt(new Intl.DateTimeFormat('en-GB', { day:'numeric', timeZone: TZ }).format(date), 10);
  const ord = (n:number)=>(n%10===1&&n%100!==11?'st':n%10===2&&n%100!==12?'nd':n%10===3&&n%100!==13?'rd':'th');
  const parts = baseFmt.formatToParts(date);
  return parts.map(p=> p.type==='day' ? `${day}${ord(day)}` : p.value).join('');
}