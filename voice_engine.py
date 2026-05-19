import sys
import json
import pyaudio
import threading
import numpy as np
from faster_whisper import WhisperModel
import time
import re
import os
import glob

sys.stdout.reconfigure(line_buffering=True)

def emit(event_dict):
    print(json.dumps(event_dict))
    sys.stdout.flush()

emit({"event": "log", "message": "Initializing Python Voice Engine..."})

# 1. Load config.json if available to extract wake word engine configuration
config_path = os.path.join(os.path.dirname(__file__), 'config.json')
use_openwakeword = False
oww_model = None

if os.path.exists(config_path):
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
            # If the user specifies openwakeword engine, boot it!
            if config.get("engine", "whisper") == "openwakeword":
                use_openwakeword = True
    except Exception as e:
        emit({"event": "log", "message": f"Error loading config.json: {str(e)}"})

# 2. Try to initialize openWakeWord if configured
if use_openwakeword:
    try:
        from openwakeword.model import Model
        
        # Scan for custom trained keyword files (.onnx) in the wakeword_models folder
        keywords_dir = os.path.join(os.path.dirname(__file__), 'wakeword_models')
        os.makedirs(keywords_dir, exist_ok=True)
        keyword_files = glob.glob(os.path.join(keywords_dir, '*.onnx'))
        
        if keyword_files:
            oww_model = Model(
                wakeword_model_paths=keyword_files,
                inference_framework="onnx"
            )
            emit({"event": "log", "message": f"openWakeWord loaded successfully with {len(keyword_files)} custom keyword models."})
        else:
            # Fallback to built-in keywords (hey_jarvis, alexa) if no custom models are provided yet
            oww_model = Model(
                wakeword_models=["hey_jarvis", "alexa"],
                inference_framework="onnx"
            )
            emit({"event": "log", "message": "openWakeWord loaded with built-in keywords: 'hey_jarvis', 'alexa'. Place your custom .onnx files in 'wakeword_models/' to use them."})
    except Exception as e:
        emit({"event": "log", "message": f"Failed to initialize openWakeWord: {str(e)}. Falling back to local Whisper VAD engine."})
        use_openwakeword = False

# 3. Initialize Faster-Whisper and Silero VAD Models
try:
    model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
    emit({"event": "log", "message": "Faster-Whisper Model loaded successfully."})
    
    from faster_whisper.vad import get_vad_model
    vad_model = get_vad_model()
    emit({"event": "log", "message": "Silero VAD Model loaded successfully."})
except Exception as e:
    emit({"event": "error", "message": f"Failed to load Faster-Whisper/VAD model: {str(e)}"})
    sys.exit(1)

class StreamingVAD:
    def __init__(self, session):
        self.session = session
        self.reset()
        
    def reset(self):
        # Silero VAD v4 hidden & cell states: shape (1, 1, 128)
        self.h = np.zeros((1, 1, 128), dtype="float32")
        self.c = np.zeros((1, 1, 128), dtype="float32")
        # rolling receptive context context window: 64 samples
        self.context = np.zeros((1, 64), dtype="float32")
        
    def process_chunk(self, audio_chunk):
        # audio_chunk should be a 1D float32 numpy array of size 512
        assert audio_chunk.shape[0] == 512
        
        # Prepare context and chunk
        chunk_with_context = np.concatenate([self.context[0], audio_chunk])
        chunk_with_context = chunk_with_context.reshape(1, 576)
        
        # Update context
        self.context = audio_chunk[-64:].reshape(1, 64)
        
        # Run model session
        output, hn, cn = self.session.run(
            None,
            {"input": chunk_with_context, "h": self.h, "c": self.c}
        )
        
        # Update states
        self.h = hn
        self.c = cn
        
        return float(output[0])

# Background thread to listen to non-blocking commands from Electron (e.g. MUTE/UNMUTE during speech playback)
muted = False

def stdin_listener():
    global muted
    for line in sys.stdin:
        cmd = line.strip().upper()
        if cmd == "MUTE":
            muted = True
            # Flush active speech frames immediately
            global active_speech_frames, active_speech_started, consecutive_speech_seconds, silence_seconds
            active_speech_started = False
            active_speech_frames = []
            consecutive_speech_seconds = 0.0
            silence_seconds = 0.0
        elif cmd == "UNMUTE":
            muted = False

