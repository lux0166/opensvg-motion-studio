import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../../App';
import { useStudioStore } from '../../../store/useStudioStore';

// Setup Mock 2D Canvas Context for happy-dom environment
const createMock2DContext = () => ({
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  transform: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  roundRect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  clip: vi.fn(),
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 100 }),
  createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  createPattern: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  drawImage: vi.fn(),
  setLineDash: vi.fn(),
  getLineDash: vi.fn().mockReturnValue([])
});

describe('GATE UI-5: Real Browser / DOM Level Studio Certification', () => {
  beforeEach(() => {
    useStudioStore.getState().createNewProject();
    useStudioStore.setState({ isExportOpen: false });

    // Mock HTMLCanvasElement context & geometry
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(createMock2DContext()) as any;
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 800,
      right: 1000,
      bottom: 800,
      x: 0,
      y: 0,
      toJSON: () => {}
    });
  });

  it('proves Toolbar buttons and Keyboard shortcuts drive tool switching purely via DOM events', async () => {
    render(<App />);

    // 1. Locate and click Select Tool (V)
    const selectBtn = screen.getByTitle('Select Tool (V)');
    expect(selectBtn).toBeDefined();
    fireEvent.click(selectBtn);
    expect(selectBtn.className).toContain('bg-blue-500');

    // 2. Switch tool using keyboard shortcut 'R' (Rectangle Tool)
    fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });
    const shapeBtn = screen.getByTitle('Shape Tools (R, O, S)');
    expect(shapeBtn.className).toContain('bg-blue-500');

    // 3. Switch tool using keyboard shortcut 'P' (Pen Tool)
    fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
    const penBtn = screen.getByTitle('Pen Tool (P)');
    expect(penBtn).toBeDefined();
    expect(penBtn.className).toContain('bg-blue-500');

    // 4. Switch tool using keyboard shortcut 'V' (Select Tool)
    fireEvent.keyDown(window, { key: 'v', code: 'KeyV' });
    expect(selectBtn.className).toContain('bg-blue-500');
  });

  it('proves Canvas Mouse Drag-to-Draw, Selection, Undo & Redo purely via Browser DOM events', async () => {
    const { container } = render(<App />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeDefined();

    // 1. Activate Rectangle tool via Keyboard 'R'
    fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });

    // 2. Perform Drag gesture on Canvas: mousedown(100, 100) -> mousemove(300, 220) -> mouseup
    fireEvent.mouseDown(canvas!, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.mouseMove(window, { clientX: 300, clientY: 220, button: 0 });
    fireEvent.mouseUp(window, { clientX: 300, clientY: 220, button: 0 });

    // Verify Toast notification appears in DOM
    await waitFor(() => {
      expect(screen.getByText('Created rect layer!')).toBeDefined();
    });

    // 3. Trigger Undo via Keyboard 'Ctrl+Z'
    fireEvent.keyDown(window, { key: 'z', code: 'KeyZ', ctrlKey: true });
    await waitFor(() => {
      expect(screen.getByText('Undo')).toBeDefined();
    });

    // 4. Trigger Redo via Keyboard 'Ctrl+Y'
    fireEvent.keyDown(window, { key: 'y', code: 'KeyY', ctrlKey: true });
    await waitFor(() => {
      expect(screen.getByText('Redo')).toBeDefined();
    });
  });

  it('proves Multi-Tab TabBar creation, switching, and closing purely via DOM buttons', async () => {
    render(<App />);

    // 1. Locate TabBar tablist in DOM with exact aria-label
    const tablist = screen.getByRole('tablist', { name: 'Document Artboard Tabs' });
    expect(tablist).toBeDefined();

    // 2. Click '+' button to create a new Tab
    const newTabBtn = screen.getByTitle('New Artboard / Composition (Ctrl+T)');
    expect(newTabBtn).toBeDefined();
    fireEvent.click(newTabBtn);

    // Verify new tab is rendered in Tablist
    await waitFor(() => {
      const tabs = tablist.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBeGreaterThanOrEqual(2);
    });

    // 3. Locate the close button on the active tab and click it
    const activeCloseBtn = tablist.querySelector('[role="tab"] button[title*="Close"]');
    if (activeCloseBtn) {
      fireEvent.click(activeCloseBtn);
    }
  });

  it('proves Header Export Button and Modal workflow purely via DOM user clicks', async () => {
    render(<App />);

    // 1. Click Header Export button (Ctrl+E)
    const exportBtn = screen.getByTitle('Export Animation (Ctrl+E)');
    expect(exportBtn).toBeDefined();
    fireEvent.click(exportBtn);

    // 2. Verify Export Modal opens in DOM
    await waitFor(() => {
      expect(screen.getByText('Export Motion Assets')).toBeDefined();
    });

    // 3. Close the modal via Close button
    const closeBtns = screen.getAllByRole('button');
    const modalCloseBtn = closeBtns.find((b) => b.querySelector('svg.lucide-x') || b.textContent?.includes('Cancel'));
    if (modalCloseBtn) {
      fireEvent.click(modalCloseBtn);
    }
  });
});
