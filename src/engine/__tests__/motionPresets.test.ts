import { describe, it, expect } from 'vitest';
import { MOTION_PRESETS, applyMotionPresetToNode } from '../motionPresets';
import { SceneNode } from '../types';

describe('Motion Presets Engine', () => {
  const createMockNode = (id = 'node-1', name = 'Test Shape'): SceneNode => ({
    id,
    name,
    type: 'rect',
    visible: true,
    locked: false,
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    borderRadius: 8,
    fill: '#3b82f6',
    tracks: []
  });

  it('should contain a comprehensive catalog of presets across entrance, emphasis, and exit', () => {
    expect(MOTION_PRESETS.length).toBeGreaterThanOrEqual(10);
    const categories = new Set(MOTION_PRESETS.map((p) => p.category));
    expect(categories.has('entrance')).toBe(true);
    expect(categories.has('emphasis')).toBe(true);
    expect(categories.has('exit')).toBe(true);
  });

  it('should generate valid sorted keyframe tracks for each preset', () => {
    const node = createMockNode();

    for (const preset of MOTION_PRESETS) {
      const tracks = preset.generateTracks(node, {
        duration: preset.defaultDuration,
        delay: 0,
        intensity: 1.0,
        replaceTracks: true
      });

      expect(tracks.length).toBeGreaterThan(0);

      for (const track of tracks) {
        expect(track.keyframes.length).toBeGreaterThanOrEqual(2);

        // Verify keyframes are strictly chronological
        for (let i = 1; i < track.keyframes.length; i++) {
          expect(track.keyframes[i].time).toBeGreaterThanOrEqual(track.keyframes[i - 1].time);
        }

        // Verify start and end times respect duration
        expect(track.keyframes[0].time).toBeGreaterThanOrEqual(0);
        expect(track.keyframes[track.keyframes.length - 1].time).toBeLessThanOrEqual(preset.defaultDuration + 0.05);
      }
    }
  });

  it('should apply preset to node and properly replace or append tracks', () => {
    const node = createMockNode();
    const updated = applyMotionPresetToNode(node, 'elastic-pop-in', { duration: 1.0 });

    expect(updated.tracks.length).toBeGreaterThanOrEqual(2);
    const scaleXTrack = updated.tracks.find((t) => t.property === 'scaleX');
    expect(scaleXTrack).toBeDefined();
    expect(scaleXTrack?.keyframes[0].value).toBe(0);
    expect(scaleXTrack?.keyframes[scaleXTrack.keyframes.length - 1].value).toBe(node.scaleX);

    // Apply another preset on the same node
    const exitNode = applyMotionPresetToNode(updated, 'fade-shrink-out', { duration: 0.5 });
    const exitScaleXTrack = exitNode.tracks.find((t) => t.property === 'scaleX');
    expect(exitScaleXTrack).toBeDefined();
    expect(exitScaleXTrack?.keyframes[exitScaleXTrack.keyframes.length - 1].value).toBe(0);
  });

  it('should respect custom duration, delay, and intensity options', () => {
    const node = createMockNode();
    const delay = 0.5;
    const duration = 2.0;
    const intensity = 1.5;

    const updated = applyMotionPresetToNode(node, 'slide-fade-up', {
      duration,
      delay,
      intensity
    });

    const yTrack = updated.tracks.find((t) => t.property === 'y');
    expect(yTrack).toBeDefined();
    expect(yTrack?.keyframes[0].time).toBe(delay);
    expect(yTrack?.keyframes[yTrack.keyframes.length - 1].time).toBe(delay + duration);
    // Baseline Y is 100, intensity 1.5 with offset 60 gives 100 + 60 * 1.5 = 190
    expect(yTrack?.keyframes[0].value).toBe(190);
    expect(yTrack?.keyframes[yTrack.keyframes.length - 1].value).toBe(100);
  });
});
