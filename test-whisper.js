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
    
    // Generate "Hello" spoken? No, let's just generate a 440Hz sine wave. It should just say "Ahhhh" or something.
    // Let's actually use an existing wav file if there is one. Is there a public/test.wav?
    
    // Let's create an Int16Array
    const sampleRate = 16000;
    const duration = 2; // 2 seconds
    const pcm = new Int16Array(sampleRate * duration);
    const f32 = new Float32Array(sampleRate * duration);
    for(let i=0; i<pcm.length; i++) {
        const val = Math.sin(2 * Math.PI * 440 * i / sampleRate);
        pcm[i] = val < 0 ? val * 0x8000 : val * 0x7FFF;
        f32[i] = val;
    }
    
    try {
        console.log("Transcribing Float32Array...");
        const res1 = await ctx.transcribeData(f32, { language: 'en' }).promise;
        console.log("Float32 result:", res1.result);
    } catch(e) { console.error("Float32 failed", e); }
    
    try {
        console.log("Transcribing Int16Array...");
        const res2 = await ctx.transcribeData(pcm, { language: 'en' }).promise;
        console.log("Int16 result:", res2.result);
    } catch(e) { console.error("Int16 failed", e); }
}

test();
