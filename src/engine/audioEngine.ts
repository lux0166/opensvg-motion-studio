/**
 * Audio Engine with Web Audio API & Waveform Peak Extraction
 */

export function extractWaveformData(channelData: Float32Array, sampleCount = 100): number[] {
  const blockSize = Math.floor(channelData.length / sampleCount);
  const peaks: number[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const start = i * blockSize;
    let max = 0;
    for (let j = 0; j < blockSize; j++) {
      const val = Math.abs(channelData[start + j] || 0);
      if (val > max) max = val;
    }
    peaks.push(parseFloat(Math.min(1, max).toFixed(3)));
  }

  return peaks;
}

export function generateSyntheticWaveform(sampleCount = 100): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const v = Math.abs(Math.sin(i * 0.2) * 0.7 + Math.cos(i * 0.5) * 0.3);
    peaks.push(parseFloat(Math.max(0.1, Math.min(1, v)).toFixed(3)));
  }
  return peaks;
}

export async function parseAudioFile(file: File, sampleCount = 100): Promise<{
  src: string;
  duration: number;
  waveformData: number[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          // Fallback if Web Audio not supported
          resolve({
            src: URL.createObjectURL(file),
            duration: 3.0,
            waveformData: generateSyntheticWaveform(sampleCount)
          });
          return;
        }

        const ctx = new AudioCtx();
        const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
        const channelData = decoded.getChannelData(0);
        const waveform = extractWaveformData(channelData, sampleCount);

        const dataUrl = URL.createObjectURL(file);
        resolve({
          src: dataUrl,
          duration: parseFloat(decoded.duration.toFixed(2)),
          waveformData: waveform
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Audio Beat Detection using instantaneous energy spike thresholding over a sliding window
 * (Constitution Rule 08 & 45 - Pure, Deterministic Audio Energy Analysis)
 */
export function detectAudioBeats(
  channelData: Float32Array,
  sampleRate = 44100,
  thresholdMultiplier = 1.25,
  minBeatDistance = 0.25 // minimum seconds between beats (max 240 BPM)
): number[] {
  const frameSize = 1024;
  const numFrames = Math.floor(channelData.length / frameSize);
  const energies: number[] = [];

  // 1. Compute frame RMS energy
  for (let i = 0; i < numFrames; i++) {
    const start = i * frameSize;
    let sum = 0;
    for (let j = 0; j < frameSize; j++) {
      const s = channelData[start + j] || 0;
      sum += s * s;
    }
    energies.push(sum / frameSize);
  }

  // 2. Sliding window average energy comparison
  const windowSize = 40; // ~1 sec history
  const beats: number[] = [];
  let lastBeatTime = -minBeatDistance;

  for (let i = 0; i < energies.length; i++) {
    const start = Math.max(0, i - windowSize / 2);
    const end = Math.min(energies.length, i + windowSize / 2);
    let avgEnergy = 0;
    for (let w = start; w < end; w++) {
      avgEnergy += energies[w];
    }
    avgEnergy /= (end - start);

    const currentTime = (i * frameSize) / sampleRate;
    const isPeak = energies[i] > avgEnergy * thresholdMultiplier && energies[i] > 0.001;

    if (isPeak && currentTime - lastBeatTime >= minBeatDistance) {
      beats.push(parseFloat(currentTime.toFixed(2)));
      lastBeatTime = currentTime;
    }
  }

  return beats;
}

/**
 * Generates synthetic beat markers based on BPM tempo
 */
export function detectSyntheticBeats(duration: number, bpm = 120): number[] {
  const interval = 60 / bpm;
  const beats: number[] = [];
  for (let t = 0; t <= duration; t += interval) {
    beats.push(parseFloat(t.toFixed(2)));
  }
  return beats;
}
