import sys
import json
import pyaudio
import numpy as np
from faster_whisper import WhisperModel
import time
import re

sys.stdout.reconfigure(line_buffering=True)

def emit(event_dict):
    print(json.dumps(event_dict))
    sys.stdout.flush()

emit({"event": "log", "message": "Initializing Python Voice Engine..."})

# Initialize Model (Use tiny.en on CPU/Metal for instant response)
# M-series Macs handle this extremely fast even on CPU.
try:
    model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
    emit({"event": "log", "message": "Faster-Whisper Model loaded."})
except Exception as e:
    emit({"event": "error", "message": f"Failed to load model: {str(e)}"})
    sys.exit(1)

# Audio Configuration
SAMPLE_RATE = 16000
FRAME_DURATION_MS = 30
CHUNK = int(SAMPLE_RATE * FRAME_DURATION_MS / 1000) # 480 samples

def calculate_rms(frame_bytes):
    audio_data = np.frombuffer(frame_bytes, dtype=np.int16)
    return np.sqrt(np.mean(audio_data.astype(np.float32)**2))

p = pyaudio.PyAudio()

# Try to find the built-in microphone or fallback to default
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

emit({"event": "log", "message": f"Using Microphone: {device_name}"})

try:
    stream = p.open(format=pyaudio.paInt16,
                    channels=1,
                    rate=SAMPLE_RATE,
                    input=True,
                    input_device_index=device_index,
                    frames_per_buffer=CHUNK)
except Exception as e:
    emit({"event": "error", "message": f"Microphone error: {str(e)}"})
    sys.exit(1)

def is_wake_word(text):
    # Regex for Pihu variations
    text = text.lower().strip()
    return bool(re.search(r'\b(hey |hi |wake up )?(pihu|pewho|peehoo|pee who|pee-who|p\.i\.h\.u|pu)\b', text))

emit({"event": "log", "message": "Listening..."})

frames = []
is_speaking = False
silence_counter = 0
SILENCE_LIMIT = 30 # ~0.9 seconds of silence triggers end of speech
WAKE_MODE = False

# Calibrate background noise
emit({"event": "log", "message": "Calibrating background noise... please stay silent for 1 second."})
bg_rms_values = []
for _ in range(int(1000 / FRAME_DURATION_MS)):
    frame = stream.read(CHUNK, exception_on_overflow=False)
    bg_rms_values.append(calculate_rms(frame))
bg_rms = float(np.mean(bg_rms_values))
emit({"event": "calibration_complete", "rms": bg_rms})
emit({"event": "log", "message": f"Calibration complete. Background RMS: {bg_rms:.2f}"})

try:
    while True:
        frame = stream.read(CHUNK, exception_on_overflow=False)
        rms = calculate_rms(frame)
        
        # Clap detection (very high RMS spike)
        clap_threshold = max(6000, bg_rms * 6)
        if rms > clap_threshold and not WAKE_MODE:
            emit({"event": "log", "message": f"Clap/Loud noise detected! (RMS: {rms:.2f})"})
            WAKE_MODE = True
            emit({"event": "waking", "text": "Clap detected"})
            
            # Reset buffers so the noise itself isn't processed
            frames = []
            is_speaking = False
            silence_counter = 0
            continue
            
        # Adaptive threshold: speech adds energy to the background noise floor.
        # We use a smaller multiplier or addition to make it highly sensitive.
        threshold = max(300, bg_rms + 300)
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
                
                # Audio is complete, convert and transcribe
                audio_data = b''.join(frames)
                frames = [] # reset
                silence_counter = 0
                
                # Convert bytes to float32 numpy array normalized to -1.0..1.0
                audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
                
                # Only transcribe if audio is at least 0.5 seconds
                if len(audio_np) > SAMPLE_RATE * 0.5:
                    segments, info = model.transcribe(audio_np, beam_size=5, vad_filter=True)
                    text = " ".join([segment.text for segment in segments]).strip()
                    
                    if text:
                        if not WAKE_MODE:
                            if is_wake_word(text):
                                WAKE_MODE = True
                                emit({"event": "waking", "text": text})
                            else:
                                emit({"event": "background", "text": text})
                        else:
                            # Already awake, this is a command
                            emit({"event": "command", "text": text})
                            WAKE_MODE = False # Go back to sleep after command
                
except KeyboardInterrupt:
    emit({"event": "log", "message": "Exiting..."})
finally:
    stream.stop_stream()
    stream.close()
    p.terminate()
