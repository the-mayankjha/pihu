const { initWhisper } = require('@fugood/whisper.node');
const path = require('path');
const fs = require('fs');

async function test() {
    const modelPath = path.join(__dirname, 'public', 'ggml-tiny.en.bin');
    if (!fs.existsSync(modelPath)) {
        console.log("Model not found!");
        return;
    }
    const ctx = await initWhisper({ filePath: modelPath });
    console.log("Init success. Testing transcription...");
    
    // Create 1 second of silence (16000 samples, 16-bit PCM = 32000 bytes)
    const pcm = new Int16Array(16000);
    
    // Also try Float32Array
    const f32 = new Float32Array(16000);

    try {
        console.log("Transcribing Float32Array buffer...");
        const res1 = await ctx.transcribeData(f32.buffer, { language: 'en' }).promise;
        console.log("Float32 result:", res1.result);
    } catch(e) { console.error("Float32 failed", e); }
    
    try {
        console.log("Transcribing Int16Array buffer...");
        const res2 = await ctx.transcribeData(pcm.buffer, { language: 'en' }).promise;
        console.log("Int16 result:", res2.result);
    } catch(e) { console.error("Int16 failed", e); }
}

test();
