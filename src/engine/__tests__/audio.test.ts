import { describe, it, expect } from 'vitest';
import { extractWaveformData, generateSyntheticWaveform } from '../audioEngine';
import { useStudioStore } from '../../store/useStudioStore';

describe('Audio Engine & Waveform Sync', () => {
  it('extracts normalized waveform peaks from audio channel data', () => {
    const channelData = new Float32Array([0.1, 0.5, 0.9, -0.8, -0.4, 0.2, 0.7, -0.95]);
    const peaks = extractWaveformData(channelData, 4);

    expect(peaks.length).toBe(4);
    expect(peaks[0]).toBe(0.5);
    expect(peaks[1]).toBe(0.9);
    expect(peaks[2]).toBe(0.4);
    expect(peaks[3]).toBe(0.95);
  });

  it('generates synthetic waveform with 100 sample peaks', () => {
    const peaks = generateSyntheticWaveform(100);
    expect(peaks.length).toBe(100);
    for (const p of peaks) {
      expect(p).toBeGreaterThanOrEqual(0.1);
      expect(p).toBeLessThanOrEqual(1.0);
    }
  });

  it('manages audio track configuration in studio store', () => {
    const peaks = generateSyntheticWaveform(50);
    useStudioStore.getState().setAudioTrack({
      id: 'track-bgm',
      name: 'kinetic-beat.mp3',
      src: 'blob:mock-url',
      volume: 0.8,
      muted: false,
      duration: 10.0,
      waveformData: peaks
    });

    let track = useStudioStore.getState().audioTrack;
    expect(track).toBeDefined();
    expect(track?.name).toBe('kinetic-beat.mp3');
    expect(track?.volume).toBe(0.8);

    useStudioStore.getState().updateAudioTrack({ muted: true, volume: 0.5 });
    track = useStudioStore.getState().audioTrack;
    expect(track?.muted).toBe(true);
    expect(track?.volume).toBe(0.5);

    useStudioStore.getState().setAudioTrack(null);
    expect(useStudioStore.getState().audioTrack).toBeNull();
  });
});
