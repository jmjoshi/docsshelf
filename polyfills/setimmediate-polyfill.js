// Polyfill for setImmediate in browsers
if (typeof setImmediate === 'undefined') {
  global.setImmediate = function (callback, ...args) {
    return setTimeout(() => callback(...args), 0);
  };
}

if (typeof clearImmediate === 'undefined') {
  global.clearImmediate = function (id) {
    clearTimeout(id);
  };
}

// Also add to window for browser compatibility
if (typeof window !== 'undefined') {
  if (!window.setImmediate) {
    window.setImmediate = global.setImmediate;
  }
  if (!window.clearImmediate) {
    window.clearImmediate = global.clearImmediate;
  }
}
