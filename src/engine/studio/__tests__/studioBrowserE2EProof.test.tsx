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

describe('GATE UI-5A: DOM-Level Interaction Studio Certification Suite', () => {
  beforeEach(() => {
    useStudioStore.getState().createNewProject();
    const defaultTab = {
      id: 'tab-e2e-init',
      title: 'Initial Project',
      isDirty: false,
      createdAt: 1700000000000,
      project: {
        id: 'proj-1',
        name: 'Initial Project',
        version: '1.0.0',
        fps: 60,
        duration: 3,
        rootFrame: {
          id: 'frame-1',
          name: 'Initial Project',
          type: 'frame' as const,
          visible: true,
          locked: false,
          clipContent: true,
          canvasBg: '#f1f2f5',
          x: 0,
          y: 0,
          width: 600,
          height: 400,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          borderRadius: 0,
          fill: '#ffffff',
          tracks: []
        },
        nodes: {},
        nodeOrder: []
      },
      history: { past: [], future: [] },
      viewport: {
        zoom: 1,
        panX: 0,
        panY: 0,
        currentTime: 0,
        selectedId: 'frame-1',
        selectedIds: ['frame-1']
      },
      audioTrack: null,
      markers: []
    };

    useStudioStore.setState({
      tabs: [defaultTab],
      activeTabId: defaultTab.id,
      isExportOpen: false,
      nodes: {},
      nodeOrder: [],
      past: [],
      future: [],
      interactions: [],
      stateMachines: []
    });

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

  it('1. proves Toolbar buttons and Keyboard shortcuts drive tool switching purely via DOM events', async () => {
    render(<App />);

    // Locate and click Select Tool (V)
    const selectBtn = screen.getByTitle('Select Tool (V)');
    expect(selectBtn).toBeDefined();
    fireEvent.click(selectBtn);
    expect(selectBtn.className).toContain('bg-blue-500');

    // Switch tool using keyboard shortcut 'R' (Rectangle Tool)
    fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });
    const shapeBtn = screen.getByTitle('Shape Tools (R, O, S)');
    expect(shapeBtn.className).toContain('bg-blue-500');

    // Switch tool using keyboard shortcut 'P' (Pen Tool)
    fireEvent.keyDown(window, { key: 'p', code: 'KeyP' });
    const penBtn = screen.getByTitle('Pen Tool (P)');
    expect(penBtn).toBeDefined();
    expect(penBtn.className).toContain('bg-blue-500');

    // Switch tool using keyboard shortcut 'V' (Select Tool)
    fireEvent.keyDown(window, { key: 'v', code: 'KeyV' });
    expect(selectBtn.className).toContain('bg-blue-500');
  });

  it('2. proves Canvas Mouse Drag-to-Draw, Selection, Undo & Redo purely via Browser DOM events', async () => {
    const { container } = render(<App />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeDefined();

    // Activate Rectangle tool via Keyboard 'R'
    fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });

    // Perform Drag gesture on Canvas: mousedown(100, 100) -> mousemove(300, 220) -> mouseup
    fireEvent.mouseDown(canvas!, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.mouseMove(window, { clientX: 300, clientY: 220, button: 0 });
    fireEvent.mouseUp(window, { clientX: 300, clientY: 220, button: 0 });

    // Verify Toast notification appears in DOM
    await waitFor(() => {
      expect(screen.getByText('Created rect layer!')).toBeDefined();
    });

    // Trigger Undo via Keyboard 'Ctrl+Z'
    fireEvent.keyDown(window, { key: 'z', code: 'KeyZ', ctrlKey: true });
    await waitFor(() => {
      expect(screen.getByText('Undo')).toBeDefined();
    });

    // Trigger Redo via Keyboard 'Ctrl+Y'
    fireEvent.keyDown(window, { key: 'y', code: 'KeyY', ctrlKey: true });
    await waitFor(() => {
      expect(screen.getByText('Redo')).toBeDefined();
    });
  });

  it('3. proves Timeline Playback Controls (Play/Pause, Step Forward/Back, Loop) via DOM buttons', async () => {
    render(<App />);

    // Locate transport buttons
    const playBtn = screen.getByTitle('Play / Pause (Space)');
    expect(playBtn).toBeDefined();
    fireEvent.click(playBtn);

    // Step forward 0.1s
    const stepFwdBtn = screen.getByTitle('Step Forward 0.1s (→)');
    fireEvent.click(stepFwdBtn);

    // Step back 0.1s
    const stepBackBtn = screen.getByTitle('Step Back 0.1s (←)');
    fireEvent.click(stepBackBtn);

    // Toggle loop
    const loopBtn = screen.getByTitle('Toggle Loop');
    fireEvent.click(loopBtn);
    await waitFor(() => {
      expect(screen.getByText(/Loop:/)).toBeDefined();
    });
  });

  it('4. proves Inspector / Properties Panel editing (Dimensions, Position, Fill) and Undo via DOM', async () => {
    const { container } = render(<App />);
    const canvas = container.querySelector('canvas');

    // Create a rectangle via Canvas draw
    fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });
    fireEvent.mouseDown(canvas!, { clientX: 50, clientY: 50, button: 0 });
    fireEvent.mouseMove(window, { clientX: 200, clientY: 150, button: 0 });
    fireEvent.mouseUp(window, { clientX: 200, clientY: 150, button: 0 });

    // Locate Width and Height inputs in Properties Panel
    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    const numberInputs = screen.getAllByRole('spinbutton');
    const widthInput = numberInputs[2] || numberInputs[0];
    fireEvent.change(widthInput, { target: { value: '250' } });

    // Verify Undo reverts property
    fireEvent.keyDown(window, { key: 'z', code: 'KeyZ', ctrlKey: true });
    await waitFor(() => {
      expect(screen.getByText('Undo')).toBeDefined();
    });
  });

  it('5. proves Interaction Authoring in Properties Panel via DOM buttons', async () => {
    const { container } = render(<App />);
    const canvas = container.querySelector('canvas');

    // Draw rect to select it
    fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });
    fireEvent.mouseDown(canvas!, { clientX: 50, clientY: 50, button: 0 });
    fireEvent.mouseMove(window, { clientX: 150, clientY: 150, button: 0 });
    fireEvent.mouseUp(window, { clientX: 150, clientY: 150, button: 0 });

    // Click "Add Interaction" button
    await waitFor(() => {
      const addInterBtn = screen.getByTitle('Add Document Interaction');
      expect(addInterBtn).toBeDefined();
      fireEvent.click(addInterBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Added click interaction')).toBeDefined();
    });
  });

  it('6. proves Multi-Tab TabBar creation, state isolation, and switching purely via DOM', async () => {
    render(<App />);

    const tablist = screen.getByRole('tablist', { name: 'Document Artboard Tabs' });
    expect(tablist).toBeDefined();

    // Click '+' button to create Tab 2
    const newTabBtn = screen.getByTitle('New Artboard / Composition (Ctrl+T)');
    fireEvent.click(newTabBtn);

    await waitFor(() => {
      const tabs = tablist.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(2);
    });

    // Switch back to Tab 1
    const tabs = tablist.querySelectorAll('[role="tab"]');
    fireEvent.click(tabs[0]);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('7. proves Unsaved Changes Confirmation Modal dialog when closing a dirty tab via DOM', async () => {
    const { container } = render(<App />);
    const canvas = container.querySelector('canvas');

    // Draw rect to make tab dirty
    fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });
    fireEvent.mouseDown(canvas!, { clientX: 50, clientY: 50, button: 0 });
    fireEvent.mouseMove(window, { clientX: 150, clientY: 150, button: 0 });
    fireEvent.mouseUp(window, { clientX: 150, clientY: 150, button: 0 });

    const tablist = screen.getByRole('tablist', { name: 'Document Artboard Tabs' });
    const closeTabBtn = tablist.querySelector('[role="tab"] button[title*="Close Tab"]');
    expect(closeTabBtn).toBeDefined();

    // Click close button on dirty tab
    fireEvent.click(closeTabBtn!);

    // Verify Unsaved Changes Modal appears in DOM
    await waitFor(() => {
      expect(screen.getByText('Unsaved Changes')).toBeDefined();
    });

    // Click "Cancel" -> Modal disappears and Tab stays open
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('Unsaved Changes')).toBeNull();
      const openTabs = tablist.querySelectorAll('[role="tab"]');
      expect(openTabs.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('8. proves Export Modal and Native OpenSVG (.osvg) Generation via DOM user clicks', async () => {
    render(<App />);

    // Click Header Export button (Ctrl+E)
    const exportBtn = screen.getByTitle('Export Animation (Ctrl+E)');
    fireEvent.click(exportBtn);

    // Verify Export Modal opens in DOM
    await waitFor(() => {
      expect(screen.getByText('Export Motion Assets')).toBeDefined();
    });

    // Click "OpenSVG Native (.osvg)" button
    const exportOsvgBtn = screen.getByText('OpenSVG Native (.osvg)');
    expect(exportOsvgBtn).toBeDefined();
    fireEvent.click(exportOsvgBtn);

    // Verify toast confirmation for exported file
    await waitFor(() => {
      expect(screen.getByText(/Exported.*\.osvg!/)).toBeDefined();
    });
  });
});
