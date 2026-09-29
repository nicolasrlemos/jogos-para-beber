import { describe, expect, it } from 'vitest';
import { createTapGuard } from '../src/ui/tap-guard';

describe('tap guard', () => {
  it('ignores taps while locked and accepts them afterwards', () => {
    let time = 1000;
    const tap = createTapGuard(350, () => time);
    let count = 0;
    const handler = tap.guard(() => count++);

    handler();
    expect(count).toBe(1);

    tap.lock();
    time += 100;
    handler();
    expect(count).toBe(1);

    time += 300;
    handler();
    expect(count).toBe(2);
  });
});
