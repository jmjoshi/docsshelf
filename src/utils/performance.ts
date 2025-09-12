// Performance monitoring utility for DocsShelf
export class PerformanceMonitor {
  private static startTimes: Map<string, number> = new Map();

  // Start timing an operation
  static startTimer(operation: string): void {
    this.startTimes.set(operation, Date.now());
  }

  // End timing and log the duration
  static endTimer(operation: string): void {
    const startTime = this.startTimes.get(operation);
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`[Performance] ${operation}: ${duration}ms`);

      // Log to Flipper if available in development
      if (
        process.env.NODE_ENV === 'development' &&
        (global as unknown as { flipper?: unknown }).flipper
      ) {
        // Send to Flipper performance plugin
        // This would be configured in Flipper desktop app
      }

      this.startTimes.delete(operation);
    }
  }

  // Monitor memory usage
  static logMemoryUsage(label: string = 'Memory Usage'): void {
    // Force garbage collection in debug mode if available
    if ((global as unknown as { gc?: () => void }).gc) {
      (global as unknown as { gc?: () => void }).gc?.();
    }

    // Monitor memory if performance.memory is available
    const globalWithPerformance = global as unknown as {
      performance?: {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
      };
    };

    if (globalWithPerformance.performance?.memory) {
      const memInfo = globalWithPerformance.performance.memory;
      console.log(
        `[${label}] Used: ${(memInfo.usedJSHeapSize / 1024 / 1024).toFixed(
          2
        )}MB, Total: ${(memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`
      );
    }
  }

  // Monitor app launch time
  static monitorAppLaunch(): void {
    this.startTimer('App Launch');
  }

  // Monitor document loading
  static monitorDocumentLoad(count: number): void {
    this.startTimer(`Load ${count} documents`);
  }

  // Monitor search performance
  static monitorSearch(query: string): void {
    this.startTimer(`Search: ${query}`);
  }
}
