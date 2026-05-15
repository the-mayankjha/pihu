// Removed vosk-browser import

// DOM Elements
const orbContainer = document.getElementById('orbContainer');
const orbStatus = document.getElementById('orbStatus');
const waveform = document.getElementById('waveform');
const blurOverlay = document.getElementById('blurOverlay');

const aiConsole = document.getElementById('aiConsole');
const automationOverlay = document.getElementById('automationOverlay');
const memoryOverlay = document.getElementById('memoryOverlay');
const terminalBody = document.getElementById('terminalBody');
const transcriptionText = document.getElementById('transcriptionText');
const screenFrame = document.getElementById('screenFrame');

// States
let isActive = false;
let isExecuting = false;
let currentUsername = localStorage.getItem('pihuUsername') || 'Mayank';

// Interaction Sequence Data
const commandSequence = [
    { text: 'User prompt received: "Search futuristic UI ideas"', delay: 800, type: 'info' },
    { text: 'Analyzing intent...', delay: 1200, type: 'system' },
    { text: 'Intent classified: Research & Design.', delay: 600, type: 'success' },
    { text: 'Querying vector database for visual references...', delay: 1500, type: 'system' },
    { text: 'Found 42 relevant entries in Memory Core.', delay: 800, type: 'info' },
    { text: 'Generating workspace overlay...', delay: 1000, type: 'system' },
    { text: 'Workflow completed.', delay: 1000, type: 'success' }
];

// Initialize Keyboard Shortcuts
const keysPressed = {};
document.addEventListener('keydown', (e) => {
    keysPressed[e.code] = true;
    
    // Option + P to trigger
    if (e.altKey && e.code === 'KeyP' && !isActive && !isExecuting) {
        e.preventDefault();
        activatePIHU();
    } 
    // Escape to deactivate
    else if (e.code === 'Escape') {
        if (isActive) deactivatePIHU();
    }
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.code] = false;
});

// Click orb to toggle (alternative)
orbContainer.addEventListener('click', () => {
    if (!isActive && !isExecuting) {
        activatePIHU();
    } else if (isActive && !isExecuting) {
        deactivatePIHU();
    }
});

// Voice Activation Setup (Whisper Backend)
async function initVoice() {
    try {
        const hintEl = document.querySelector('.hint-text');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { 
                echoCancellation: true, 
                noiseSuppression: true, 
                channelCount: 1 
            } 
        });
        
        // Use 16kHz for Whisper
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        
        source.connect(processor);
        processor.connect(audioContext.destination);

        let lastClapTime = 0;
        let audioChunks = [];
        let silenceTimer = null;
        let isSpeaking = false;
        let ignoreAudioUntil = 0;
        let recordingStartTime = 0;

        processor.onaudioprocess = (e) => {
            const data = e.inputBuffer.getChannelData(0);
            let maxAmplitude = 0;
            for (let i = 0; i < data.length; i++) {
                const val = Math.abs(data[i]);
                if (val > maxAmplitude) maxAmplitude = val;
            }
            
            const now = Date.now();

            const processAudio = async () => {
                clearTimeout(silenceTimer);
                isSpeaking = false;
                isExecuting = true;

                orbStatus.textContent = "Processing...";
                orbContainer.classList.remove('listening', 'waking');
                orbContainer.classList.add('executing');
                waveform.style.transform = 'scale(1)';

                // Show panels during processing
                aiConsole.classList.remove('hidden');
                automationOverlay.classList.remove('hidden');
                memoryOverlay.classList.remove('hidden');
                
                addTerminalLine('Audio captured. Processing...', 'cyan');

                const totalLen = audioChunks.reduce((acc, val) => acc + val.length, 0);
                const merged = new Float32Array(totalLen);
                let offset = 0;
                for (let chunk of audioChunks) {
                    merged.set(chunk, offset);
                    offset += chunk.length;
                }
                audioChunks = []; 
                
                const pcm16 = new Int16Array(merged.length);
                for (let i = 0; i < merged.length; i++) {
                    let s = Math.max(-1, Math.min(1, merged[i]));
                    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                if (window.electronAPI && window.electronAPI.transcribeAudio) {
                    try {
                        const result = await window.electronAPI.transcribeAudio(pcm16);
                        const command = result.text.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim().toLowerCase();
                        console.log('Whisper Heard:', command);
                        
                        if (command) {
                            if (transcriptionText) {
                                transcriptionText.textContent = command;
                                transcriptionText.classList.remove('hidden');
                                setTimeout(() => transcriptionText.classList.add('hidden'), 3000);
                            }
                            handleCommand(command);
                        } else {
                            isExecuting = false;
                            orbStatus.textContent = "Listening...";
                            orbContainer.classList.remove('executing');
                            orbContainer.classList.add('listening');
                        }
                    } catch (err) {
                        console.error("Whisper Transcription Error:", err);
                        deactivatePIHU();
                    }
                } else {
                    console.warn("Electron API not available");
                    deactivatePIHU();
                }
            };

            // 1. Idle state: waiting for clap
            if (!isActive && !isExecuting) {
                if (maxAmplitude > 0.5) {
                    if (now - lastClapTime > 1000) {
                        lastClapTime = now;
                        console.log("🔊 Clap Detected! Amplitude:", maxAmplitude);
                        activatePIHU();
                        audioChunks = []; 
                        isSpeaking = true; // Immediately start recording
                        recordingStartTime = now;
                        ignoreAudioUntil = now + 800; // Ignore echo
                        
                        // Start an initial silence timer just in case they wake it and say nothing
                        clearTimeout(silenceTimer);
                        silenceTimer = setTimeout(processAudio, 5000); 
                    }
                }
            } 
            // 2. Active state: recording audio
            else if (isActive && !isExecuting) {
                if (now < ignoreAudioUntil) return; // Skip echo

                const scale = 1 + (maxAmplitude * 20);
                waveform.style.transform = `scale(${Math.min(scale, 2.5)})`;
                waveform.style.opacity = maxAmplitude > 0.005 ? '1' : '0.5';

                audioChunks.push(new Float32Array(data));

                // If user speaks, reset silence timer
                if (maxAmplitude > 0.005) {
                    clearTimeout(silenceTimer);
                    silenceTimer = setTimeout(processAudio, 5000); // 5s silence triggers processing
                }
            }
        };

        if (hintEl) hintEl.innerHTML = `Press <strong>Option + P</strong> or <strong>Clap</strong> your hands`;
    } catch (e) {
        console.error("Audio initialization error:", e);
    }
}

