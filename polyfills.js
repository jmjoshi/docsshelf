// Essential polyfills for React Native libraries in web environment
// This file MUST be loaded before any React Native modules

// setImmediate polyfill - critical for react-native-sqlite-storage
(function () {
  function setImmediatePolyfill(callback, ...args) {
    return setTimeout(function () {
      callback.apply(null, args);
    }, 0);
  }

  function clearImmediatePolyfill(id) {
    return clearTimeout(id);
  }

  // Make setImmediate globally available in ALL possible contexts
  var setImmediateFn = setImmediatePolyfill;
  var clearImmediateFn = clearImmediatePolyfill;

  // Set in global scope (Node.js style)
  if (typeof global !== 'undefined') {
    global.setImmediate = setImmediateFn;
    global.clearImmediate = clearImmediateFn;
  }

  // Set in window scope (Browser)
  if (typeof window !== 'undefined') {
    window.setImmediate = setImmediateFn;
    window.clearImmediate = clearImmediateFn;
  }

  // Set in self scope (Web Workers)
  if (typeof self !== 'undefined') {
    self.setImmediate = setImmediateFn;
    self.clearImmediate = clearImmediateFn;
  }

  // Set directly in current scope
  if (typeof setImmediate === 'undefined') {
    this.setImmediate = setImmediateFn;
    this.clearImmediate = clearImmediateFn;
  }

  // Also set as properties of globalThis if available
  if (typeof globalThis !== 'undefined') {
    globalThis.setImmediate = setImmediateFn;
    globalThis.clearImmediate = clearImmediateFn;
  }
})();

// _interopRequireDefault polyfill
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
