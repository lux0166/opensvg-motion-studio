import { Matrix2D, Vec2, Transform } from '../runtime/coreContracts';

/**
 * 2D Affine Transform Matrix Engine
 * Adheres strictly to CORE_ENGINE_DEPTH.md (Section 4) & CORE-02
 * Matrix Representation:
 * [ a  c  e ]
 * [ b  d  f ]
 * [ 0  0  1 ]
 */

export const IDENTITY_MATRIX: Matrix2D = Object.freeze({
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: 0,
  f: 0
});

export function createIdentity(): Matrix2D {
  return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
}

export function createTranslation(tx: number, ty: number): Matrix2D {
  return { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty };
}

export function createRotation(degrees: number): Matrix2D {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
}

export function createScale(sx: number, sy: number): Matrix2D {
  return { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 };
}

/**
 * Multiplies two 2D matrices: M = m1 * m2
 */
export function multiplyMatrices(m1: Matrix2D, m2: Matrix2D): Matrix2D {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f
  };
}

/**
 * Inverts a 2D matrix. Returns identity if determinant is zero.
 */
export function invertMatrix(m: Matrix2D): Matrix2D {
  const det = m.a * m.d - m.b * m.c;
  if (Math.abs(det) < 1e-10) {
    return createIdentity();
  }

  const invDet = 1 / det;
  return {
    a: m.d * invDet,
    b: -m.b * invDet,
    c: -m.c * invDet,
    d: m.a * invDet,
    e: (m.c * m.f - m.d * m.e) * invDet,
    f: (m.b * m.e - m.a * m.f) * invDet
  };
}

/**
 * Transforms a 2D point [x, y, 1]^T by a matrix
 */
export function transformPoint(m: Matrix2D, p: Vec2): Vec2 {
  return {
    x: parseFloat((m.a * p.x + m.c * p.y + m.e).toFixed(4)),
    y: parseFloat((m.b * p.x + m.d * p.y + m.f).toFixed(4))
  };
}

/**
 * Transforms a 2D direction vector [dx, dy, 0]^T (ignoring translation)
 */
export function transformVector(m: Matrix2D, v: Vec2): Vec2 {
  return {
    x: parseFloat((m.a * v.x + m.c * v.y).toFixed(4)),
    y: parseFloat((m.b * v.x + m.d * v.y).toFixed(4))
  };
}

/**
 * Composes a full Transform (Translation, Rotation, Scale, Pivot) into a Matrix2D
 */
export function composeTransform(transform: Transform, boundsWidth: number = 0, boundsHeight: number = 0): Matrix2D {
  const pivotPxX = transform.pivot.x * boundsWidth;
  const pivotPxY = transform.pivot.y * boundsHeight;

  // 1. Translate to object position + pivot
  const t1 = createTranslation(transform.translation.x + pivotPxX, transform.translation.y + pivotPxY);
  // 2. Rotate
  const r = createRotation(transform.rotation);
  // 3. Scale
  const s = createScale(transform.scale.x, transform.scale.y);
  // 4. Translate back from pivot
  const t2 = createTranslation(-pivotPxX, -pivotPxY);

  return multiplyMatrices(t1, multiplyMatrices(r, multiplyMatrices(s, t2)));
}

/**
 * Decomposes a Matrix2D back into translation, rotation, scale
 */
export function decomposeMatrix(m: Matrix2D): { translation: Vec2; rotation: number; scale: Vec2 } {
  const tx = m.e;
  const ty = m.f;

  const sx = Math.sqrt(m.a * m.a + m.b * m.b);
  const sy = Math.sqrt(m.c * m.c + m.d * m.d);

  const rotRad = Math.atan2(m.b, m.a);
  const rotDeg = parseFloat(((rotRad * 180) / Math.PI).toFixed(3));

  return {
    translation: { x: parseFloat(tx.toFixed(3)), y: parseFloat(ty.toFixed(3)) },
    rotation: rotDeg,
    scale: { x: parseFloat(sx.toFixed(3)), y: parseFloat(sy.toFixed(3)) }
  };
}
