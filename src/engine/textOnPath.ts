import { BezierPoint } from './types';
import { pointDistance, pointAngle } from './geometry';

/**
 * Kinetic Typography & Text on Path Engine
 * Adheres strictly to OpenSVG Feature Engineering Rules K1, K2, K3, K4, K5
 */

export interface PathSample {
  x: number;
  y: number;
  tangentAngle: number; // in radians
  distance: number;
}

export interface GlyphRenderData {
  char: string;
  x: number;
  y: number;
  rotation: number; // in degrees
  opacity: number;
  scale: number;
}

/**
 * Approximates path points with a high-density polyline for distance metric sampling (Rule K1)
 */
export function samplePathMetrics(points: BezierPoint[], stepsPerSegment: number = 20): PathSample[] {
  if (!points || points.length < 2) return [];

  const samples: PathSample[] = [];
  let accumulatedDist = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];

    for (let step = 0; step < stepsPerSegment; step++) {
      const t = step / stepsPerSegment;
      const nextT = (step + 1) / stepsPerSegment;

      let x = 0, y = 0, nextX = 0, nextY = 0;

      if (p1.cp1x !== undefined && p1.cp1y !== undefined && p0.cp2x !== undefined && p0.cp2y !== undefined) {
        // Cubic bezier
        const u = 1 - t;
        x = u*u*u*p0.x + 3*u*u*t*p0.cp2x + 3*u*t*t*p1.cp1x + t*t*t*p1.x;
        y = u*u*u*p0.y + 3*u*u*t*p0.cp2y + 3*u*t*t*p1.cp1y + t*t*t*p1.y;

        const nextU = 1 - nextT;
        nextX = nextU*nextU*nextU*p0.x + 3*nextU*nextU*nextT*p0.cp2x + 3*nextU*nextT*nextT*p1.cp1x + nextT*nextT*nextT*p1.x;
        nextY = nextU*nextU*nextU*p0.y + 3*nextU*nextU*nextT*p0.cp2y + 3*nextU*nextT*nextT*p1.cp1y + nextT*nextT*nextT*p1.y;
      } else {
        // Linear segment
        x = p0.x + (p1.x - p0.x) * t;
        y = p0.y + (p1.y - p0.y) * t;
        nextX = p0.x + (p1.x - p0.x) * nextT;
        nextY = p0.y + (p1.y - p0.y) * nextT;
      }

      const segDist = pointDistance(x, y, nextX, nextY);
      const angle = pointAngle(x, y, nextX, nextY);

      samples.push({
        x,
        y,
        tangentAngle: angle,
        distance: accumulatedDist
      });

      accumulatedDist += segDist;

      if (step === stepsPerSegment - 1 && i === points.length - 2) {
        samples.push({
          x: nextX,
          y: nextY,
          tangentAngle: angle,
          distance: accumulatedDist
        });
      }
    }
  }

  return samples;
}

/**
 * Calculates glyph layout along a path metric curve (Rule K1, K2, K3)
 */
export function computeTextOnPath(
  text: string,
  pathPoints: BezierPoint[],
  offsetProgress: number = 0, // 0.0 to 1.0
  fontSize: number = 24,
  letterSpacing: number = 2
): GlyphRenderData[] {
  if (!text || !pathPoints || pathPoints.length < 2) return [];

  const samples = samplePathMetrics(pathPoints, 25);
  if (samples.length === 0) return [];

  const totalLength = samples[samples.length - 1].distance;
  if (totalLength <= 0) return [];

  const startDistance = offsetProgress * totalLength;
  const glyphs: GlyphRenderData[] = [];
  const charAdvance = fontSize * 0.6 + letterSpacing;

  let currentDist = startDistance;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (currentDist > totalLength) break;

    // Find closest sample point along distance
    let sample = samples[0];
    for (let s = 0; s < samples.length; s++) {
      if (samples[s].distance >= currentDist) {
        sample = samples[s];
        break;
      }
    }

    glyphs.push({
      char,
      x: sample.x,
      y: sample.y,
      rotation: (sample.tangentAngle * 180) / Math.PI,
      opacity: 1,
      scale: 1
    });

    currentDist += charAdvance;
  }

  return glyphs;
}

/**
 * Computes kinetic text stagger per character (Rule K4 & K5)
 */
export function computeKineticTextStagger(
  text: string,
  currentTime: number,
  staggerType: 'none' | 'typewriter' | 'wave' | 'cascade' = 'none',
  staggerDelay: number = 0.06,
  baseDuration: number = 0.4
): GlyphRenderData[] {
  if (!text) return [];

  const glyphs: GlyphRenderData[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charStartTime = i * staggerDelay;
    const progress = Math.max(0, Math.min(1, (currentTime - charStartTime) / baseDuration));

    let opacity = 1;
    let scale = 1;
    let yOffset = 0;

    if (staggerType === 'typewriter') {
      opacity = currentTime >= charStartTime ? 1 : 0;
    } else if (staggerType === 'wave') {
      opacity = progress;
      yOffset = Math.sin(progress * Math.PI) * -15; // Bounce wave
      scale = 0.5 + progress * 0.5;
    } else if (staggerType === 'cascade') {
      opacity = progress;
      yOffset = (1 - progress) * 20; // Slide up
      scale = progress;
    }

    glyphs.push({
      char,
      x: 0, // Relies on standard kerning if not on path
      y: yOffset,
      rotation: 0,
      opacity: parseFloat(opacity.toFixed(3)),
      scale: parseFloat(scale.toFixed(3))
    });
  }

  return glyphs;
}
