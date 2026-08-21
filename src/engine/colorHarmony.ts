/**
 * Color Harmony & Palette Generator Engine
 * Pure mathematical color conversions without external dependencies.
 * (Constitution Rule 08 & 45 - Pure, Deterministic Domain Logic)
 */

export interface ColorHarmonies {
  complementary: string[];
  analogous: string[];
  triadic: string[];
  monochromatic: string[];
  tetradic: string[];
}

export function parseHex(hex: string): [number, number, number] {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) {
    return [0, 0, 0];
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = (h % 360 + 360) % 360 / 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Generates harmonic color sets based on a base hex color
 */
export function generateColorHarmonies(baseHex: string): ColorHarmonies {
  const [r, g, b] = parseHex(baseHex);
  const [h, s, l] = rgbToHsl(r, g, b);

  return {
    complementary: [
      hslToHex(h, s, l),
      hslToHex(h + 180, s, l)
    ],
    analogous: [
      hslToHex(h - 30, s, l),
      hslToHex(h, s, l),
      hslToHex(h + 30, s, l)
    ],
    triadic: [
      hslToHex(h, s, l),
      hslToHex(h + 120, s, l),
      hslToHex(h + 240, s, l)
    ],
    monochromatic: [
      hslToHex(h, s, Math.max(15, l - 30)),
      hslToHex(h, s, Math.max(25, l - 15)),
      hslToHex(h, s, l),
      hslToHex(h, Math.max(10, s - 20), Math.min(90, l + 20))
    ],
    tetradic: [
      hslToHex(h, s, l),
      hslToHex(h + 60, s, l),
      hslToHex(h + 180, s, l),
      hslToHex(h + 240, s, l)
    ]
  };
}
