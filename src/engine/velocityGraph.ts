import { PropertyTrack } from './types';
import { evaluateTrack } from './evaluator';

/**
 * Motion Graph Velocity Derivative Engine
 * Adheres strictly to OpenSVG Feature Engineering Rules T6 & T10
 */

export interface VelocitySample {
  time: number;
  value: number; // Value at timestamp t
  velocity: number; // Rate of change dp/dt (units/sec)
}

export interface VelocityCurveResult {
  property: string;
  unit: string;
  samples: VelocitySample[];
  maxVelocity: number;
  minVelocity: number;
}

/**
 * Computes velocity derivative curve samples over a PropertyTrack (Rule T6 & T10)
 * Uses central difference formula: v(t) = (p(t + dt) - p(t - dt)) / (2 * dt)
 */
export function computeVelocityCurve(
  track: PropertyTrack,
  duration: number,
  sampleCount: number = 100
): VelocityCurveResult {
  if (!track || !track.keyframes || track.keyframes.length === 0 || duration <= 0) {
    return {
      property: track?.property || '',
      unit: track?.unit || '',
      samples: [],
      maxVelocity: 0,
      minVelocity: 0
    };
  }

  const samples: VelocitySample[] = [];
  const dt = 0.005; // 5ms delta for derivative
  let maxV = -Infinity;
  let minV = Infinity;
  const defVal = typeof track.keyframes[0]?.value === 'number' ? track.keyframes[0].value : 0;

  for (let i = 0; i <= sampleCount; i++) {
    const t = (i / sampleCount) * duration;

    // Evaluate position at t - dt, t, and t + dt
    const valBefore = typeof evaluateTrack(track, Math.max(0, t - dt), defVal) === 'number'
      ? (evaluateTrack(track, Math.max(0, t - dt), defVal) as number)
      : 0;

    const valCurrent = typeof evaluateTrack(track, t, defVal) === 'number'
      ? (evaluateTrack(track, t, defVal) as number)
      : 0;

    const valAfter = typeof evaluateTrack(track, Math.min(duration, t + dt), defVal) === 'number'
      ? (evaluateTrack(track, Math.min(duration, t + dt), defVal) as number)
      : 0;

    const velocity = (valAfter - valBefore) / (2 * dt);

    maxV = Math.max(maxV, velocity);
    minV = Math.min(minV, velocity);

    samples.push({
      time: parseFloat(t.toFixed(3)),
      value: parseFloat(valCurrent.toFixed(2)),
      velocity: parseFloat(velocity.toFixed(2))
    });
  }

  return {
    property: track.property,
    unit: track.unit || '',
    samples,
    maxVelocity: isFinite(maxV) ? maxV : 0,
    minVelocity: isFinite(minV) ? minV : 0
  };
}
