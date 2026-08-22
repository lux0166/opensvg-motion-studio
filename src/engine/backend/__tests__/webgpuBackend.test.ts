import { describe, it, expect, vi } from 'vitest';
import { WebGpuBackend } from '../webgpuBackend';

describe('WebGPU Render Backend Prototype & Fallback (CORE-13 & Section 6-10)', () => {
  it('automatically activates Canvas2D fallback in environments without WebGPU', async () => {
    const backend = new WebGpuBackend();
    expect(backend.name).toBe('webgpu');
    expect(backend.capabilities.webgpu).toBe(true);

    const mockCanvas = {
      getContext: vi.fn().mockReturnValue({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn()
      }),
      width: 800,
      height: 600
    } as unknown as HTMLCanvasElement;

    // Initialize without navigator.gpu -> activates fallback
    await backend.initialize(mockCanvas);
    expect(backend.isUsingFallback()).toBe(true);

    backend.beginFrame({ currentTime: 0, width: 800, height: 600, dpr: 1 });
    backend.submit({
      id: 'test-scene',
      viewport: { width: 800, height: 600, dpr: 1, background: '#ffffff' },
      nodes: [],
      drawOrder: []
    });
    backend.endFrame();
    backend.dispose();
  });
});
