// Browser polyfill for Buffer
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Browser polyfill for process
if (typeof process === 'undefined') {
  global.process = {
    browser: true,
    env: { NODE_ENV: 'development' },
    version: '',
    versions: {},
    on: function () {},
    addListener: function () {},
    once: function () {},
    off: function () {},
    removeListener: function () {},
    removeAllListeners: function () {},
    emit: function () {},
    binding: function () {
      throw new Error('process.binding is not supported');
    },
    cwd: function () {
      return '/';
    },
    chdir: function () {
      throw new Error('process.chdir is not supported');
    },
    umask: function () {
      return 0;
    },
  };
}
