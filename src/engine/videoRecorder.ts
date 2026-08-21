import { FrameNode, SceneNode } from './types';
import { evaluateNode } from './evaluator';
import { renderCanvasScene } from './renderer';

export interface VideoRecordOptions {
  fps?: number;
  quality?: number; // 0.1 to 1.0
  mimeType?: string;
  onProgress?: (progress: number) => void;
}

/**
 * High-Precision 60fps Canvas Video Recording Engine
 * Evaluates scene nodes frame-by-frame deterministically to produce smooth 60fps video
 */
export async function recordSceneToVideo(
  rootFrame: FrameNode,
  nodes: SceneNode[],
  duration: number,
  options: VideoRecordOptions = {}
): Promise<Blob> {
  const fps = options.fps || 60;
  const totalFrames = Math.round(duration * fps);
  const dpr = 2; // High-res 2x export

  // Create dedicated offscreen recording canvas
  const canvas = document.createElement('canvas');
  canvas.width = rootFrame.width * dpr;
  canvas.height = rootFrame.height * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Determine supported mimeType
  const mimeTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4'
  ];
  let selectedMimeType = options.mimeType || '';
  if (!selectedMimeType || (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(selectedMimeType))) {
    selectedMimeType = mimeTypes.find(t => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) || 'video/webm';
  }

  // Create stream from canvas
  const stream = (canvas as any).captureStream ? (canvas as any).captureStream(fps) : null;
  if (!stream || typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder or Canvas stream is not supported in this environment');
  }

  const recorder = new MediaRecorder(stream, {
    mimeType: selectedMimeType,
    videoBitsPerSecond: 12000000 // 12 Mbps crystal clear quality
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();

  // Render each frame sequentially
  for (let frame = 0; frame <= totalFrames; frame++) {
    const time = (frame / fps);
    const evaluatedNodes = nodes.map(node => evaluateNode(node, time));

    renderCanvasScene(
      ctx,
      rootFrame,
      evaluatedNodes,
      null,
      'select',
      null,
      dpr,
      []
    );

    if (options.onProgress) {
      options.onProgress(Math.min(100, Math.round((frame / totalFrames) * 100)));
    }

    // Small frame delay to allow stream buffer ingestion
    await new Promise((resolve) => setTimeout(resolve, 1000 / fps / 2));
  }

  return new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const videoBlob = new Blob(chunks, { type: selectedMimeType });
      resolve(videoBlob);
    };
    recorder.stop();
  });
}
