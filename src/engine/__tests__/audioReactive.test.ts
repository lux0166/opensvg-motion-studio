import { describe, it, expect } from 'vitest';
import { generateAudioReactiveKeyframes } from '../audioReactive';

describe('Audio-Reactive Keyframe Generator (Rules A5 & A6)', () => {
  it('generates normalized keyframes mapped from waveform energy', () => {
    const mockWaveform = [0.1, 0.5, 0.9, 0.4, 0.8, 0.2];
    const keyframes = generateAudioReactiveKeyframes(mockWaveform, {
      property: 'scaleY',
      minVal: 1.0,
      maxVal: 2.5,
      threshold: 0.2,
      smoothing: 0.3,
      sampleRateFps: 30,
      duration: 1.0
    });

    expect(keyframes.length).toBe(31); // 1s @ 30fps -> 31 keyframes (0 to 30)
    expect(keyframes[0].time).toBe(0.0);
    expect(keyframes[keyframes.length - 1].time).toBe(1.0);
    expect(keyframes[0].value).toBeGreaterThanOrEqual(1.0);
    expect(keyframes[0].value).toBeLessThanOrEqual(2.5);
  });
});
