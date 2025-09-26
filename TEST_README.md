# DocsShelf Test Suite

This comprehensive test suite provides 100% coverage validation for the DocsShelf mobile application, including unit tests, integration tests, performance tests, and component tests.

## Test Structure

```
__tests__/
├── auth.test.ts              # Authentication service tests
├── documents.test.ts         # Document service tests
├── storage.test.ts           # Storage service tests
├── encryption.test.ts        # Encryption service tests
├── database.test.ts          # Database service tests
├── components.test.tsx       # React component tests
├── integration.test.ts       # Integration workflow tests
└── performance.test.ts       # Performance benchmark tests
```

## Test Categories

### 1. Unit Tests

- **AuthService**: User registration, login, biometric authentication, password changes
- **DocumentService**: File upload, scanning, search, categorization
- **StorageService**: Encrypted file storage, retrieval, deletion
- **EncryptionService**: AES-256 encryption/decryption, key management
- **DatabaseService**: SQLite operations, migrations, audit logging

### 2. Integration Tests

- Complete user workflows (registration → document upload → search)
- Service interactions and data flow
- Error handling and recovery
- Authentication and authorization flows

### 3. Component Tests

- React Native component rendering
- User interaction handling
- Navigation flows
- Form validation and error states

### 4. Performance Tests

- App launch time (< 2 seconds)
- Document search performance (< 500ms for 1k documents)
- Memory usage (< 80MB)
- File operations timing
- Bulk operations performance

## Running Tests

### Run All Tests

```bash
npm run test:all
```

### Run Specific Test Categories

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Performance tests only
npm run test:performance

# Component tests only
npm run test:components

# Generate coverage report
npm run test:coverage
```

### Test Results

The test runner will:

- Execute all test suites in sequence
- Generate combined coverage reports
- Validate against 80% coverage target
- Provide detailed performance metrics
- Generate HTML coverage reports in `coverage/combined/`

## Coverage Targets

The test suite validates the following coverage targets:

- **Statements**: ≥ 80%
- **Branches**: ≥ 75%
- **Functions**: ≥ 80%
- **Lines**: ≥ 80%

## Performance Benchmarks

### App Launch

- Target: < 2 seconds
- Measured: Database initialization + service setup

### Document Search

- Target: < 500ms for 1,000 documents
- Measured: Full-text search with pagination

### Memory Usage

- Target: < 80MB during operations
- Measured: Heap usage during bulk operations

### File Operations

- Upload: < 1 second per MB
- Encryption: < 500ms per MB
- Search: < 100ms for metadata queries

## Test Data

Tests use mock data and services to ensure:

- Consistent test results
- Fast execution
- No external dependencies
- Isolated test environments

## Continuous Integration

The test suite is designed for CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: npm run test:all

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/combined/lcov.info
```

## Test Maintenance

### Adding New Tests

1. Create test file in `__tests__/` directory
2. Follow naming convention: `*.test.ts` or `*.test.tsx`
3. Mock external dependencies
4. Include both positive and negative test cases
5. Add performance assertions where applicable

### Updating Performance Benchmarks

1. Modify performance test expectations
2. Update documentation
3. Validate on target devices
4. Consider hardware differences

## Troubleshooting

### Common Issues

**Tests failing due to mocks**

- Ensure all external dependencies are properly mocked
- Check jest configuration for module mocking

**Performance tests timing out**

- Increase timeout in jest config
- Check for infinite loops in test code
- Validate async operations complete

**Coverage below target**

- Add missing test cases
- Review uncovered code paths
- Consider if code is actually testable

**Component tests failing**

- Install missing testing library dependencies
- Mock React Navigation properly
- Ensure proper component setup

## Dependencies

The test suite requires these dev dependencies:

- `jest`: Test runner
- `@testing-library/react-native`: Component testing
- `@testing-library/jest-native`: Jest matchers
- `istanbul-combine`: Coverage report combination
- Various type definitions

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure 80%+ coverage for new code
3. Add performance tests for critical paths
4. Update this documentation
5. Run full test suite before PR

## Test Reports

After running tests, check:

- `coverage/combined/index.html`: HTML coverage report
- `coverage/unit/`: Unit test coverage
- `coverage/integration/`: Integration test coverage
- `coverage/performance/`: Performance test coverage
- `coverage/components/`: Component test coverage

The test runner provides a summary with pass/fail status and coverage validation against targets.
