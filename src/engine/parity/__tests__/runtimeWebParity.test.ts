import { describe, it, expect } from 'vitest';
import { evaluateScenePipeline } from '../../runtime/evaluationPipeline';
import { OpenSVGRuntime } from '../../runtime/runtimeKernel';
import { OpenSVGWebRuntime } from '../../webRuntime/openSVGWebRuntime';
import { createInteractiveButtonDocument } from '../../templates/interactiveButtonTemplate';
import { convertNativeDocumentToProject } from '../../format/documentParser';

describe('Runtime Parity: Studio Preview == Headless Runtime == Web Runtime (Section 2 & 9)', () => {
  it('guarantees identical evaluated scene states across all 3 runtime consumption paths', () => {
    const nativeDoc = createInteractiveButtonDocument();
    const project = convertNativeDocumentToProject(nativeDoc);

    const testTime = 0.25;

    // 1. Direct Canonical Evaluation Pipeline (Studio Preview Path)
    const studioPreviewState = evaluateScenePipeline(project, {
      time: testTime,
      stateMachineRuntime: undefined,
      externalPropertyOverrides: {
        'btn-container': { scaleX: 1.04 }
      }
    });

    // 2. Headless Runtime Kernel (Node / Worker / Server Path)
    const headlessRuntime = new OpenSVGRuntime();
    headlessRuntime.load(nativeDoc);
    headlessRuntime.seek(testTime);
    headlessRuntime.setProperty('btn-container', 'scaleX', 1.04);
    const headlessState = headlessRuntime.getEvaluatedSceneState();

    // 3. OpenSVG Web Runtime Adapter (Browser / Frontend Path)
    const webRuntime = new OpenSVGWebRuntime({ autoplay: false });
    webRuntime.load(nativeDoc);
    webRuntime.seek(testTime);
    webRuntime.setProperty('btn-container', 'scaleX', 1.04);
    const webRuntimeState = webRuntime.getRuntime().getEvaluatedSceneState();

    // Verification of Parity
    expect(headlessState.time).toBe(studioPreviewState.time);
    expect(webRuntimeState.time).toBe(studioPreviewState.time);

    // Node count and order parity
    expect(headlessState.nodeOrder).toEqual(studioPreviewState.nodeOrder);
    expect(webRuntimeState.nodeOrder).toEqual(studioPreviewState.nodeOrder);

    // Node property parity
    for (const id of studioPreviewState.nodeOrder) {
      const studioNode = studioPreviewState.evaluatedNodes[id];
      const headlessNode = headlessState.evaluatedNodes[id];
      const webNode = webRuntimeState.evaluatedNodes[id];

      expect(headlessNode.x).toBe(studioNode.x);
      expect(webNode.x).toBe(studioNode.x);
      expect(headlessNode.scaleX).toBeCloseTo(studioNode.scaleX ?? 1, 3);
      expect(webNode.scaleX).toBeCloseTo(studioNode.scaleX ?? 1, 3);
      expect(headlessNode.fill).toBe(studioNode.fill);
      expect(webNode.fill).toBe(studioNode.fill);
    }

    // RenderScene viewport and draw order parity
    expect(headlessState.renderScene.viewport).toEqual(studioPreviewState.renderScene.viewport);
    expect(webRuntimeState.renderScene.viewport).toEqual(studioPreviewState.renderScene.viewport);
    expect(headlessState.renderScene.drawOrder).toEqual(studioPreviewState.renderScene.drawOrder);
    expect(webRuntimeState.renderScene.drawOrder).toEqual(studioPreviewState.renderScene.drawOrder);
  });
});
