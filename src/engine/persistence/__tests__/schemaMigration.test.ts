import { describe, it, expect } from 'vitest';
import {
  migrateProjectToLatest,
  validateProject,
  serializeProject,
  CURRENT_SCHEMA_VERSION
} from '../schemaMigration';

describe('Schema Migration & Persistence Hardening (CORE-11 & Section 13)', () => {
  it('migrates legacy v1 project payload to canonical v2 schema', () => {
    const legacyPayload = {
      id: 'proj-v1',
      name: 'Legacy Project',
      nodes: {
        layer1: { id: 'layer1', type: 'rect', x: 20, y: 30 }
      },
      nodeOrder: ['layer1']
    };

    const migrated = migrateProjectToLatest(legacyPayload);
    expect(migrated.version).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.rootFrame.width).toBe(800);
    expect(migrated.nodes.layer1.pivotX).toBe(0.5);
    expect(migrated.nodes.layer1.pivotY).toBe(0.5);
    expect(migrated.nodes.layer1.fillRule).toBe('nonzero');
  });

  it('validates project and detects integrity errors', () => {
    const corruptProject: any = {
      id: 'proj-bad',
      version: '2.0.0',
      duration: 2.0,
      fps: 60,
      rootFrame: { id: 'root', width: 0, height: 0 }, // invalid dimensions
      nodes: {},
      nodeOrder: ['missing-node-id'] // missing reference
    };

    const report = validateProject(corruptProject);
    expect(report.valid).toBe(false);
    expect(report.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('serializes project with schema version and checksum', () => {
    const validProject = migrateProjectToLatest({
      id: 'proj-valid',
      name: 'Valid Project'
    });

    const serialized = serializeProject(validProject);
    const parsed = JSON.parse(serialized);

    expect(parsed.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(parsed.checksum).toBeDefined();
    expect(parsed.project.id).toBe('proj-valid');
  });
});
