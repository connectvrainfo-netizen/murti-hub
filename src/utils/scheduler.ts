/**
 * Enterprise Non-Blocking Task Scheduler
 * Uses the modern Prioritized Task Scheduling API (scheduler.postTask)
 * with robust fallback to requestIdleCallback and setTimeout.
 */

export type TaskPriority = 'user-blocking' | 'user-visible' | 'background';

interface PostTaskOptions {
  priority?: TaskPriority;
  delay?: number;
  signal?: AbortSignal;
}

// Polyfill check for window.scheduler
interface GlobalWithScheduler {
  scheduler?: {
    postTask<T>(callback: () => T | Promise<T>, options?: PostTaskOptions): Promise<T>;
  };
}

/**
 * Schedule non-critical work (e.g., analytics telemetry, DOM measurements, expensive calculations)
 * without dropping frames or blocking main-thread responsiveness (INP).
 */
export function scheduleTask<T>(
  task: () => T | Promise<T>,
  priority: TaskPriority = 'background',
  delay = 0
): Promise<T> {
  const globalObj = typeof window !== 'undefined' ? (window as unknown as GlobalWithScheduler) : undefined;

  // 1. High-Performance Path: Native Prioritized Task Scheduling API
  if (globalObj?.scheduler?.postTask) {
    return globalObj.scheduler.postTask(task, { priority, delay });
  }

  // 2. Secondary Path: requestIdleCallback for background tasks
  if (priority === 'background' && typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return new Promise<T>((resolve, reject) => {
      window.requestIdleCallback(
        async (deadline) => {
          try {
            // Wait if time remaining is sufficient, or execute during browser idle slice
            if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
              const result = await task();
              resolve(result);
            } else {
              // Yield to next frame if slice expired
              setTimeout(async () => {
                try {
                  const res = await task();
                  resolve(res);
                } catch (e) {
                  reject(e);
                }
              }, 16);
            }
          } catch (err) {
            reject(err);
          }
        },
        { timeout: 2000 } // Guaranteed execution boundary
      );
    });
  }

  // 3. Fallback Path: Deferred setTimeout
  return new Promise<T>((resolve, reject) => {
    setTimeout(async () => {
      try {
        const result = await task();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }, delay || (priority === 'background' ? 50 : 0));
  });
}

/**
 * Offload batch operations across idle slices to eliminate long tasks (>50ms)
 */
export async function chunkedExecution<T, R>(
  items: T[],
  processor: (item: T, index: number) => R,
  batchSize = 25
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  while (index < items.length) {
    const chunk = items.slice(index, index + batchSize);
    await scheduleTask(() => {
      for (let i = 0; i < chunk.length; i++) {
        results.push(processor(chunk[i], index + i));
      }
    }, 'background');
    index += batchSize;
  }

  return results;
}
