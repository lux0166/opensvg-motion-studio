import { TimelineMarker } from './types';

/**
 * High-Density Timeline Audio Waveform Visualizer & Beat Snapping
 * Adheres strictly to OpenSVG Feature Engineering Rules A1, A2, A3, A4
 */

export interface WaveformRenderOptions {
  width: number;
  height: number;
  barWidth?: number;
  barGap?: number;
  waveColor?: string;
  progressColor?: string;
  currentTime: number;
  duration: number;
}

/**
 * Renders high-resolution audio waveform onto an HTML Canvas 2D context (Rule A1 & A2)
 */
export function renderWaveform(
  ctx: CanvasRenderingContext2D,
  waveformData: number[],
  options: WaveformRenderOptions
) {
  if (!waveformData || waveformData.length === 0 || options.duration <= 0) return;

  const {
    width,
    height,
    barWidth = 2,
    barGap = 1,
    waveColor = '#64748b',
    progressColor = '#3b82f6',
    currentTime,
    duration
  } = options;

  ctx.clearRect(0, 0, width, height);

  const totalBars = Math.floor(width / (barWidth + barGap));
  const progressRatio = Math.max(0, Math.min(1, currentTime / duration));
  const currentProgressX = progressRatio * width;
  const centerY = height / 2;

  for (let i = 0; i < totalBars; i++) {
    const x = i * (barWidth + barGap);
    const sampleIdx = Math.min(
      waveformData.length - 1,
      Math.floor((i / totalBars) * waveformData.length)
    );
    const amplitude = Math.abs(waveformData[sampleIdx] || 0);
    const barHeight = Math.max(2, amplitude * (height * 0.85));

    ctx.fillStyle = x <= currentProgressX ? progressColor : waveColor;
    ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
  }
}

/**
 * Snaps playhead timestamp to nearest audio beat marker within a threshold window (Rule A3 & A4)
 */
export function snapTimeToBeatMarker(
  targetTime: number,
  markers: TimelineMarker[],
  thresholdSeconds: number = 0.05
): { snappedTime: number; marker: TimelineMarker | null } {
  if (!markers || markers.length === 0) {
    return { snappedTime: targetTime, marker: null };
  }

  let closestMarker: TimelineMarker | null = null;
  let minDiff = Infinity;

  for (const m of markers) {
    const diff = Math.abs(m.time - targetTime);
    if (diff < minDiff && diff <= thresholdSeconds) {
      minDiff = diff;
      closestMarker = m;
    }
  }

  if (closestMarker) {
    return { snappedTime: closestMarker.time, marker: closestMarker };
  }

  return { snappedTime: targetTime, marker: null };
}
