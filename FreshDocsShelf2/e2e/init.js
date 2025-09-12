const detox = require('detox');

const initSymbol = Object.getOwnPropertySymbols(detox).find(
  (s) => s.description === 'init'
);
const cleanupSymbol = Object.getOwnPropertySymbols(detox).find(
  (s) => s.description === 'cleanup'
);

jest.setTimeout(120000);

beforeAll(async () => {
  await detox[initSymbol]();
});

beforeEach(async () => {
  await detox.device.launchApp();
});

afterAll(async () => {
  await detox[cleanupSymbol]();
});
