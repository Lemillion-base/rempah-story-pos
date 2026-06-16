export const formatRupiah = (n: number): string => {
  const rounded = Math.round(n);
  const numStr = String(Math.abs(rounded));
  let result = '';
  let count = 0;
  for (let i = numStr.length - 1; i >= 0; i--) {
    result = numStr[i] + result;
    count++;
    if (count % 3 === 0 && i > 0) {
      result = '.' + result;
    }
  }
  return (rounded < 0 ? '-Rp ' : 'Rp ') + result;
};

export const formatDate = (iso: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  
  return `${day} ${month} ${year}, ${hour}:${minute}`;
};

export const formatTime = (iso: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
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
