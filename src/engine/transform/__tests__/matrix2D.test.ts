import { describe, it, expect } from 'vitest';
import {
  createIdentity,
  createTranslation,
  createRotation,
  createScale,
  multiplyMatrices,
  invertMatrix,
  transformPoint,
  transformVector,
  composeTransform,
  decomposeMatrix
} from '../matrix2D';

describe('Transform Engine — Matrix2D (CORE-02 & Section 4)', () => {
  it('creates identity and handles point translation', () => {
    const id = createIdentity();
    expect(id.a).toBe(1);
    expect(id.d).toBe(1);

    const t = createTranslation(100, 50);
    const p = transformPoint(t, { x: 10, y: 20 });
    expect(p.x).toBe(110);
    expect(p.y).toBe(70);
  });

  it('rotates points 90 degrees around origin', () => {
    const r = createRotation(90);
    const p = transformPoint(r, { x: 10, y: 0 });
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(10);
  });

  it('scales vectors and points correctly', () => {
    const s = createScale(2, 3);
    const p = transformPoint(s, { x: 10, y: 20 });
    expect(p.x).toBe(20);
    expect(p.y).toBe(60);

    const v = transformVector(s, { x: 5, y: 5 });
    expect(v.x).toBe(10);
    expect(v.y).toBe(15);
  });

  it('inverts affine matrices correctly (M * M^-1 = Identity)', () => {
    const m = multiplyMatrices(createTranslation(50, 100), createRotation(45));
    const inv = invertMatrix(m);
    const prod = multiplyMatrices(m, inv);

    expect(prod.a).toBeCloseTo(1);
    expect(prod.b).toBeCloseTo(0);
    expect(prod.c).toBeCloseTo(0);
    expect(prod.d).toBeCloseTo(1);
    expect(prod.e).toBeCloseTo(0);
    expect(prod.f).toBeCloseTo(0);
  });

  it('composes full transform with pivot point offset', () => {
    const matrix = composeTransform(
      {
        translation: { x: 100, y: 100 },
        rotation: 0,
        scale: { x: 1, y: 1 },
        pivot: { x: 0.5, y: 0.5 }
      },
      200,
      100
    );

    expect(matrix.e).toBe(100);
    expect(matrix.f).toBe(100);
  });

  it('decomposes matrix back into translation and scale', () => {
    const m = multiplyMatrices(createTranslation(200, 300), createScale(2, 2));
    const dec = decomposeMatrix(m);

    expect(dec.translation.x).toBe(200);
    expect(dec.translation.y).toBe(300);
    expect(dec.scale.x).toBe(2);
    expect(dec.scale.y).toBe(2);
  });
});
