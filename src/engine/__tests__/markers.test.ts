import { describe, it, expect } from 'vitest';
import { detectAudioBeats, detectSyntheticBeats } from '../audioEngine';
import { useStudioStore } from '../../store/useStudioStore';

describe('Timeline Markers & Beat Detection Engine', () => {
  it('detects synthetic BPM beat intervals', () => {
    // At 120 BPM, interval is 0.5s. Over 2.0s -> [0, 0.5, 1.0, 1.5, 2.0]
    const beats = detectSyntheticBeats(2.0, 120);
    expect(beats).toEqual([0, 0.5, 1.0, 1.5, 2.0]);
  });

  it('detects energy peaks in audio buffer', () => {
    // Construct a synthetic 1-second audio buffer (44100 samples)
    const sampleRate = 44100;
    const channelData = new Float32Array(sampleRate);

    // Inject sharp energy pulses at t=0.25s and t=0.75s
    const idx1 = Math.floor(0.25 * sampleRate);
    const idx2 = Math.floor(0.75 * sampleRate);
    for (let i = 0; i < 500; i++) {
      channelData[idx1 + i] = 0.9;
      channelData[idx2 + i] = 0.9;
    }

    const beats = detectAudioBeats(channelData, sampleRate, 1.2, 0.2);
    expect(beats.length).toBeGreaterThanOrEqual(2);
    expect(beats[0]).toBeCloseTo(0.25, 1);
    expect(beats[1]).toBeCloseTo(0.75, 1);
  });

  it('manages markers in studio store', () => {
    useStudioStore.setState({
      markers: [],
      duration: 5.0
    });

    // 1. Add marker
    useStudioStore.getState().addMarker(2.5, 'Chorus', '#f59e0b');
    expect(useStudioStore.getState().markers.length).toBe(1);
    const mId = useStudioStore.getState().markers[0].id;
    expect(useStudioStore.getState().markers[0].label).toBe('Chorus');
    expect(useStudioStore.getState().markers[0].time).toBe(2.5);

    // 2. Remove marker
    useStudioStore.getState().removeMarker(mId);
    expect(useStudioStore.getState().markers.length).toBe(0);

    // 3. Auto-generate from beats
    useStudioStore.getState().generateMarkersFromAudioBeats();
    expect(useStudioStore.getState().markers.length).toBeGreaterThan(0);
  });
});
