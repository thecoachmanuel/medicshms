/**
 * Color Utilities for Dynamic Theme Generation
 */

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

/**
 * Converts a hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Converts RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Converts RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Converts HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Generates a full tailwind-like palette from a single base color
 */
export function generatePalette(baseHex: string): ColorPalette {
  const rgb = hexToRgb(baseHex);
  if (!rgb) {
    // Return a default blue palette if hex is invalid
    return generatePalette('#3b82f6');
  }

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  const shades = {
    50: 95,
    100: 90,
    200: 80,
    300: 70,
    400: 60,
    500: hsl.l,
    600: Math.max(0, hsl.l - 10),
    700: Math.max(0, hsl.l - 20),
    800: Math.max(0, hsl.l - 30),
    900: Math.max(0, hsl.l - 40),
    950: Math.max(0, hsl.l - 50),
  };

  const palette: any = {};
  
  // Special case: if baseHex is already provided, use it for 500
  // to ensure exact match with user choice
  
  (Object.keys(shades) as unknown as (keyof ColorPalette)[]).forEach((shade) => {
    if (Number(shade) === 500) {
      palette[shade] = baseHex;
    } else {
      const { r, g, b } = hslToRgb(hsl.h, hsl.s, shades[shade]);
      palette[shade] = rgbToHex(r, g, b);
    }
  });

  return palette as ColorPalette;
}
