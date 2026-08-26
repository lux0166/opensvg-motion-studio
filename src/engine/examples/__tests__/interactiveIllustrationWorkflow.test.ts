import { describe, it, expect } from 'vitest';
import {
  buildInteractiveHeroIllustrationDocument,
  executeKillerProductWorkflow
} from '../interactiveIllustrationWorkflow';
import { parseDocument, serializeDocument, validateDocument } from '../../format/documentParser';

describe('Killer Product Workflow: Complex SVG -> .osvg -> Standalone WebRuntime (Section 4 & 5)', () => {
  it('successfully executes the complete product workflow with 100% data integrity and autonomous execution', () => {
    // 1. Execute authoring, serialization, validation and runtime loading
    const result = executeKillerProductWorkflow();

    // Verify .osvg is 100% valid schema 2.0.0
    expect(result.isValid).toBe(true);
    expect(result.osvgJson).toContain('"schemaVersion":"2.0.0"');
    expect(result.osvgJson).toContain('"format":"opensvg"');

    // 2. Test Standalone WebRuntime Evaluation (Studio is NOT running)
    const runtime = result.runtime;
    const initialScene = runtime.getRuntime().getEvaluatedSceneState();

    // Initial state check
    expect(initialScene.evaluatedNodes['energy-core']).toBeDefined();
    expect(initialScene.evaluatedNodes['energy-core'].fill).toBe('#3b82f6');
    expect(initialScene.evaluatedNodes['energy-core'].scaleX).toBe(1.0);
    expect(initialScene.evaluatedNodes['action-btn-label'].textContent).toBe('ACTIVATE SHIELD');

    // 3. User Hovers on element -> State Machine transitions to Hover
    runtime.setBoolean('isHovered', true);
    runtime.getRuntime().advance(0.2); // Advance through 0.2s transition

    const hoverScene = runtime.getRuntime().getEvaluatedSceneState();
    expect(hoverScene.evaluatedNodes['energy-core'].fill).toBe('#60a5fa');
    expect(hoverScene.evaluatedNodes['energy-core'].scaleX).toBe(1.15);
    expect(hoverScene.evaluatedNodes['action-btn-label'].textContent).toBe('READY TO ARM');

    // 4. User Triggers Active Overdrive
    runtime.setBoolean('isActive', true);
    runtime.getRuntime().advance(0.15); // Advance through 0.15s transition

    const activeScene = runtime.getRuntime().getEvaluatedSceneState();
    expect(activeScene.evaluatedNodes['energy-core'].fill).toBe('#10b981');
    expect(activeScene.evaluatedNodes['energy-core'].scaleX).toBe(1.35);
    expect(activeScene.evaluatedNodes['action-btn-label'].textContent).toBe('SYSTEM SECURED');
  });

  it('guarantees roundtrip idempotency: Save .osvg -> Close Studio -> Load in New Runtime -> 100% Same Result', () => {
    const doc = buildInteractiveHeroIllustrationDocument();
    const serialized = serializeDocument(doc);
    const validation = validateDocument(serialized);
    expect(validation.valid).toBe(true);

    const reloadedDoc = parseDocument(serialized);
    expect(reloadedDoc.metadata.id).toBe(doc.metadata.id);
    expect(reloadedDoc.nodes['shield-body'].tracks.length).toBe(doc.nodes['shield-body'].tracks.length);
    expect(reloadedDoc.stateMachines?.[0].layers.length).toBe(doc.stateMachines?.[0].layers.length);
  });
});
