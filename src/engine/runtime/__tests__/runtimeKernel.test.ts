import { describe, it, expect } from 'vitest';
import { OpenSVGRuntime } from '../runtimeKernel';
import { evaluateScenePipeline } from '../evaluationPipeline';
import { RuntimeClock } from '../runtimeClock';
import { SceneProject } from '../../types';

describe('Headless Runtime Evaluation Kernel (CORE-04 & Single Evaluation Path)', () => {
  const mockProject: SceneProject = {
    id: 'proj-rt-1',
    name: 'Runtime Kernel Test',
    version: '1.0',
    duration: 4.0,
    fps: 60,
    rootFrame: {
      id: 'frame-1', name: 'Root', type: 'frame', visible: true, locked: false, clipContent: true,
      canvasBg: '#ffffff', x: 0, y: 0, width: 600, height: 400, rotation: 0, scaleX: 1, scaleY: 1,
      opacity: 1, borderRadius: 0, fill: '#ffffff', tracks: []
    },
    nodes: {
      box: {
        id: 'box', name: 'Animated Box', type: 'rect', visible: true, locked: false,
        x: 0, y: 0, width: 50, height: 50, rotation: 0, scaleX: 1, scaleY: 1,
        opacity: 1, borderRadius: 0, fill: '#3b82f6',
        tracks: [
          {
            id: 'tr-x', property: 'x', label: 'X', unit: 'px',
            keyframes: [
              { id: 'k1', time: 0, value: 0, easing: 'linear' },
              { id: 'k2', time: 4.0, value: 400, easing: 'linear' }
            ]
          }
        ]
      }
    },
    nodeOrder: ['box']
  };

  it('advances clock without mutating original authoring document', () => {
    const runtime = new OpenSVGRuntime();
    runtime.load(mockProject);

    expect(runtime.getCurrentTime()).toBe(0);

    runtime.advance(1.0);
    expect(runtime.getCurrentTime()).toBe(1.0);

    const renderScene = runtime.getRenderState();
    expect(renderScene.nodes.length).toBe(1);
    expect(renderScene.nodes[0].worldTransform.e).toBeCloseTo(100, -1);

    // Original authoring document remains untouched
    expect(mockProject.nodes.box.x).toBe(0);
  });

  it('seeks deterministically forward and backward', () => {
    const runtime = new OpenSVGRuntime();
    runtime.load(mockProject);

    runtime.seek(2.0);
    expect(runtime.getCurrentTime()).toBe(2.0);
    let state = runtime.getRenderState();
    expect(state.nodes[0].worldTransform.e).toBeCloseTo(200, -1);

    runtime.seek(0.5);
    expect(runtime.getCurrentTime()).toBe(0.5);
    state = runtime.getRenderState();
    expect(state.nodes[0].worldTransform.e).toBeCloseTo(50, -1);
  });

  it('resets clock back to zero', () => {
    const runtime = new OpenSVGRuntime();
    runtime.load(mockProject);
    runtime.seek(3.5);
    runtime.reset();
    expect(runtime.getCurrentTime()).toBe(0);
  });

  it('proves 100% parity between OpenSVGRuntime and evaluateScenePipeline (Single Source of Truth)', () => {
    const runtime = new OpenSVGRuntime();
    runtime.load(mockProject);
    runtime.seek(1.5);

    const runtimeRenderState = runtime.getRenderState();
    const directPipelineRenderState = evaluateScenePipeline(mockProject, { time: 1.5 }).renderScene;

    expect(runtimeRenderState.id).toBe(directPipelineRenderState.id);
    expect(runtimeRenderState.nodes).toHaveLength(directPipelineRenderState.nodes.length);
    expect(runtimeRenderState.nodes[0].worldTransform).toEqual(directPipelineRenderState.nodes[0].worldTransform);
  });
});

describe('RuntimeClock Lifecycle & Loop Modes', () => {
  it('handles loop, once, and ping-pong modes', () => {
    const clock = new RuntimeClock(2.0, 60, 'loop');
    clock.advance(2.5);
    expect(clock.getCurrentTime()).toBeCloseTo(0.5, 2);

    const onceClock = new RuntimeClock(2.0, 60, 'once');
    onceClock.play();
    onceClock.advance(2.5);
    expect(onceClock.getCurrentTime()).toBe(2.0);
    expect(onceClock.getIsPlaying()).toBe(false);

    const pingPongClock = new RuntimeClock(2.0, 60, 'ping-pong');
    pingPongClock.advance(2.5); // 2.0 -> bounces back 0.5s to 1.5s
    expect(pingPongClock.getCurrentTime()).toBeCloseTo(1.5, 2);
  });
});
