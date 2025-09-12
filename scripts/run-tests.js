#!/usr/bin/env node

// Comprehensive Test Runner for DocsShelf
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      coverage: 0,
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m',
    };
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  runCommand(command, description) {
    try {
      this.log(`Running: ${description}`, 'info');
      const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      this.log(`${description} completed successfully`, 'success');
      return result;
    } catch (_error) {
      this.log(`${description} failed: ${_error.message}`, 'error');
      throw _error;
    }
  }

  runUnitTests() {
    this.log('Starting Unit Tests...', 'info');

    try {
      // Run all unit tests with coverage
      const result = this.runCommand(
        'npx jest --testPathPatterns="__tests__/**/*.test.(ts|tsx)" --testPathPatterns="!__tests__/integration.test.(ts|tsx)" --testPathPatterns="!__tests__/performance.test.(ts|tsx)" --testPathPatterns="!__tests__/components.test.(ts|tsx)" --coverage --coverageDirectory=coverage/unit',
        'Unit Tests'
      );

      // Parse test results
      const testSummary = result.match(
        /Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed/
      );
      if (testSummary) {
        this.testResults.passed += parseInt(testSummary[1]);
        this.testResults.failed += parseInt(testSummary[2]);
        this.testResults.total +=
          this.testResults.passed + this.testResults.failed;
      }

      return true;
    } catch {
      this.log('Unit tests failed', 'error');
      return false;
    }
  }

  runIntegrationTests() {
    this.log('Starting Integration Tests...', 'info');

    try {
      this.runCommand(
        'npx jest --testPathPatterns="__tests__/integration.test.(ts|tsx)" --coverage --coverageDirectory=coverage/integration',
        'Integration Tests'
      );

      return true;
    } catch {
      this.log('Integration tests failed', 'error');
      return false;
    }
  }

  runPerformanceTests() {
    this.log('Starting Performance Tests...', 'info');

    try {
      this.runCommand(
        'npx jest --testPathPatterns="__tests__/performance.test.(ts|tsx)" --coverage --coverageDirectory=coverage/performance',
        'Performance Tests'
      );

      return true;
    } catch {
      this.log('Performance tests failed', 'error');
      return false;
    }
  }

  runComponentTests() {
    this.log('Starting Component Tests...', 'info');

    try {
      this.runCommand(
        'npx jest --testPathPatterns="__tests__/components.test.(ts|tsx)" --coverage --coverageDirectory=coverage/components',
        'Component Tests'
      );

      return true;
    } catch {
      this.log('Component tests failed', 'error');
      return false;
    }
  }

  generateCoverageReport() {
    this.log('Generating Coverage Report...', 'info');

    try {
      // Use nyc for coverage reporting instead of istanbul
      this.runCommand(
        'npx nyc report --reporter=html --report-dir=coverage/combined',
        'Generate HTML Coverage Report'
      );

      this.log(
        'Coverage report generated at: coverage/combined/index.html',
        'success'
      );
      return true;
    } catch {
      this.log('Failed to generate coverage report, continuing...', 'warning');
      return false;
    }
  }

  validateCoverage() {
    this.log('Validating Test Coverage...', 'info');

    try {
      // Read coverage summary
      const coveragePath = path.join(
        process.cwd(),
        'coverage',
        'unit',
        'coverage-summary.json'
      );

      if (fs.existsSync(coveragePath)) {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        const totalCoverage = coverageData.total;

        this.log(`Coverage Summary:`, 'info');
        this.log(
          `  Statements: ${totalCoverage.statements.pct}%`,
          totalCoverage.statements.pct >= 80 ? 'success' : 'warning'
        );
        this.log(
          `  Branches: ${totalCoverage.branches.pct}%`,
          totalCoverage.branches.pct >= 75 ? 'success' : 'warning'
        );
        this.log(
          `  Functions: ${totalCoverage.functions.pct}%`,
          totalCoverage.functions.pct >= 80 ? 'success' : 'warning'
        );
        this.log(
          `  Lines: ${totalCoverage.lines.pct}%`,
          totalCoverage.lines.pct >= 80 ? 'success' : 'warning'
        );

        // Validate against 80% target
        const meetsTarget =
          totalCoverage.statements.pct >= 80 &&
          totalCoverage.functions.pct >= 80 &&
          totalCoverage.lines.pct >= 80;

        if (meetsTarget) {
          this.log('✅ Test coverage meets 80% target!', 'success');
          return true;
        } else {
          this.log('❌ Test coverage below 80% target', 'error');
          return false;
        }
      } else {
        this.log('Coverage file not found', 'warning');
        return false;
      }
    } catch {
      this.log('Failed to validate coverage', 'error');
      return false;
    }
  }

  runAllTests() {
    this.log('🚀 Starting Comprehensive Test Suite for DocsShelf', 'info');
    this.log('='.repeat(60), 'info');

    const startTime = Date.now();
    let allPassed = true;

    try {
      // Run all test suites
      allPassed &= this.runUnitTests();
      allPassed &= this.runIntegrationTests();
      allPassed &= this.runComponentTests();
      allPassed &= this.runPerformanceTests();

      // Generate and validate coverage
      this.generateCoverageReport();
      const coverageValid = this.validateCoverage();

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      this.log('='.repeat(60), 'info');
      this.log(`Test Summary:`, 'info');
      this.log(`  Total Tests: ${this.testResults.total}`, 'info');
      this.log(`  Passed: ${this.testResults.passed}`, 'success');
      this.log(
        `  Failed: ${this.testResults.failed}`,
        this.testResults.failed > 0 ? 'error' : 'info'
      );
      this.log(`  Duration: ${duration}s`, 'info');
      this.log(
        `  Coverage Target Met: ${coverageValid ? '✅' : '❌'}`,
        coverageValid ? 'success' : 'error'
      );

      if (allPassed && coverageValid) {
        this.log('🎉 All tests passed! Ready for production.', 'success');
        process.exit(0);
      } else {
        this.log('❌ Some tests failed or coverage target not met.', 'error');
        process.exit(1);
      }
    } catch {
      this.log('Test suite failed with an unknown error', 'error');
      process.exit(1);
    }
  }
}

// Run the test suite
const runner = new TestRunner();
runner.runAllTests();
