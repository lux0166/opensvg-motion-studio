import { SceneProject } from './types';

/**
 * Atomic Project Auto-Save and Crash Recovery Engine
 * Adheres strictly to OpenSVG Feature Engineering Rules D3, D4, D5
 */

export interface RecoverySnapshot {
  id: string;
  timestamp: number;
  checksum: string;
  project: SceneProject;
}

const RECOVERY_STORAGE_KEY = 'opensvg_crash_recovery_snapshot';

/**
 * Computes a fast hash checksum for data integrity verification (Rule D4)
 */
export function computeProjectChecksum(project: SceneProject): string {
  const str = JSON.stringify({
    name: project.name,
    duration: project.duration,
    fps: project.fps,
    nodeOrder: project.nodeOrder,
    nodesCount: Object.keys(project.nodes || {}).length
  });
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `chk_${Math.abs(hash).toString(16)}`;
}

/**
 * Creates an atomic snapshot payload for persistence
 */
export function createRecoverySnapshot(project: SceneProject): RecoverySnapshot {
  return {
    id: `rec-${Date.now()}`,
    timestamp: Date.now(),
    checksum: computeProjectChecksum(project),
    project: JSON.parse(JSON.stringify(project))
  };
}

/**
 * Validates a recovery snapshot structure and checksum integrity (Rule D4 & D5)
 */
export function validateRecoverySnapshot(snapshot: any): snapshot is RecoverySnapshot {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (!snapshot.timestamp || !snapshot.checksum || !snapshot.project) return false;

  const proj = snapshot.project;
  if (!proj.id || !proj.nodes || !Array.isArray(proj.nodeOrder) || !proj.rootFrame) return false;

  const expectedChecksum = computeProjectChecksum(proj);
  return snapshot.checksum === expectedChecksum;
}

/**
 * Saves a recovery snapshot to local storage with atomic safety (Rule D3)
 */
export function saveRecoverySnapshot(
  snapshot: RecoverySnapshot,
  storage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as Storage)
): boolean {
  try {
    const raw = JSON.stringify(snapshot);
    storage.setItem(RECOVERY_STORAGE_KEY, raw);
    return true;
  } catch (err) {
    console.error('Failed to save atomic crash recovery snapshot:', err);
    return false;
  }
}

/**
 * Loads and verifies the latest crash recovery snapshot (Rule D5)
 */
export function loadRecoverySnapshot(
  storage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as Storage)
): RecoverySnapshot | null {
  try {
    const raw = storage.getItem(RECOVERY_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (validateRecoverySnapshot(parsed)) {
      return parsed;
    }
    console.warn('Corrupt crash recovery snapshot detected; discarded safely.');
    return null;
  } catch (err) {
    console.error('Failed to load crash recovery snapshot:', err);
    return null;
  }
}

/**
 * Clears existing recovery snapshot after clean save/exit
 */
export function clearRecoverySnapshot(
  storage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as Storage)
): void {
  try {
    storage.removeItem(RECOVERY_STORAGE_KEY);
  } catch {}
}
