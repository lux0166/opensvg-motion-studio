import { describe, it, expect } from 'vitest';
import { parseHex, rgbToHsl, hslToRgb, hslToHex, generateColorHarmonies } from '../colorHarmony';

describe('Color Harmony Engine', () => {
  it('correctly converts RGB to HSL and back', () => {
    // Red: RGB(255, 0, 0) -> HSL(0, 100%, 50%)
    const [h, s, l] = rgbToHsl(255, 0, 0);
    expect(h).toBe(0);
    expect(s).toBe(100);
    expect(l).toBe(50);

    const [r, g, b] = hslToRgb(0, 100, 50);
    expect(r).toBe(255);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it('correctly parses hex and formats back to hex', () => {
    expect(parseHex('#ff0000')).toEqual([255, 0, 0]);
    expect(parseHex('#f00')).toEqual([255, 0, 0]);
    expect(hslToHex(0, 100, 50).toLowerCase()).toBe('#ff0000');
  });

  it('generates accurate Complementary, Triadic, and Analogous harmonies', () => {
    // Pure Red (#ff0000)
    const harmonies = generateColorHarmonies('#ff0000');

    // Complementary of Red (0 deg) is Cyan (180 deg) -> #00ffff
    expect(harmonies.complementary.length).toBe(2);
    expect(harmonies.complementary[0].toLowerCase()).toBe('#ff0000');
    expect(harmonies.complementary[1].toLowerCase()).toBe('#00ffff');

    // Triadic of Red (0 deg) -> [Red, Green #00ff00, Blue #0000ff]
    expect(harmonies.triadic.length).toBe(3);
    expect(harmonies.triadic[0].toLowerCase()).toBe('#ff0000');
    expect(harmonies.triadic[1].toLowerCase()).toBe('#00ff00');
    expect(harmonies.triadic[2].toLowerCase()).toBe('#0000ff');

    // Analogous has 3 colors
    expect(harmonies.analogous.length).toBe(3);
    // Monochromatic has 4 shades
    expect(harmonies.monochromatic.length).toBe(4);
    // Tetradic has 4 colors
    expect(harmonies.tetradic.length).toBe(4);
  });
});
