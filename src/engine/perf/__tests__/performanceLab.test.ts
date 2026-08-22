import { describe, it, expect } from 'vitest';
import { generateStressProject, runBenchmark, runPerformanceLab } from '../performanceLab';

describe('Performance Lab Benchmark Suite (CORE-12 & Section 14)', () => {
  it('generates synthetic stress project with 500 animated nodes', () => {
    const project = generateStressProject(500);
    expect(project.nodeOrder.length).toBe(500);
    expect(Object.keys(project.nodes).length).toBe(500);
    expect(project.nodes['stress-node-0'].tracks.length).toBe(1);
  });

  it('runs micro-benchmarks and reports timing metrics', () => {
    const res = runBenchmark('Test Micro Loop', 1000, () => {
      Math.sqrt(12345.67);
    });

    expect(res.name).toBe('Test Micro Loop');
    expect(res.iterations).toBe(1000);
    expect(res.avgTimeMs).toBeLessThan(1.0);
    expect(res.opsPerSec).toBeGreaterThan(1000);
  });

  it('executes full Performance Lab suite and passes SLA budgets', () => {
    const report = runPerformanceLab();
    expect(report.results.length).toBe(2);
    expect(report.passed).toBe(true);
  });
});
