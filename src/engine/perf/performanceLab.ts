import { SceneProject, SceneNode } from '../types';
import { OpenSVGRuntime } from '../runtime/runtimeKernel';
import { composeTransform } from '../transform/matrix2D';

/**
 * OpenSVG Performance Lab Benchmark Suite
 * Adheres strictly to RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md (CORE-12)
 */

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTimeMs: number;
  avgTimeMs: number;
  opsPerSec: number;
}

export interface PerfReport {
  timestamp: number;
  results: BenchmarkResult[];
  passed: boolean;
}

/**
 * Generates a synthetic stress-test project with N animated nodes
 */
export function generateStressProject(nodeCount: number = 1000): SceneProject {
  const nodes: Record<string, SceneNode> = {};
  const nodeOrder: string[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const id = `stress-node-${i}`;
    nodes[id] = {
      id,
      name: `Node ${i}`,
      type: 'rect',
      visible: true,
      locked: false,
      x: (i * 10) % 800,
      y: (i * 10) % 600,
      width: 40,
      height: 40,
      rotation: (i * 5) % 360,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 4,
      fill: i % 2 === 0 ? '#3b82f6' : '#10b981',
      tracks: [
        {
          id: `tr-x-${i}`,
          property: 'x',
          label: 'X',
          unit: 'px',
          keyframes: [
            { id: `k1-${i}`, time: 0, value: (i * 10) % 800 },
            { id: `k2-${i}`, time: 2.0, value: ((i * 10) % 800) + 100 },
            { id: `k3-${i}`, time: 4.0, value: (i * 10) % 800 }
          ]
        }
      ]
    };
    nodeOrder.push(id);
  }

  return {
    id: `stress-test-${nodeCount}`,
    name: 'Stress Test Project',
    version: '2.0.0',
    duration: 4.0,
    fps: 60,
    rootFrame: {
      id: 'root-frame',
      name: 'Stage',
      type: 'frame',
      visible: true,
      locked: false,
      clipContent: true,
      canvasBg: '#0f172a',
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      borderRadius: 0,
      fill: '#0f172a',
      tracks: []
    },
    nodes,
    nodeOrder
  };
}

/**
 * Runs a micro-benchmark and computes ops/sec
 */
export function runBenchmark(name: string, iterations: number, fn: () => void): BenchmarkResult {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const totalTimeMs = performance.now() - start;
  const avgTimeMs = totalTimeMs / iterations;
  const opsPerSec = Math.round(1000 / (avgTimeMs || 0.001));

  return {
    name,
    iterations,
    totalTimeMs: parseFloat(totalTimeMs.toFixed(3)),
    avgTimeMs: parseFloat(avgTimeMs.toFixed(4)),
    opsPerSec
  };
}

/**
 * Executes the complete Performance Lab Suite (Rule CORE-12)
 */
export function runPerformanceLab(): PerfReport {
  const results: BenchmarkResult[] = [];
  const project = generateStressProject(500);
  const runtime = new OpenSVGRuntime();
  runtime.load(project);

  // 1. Runtime advance & render state evaluation throughput
  results.push(
    runBenchmark('Runtime Evaluation (500 animated nodes)', 50, () => {
      runtime.advance(0.016);
      runtime.getRenderState();
    })
  );

  // 2. Matrix2D Transform composition throughput
  results.push(
    runBenchmark('Matrix2D Transform Composition', 10000, () => {
      composeTransform(
        {
          translation: { x: 120, y: 340 },
          rotation: 45,
          scale: { x: 1.5, y: 1.5 },
          pivot: { x: 0.5, y: 0.5 }
        },
        200,
        150
      );
    })
  );

  return {
    timestamp: Date.now(),
    results,
    passed: results.every((r) => r.avgTimeMs < 50)
  };
}
