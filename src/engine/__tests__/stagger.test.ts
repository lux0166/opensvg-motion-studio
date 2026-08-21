import { describe, it, expect, beforeEach } from 'vitest';
import { useStudioStore } from '../../store/useStudioStore';

describe('Multi-Keyframe Selection & Staggering Engine', () => {
  beforeEach(() => {
    useStudioStore.setState({
      past: [],
      future: [],
      selectedKeyframeIds: [],
      selectedId: 'hero-box',
      nodes: {
        'hero-box': {
          id: 'hero-box',
          name: 'Hero Box',
          type: 'rect',
          visible: true,
          locked: false,
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          borderRadius: 0,
          fill: '#3b82f6',
          tracks: [
            {
              id: 'tr-rot',
              property: 'rotation',
              label: 'Rotation',
              unit: '°',
              keyframes: [
                { id: 'kf-rot-1', time: 0.1, value: 0 },
                { id: 'kf-rot-2', time: 1.0, value: 180 }
              ]
            },
            {
              id: 'tr-opacity',
              property: 'opacity',
              label: 'Opacity',
              unit: '',
              keyframes: [
                { id: 'kf-op-1', time: 0.1, value: 0 },
                { id: 'kf-op-2', time: 1.0, value: 1 }
              ]
            }
          ]
        }
      },
      nodeOrder: ['hero-box']
    });
  });

  it('manages multi-keyframe selection with shift toggle', () => {
    const store = useStudioStore.getState();

    store.toggleKeyframeSelection('kf-rot-1', false);
    expect(useStudioStore.getState().selectedKeyframeIds).toEqual(['kf-rot-1']);

    store.toggleKeyframeSelection('kf-op-1', true);
    expect(useStudioStore.getState().selectedKeyframeIds).toEqual(['kf-rot-1', 'kf-op-1']);

    store.toggleKeyframeSelection('kf-rot-1', true);
    expect(useStudioStore.getState().selectedKeyframeIds).toEqual(['kf-op-1']);
  });

  it('staggers animation tracks by +0.1s step offset', () => {
    const store = useStudioStore.getState();
    store.staggerSelectedKeyframes(0.1);

    const node = useStudioStore.getState().nodes['hero-box'];
    const rotTrack = node.tracks[0];
    const opTrack = node.tracks[1];

    // Track 0 (shift = 0 * 0.1s = 0s)
    expect(rotTrack.keyframes[0].time).toBe(0.1);
    expect(rotTrack.keyframes[1].time).toBe(1.0);

    // Track 1 (shift = 1 * 0.1s = 0.1s)
    expect(opTrack.keyframes[0].time).toBe(0.2);
    expect(opTrack.keyframes[1].time).toBe(1.1);
  });
});
