// Performance monitoring and optimization service
import { Platform } from 'react-native';
import { Dimensions, PixelRatio } from 'react-native';

export interface PerformanceMetrics {
  memoryUsage: number;
  bundleSize: number;
  renderTime: number;
  navigationTime: number;
  searchTime: number;
  ocrProcessingTime: number;
  batteryLevel?: number;
  networkType?: string;
  deviceInfo: {
    model: string;
    osVersion: string;
    screenDensity: number;
    isLowEndDevice: boolean;
  };
}

export interface PerformanceBenchmarks {
  maxMemoryUsage: number; // 80MB
  maxAppLaunchTime: number; // 1.5s
  maxDocumentLoadTime: number; // 2s
  maxSearchTime: number; // 500ms
  maxOCRTime: number; // 5s per page
  maxBatteryDrainPerHour: number; // 5%
}

export class PerformanceService {
  private static metrics: PerformanceMetrics = {
    memoryUsage: 0,
    bundleSize: 0,
    renderTime: 0,
    navigationTime: 0,
    searchTime: 0,
    ocrProcessingTime: 0,
    deviceInfo: {
      model: '',
      osVersion: '',
      screenDensity: PixelRatio.get(),
      isLowEndDevice: false,
    },
  };

  private static benchmarks: PerformanceBenchmarks = {
    maxMemoryUsage: 80 * 1024 * 1024, // 80MB in bytes
    maxAppLaunchTime: 1500, // 1.5 seconds
    maxDocumentLoadTime: 2000, // 2 seconds
    maxSearchTime: 500, // 500ms
    maxOCRTime: 5000, // 5 seconds per page
    maxBatteryDrainPerHour: 5, // 5% per hour
  };

  private static performanceObservers: Map<string, PerformanceObserver> =
    new Map();
  private static performanceLogs: Array<{
    timestamp: number;
    metric: string;
    value: number;
    benchmark: number;
    passed: boolean;
  }> = [];

