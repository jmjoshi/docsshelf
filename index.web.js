// Load critical polyfills FIRST - before any other imports
if (typeof setImmediate === 'undefined') {
  global.setImmediate = function (callback, ...args) {
    return setTimeout(() => callback.apply(null, args), 0);
  };
  global.clearImmediate = function (id) {
    return clearTimeout(id);
  };
  if (typeof window !== 'undefined') {
    window.setImmediate = global.setImmediate;
    window.clearImmediate = global.clearImmediate;
  }
}

import './polyfills';
import { registerRootComponent } from 'expo';

import App from './App';

// Register the main component
registerRootComponent(App);
