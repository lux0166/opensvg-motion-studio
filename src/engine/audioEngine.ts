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
