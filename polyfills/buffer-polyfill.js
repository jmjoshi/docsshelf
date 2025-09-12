// Buffer polyfill for web compatibility
import { Buffer as BufferPolyfill } from 'buffer';

// Ensure Buffer is available globally
if (typeof global !== 'undefined' && !global.Buffer) {
  global.Buffer = BufferPolyfill;
}

if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = BufferPolyfill;
}

// Export Buffer for direct imports
export { BufferPolyfill as Buffer };
export default BufferPolyfill;
