// Polyfills for missing browser APIs
// Add setImmediate polyfill immediately to global scope
(function () {
  var setImmediatePolyfill = function (callback) {
    return setTimeout(callback, 0);
  };

  if (typeof setImmediate === 'undefined') {
    if (typeof global !== 'undefined') {
      global.setImmediate = setImmediatePolyfill;
    }
    if (typeof window !== 'undefined') {
      window.setImmediate = setImmediatePolyfill;
    }
    // Also set it in the current scope for immediate access
    if (typeof self !== 'undefined') {
      self.setImmediate = setImmediatePolyfill;
    }
  }
})();

if (typeof global !== 'undefined') {
  global._interopRequireDefault = function (obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  };
}

if (typeof window !== 'undefined') {
  window._interopRequireDefault = function (obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  };
}
