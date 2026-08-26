import { describe, it, expect } from 'vitest';
import { createInteractiveButtonDocument } from '../interactiveButtonTemplate';
import { validateDocument } from '../../format/documentParser';
import { OpenSVGWebRuntime } from '../../webRuntime/openSVGWebRuntime';

describe('Killer Workflow — Interactive Button Template (Section 16)', () => {
  it('generates valid canonical OpenSVG document with full interactive states', () => {
    const doc = createInteractiveButtonDocument();

    const report = validateDocument(doc);
    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);

    expect(doc.format).toBe('opensvg');
    expect(doc.metadata.id).toBe('template-interactive-button');
    expect(doc.nodes['btn-container']).toBeDefined();
    expect(doc.nodes['btn-label']).toBeDefined();
    expect(doc.stateMachines).toHaveLength(1);
    expect(doc.stateMachines![0].inputs).toHaveLength(4);
  });

  it('runs interactive button in OpenSVGWebRuntime seamlessly', () => {
    const doc = createInteractiveButtonDocument();
    const runtime = new OpenSVGWebRuntime({ autoplay: false });
    runtime.load(doc);

    expect(runtime.getDuration()).toBe(3.0);

    // Test driving interactive inputs
    runtime.setBoolean('isHovered', true);
    runtime.setBoolean('isPressed', true);
    runtime.setBoolean('isLoading', true);
    runtime.fireTrigger('isSuccess');

    const sceneState = runtime.getRuntime().getEvaluatedSceneState();
    expect(sceneState.evaluatedNodes['btn-container']).toBeDefined();
    expect(sceneState.evaluatedNodes['btn-label']).toBeDefined();
  });
});
