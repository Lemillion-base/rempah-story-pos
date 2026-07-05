export function hexToRgbValues(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, '');
  
  // Parse r, g, b
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  
  return `${isNaN(r) ? 0 : r} ${isNaN(g) ? 0 : g} ${isNaN(b) ? 0 : b}`;
}

function parseHex(hex: string) {
  const clean = hex.replace(/^#/, '');
  let r = 0, g = 0, b = 0;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  }
  return {
    r: isNaN(r) ? 0 : r,
    g: isNaN(g) ? 0 : g,
    b: isNaN(b) ? 0 : b,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.min(255, Math.max(0, Math.round(val)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function mix(color1: { r: number, g: number, b: number }, color2: { r: number, g: number, b: number }, weight: number): { r: number, g: number, b: number } {
  // weight is 0 to 1, representing the amount of color2
  return {
    r: color1.r * (1 - weight) + color2.r * weight,
    g: color1.g * (1 - weight) + color2.g * weight,
    b: color1.b * (1 - weight) + color2.b * weight,
  };
}

export function generateShades(baseHex: string) {
  const base = parseHex(baseHex);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  // Generate beautiful tailwind-like shades
  return {
    50: rgbToHex(mix(base, white, 0.95).r, mix(base, white, 0.95).g, mix(base, white, 0.95).b),
    100: rgbToHex(mix(base, white, 0.85).r, mix(base, white, 0.85).g, mix(base, white, 0.85).b),
    200: rgbToHex(mix(base, white, 0.70).r, mix(base, white, 0.70).g, mix(base, white, 0.70).b),
    300: rgbToHex(mix(base, white, 0.50).r, mix(base, white, 0.50).g, mix(base, white, 0.50).b),
    400: rgbToHex(mix(base, white, 0.25).r, mix(base, white, 0.25).g, mix(base, white, 0.25).b),
    500: rgbToHex(mix(base, white, 0.10).r, mix(base, white, 0.10).g, mix(base, white, 0.10).b),
    600: baseHex,
    700: rgbToHex(mix(base, black, 0.20).r, mix(base, black, 0.20).g, mix(base, black, 0.20).b),
    800: rgbToHex(mix(base, black, 0.40).r, mix(base, black, 0.40).g, mix(base, black, 0.40).b),
    900: rgbToHex(mix(base, black, 0.60).r, mix(base, black, 0.60).g, mix(base, black, 0.60).b),
  };
}

export interface ThemePreset {
  name: string;
  color: string;
  shades: Record<string, string>;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Jamu Original (Cokelat/Oranye)',
    color: '#b85f21',
    shades: {
      '50': '#fdf8f3',
      '100': '#f9ebd9',
      '200': '#f2d4ae',
      '300': '#e9b67a',
      '400': '#de9348',
      '500': '#d17a2a',
      '600': '#b85f21',
      '700': '#94481f',
      '800': '#763b20',
      '900': '#60311d',
    }
  },
  {
    name: 'Matcha Green (Hijau Segar)',
    color: '#15803d',
    shades: {
      '50': '#f0fdf4',
      '100': '#dcfce7',
      '200': '#bbf7d0',
      '300': '#86efac',
      '400': '#4ade80',
      '500': '#22c55e',
      '600': '#16a34a',
      '700': '#15803d',
      '800': '#166534',
      '900': '#14532d',
    }
  },
  {
    name: 'Telang Blue (Biru Klasik)',
    color: '#1d4ed8',
    shades: {
      '50': '#eff6ff',
      '100': '#dbeafe',
      '200': '#bfdbfe',
      '300': '#93c5fd',
      '400': '#60a5fa',
      '500': '#3b82f6',
      '600': '#2563eb',
      '700': '#1d4ed8',
      '800': '#1e40af',
      '900': '#1e3a8a',
    }
  },
  {
    name: 'Rosella Red (Merah Elegan)',
    color: '#be123c',
    shades: {
      '50': '#fff1f2',
      '100': '#ffe4e6',
      '200': '#fecdd3',
      '300': '#fda4af',
      '400': '#fb7185',
      '500': '#f43f5e',
      '600': '#e11d48',
      '700': '#be123c',
      '800': '#9f1239',
      '900': '#881337',
    }
  },
  {
    name: 'Charcoal Slate (Abu Modern)',
    color: '#475569',
    shades: {
      '50': '#f8fafc',
      '100': '#f1f5f9',
      '200': '#e2e8f0',
      '300': '#cbd5e1',
      '400': '#94a3b8',
      '500': '#64748b',
      '600': '#475569',
      '700': '#334155',
      '800': '#1e293b',
      '900': '#0f172a',
    }
  }
];
