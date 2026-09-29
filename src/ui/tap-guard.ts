export interface TapGuard {
  lock(): void;
  guard(handler: () => void): () => void;
}

export function createTapGuard(
  ms = 350,
  now: () => number = () => performance.now(),
): TapGuard {
  let lockedUntil = 0;
  return {
    lock() {
      lockedUntil = now() + ms;
    },
    guard(handler) {
      return () => {
        if (now() < lockedUntil) return;
        handler();
      };
    },
  };
}
