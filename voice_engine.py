import sys
import json
import pyaudio
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

# 3. Initialize Faster-Whisper Model for high-accuracy local dictation
try:
    model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
    emit({"event": "log", "message": "Faster-Whisper Model loaded successfully."})
except Exception as e:
    emit({"event": "error", "message": f"Failed to load Faster-Whisper model: {str(e)}"})
    sys.exit(1)

# 4. Audio Configuration
SAMPLE_RATE = 16000
FRAME_DURATION_MS = 30
WHISPER_CHUNK = int(SAMPLE_RATE * FRAME_DURATION_MS / 1000) # 480 samples (30ms)

# openWakeWord operates on 1280 samples chunks (80ms at 16000Hz)
OWW_CHUNK = 1280

# Determine standby read size
STANDBY_CHUNK = OWW_CHUNK if use_openwakeword else WHISPER_CHUNK

def calculate_rms(frame_bytes):
    audio_data = np.frombuffer(frame_bytes, dtype=np.int16)
    return np.sqrt(np.mean(audio_data.astype(np.float32)**2))

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
try:
    stream = p.open(format=pyaudio.paInt16,
                    channels=1,
                    rate=SAMPLE_RATE,
                    input=True,
                    input_device_index=device_index,
                    frames_per_buffer=1024) # larger buffer prevents overflow
except Exception as e:
    emit({"event": "error", "message": f"Microphone error: {str(e)}"})
    sys.exit(1)

def is_wake_word(text):
    # Regex for Pihu variations
    text = text.lower().strip()
    return bool(re.search(r'\b(hey |hi |wake up |good morning |goodmorning )?(pihu|pewho|peehoo|pee who|pee-who|p\.i\.h\.u|pu|pee-whoo|peewhoo)\b', text))

emit({"event": "log", "message": "Listening..."})

frames = []
is_speaking = False
silence_counter = 0
SILENCE_LIMIT = 30 # ~0.9 seconds of silence triggers end of speech
WAKE_MODE = False

# Calibrate background noise floor (useful for fallback Whisper VAD)
emit({"event": "log", "message": "Calibrating background noise floor..."})
bg_rms_values = []
for _ in range(int(1000 / FRAME_DURATION_MS)):
    frame = stream.read(WHISPER_CHUNK, exception_on_overflow=False)
    bg_rms_values.append(calculate_rms(frame))
bg_rms = float(np.mean(bg_rms_values))
emit({"event": "calibration_complete", "rms": bg_rms})
emit({"event": "log", "message": f"Calibration complete. Background RMS: {bg_rms:.2f}"})

try:
    while True:
        # Determine chunk size dynamically based on current state
        # If we are in WAKE_MODE (capturing spoken command), we read WHISPER_CHUNK (480)
        # If we are in standby and use_openwakeword is active, we read STANDBY_CHUNK (1280)
        current_chunk = WHISPER_CHUNK if (WAKE_MODE or not use_openwakeword) else STANDBY_CHUNK
        
        frame = stream.read(current_chunk, exception_on_overflow=False)
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
                        
                        frames = []
                        is_speaking = False
                        silence_counter = 0
                        continue
            else:
                # 2. Process via Fallback Whisper VAD (Clap or speech wake detection)
                # Clap detection (very high RMS spike)
                clap_threshold = max(6000, bg_rms * 6)
                if rms > clap_threshold:
                    emit({"event": "log", "message": f"Clap/Loud noise detected! (RMS: {rms:.2f})"})
                    WAKE_MODE = True
                    emit({"event": "waking", "text": "Clap detected"})
                    
                    frames = []
                    is_speaking = False
                    silence_counter = 0
                    continue
                
                # Speech sensitivity check
                threshold = max(300, bg_rms + 300)
                if rms > threshold:
                    # Capture speech frame in standby to check if it's the wake word
                    if not is_speaking:
                        is_speaking = True
                        emit({"event": "speech_start"})
                    frames.append(frame)
                    silence_counter = 0
                elif is_speaking:
                    frames.append(frame)
                    silence_counter += 1
                    if silence_counter > SILENCE_LIMIT:
                        is_speaking = False
                        emit({"event": "speech_end"})
                        
                        audio_data = b''.join(frames)
                        frames = []
                        silence_counter = 0
                        
                        audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
                        if len(audio_np) > SAMPLE_RATE * 0.5:
                            segments, info = model.transcribe(audio_np, beam_size=5, vad_filter=True)
                            text = " ".join([segment.text for segment in segments]).strip()
                            if text and is_wake_word(text):
                                emit({"event": "log", "message": f"Whisper wake word detected: {text}"})
                                WAKE_MODE = True
                                emit({"event": "waking", "text": text})
        
        # --- B: Active Mode (Capturing Spoken Command) ---
        else:
            threshold = max(300, bg_rms + 250)
            speech_active = rms > threshold
            
            if speech_active:
                if not is_speaking:
                    is_speaking = True
                    emit({"event": "log", "message": f"Speech started (RMS: {rms:.2f})"})
                    emit({"event": "speech_start"})
                frames.append(frame)
                silence_counter = 0
            elif is_speaking:
                frames.append(frame)
                silence_counter += 1
                if silence_counter > SILENCE_LIMIT:
                    is_speaking = False
                    emit({"event": "speech_end"})
                    
                    audio_data = b''.join(frames)
                    frames = []
                    silence_counter = 0
                    
                    audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
                    
                    if len(audio_np) > SAMPLE_RATE * 0.5:
                        segments, info = model.transcribe(audio_np, beam_size=5, vad_filter=True)
                        text = " ".join([segment.text for segment in segments]).strip()
                        
                        if text:
                            emit({"event": "command", "text": text})
                        else:
                            emit({"event": "log", "message": "No command heard, returning to standby."})
                        
                        # Go back to standby wake monitoring after processing the command
                        WAKE_MODE = False

except KeyboardInterrupt:
    emit({"event": "log", "message": "Exiting..."})
finally:
    stream.stop_stream()
    stream.close()
    p.terminate()