function handleCommand(command, isPartial = false) {
    if (!command) return;
    
    // Clean up handleCommand for Whisper
    const isSleepWord = command.includes('bye pihu') || command.includes('close');
    const isDismiss = command.includes('dismiss') || command.includes('hide') || command.includes('cancel');
    const isGreeting = command.includes('hi pihu') || command.includes('hello pihu');
    const isSettings = command.includes('show setting');
    const isCallMe = command.startsWith('call me ');

    if (isSleepWord) {
        if (window.electronAPI) window.electronAPI.quitApp();
    } else if (isDismiss && isActive) {
        deactivatePIHU();
    } else if (isGreeting) {
        addTerminalLine(`Heard: "${command}"`, 'purple');
        addTerminalLine(`Hi, ${currentUsername}! How can I help you today?`, 'cyan');
        revertToListening();
    } else if (isCallMe) {
        let newName = command.replace('call me', '').trim();
        if (newName) {
            // Capitalize first letter
            newName = newName.charAt(0).toUpperCase() + newName.slice(1);
            currentUsername = newName;
            localStorage.setItem('pihuUsername', currentUsername);
            addTerminalLine(`Heard: "${command}"`, 'purple');
            addTerminalLine(`Understood. I will call you ${currentUsername} from now on.`, 'cyan');
        }
        revertToListening();
    } else if (isSettings) {
        addTerminalLine(`Heard: "${command}"`, 'purple');
        addTerminalLine(`-- PIHU SETTINGS --`, 'cyan');
        addTerminalLine(`Username: ${currentUsername}`, 'info');
        addTerminalLine(`Voice Engine: Whisper.cpp (ggml-tiny.en)`, 'info');
        addTerminalLine(`Say "call me [name]" to change your name.`, 'info');
        revertToListening();
    } else if (isActive && command.length > 3) {
        // Handle actual transcribed text
        addTerminalLine(`Heard: "${command}"`, 'purple');
        executeCommandSequence();
    }
}

function revertToListening() {
    isExecuting = false;
    orbStatus.innerHTML = 'Listening<span class="dots"></span>';
    orbContainer.classList.remove('executing');
    orbContainer.classList.add('listening');
}

