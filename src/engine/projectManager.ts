import { FrameNode, SceneNode, SceneProject } from './types';

/**
 * OpenSVG Project Schema Validator & Serialization Engine (.kinetic)
 */

export function serializeProject(
  rootFrame: FrameNode,
  nodes: Record<string, SceneNode>,
  nodeOrder: string[],
  duration: number,
  fps = 60
): string {
  const project: SceneProject = {
    id: `proj-${Date.now()}`,
    name: rootFrame.name,
    version: '1.0.0',
    duration,
    fps,
    rootFrame,
    nodes,
    nodeOrder
  };

  return JSON.stringify(project, null, 2);
}

export function parseAndValidateProject(jsonStr: string): SceneProject {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error('Invalid JSON format');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Project file root must be an object');
  }

  if (!parsed.rootFrame || typeof parsed.rootFrame !== 'object') {
    throw new Error('Project missing valid rootFrame');
  }

  if (!parsed.nodes || typeof parsed.nodes !== 'object') {
    throw new Error('Project missing valid nodes map');
  }

  if (!Array.isArray(parsed.nodeOrder)) {
    throw new Error('Project missing valid nodeOrder array');
  }

  return {
    id: parsed.id || `proj-${Date.now()}`,
    name: parsed.name || parsed.rootFrame.name || 'Untitled Project',
    version: parsed.version || '1.0.0',
    duration: typeof parsed.duration === 'number' ? parsed.duration : 3.0,
    fps: typeof parsed.fps === 'number' ? parsed.fps : 60,
    rootFrame: parsed.rootFrame,
    nodes: parsed.nodes,
    nodeOrder: parsed.nodeOrder
  };
}

export async function openProjectFromFile(): Promise<SceneProject> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.osvg,.kinetic,.json,application/json';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const proj = parseAndValidateProject(content);
          resolve(proj);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };
    input.click();
  });
}
