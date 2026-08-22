import { describe, it, expect } from 'vitest';
import { snapTimeToBeatMarker } from '../waveformRenderer';
import { TimelineMarker } from '../types';

describe('Waveform & Beat Marker Snapping (Rules A1, A2, A3, A4)', () => {
  const markers: TimelineMarker[] = [
    { id: 'm1', time: 0.5, label: 'Beat 1' },
    { id: 'm2', time: 1.0, label: 'Beat 2' },
    { id: 'm3', time: 1.5, label: 'Beat 3' }
  ];

  it('snaps time to closest beat marker within threshold (Rule A3)', () => {
    // 0.52s snaps to 0.5s with threshold 0.05s
    const res1 = snapTimeToBeatMarker(0.52, markers, 0.05);
    expect(res1.snappedTime).toBe(0.5);
    expect(res1.marker?.id).toBe('m1');

    // 0.75s is too far from any beat, remains 0.75s
    const res2 = snapTimeToBeatMarker(0.75, markers, 0.05);
    expect(res2.snappedTime).toBe(0.75);
    expect(res2.marker).toBeNull();
  });
});
