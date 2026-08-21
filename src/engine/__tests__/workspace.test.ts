import { describe, it, expect, beforeEach } from 'vitest';
import { useStudioStore } from '../../store/useStudioStore';
import { WORKSPACE_PRESETS } from '../workspaceTypes';

describe('Flexible Dockable Workspace Engine', () => {
  beforeEach(() => {
    useStudioStore.setState({
      workspace: JSON.parse(JSON.stringify(WORKSPACE_PRESETS.default)),
      activeDraggingPanel: null,
      dragHoverTarget: null,
    });
  });

  it('initializes with default workspace layout', () => {
    const { workspace } = useStudioStore.getState();
    expect(workspace.activePreset).toBe('default');
    expect(workspace.leftContainers.length).toBe(1);
    expect(workspace.leftContainers[0].panels).toContain('layers');
    expect(workspace.rightContainers[0].panels).toContain('properties');
    expect(workspace.bottomContainers[0].panels).toContain('timeline');
  });

  it('switches between workspace presets correctly', () => {
    // 1. Switch to Animation preset
    useStudioStore.getState().setWorkspacePreset('animation');
    let state = useStudioStore.getState();
    expect(state.workspace.activePreset).toBe('animation');
    expect(state.workspace.leftContainers.length).toBe(2);
    expect(state.workspace.leftContainers[1].panels).toContain('assets');
    expect(state.workspace.rightContainers[1].panels).toContain('colorHarmony');

    // 2. Switch to Design preset
    useStudioStore.getState().setWorkspacePreset('design');
    state = useStudioStore.getState();
    expect(state.workspace.activePreset).toBe('design');
    expect(state.workspace.leftContainers[0].panels).toEqual(['layers', 'assets']);

    // 3. Reset to default
    useStudioStore.getState().resetWorkspace();
    state = useStudioStore.getState();
    expect(state.workspace.activePreset).toBe('default');
    expect(state.workspace.leftContainers.length).toBe(1);
  });

  it('moves a panel and stacks it as a tab in target container', () => {
    const { workspace, movePanel } = useStudioStore.getState();
    const sourceContainerId = workspace.leftContainers[0].id;
    const targetContainerId = workspace.rightContainers[0].id;

    // Move 'layers' from left to right as 'tab'
    movePanel(sourceContainerId, targetContainerId, 'tab', 'layers');

    const state = useStudioStore.getState();
    expect(state.workspace.rightContainers[0].panels).toContain('layers');
    expect(state.workspace.rightContainers[0].activePanelId).toBe('layers');
    expect(state.workspace.activePreset).toBe('custom');
  });

  it('splits a container vertically when moving a panel to bottom or top', () => {
    const { workspace, movePanel } = useStudioStore.getState();
    const sourceContainerId = workspace.rightContainers[0].id;
    const targetContainerId = workspace.leftContainers[0].id;

    // Move 'colorHarmony' to bottom of left container
    movePanel(sourceContainerId, targetContainerId, 'bottom', 'colorHarmony');

    const state = useStudioStore.getState();
    expect(state.workspace.leftContainers.length).toBe(2);
    expect(state.workspace.leftContainers[1].panels).toContain('colorHarmony');
  });

  it('resizes workspace columns within safe bounds', () => {
    const { resizeWorkspaceColumn } = useStudioStore.getState();

    // Resize left column
    resizeWorkspaceColumn('left', 50);
    expect(useStudioStore.getState().workspace.leftWidth).toBe(310);

    // Clamp check
    resizeWorkspaceColumn('left', 1000);
    expect(useStudioStore.getState().workspace.leftWidth).toBe(600);
  });

  it('toggles column collapse states correctly', () => {
    const { toggleWorkspaceCollapse } = useStudioStore.getState();

    expect(useStudioStore.getState().workspace.isLeftCollapsed).toBe(false);
    toggleWorkspaceCollapse('left');
    expect(useStudioStore.getState().workspace.isLeftCollapsed).toBe(true);
    toggleWorkspaceCollapse('left');
    expect(useStudioStore.getState().workspace.isLeftCollapsed).toBe(false);
  });
});
