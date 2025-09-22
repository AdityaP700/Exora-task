// Simple concurrency limiter (semaphore-style) to cap concurrent external API calls
// Ensures we never run more than `maxConcurrency` tasks simultaneously

export class ConcurrencyLimiter {
  private max: number;
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(maxConcurrency: number) {
    if (maxConcurrency < 1) throw new Error('maxConcurrency must be >= 1');
    this.max = maxConcurrency;
  }

  schedule<T>(task: () => Promise<T> | T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        this.active++;
        Promise.resolve()
          .then(task)
          .then((result) => {
            this.active--;
            this.next();
            resolve(result);
          })
          .catch((err) => {
            this.active--;
            this.next();
            reject(err);
          });
      };

      if (this.active < this.max) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }

  private next() {
    if (this.active >= this.max) return;
    const nextTask = this.queue.shift();
    if (nextTask) nextTask();
  }
}

// Shared limiter: cap all external API calls at 5 concurrent
export const sharedLimiter = new ConcurrencyLimiter(5);
