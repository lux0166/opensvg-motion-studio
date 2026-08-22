import { describe, it, expect, vi } from 'vitest';
import { Canvas2DBackend } from '../canvas2DBackend';
import { RenderScene } from '../../runtime/coreContracts';
import { IDENTITY_MATRIX } from '../../transform/matrix2D';

describe('Canvas2D Render Backend (CORE-07 & Section 6)', () => {
  it('implements RenderBackend lifecycle correctly', async () => {
    const backend = new Canvas2DBackend();
    expect(backend.name).toBe('canvas2d');
    expect(backend.capabilities.webgpu).toBe(false);

    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      transform: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn()
    };

    const mockCanvas = {
      getContext: vi.fn().mockReturnValue(mockCtx),
      width: 800,
      height: 600
    } as unknown as HTMLCanvasElement;

    await backend.initialize(mockCanvas);

    backend.beginFrame({ currentTime: 0, width: 800, height: 600, dpr: 1 });
    expect(mockCtx.clearRect).toHaveBeenCalled();

    const mockScene: RenderScene = {
      id: 'test-scene',
      viewport: { width: 800, height: 600, dpr: 1, background: '#ffffff' },
      nodes: [
        {
          id: 'n1', name: 'N1', type: 'rect', visible: true, opacity: 1,
          worldTransform: IDENTITY_MATRIX,
          bounds: { x: 0, y: 0, width: 100, height: 100 },
          fill: { type: 'solid', color: '#ff0000' }
        }
      ],
      drawOrder: ['n1']
    };

    backend.submit(mockScene);
    expect(mockCtx.fillRect).toHaveBeenCalled();

    backend.endFrame();
    expect(mockCtx.restore).toHaveBeenCalled();

    backend.resize(1200, 900, 2);
    expect(mockCanvas.width).toBe(2400);
    expect(mockCanvas.height).toBe(1800);

    backend.dispose();
  });
});
