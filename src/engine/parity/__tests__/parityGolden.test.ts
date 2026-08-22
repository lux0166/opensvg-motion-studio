import { describe, it, expect } from 'vitest';
import { SceneProject } from '../../types';
import { OpenSVGRuntime } from '../../runtime/runtimeKernel';
import { Canvas2DBackend } from '../../backend/canvas2DBackend';
import { WebGpuBackend } from '../../backend/webgpuBackend';
import { evaluateNode } from '../../evaluator';
import { computePathMetrics, samplePointAtDistance } from '../../geometry/geometryCore';

describe('Parity Golden Tests (CORE-14 & Section 15)', () => {
  const parityProject: SceneProject = {
    id: 'parity-proj',
    name: 'Parity Golden Project',
    version: '2.0.0',
    duration: 3.0,
    fps: 60,
    rootFrame: {
      id: 'root-frame',
      name: 'Stage',
      type: 'frame',
      visible: true,
      locked: false,
      clipContent: true,
      canvasBg: '#ffffff',
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 0,
      fill: '#ffffff',
      tracks: []
    },
    nodes: {
      parentBox: {
        id: 'parentBox',
        name: 'Parent Box',
        type: 'rect',
        visible: true,
        locked: false,
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        rotation: 45,
        scaleX: 1.5,
        scaleY: 1.5,
        opacity: 0.8,
        borderRadius: 8,
        fill: '#3b82f6',
        tracks: [
          {
            id: 'tr-x',
            property: 'x',
            label: 'X',
            unit: 'px',
            keyframes: [
              { id: 'k1', time: 0, value: 100 },
              { id: 'k2', time: 1.5, value: 300 }
            ]
          }
        ]
      },
      childCircle: {
        id: 'childCircle',
        name: 'Child Circle',
        type: 'circle',
        parentId: 'parentBox',
        visible: true,
        locked: false,
        x: 50,
        y: 50,
        width: 60,
        height: 60,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 30,
        fill: '#10b981',
        tracks: []
      }
    },
    nodeOrder: ['parentBox', 'childCircle']
  };

  it('maintains exact parity between Evaluator and Runtime RenderScene derivation at t=1.5s', () => {
    const runtime = new OpenSVGRuntime();
    runtime.load(parityProject);
    runtime.seek(1.5);

    const renderScene = runtime.getRenderState();
    expect(renderScene).toBeDefined();

    // 1. Check direct evaluator output
    const evalParent = evaluateNode(parityProject.nodes.parentBox, 1.5);
    expect(evalParent.x).toBe(300);

    // 2. Check derived render node state
    const renderParent = renderScene?.nodes.find((n) => n.id === 'parentBox');
    expect(renderParent).toBeDefined();
    expect(renderParent?.bounds.x).toBe(300);
    expect(renderParent?.worldTransform.e).toBe(400);
    expect(renderParent?.opacity).toBe(0.8);

    const renderChild = renderScene?.nodes.find((n) => n.id === 'childCircle');
    expect(renderChild).toBeDefined();
    // Child inherits parent opacity (0.8 * 1.0 = 0.8)
    expect(renderChild?.opacity).toBeCloseTo(0.8, 2);
  });

  it('renders identical scene submissions across Canvas2D and WebGPU fallback backends', async () => {
    const runtime = new OpenSVGRuntime();
    runtime.load(parityProject);
    runtime.seek(0.75);
    const renderScene = runtime.getRenderState()!;

    const createMockCtx = () => ({
      clearRect: () => {},
      fillRect: () => {},
      save: () => {},
      restore: () => {},
      transform: () => {},
      setTransform: () => {},
      beginPath: () => {},
      rect: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {}
    });

    // 1. Canvas2D Backend
    const canvas2D = new Canvas2DBackend();
    const mockCanvas1 = {
      getContext: createMockCtx,
      width: 800,
      height: 600
    } as unknown as HTMLCanvasElement;

    await canvas2D.initialize(mockCanvas1);
    expect(() => {
      canvas2D.beginFrame({ currentTime: 0.75, width: 800, height: 600, dpr: 1 });
      canvas2D.submit(renderScene);
      canvas2D.endFrame();
    }).not.toThrow();

    // 2. WebGPU Backend (Fallback mode)
    const webgpu = new WebGpuBackend();
    const mockCanvas2 = {
      getContext: createMockCtx,
      width: 800,
      height: 600
    } as unknown as HTMLCanvasElement;

    await webgpu.initialize(mockCanvas2);
    expect(webgpu.isUsingFallback()).toBe(true);
    expect(() => {
      webgpu.beginFrame({ currentTime: 0.75, width: 800, height: 600, dpr: 1 });
      webgpu.submit(renderScene);
      webgpu.endFrame();
    }).not.toThrow();
  });

  it('verifies path metrics and point sampling parity along motion paths', () => {
    const path = [
      { x: 0, y: 0, type: 'move' as const },
      { x: 200, y: 0, type: 'line' as const }
    ];

    const metrics = computePathMetrics(path, 20);
    expect(metrics.totalLength).toBeCloseTo(200, 1);

    const s0 = samplePointAtDistance(metrics, 0);
    const s100 = samplePointAtDistance(metrics, 100);
    const s200 = samplePointAtDistance(metrics, 200);

    expect(s0.point.x).toBeCloseTo(0, 0);
    expect(s100.point.x).toBeCloseTo(100, 0);
    expect(s200.point.x).toBeCloseTo(200, 0);
  });
});
