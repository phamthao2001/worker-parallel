import { describe, expect, test } from 'bun:test';
import { Parallel } from '../parallel';

describe('Parallel Worker Tests', () => {
  const hardWork = (n: number): number => {
    let out = 0;
    for (let i = 0; i < n; i++) {
      out += i;
    }
    return out;
  };

  const testData = [1, 4, 3];

  test('should compute results in parallel', async () => {
    const p = new Parallel(hardWork);
    p.calculateData(testData);

    const result = await p.execute<number[]>();

    // Verify we got results for all inputs
    expect(result.length).toBe(testData.length);

    // Verify results match sequential computation
    const expectedResults = testData.map(n => hardWork(n));
    expect(result).toEqual(expectedResults);
  });

  test('should handle empty input array', async () => {
    const p = new Parallel(hardWork);
    p.calculateData([]);

    const result = await p.execute<number[]>();
    expect(result).toEqual([]);
  });

  test('should handle single item array', async () => {
    const p = new Parallel(hardWork);
    const singleData = [1_000_000];
    p.calculateData(singleData);

    const result = await p.execute<number[]>();
    expect(result).toEqual([hardWork(1_000_000)]);
  });

  test('parallel execution should be faster than sequential for large computations', async () => {
    const largeData = [1_000_000, 1_500_000, 2_000_000].map(i => i * 1000);

    // Measure parallel execution time
    const parallelStartTime = performance.now();

    const p = new Parallel(hardWork);
    p.calculateData(largeData);
    await p.execute<number[]>();
    // end measure
    const parallelTime = performance.now() - parallelStartTime;

    // Measure sequential execution time
    const sequentialStartTime = performance.now();

    const sequentialResults: number[] = [];
    for (const n of largeData) {
      sequentialResults.push(hardWork(n));
    }
    // end measure
    const sequentialTime = performance.now() - sequentialStartTime;

    // Parallel should be faster (allowing some margin for overhead)
    expect(parallelTime).toBeLessThan(sequentialTime);
  });
});
