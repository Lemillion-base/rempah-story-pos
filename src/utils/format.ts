export const formatRupiah = (n: number): string => {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
};

export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

export const isSameDay = (a: Date, b: Date): boolean => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export const startOfWeek = (d: Date): Date => {
  const out = new Date(d);
  const day = out.getDay() === 0 ? 6 : out.getDay() - 1; // Monday=0
  out.setDate(out.getDate() - day);
  out.setHours(0, 0, 0, 0);
  return out;
};
