export interface SpringConfig {
  mass: number;
  stiffness: number;
  damping: number;
  velocity?: number;
}

export const SPRING_PRESETS: Record<string, SpringConfig> = {
  bouncy: { mass: 1, stiffness: 280, damping: 10, velocity: 0 },
  gentle: { mass: 1, stiffness: 120, damping: 14, velocity: 0 },
  wobbly: { mass: 1, stiffness: 180, damping: 12, velocity: 0 },
  snappy: { mass: 0.8, stiffness: 400, damping: 28, velocity: 0 }
};

export const DEFAULT_SPRING: SpringConfig = SPRING_PRESETS.bouncy;

/**
 * Analytical Damped Harmonic Oscillator (Spring) Evaluator
 * Evaluates position at time t (normalized 0 to 1, scaled by duration)
 */
export function evaluateSpring(
  from: number,
  to: number,
  t: number,
  config: SpringConfig = DEFAULT_SPRING
): number {
  if (t <= 0) return from;
  if (from === to) return from;

  const { mass = 1, stiffness = 280, damping = 10 } = config;
  const m = Math.max(0.01, mass);
  const k = Math.max(1, stiffness);
  const c = Math.max(0.1, damping);

  const omega0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));

  let progress = 1;

  if (zeta < 1) {
    // Underdamped (oscillation / bounce)
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const decay = Math.exp(-zeta * omega0 * t);
    const envelope = Math.cos(omegaD * t) + ((zeta * omega0) / omegaD) * Math.sin(omegaD * t);
    progress = 1 - decay * envelope;
  } else if (Math.abs(zeta - 1) < 0.001) {
    // Critically Damped
    const decay = Math.exp(-omega0 * t);
    progress = 1 - decay * (1 + omega0 * t);
  } else {
    // Overdamped
    const omegaD = omega0 * Math.sqrt(zeta * zeta - 1);
    const decay = Math.exp(-zeta * omega0 * t);
    const envelope = Math.cosh(omegaD * t) + ((zeta * omega0) / omegaD) * Math.sinh(omegaD * t);
    progress = 1 - decay * envelope;
  }

  return from + (to - from) * progress;
}