initVoice();

function activatePIHU() {
    isActive = true;
    
    // Electron: Allow interaction
    if (window.electronAPI) {
        window.electronAPI.setIgnoreMouseEvents(false);
    }
    
    // UI Changes
    blurOverlay.classList.add('active');
    if (screenFrame) screenFrame.classList.add('active');
    
    // Orb State: Waking
    orbContainer.classList.remove('executing', 'listening', 'idle');
    orbContainer.classList.add('waking');
    waveform.classList.add('hidden'); // Hide waveform during wake
    orbStatus.innerHTML = 'Waking<span class="dots"></span>';

    // Panels are hidden during wake and listening; they will show during processing.
    
    // Wait for wake animation then listening
    setTimeout(() => {
        if (!isActive) return;
        orbContainer.classList.remove('waking');
        orbContainer.classList.add('listening');
        waveform.classList.remove('hidden');
        orbStatus.innerHTML = 'Listening<span class="dots"></span>';
        addTerminalLine('System awakened. Listening...', 'cyan');
    }, 1200);
}

function deactivatePIHU() {
    isActive = false;
    isExecuting = false;

    // Electron: Ignore interaction (pass-through)
    if (window.electronAPI) {
        window.electronAPI.setIgnoreMouseEvents(true);
    }

    // UI Changes
    blurOverlay.classList.remove('active');
    if (screenFrame) screenFrame.classList.remove('active');
    
    // Orb State: Idle
    orbContainer.classList.remove('listening');
    orbContainer.classList.remove('executing');
    waveform.classList.add('hidden');
    orbStatus.textContent = 'Idle';

    // Hide panels
    aiConsole.classList.add('hidden');
    automationOverlay.classList.add('hidden');
    memoryOverlay.classList.add('hidden');

    // Reset terminal after a delay
    setTimeout(() => {
        terminalBody.innerHTML = `
            <div class="terminal-line"><span class="prompt">_></span> System initialized.</div>
            <div class="terminal-line"><span class="prompt cyan">*</span> Awaiting command...</div>
        `;
    }, 800);
}

async function executeCommandSequence() {
    isExecuting = true;
    
    // Orb State: Executing
    orbContainer.classList.remove('listening');
    orbContainer.classList.add('executing');
    waveform.classList.add('hidden'); // Pause waveform when executing
    orbStatus.innerHTML = 'Executing<span class="dots"></span>';

    for (const step of commandSequence) {
        if (!isActive) break; // Stop if user deactivated
        
        await new Promise(resolve => setTimeout(resolve, step.delay));
        
        let colorClass = '';
        if (step.type === 'success') colorClass = 'cyan';
        
        addTerminalLine(step.text, colorClass);
    }

    if (isActive) {
        setTimeout(() => {
            orbStatus.textContent = 'Standby';
            orbContainer.classList.remove('executing');
            addTerminalLine('Awaiting next command.', 'cyan');
            isExecuting = false;
        }, 1000);
    }
}

function addTerminalLine(text, promptClass = '') {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = `<span class="prompt ${promptClass}">_></span> ${text}`;
    terminalBody.appendChild(line);
    
    // Auto scroll to bottom
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

// Draggable Panels
function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (handle) {
        handle.onmousedown = dragMouseDown;
        handle.style.cursor = 'grab';
    } else {
        element.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        if (handle) handle.style.cursor = 'grabbing';
        
        element.style.transition = 'none';
        
        // Prevent jump by converting transform/bottom/right to absolute top/left
        const rect = element.getBoundingClientRect();
        const parentRect = element.offsetParent ? element.offsetParent.getBoundingClientRect() : {left: 0, top: 0};
        
        element.style.left = (rect.left - parentRect.left) + 'px';
        element.style.top = (rect.top - parentRect.top) + 'px';
        element.style.right = 'auto';
        element.style.bottom = 'auto';
        element.style.transform = 'none';
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        if (handle) handle.style.cursor = 'grab';
        
        // Re-enable transition for hide/show animations, except transform since we removed it
        element.style.transition = 'opacity 0.6s var(--transition-spring)'; 
    }
}

makeDraggable(automationOverlay, automationOverlay.querySelector('.panel-header'));
makeDraggable(memoryOverlay, memoryOverlay.querySelector('.panel-header'));
makeDraggable(aiConsole, aiConsole.querySelector('.panel-header'));