threading.Thread(target=stdin_listener, daemon=True).start()

# 4. Audio Configuration
SAMPLE_RATE = 16000
VAD_CHUNK = 512  # 32ms at 16kHz
OWW_CHUNK = 1280 # openWakeWord chunk size (80ms)

def calculate_rms(frame_bytes):
    audio_data = np.frombuffer(frame_bytes, dtype=np.int16)
    return np.sqrt(np.mean(audio_data.astype(np.float32)**2))

try:
    p = pyaudio.PyAudio()

    # Find macOS Built-in Microphone or fallback to default
    device_index = None
    default_device_info = p.get_default_input_device_info()
    device_name = default_device_info.get("name")

    for i in range(p.get_device_count()):
        info = p.get_device_info_by_index(i)
        if info.get('maxInputChannels') > 0:
            if 'MacBook' in info.get('name') and 'Microphone' in info.get('name'):
                device_index = i
                device_name = info.get('name')
                break

    emit({"event": "log", "message": f"Using Audio Input: {device_name}"})

    # Open dynamic stream
    stream = p.open(format=pyaudio.paInt16,
                    channels=1,
                    rate=SAMPLE_RATE,
                    input=True,
                    input_device_index=device_index,
                    frames_per_buffer=1024) # larger buffer prevents overflow
except KeyboardInterrupt:
    emit({"event": "log", "message": "Exiting during initialization..."})
    sys.exit(0)
except Exception as e:
    emit({"event": "error", "message": f"Microphone error: {str(e)}"})
    sys.exit(1)

def is_wake_word(text):
    text = text.lower().strip()
    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)
    
    # Ignore Whisper repetitive hallucinations
    words = text.split()
    for w in set(words):
        if words.count(w) >= 3:
            return False
            
    # Variations of Pihu itself
    pihu_variations = r'(pihu|pewho|peehoo|pee\s+who|pee\s+whoo|peewhoo|pehu|peehu|pi\s+hu|peewhu)'
    
    # Direct phonetic matches for Whisper hallucinations of "Pihu"
    hallucinations = [
        r'\bhype\s+you\b',
        r'\bhigh\s+view\b',
        r'\bhope\s+you\b',
        r'\bbehold\b',
        r'\btype\s+b1\b',
        r'\bhow\s+do\s+you\s+hear\b',
        r'\bill\s+beat\s+you\b',
        r'\bi\s+feel\b',
        r'\bthank\s+you\b',
    ]
    
    # Check if the text matches either "pihu" variants on their own or with a greeting
    pattern = rf'\b(hey|okay|ok|hello|hi|wake\s+up|good\s+morning)?\s*{pihu_variations}\b'
    
    # Also handle "hey people" or "hi people" as a likely mis-transcription of "hey pihu"
    mis_transcriptions = r'\b(hey|okay|ok|hello|hi|wake\s+up)\s+(people|pear|peer)\b'
    
    if bool(re.search(pattern, text)) or bool(re.search(mis_transcriptions, text)):
        return True
        
    for hal in hallucinations:
        if bool(re.search(hal, text)):
            return True
            
    return False

emit({"event": "log", "message": "Listening..."})

# Initialize VAD tracking variables
streaming_vad = StreamingVAD(vad_model.session)
WAKE_MODE = False

active_speech_started = False
active_speech_frames = []
active_start_time = 0.0
silence_seconds = 0.0
consecutive_speech_seconds = 0.0

standby_speech_started = False
standby_speech_frames = []
standby_silence_seconds = 0.0
standby_speech_seconds = 0.0

# Calibrate background noise floor (useful for fallback clap detection)
emit({"event": "log", "message": "Calibrating background noise floor..."})
bg_rms_values = []
for _ in range(int(200 / 32)): # 200ms calibration
    frame = stream.read(VAD_CHUNK, exception_on_overflow=False)
    bg_rms_values.append(calculate_rms(frame))
bg_rms = min(300, float(np.mean(bg_rms_values))) # Cap background noise to prevent unreachable thresholds
emit({"event": "calibration_complete", "rms": bg_rms})
emit({"event": "log", "message": f"Calibration complete. Background RMS: {bg_rms:.2f}"})

