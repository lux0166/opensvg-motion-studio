import { Keyframe } from './types';

/**
 * Audio-Reactive Keyframe Generation Engine
 * Adheres strictly to OpenSVG Feature Engineering Rules A5 & A6
 */

export interface AudioReactiveConfig {
  property: string;
  minVal: number;
  maxVal: number;
  threshold: number; // 0.0 to 1.0 (amplitude floor)
  smoothing: number; // 0.0 to 1.0 (moving average blend)
  sampleRateFps: number; // e.g. 30 or 60
  duration: number; // seconds
}

/**
 * Generates an array of animation keyframes mapped deterministically from audio waveform energy (Rule A5 & A6).
 */
export function generateAudioReactiveKeyframes(
  waveformData: number[],
  config: AudioReactiveConfig
): Keyframe<number>[] {
  if (!waveformData || waveformData.length === 0 || config.duration <= 0) return [];

  const keyframes: Keyframe<number>[] = [];
  const totalFrames = Math.floor(config.duration * config.sampleRateFps);
  const frameInterval = 1 / config.sampleRateFps;

  let prevSmoothedEnergy = 0;

  for (let i = 0; i <= totalFrames; i++) {
    const time = parseFloat((i * frameInterval).toFixed(3));
    const progress = Math.min(1, time / config.duration);

    // Sample waveform energy index
    const waveIndex = Math.min(
      waveformData.length - 1,
      Math.floor(progress * waveformData.length)
    );
    const rawEnergy = Math.abs(waveformData[waveIndex] || 0);

    // Apply threshold gate
    const gatedEnergy = rawEnergy >= config.threshold
      ? (rawEnergy - config.threshold) / (1 - config.threshold || 0.01)
      : 0;

    // Apply temporal smoothing (moving average filter)
    const smoothedEnergy = prevSmoothedEnergy * config.smoothing + gatedEnergy * (1 - config.smoothing);
    prevSmoothedEnergy = smoothedEnergy;

    // Map energy to value range [minVal, maxVal]
    const calculatedValue = parseFloat((config.minVal + (config.maxVal - config.minVal) * smoothedEnergy).toFixed(2));

    keyframes.push({
      id: `kf-audio-${i}-${Math.random().toString(36).substr(2, 5)}`,
      time,
      value: calculatedValue,
      easing: 'ease-out'
    });
  }

  return keyframes;
}