  // Initialize performance monitoring
  static async init(): Promise<void> {
    try {
      await this.detectDeviceCapabilities();
      this.setupMemoryMonitoring();
      this.setupPerformanceObservers();

      if (Platform.OS === 'web') {
        this.setupWebPerformanceAPI();
      }

      console.log('Performance monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }

  // Detect device capabilities for optimization
  private static async detectDeviceCapabilities(): Promise<void> {
    const { width, height } = Dimensions.get('screen');
    const screenDensity = PixelRatio.get();
    const screenSize = width * height * screenDensity;

    // Classify device as low-end based on screen characteristics
    const isLowEndDevice = screenSize < 2000000 || screenDensity < 2;

    this.metrics.deviceInfo = {
      model: Platform.OS === 'web' ? 'Web Browser' : 'Mobile Device',
      osVersion: Platform.Version?.toString() || 'Unknown',
      screenDensity,
      isLowEndDevice,
    };

    // Adjust performance targets for low-end devices
    if (isLowEndDevice) {
      this.benchmarks.maxMemoryUsage = 50 * 1024 * 1024; // 50MB for low-end
      this.benchmarks.maxAppLaunchTime = 2500; // 2.5s for low-end
      this.benchmarks.maxDocumentLoadTime = 3000; // 3s for low-end
    }
  }

  // Setup memory monitoring
  private static setupMemoryMonitoring(): void {
    if (Platform.OS === 'web' && 'memory' in performance) {
      const webMemory = (
        performance as Performance & { memory: { usedJSHeapSize: number } }
      ).memory;
      this.metrics.memoryUsage = webMemory.usedJSHeapSize;

      setInterval(() => {
        const currentMemory = webMemory.usedJSHeapSize;
        this.metrics.memoryUsage = currentMemory;
        this.logPerformanceMetric(
          'memoryUsage',
          currentMemory,
          this.benchmarks.maxMemoryUsage
        );
      }, 10000); // Check every 10 seconds
    }
  }

  // Setup Web Performance API observers
  private static setupWebPerformanceAPI(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      // Navigation timing
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            const loadTime = navEntry.loadEventEnd - navEntry.fetchStart;
            this.metrics.navigationTime = loadTime;
            this.logPerformanceMetric(
              'navigationTime',
              loadTime,
              this.benchmarks.maxAppLaunchTime
            );
          }
        });
      });

      navObserver.observe({ entryTypes: ['navigation'] });
      this.performanceObservers.set('navigation', navObserver);

      // Paint timing
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.renderTime = entry.startTime;
            this.logPerformanceMetric('renderTime', entry.startTime, 2000); // 2s target for FCP
          }
        });
      });

      paintObserver.observe({ entryTypes: ['paint'] });
      this.performanceObservers.set('paint', paintObserver);
    }
  }

  // Setup generic performance observers
  private static setupPerformanceObservers(): void {
    // Long task detection for web
    if (Platform.OS === 'web' && typeof PerformanceObserver !== 'undefined') {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            console.warn('Long task detected:', entry.duration, 'ms');
            this.logPerformanceMetric('longTask', entry.duration, 50); // 50ms threshold
          });
        });

        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.performanceObservers.set('longtask', longTaskObserver);
      } catch {
        // Long task API not supported, ignore
      }
    }
  }

  // Measure function execution time
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    benchmark?: number
  ): Promise<{ result: T; duration: number; passed: boolean }> {
    const startTime = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      const targetBenchmark = benchmark || this.getBenchmarkForMetric(name);
      const passed = duration <= targetBenchmark;

      this.logPerformanceMetric(name, duration, targetBenchmark);

      return { result, duration, passed };
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logPerformanceMetric(name, duration, benchmark || 0, false);
      throw error;
    }
  }

  // Measure synchronous function execution
  static measure<T>(
    name: string,
    fn: () => T,
    benchmark?: number
  ): { result: T; duration: number; passed: boolean } {
    const startTime = performance.now();

    try {
      const result = fn();
      const duration = performance.now() - startTime;
      const targetBenchmark = benchmark || this.getBenchmarkForMetric(name);
      const passed = duration <= targetBenchmark;

      this.logPerformanceMetric(name, duration, targetBenchmark);

      return { result, duration, passed };
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logPerformanceMetric(name, duration, benchmark || 0, false);
      throw error;
    }
  }

  // Log performance metric
  private static logPerformanceMetric(
    metric: string,
    value: number,
    benchmark: number,
    success: boolean = true
  ): void {
    const passed = success && value <= benchmark;

    this.performanceLogs.push({
      timestamp: Date.now(),
      metric,
      value,
      benchmark,
      passed,
    });

    // Keep only last 1000 entries
    if (this.performanceLogs.length > 1000) {
      this.performanceLogs.splice(0, 100);
    }

    // Log warnings for failed benchmarks
    if (!passed) {
      console.warn(
        `Performance benchmark failed: ${metric} took ${value}ms (max: ${benchmark}ms)`
      );
    }
  }

  // Get benchmark for specific metric
  private static getBenchmarkForMetric(metric: string): number {
    switch (metric) {
      case 'search':
      case 'searchTime':
        return this.benchmarks.maxSearchTime;
      case 'ocr':
      case 'ocrProcessingTime':
        return this.benchmarks.maxOCRTime;
      case 'documentLoad':
        return this.benchmarks.maxDocumentLoadTime;
      case 'appLaunch':
      case 'navigationTime':
        return this.benchmarks.maxAppLaunchTime;
      default:
        return 1000; // 1 second default
    }
  }

  // Get current performance metrics
  static getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get performance logs
  static getPerformanceLogs(limit: number = 100): Array<{
    timestamp: number;
    metric: string;
    value: number;
    benchmark: number;
    passed: boolean;
  }> {
    return this.performanceLogs.slice(-limit);
  }

  // Get performance summary
  static getPerformanceSummary(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averagePerformance: number;
    criticalIssues: number;
  } {
    const recentLogs = this.performanceLogs.slice(-100); // Last 100 entries
    const totalTests = recentLogs.length;
    const passedTests = recentLogs.filter((log) => log.passed).length;
    const failedTests = totalTests - passedTests;
    const averagePerformance = passedTests / totalTests;
    const criticalIssues = recentLogs.filter(
      (log) => !log.passed && log.value > log.benchmark * 2
    ).length;

    return {
      totalTests,
      passedTests,
      failedTests,
      averagePerformance,
      criticalIssues,
    };
  }

  // Optimize for low-end devices
  static optimizeForLowEndDevice(): {
    reducedAnimations: boolean;
    lowerImageQuality: boolean;
    reducedCaching: boolean;
    simpleUI: boolean;
  } {
    const isLowEnd = this.metrics.deviceInfo.isLowEndDevice;
    const memoryPressure =
      this.metrics.memoryUsage > this.benchmarks.maxMemoryUsage * 0.8;

    return {
      reducedAnimations: isLowEnd || memoryPressure,
      lowerImageQuality: isLowEnd,
      reducedCaching: memoryPressure,
      simpleUI: isLowEnd,
    };
  }

  // Memory optimization
  static async triggerGarbageCollection(): Promise<void> {
    if (Platform.OS === 'web') {
      // Force garbage collection if available (Chrome DevTools)
      if ('gc' in window) {
        (window as Window & { gc: () => void }).gc();
      }
    }

    // Clear caches
    this.clearPerformanceCaches();
  }

  // Clear performance caches
  private static clearPerformanceCaches(): void {
    // Clear old performance logs
    if (this.performanceLogs.length > 500) {
      this.performanceLogs.splice(0, this.performanceLogs.length - 500);
    }
  }

  // Cleanup observers
  static cleanup(): void {
    this.performanceObservers.forEach((observer) => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    this.performanceObservers.clear();
  }
}
