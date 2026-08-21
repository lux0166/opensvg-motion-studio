import { describe, it, expect, beforeEach } from 'vitest';
import { useStudioStore, createDefaultTab } from '../../store/useStudioStore';

describe('Rive-Style Multi-Document Tab System Engine', () => {
  beforeEach(() => {
    const initial = createDefaultTab('tab-1', 'moon_scan');
    useStudioStore.setState({
      tabs: [initial],
      activeTabId: 'tab-1',
      rootFrame: initial.project.rootFrame,
      nodes: initial.project.nodes,
      nodeOrder: initial.project.nodeOrder,
      past: [],
      future: []
    });
  });

  it('initializes with a default tab', () => {
    const state = useStudioStore.getState();
    expect(state.tabs.length).toBe(1);
    expect(state.activeTabId).toBe('tab-1');
    expect(state.tabs[0].title).toBe('moon_scan');
  });

  it('opens a new tab with fresh scene graph and activates it', () => {
    useStudioStore.getState().openNewTab('character_walk');

    const state = useStudioStore.getState();
    expect(state.tabs.length).toBe(2);
    expect(state.tabs[1].title).toBe('character_walk');
    expect(state.activeTabId).toBe(state.tabs[1].id);
    expect(state.rootFrame.name).toBe('character_walk');
  });

  it('switches between tabs and preserves independent document state', () => {
    // 1. In Tab 1 ('moon_scan'), add a special node
    useStudioStore.getState().addNode({
      id: 'moon-rock',
      name: 'Moon Rock',
      type: 'rect',
      visible: true,
      locked: false,
      x: 50,
      y: 50,
      width: 80,
      height: 80,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 8,
      fill: '#64748b',
      tracks: []
    });

    expect(useStudioStore.getState().nodes['moon-rock']).toBeDefined();

    // 2. Open Tab 2 ('star_scan')
    useStudioStore.getState().openNewTab('star_scan');
    expect(useStudioStore.getState().activeTabId).not.toBe('tab-1');
    expect(useStudioStore.getState().nodes['moon-rock']).toBeUndefined();

    // 3. Switch back to Tab 1
    useStudioStore.getState().switchTab('tab-1');
    expect(useStudioStore.getState().activeTabId).toBe('tab-1');
    expect(useStudioStore.getState().nodes['moon-rock']).toBeDefined();
  });

  it('isolates Undo/Redo history stack per tab', () => {
    // Tab 1 mutation
    useStudioStore.getState().updateRootFrame({ canvasBg: '#ff0000' });
    expect(useStudioStore.getState().past.length).toBe(1);

    // Open Tab 2
    useStudioStore.getState().openNewTab('Tab 2');
    expect(useStudioStore.getState().past.length).toBe(0); // Clean history on fresh tab

    // Mutate Tab 2
    useStudioStore.getState().updateRootFrame({ canvasBg: '#00ff00' });
    expect(useStudioStore.getState().past.length).toBe(1);

    // Undo on Tab 2
    useStudioStore.getState().undo();
    expect(useStudioStore.getState().past.length).toBe(0);

    // Switch back to Tab 1
    useStudioStore.getState().switchTab('tab-1');
    expect(useStudioStore.getState().past.length).toBe(1);
    expect(useStudioStore.getState().rootFrame.canvasBg).toBe('#ff0000');
  });

  it('renames a tab and keeps root frame synchronized', () => {
    useStudioStore.getState().renameTab('tab-1', 'planet_scanner');
    const state = useStudioStore.getState();
    expect(state.tabs[0].title).toBe('planet_scanner');
    expect(state.rootFrame.name).toBe('planet_scanner');
  });

  it('duplicates an existing tab into a new document tab', () => {
    useStudioStore.getState().duplicateTab('tab-1');
    const state = useStudioStore.getState();
    expect(state.tabs.length).toBe(2);
    expect(state.tabs[1].title).toBe('moon_scan (Copy)');
    expect(state.activeTabId).toBe(state.tabs[1].id);
  });

  it('closes an active tab and transitions to the adjacent tab', () => {
    useStudioStore.getState().openNewTab('Tab 2');
    const tab2Id = useStudioStore.getState().activeTabId;

    useStudioStore.getState().closeTab(tab2Id);
    const state = useStudioStore.getState();
    expect(state.tabs.length).toBe(1);
    expect(state.activeTabId).toBe('tab-1');
  });

  it('closes the single remaining tab and resets to a new composition', () => {
    useStudioStore.getState().closeTab('tab-1');
    const state = useStudioStore.getState();
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0].title).toBe('Composition 1');
  });

  it('reorders tabs accurately', () => {
    useStudioStore.getState().openNewTab('Tab 2');
    useStudioStore.getState().openNewTab('Tab 3');

    // Currently [tab-1, Tab 2, Tab 3] -> move Tab 3 (idx 2) to start (idx 0)
    useStudioStore.getState().reorderTabs(2, 0);
    const titles = useStudioStore.getState().tabs.map((t) => t.title);
    expect(titles).toEqual(['Tab 3', 'moon_scan', 'Tab 2']);
  });

  it('closes all other tabs except the target tab', () => {
    useStudioStore.getState().openNewTab('Tab 2');
    useStudioStore.getState().openNewTab('Tab 3');
    expect(useStudioStore.getState().tabs.length).toBe(3);

    useStudioStore.getState().closeOtherTabs('tab-1');
    const state = useStudioStore.getState();
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0].id).toBe('tab-1');
    expect(state.activeTabId).toBe('tab-1');
  });

  it('closes all tabs to the right of the target tab', () => {
    useStudioStore.getState().openNewTab('Tab 2');
    useStudioStore.getState().openNewTab('Tab 3');
    useStudioStore.getState().openNewTab('Tab 4');
    expect(useStudioStore.getState().tabs.length).toBe(4);

    const tab2Id = useStudioStore.getState().tabs[1].id;
    useStudioStore.getState().closeTabsToRight(tab2Id);

    const state = useStudioStore.getState();
    expect(state.tabs.length).toBe(2);
    expect(state.tabs.map((t) => t.title)).toEqual(['moon_scan', 'Tab 2']);
  });
});