try:
    while True:
        # Determine chunk size dynamically based on current state
        if WAKE_MODE:
            current_chunk = VAD_CHUNK
        else:
            current_chunk = OWW_CHUNK if use_openwakeword else VAD_CHUNK
        
        frame = stream.read(current_chunk, exception_on_overflow=False)
        
        # If the engine is muted (TTS speaking), discard the audio to prevent self-feedback
        if muted:
            active_speech_started = False
            active_speech_frames = []
            consecutive_speech_seconds = 0.0
            silence_seconds = 0.0
            continue
            
        rms = calculate_rms(frame)
        
        # --- A: Standby Mode (Listening for Wake Word) ---
        if not WAKE_MODE:
            if use_openwakeword:
                # 1. Process via openWakeWord (high-accuracy, open-source ONNX model)
                audio_np = np.frombuffer(frame, dtype=np.int16)
                
                # Check that audio has the exact chunk size needed (1280)
                if len(audio_np) == OWW_CHUNK:
                    prediction = oww_model.predict(audio_np)
                    
                    # Check if any wake word triggered with score > 0.5
                    triggered = False
                    triggered_word = ""
                    for wakeword, score in prediction.items():
                        if score > 0.5:
                            triggered = True
                            triggered_word = wakeword
                            break
                    
                    if triggered:
                        emit({"event": "log", "message": f"openWakeWord detected wake trigger: '{triggered_word}'"})
                        WAKE_MODE = True
                        emit({"event": "waking", "text": f"Wake Word: {triggered_word}"})
                        
                        # Initialize active streaming variables
                        streaming_vad.reset()
                        active_speech_started = False
                        active_speech_frames = []
                        active_start_time = time.time()
                        silence_seconds = 0.0
                        consecutive_speech_seconds = 0.0
                        continue
            else:
                # 2. Process via Fallback Clap & Stateful Silero VAD
                # Clap detection (very high RMS spike)
                clap_threshold = max(6000, bg_rms * 6)
                if rms > clap_threshold:
                    emit({"event": "log", "message": f"Clap/Loud noise detected! (RMS: {rms:.2f})"})
                    WAKE_MODE = True
                    emit({"event": "waking", "text": "Clap detected"})
                    
                    # Initialize active streaming variables
                    streaming_vad.reset()
                    active_speech_started = False
                    active_speech_frames = []
                    active_start_time = time.time()
                    silence_seconds = 0.0
                    consecutive_speech_seconds = 0.0
                    continue
                
                # Dynamic Silero VAD check for fallback speech wake word
                audio_np = np.frombuffer(frame, dtype=np.int16).astype(np.float32) / 32768.0
                if len(audio_np) == VAD_CHUNK:
                    prob = streaming_vad.process_chunk(audio_np)
                    
                    if not standby_speech_started:
                        if prob > 0.55:
                            standby_speech_seconds += 0.032
                            if standby_speech_seconds >= 0.25: # validated human speech (250ms)
                                standby_speech_started = True
                                standby_speech_frames = [frame]
                                standby_silence_seconds = 0.0
                        else:
                            standby_speech_seconds = max(0.0, standby_speech_seconds - 0.032)
                    else:
                        standby_speech_frames.append(frame)
                        if prob > 0.45:
                            standby_silence_seconds = 0.0
                        else:
                            standby_silence_seconds += 0.032
                            
                            # Max 2.5 seconds of wake speech, or 0.6 seconds of trailing silence
                            if standby_silence_seconds >= 0.6 or len(standby_speech_frames) >= 78:
                                standby_speech_started = False
                                standby_speech_seconds = 0.0
                                
                                audio_data = b''.join(standby_speech_frames)
                                standby_speech_frames = []
                                
                                # Validate RMS level of the captured speech before transcribing!
                                rms_val = calculate_rms(audio_data)
                                if rms_val < max(280, bg_rms * 1.7):
                                    emit({"event": "log", "message": f"Standby VAD: Discarding quiet segment (RMS: {rms_val:.2f} < threshold)"})
                                    continue
                                    
                                audio_np_full = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
                                if len(audio_np_full) > SAMPLE_RATE * 0.6: # At least 600ms
                                    segments, info = model.transcribe(
                                        audio_np_full, 
                                        beam_size=1, # Greedy wake word decoding is ultra fast!
                                        vad_filter=True,
                                        initial_prompt="Hey Pihu, okay pihu, hello pihu, peehoo, peewhoo, hey peewhu"
                                    )
                                    text = " ".join([segment.text for segment in segments]).strip()
                                    if text and is_wake_word(text):
                                        emit({"event": "log", "message": f"Whisper wake word detected: {text}"})
                                        WAKE_MODE = True
                                        emit({"event": "waking", "text": text})
                                        
                                        # Initialize active streaming variables
                                        streaming_vad.reset()
                                        active_speech_started = False
                                        active_speech_frames = []
                                        active_start_time = time.time()
                                        silence_seconds = 0.0
                                        consecutive_speech_seconds = 0.0
        
        # --- B: Active Mode (Dynamic Endpoint VAD Streaming) ---
        else:
            # Convert incoming active frame to float32
            audio_np = np.frombuffer(frame, dtype=np.int16).astype(np.float32) / 32768.0
            
            if len(audio_np) == VAD_CHUNK:
                prob = streaming_vad.process_chunk(audio_np)
                
                # Case 1: Speech has not started yet
                if not active_speech_started:
                    # Check safety active idle timeout (5.0 seconds of no speech since wake trigger)
                    elapsed_since_wake = time.time() - active_start_time
                    if elapsed_since_wake > 5.0:
                        emit({"event": "log", "message": "Disarming active mode: No speech detected for 5.0 seconds."})
                        WAKE_MODE = False
                        continue
                    
                    # Accumulate speech frames if probability is high
                    if prob > 0.55:
                        consecutive_speech_seconds += 0.032
                        if consecutive_speech_seconds >= 0.2: # verified speech start (200ms)
                            active_speech_started = True
                            emit({"event": "log", "message": f"Silero VAD: Speech confirmed (prob: {prob:.2f})"})
                            emit({"event": "speech_start"})
                            active_speech_frames = [frame]
                            silence_seconds = 0.0
                    else:
                        consecutive_speech_seconds = max(0.0, consecutive_speech_seconds - 0.032)
                
                # Case 2: User is actively speaking
                else:
                    active_speech_frames.append(frame)
                    
                    # Track trailing pauses vs continued speech
                    if prob > 0.45:
                        silence_seconds = 0.0
                    else:
                        silence_seconds += 0.032
                        
                        # Dynamic speech endpoint triggered if silence exceeds 1.2 seconds
                        # Or safe maximum capture limit reached (10.0 seconds)
                        if silence_seconds >= 1.2 or len(active_speech_frames) >= 312:
                            active_speech_started = False
                            emit({"event": "speech_end"})
                            emit({"event": "log", "message": f"Silero VAD: End of speech detected ({silence_seconds:.1f}s silence). Transcribing..."})
                            
                            audio_data = b''.join(active_speech_frames)
                            active_speech_frames = []
                            
                            # Validate RMS level of active command segment
                            rms_val = calculate_rms(audio_data)
                            if rms_val < max(250, bg_rms * 1.4):
                                emit({"event": "log", "message": f"Active VAD: Discarding quiet command segment (RMS: {rms_val:.2f})"})
                                WAKE_MODE = False
                                continue
                                
                            audio_np_full = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
                            
                            if len(audio_np_full) > SAMPLE_RATE * 0.5:
                                segments, info = model.transcribe(
                                    audio_np_full, 
                                    beam_size=3, # Beam size 3 for accurate command recognition
                                    vad_filter=True,
                                    initial_prompt="Hey Pihu, okay pihu, hello pihu, peehoo, peewhoo, hey peewhu"
                                )
                                text = " ".join([segment.text for segment in segments]).strip()
                                
                                if text:
                                    emit({"event": "command", "text": text})
                                else:
                                    emit({"event": "log", "message": "Whisper heard nothing. Returning to standby."})
                            else:
                                emit({"event": "log", "message": "Audio duration too short. Discarding."})
                            
                            # Disarm active mode and go back to standby wake monitoring
                            WAKE_MODE = False

except KeyboardInterrupt:
    emit({"event": "log", "message": "Exiting..."})
finally:
    stream.stop_stream()
    stream.close()
    p.terminate()
