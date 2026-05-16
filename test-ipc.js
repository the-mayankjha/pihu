const { Buffer } = require('buffer');
// Emulate what happens when ArrayBuffer crosses IPC (it usually becomes a Buffer or Uint8Array)
const f32 = new Float32Array([1.0, 0.5, -0.5, -1.0]);
const buf = Buffer.from(f32.buffer);
console.log(buf);
console.log(buf.length);

const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const f32_restored = new Float32Array(arrayBuffer);
console.log(f32_restored);
