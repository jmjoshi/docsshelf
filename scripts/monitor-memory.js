#!/usr/bin/env node

/* eslint-env node */

// Memory monitoring script for performance profiling
const fs = require('fs');
const path = require('path');

class MemoryMonitor {
  constructor() {
    this.measurements = [];
    this.interval = null;
    this.isRunning = false;
  }

  // Start monitoring memory usage
  start(intervalMs = 1000) {
    if (this.isRunning) {
      console.log('Memory monitor is already running');
      return;
    }

    console.log(`Starting memory monitoring (interval: ${intervalMs}ms)`);
    this.isRunning = true;
    this.measurements = [];

    this.interval = setInterval(() => {
      const memUsage = process.memoryUsage();
      const measurement = {
        timestamp: Date.now(),
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
      };

      this.measurements.push(measurement);

      // Log current usage
      console.log(
        `Memory: RSS=${this.formatBytes(memUsage.rss)} ` +
          `Heap=${this.formatBytes(memUsage.heapUsed)}/${this.formatBytes(memUsage.heapTotal)} ` +
          `External=${this.formatBytes(memUsage.external)}`
      );

      // Trigger garbage collection if available (for debugging)
      if (global.gc && memUsage.heapUsed > 50 * 1024 * 1024) {
        console.log('Triggering garbage collection...');
        global.gc();
      }
    }, intervalMs);
  }

  // Stop monitoring
  stop() {
    if (!this.isRunning) {
      console.log('Memory monitor is not running');
      return;
    }

    clearInterval(this.interval);
    this.isRunning = false;
    console.log('Memory monitoring stopped');

    // Generate report
    this.generateReport();
  }

  // Format bytes to human readable format
  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // Generate memory usage report
  generateReport() {
    if (this.measurements.length === 0) {
      console.log('No measurements to report');
      return;
    }

    const report = {
      totalMeasurements: this.measurements.length,
      duration:
        this.measurements[this.measurements.length - 1].timestamp -
        this.measurements[0].timestamp,
      peak: {
        rss: Math.max(...this.measurements.map((m) => m.rss)),
        heapTotal: Math.max(...this.measurements.map((m) => m.heapTotal)),
        heapUsed: Math.max(...this.measurements.map((m) => m.heapUsed)),
        external: Math.max(...this.measurements.map((m) => m.external)),
      },
      average: {
        rss: Math.round(
          this.measurements.reduce((sum, m) => sum + m.rss, 0) /
            this.measurements.length
        ),
        heapTotal: Math.round(
          this.measurements.reduce((sum, m) => sum + m.heapTotal, 0) /
            this.measurements.length
        ),
        heapUsed: Math.round(
          this.measurements.reduce((sum, m) => sum + m.heapUsed, 0) /
            this.measurements.length
        ),
        external: Math.round(
          this.measurements.reduce((sum, m) => sum + m.external, 0) /
            this.measurements.length
        ),
      },
    };

    console.log('\n=== Memory Usage Report ===');
    console.log(`Duration: ${Math.round(report.duration / 1000)}s`);
    console.log(`Measurements: ${report.totalMeasurements}`);
    console.log('\nPeak Usage:');
    console.log(`  RSS: ${this.formatBytes(report.peak.rss)}`);
    console.log(`  Heap Total: ${this.formatBytes(report.peak.heapTotal)}`);
    console.log(`  Heap Used: ${this.formatBytes(report.peak.heapUsed)}`);
    console.log(`  External: ${this.formatBytes(report.peak.external)}`);
    console.log('\nAverage Usage:');
    console.log(`  RSS: ${this.formatBytes(report.average.rss)}`);
    console.log(`  Heap Total: ${this.formatBytes(report.average.heapTotal)}`);
    console.log(`  Heap Used: ${this.formatBytes(report.average.heapUsed)}`);
    console.log(`  External: ${this.formatBytes(report.average.external)}`);

    // Save detailed report to file
    const reportPath = path.join(process.cwd(), 'memory-report.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          report,
          measurements: this.measurements,
        },
        null,
        2
      )
    );

    console.log(`\nDetailed report saved to: ${reportPath}`);
  }
}

// Create monitor instance
const monitor = new MemoryMonitor();

// Handle process signals
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, stopping memory monitor...');
  monitor.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, stopping memory monitor...');
  monitor.stop();
  process.exit(0);
});

// Start monitoring if run directly
if (require.main === module) {
  const interval = process.argv[2] ? parseInt(process.argv[2]) : 1000;
  console.log('Memory Monitor for DocsShelf');
  console.log('Press Ctrl+C to stop monitoring and generate report');
  console.log(
    'Run with --expose-gc flag to enable garbage collection triggering\n'
  );

  monitor.start(interval);
}

module.exports = MemoryMonitor;
