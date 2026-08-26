import { ToolMode } from '../types';

export interface ToolDefinition {
  id: ToolMode;
  label: string;
  shortcut: string;
  cursor: string;
  category: 'selection' | 'creation' | 'navigation' | 'manipulation';
  capabilities: {
    canSelect?: boolean;
    canDraw?: boolean;
    canPan?: boolean;
    canZoom?: boolean;
  };
}

export const TOOL_REGISTRY: Record<ToolMode, ToolDefinition> = {
  select: {
    id: 'select',
    label: 'Select Tool (V)',
    shortcut: 'v',
    cursor: 'default',
    category: 'selection',
    capabilities: { canSelect: true }
  },
  'direct-select': {
    id: 'direct-select',
    label: 'Transform / Direct Select (A)',
    shortcut: 'a',
    cursor: 'crosshair',
    category: 'selection',
    capabilities: { canSelect: true }
  },
  frame: {
    id: 'frame',
    label: 'Frame Tool (F)',
    shortcut: 'f',
    cursor: 'crosshair',
    category: 'creation',
    capabilities: { canDraw: true }
  },
  rect: {
    id: 'rect',
    label: 'Rectangle Tool (R)',
    shortcut: 'r',
    cursor: 'crosshair',
    category: 'creation',
    capabilities: { canDraw: true }
  },
  circle: {
    id: 'circle',
    label: 'Circle Tool (O)',
    shortcut: 'o',
    cursor: 'crosshair',
    category: 'creation',
    capabilities: { canDraw: true }
  },
  star: {
    id: 'star',
    label: 'Star Tool (S)',
    shortcut: 's',
    cursor: 'crosshair',
    category: 'creation',
    capabilities: { canDraw: true }
  },
  pen: {
    id: 'pen',
    label: 'Pen Tool (P)',
    shortcut: 'p',
    cursor: 'crosshair',
    category: 'creation',
    capabilities: { canDraw: true }
  },
  text: {
    id: 'text',
    label: 'Text Tool (T)',
    shortcut: 't',
    cursor: 'text',
    category: 'creation',
    capabilities: { canDraw: true }
  },
  hand: {
    id: 'hand',
    label: 'Hand / Pan Tool (H)',
    shortcut: 'h',
    cursor: 'grab',
    category: 'navigation',
    capabilities: { canPan: true }
  },
  zoom: {
    id: 'zoom',
    label: 'Zoom Tool (Z)',
    shortcut: 'z',
    cursor: 'zoom-in',
    category: 'navigation',
    capabilities: { canZoom: true }
  },
  pivot: {
    id: 'pivot',
    label: 'Pivot Tool (Y)',
    shortcut: 'y',
    cursor: 'crosshair',
    category: 'manipulation',
    capabilities: { canSelect: true }
  }
};

export function getToolDefinition(mode: ToolMode): ToolDefinition {
  return TOOL_REGISTRY[mode] || TOOL_REGISTRY.select;
}
