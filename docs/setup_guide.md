# 📄 Setup and Installation Guide

Follow this guide to compile, configure, and initialize the PIHU OS local voice pipeline on Apple Silicon (M1/M2/M3) and Intel Macs.

---

## 📋 System Requirements
- **Operating System:** macOS Big Sur (11.0) or higher.
- **Node.js:** v18.0.0 or higher.
- **Python:** 3.10 to 3.12 (Pyaudio has limited pre-built wheels for Python 3.13, so 3.12 is highly recommended).
- **Homebrew:** Required for installing system audio utilities.

---

## ⚙️ Step-by-Step Installation

### Step 1: Install System Dependencies
PyAudio requires headers from the **PortAudio** system library to interface with macOS CoreAudio.
```bash
brew install portaudio
```

### Step 2: Install Node Packages
Run npm install in the project root:
```bash
npm install
```

### Step 3: Configure Python Virtual Environment
1.  Initialize a virtual environment:
    ```bash
    python3 -m venv venv
    ```
2.  Activate the environment:
    ```bash
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install --upgrade pip
    pip install -r requirements.txt
    ```

---

## 🛠️ Apple Silicon (M1/M2/M3) Compilation Fixes

On Apple Silicon Macs, Homebrew compiles binaries to `/opt/homebrew/` instead of `/usr/local/`. This frequently causes `pip install pyaudio` to fail with a missing `portaudio.h` compiler error.

If you encounter this compilation failure:
1.  Verify where PortAudio is installed:
    ```bash
    brew --prefix portaudio
    # Usually outputs: /opt/homebrew/opt/portaudio
    ```
2.  Directly pass the compiler flags pointing to Homebrew's paths:
    ```bash
    pip install --global-option=build_ext \
                --global-option="-I$(brew --prefix portaudio)/include" \
                --global-option="-L$(brew --prefix portaudio)/lib" \
                pyaudio
    ```
    *Alternatively (on modern Pip versions):*
    ```bash
    C_INCLUDE_PATH=$(brew --prefix portaudio)/include \
    LIBRARY_PATH=$(brew --prefix portaudio)/lib \
    pip install pyaudio
    ```

---

## ⚙️ Configuration File (`config.json`)

The application stores settings in `config.json` inside the root workspace.
```json
{
  "access_key": "YOUR_PICOVOICE_ACCESS_KEY",
  "engine": "porcupine"
}
```

*   **engine:** 
    *   Set to `"porcupine"` if you have a Picovoice Porcupine console developer key.
    *   Set to `"whisper"` or leave empty to default to our **100% free, stateful Silero VAD local fallback engine** (which does not require any keys or internet access!).

---

## 🔊 Microphone Calibration & Diagnostics

Upon starting, PIHU OS automatically takes a 200ms sample to calibrate against your room's background noise floor:
```text
[Python] Calibrating background noise floor...
[Python] Calibration complete. Background RMS: 94.25
```
*   If your background RMS is extremely high (e.g. >500), check if another app is using the mic or if there is heavy fan noise.
*   The system caps background calibration at `300` RMS to ensure it never creates unreachable speech start thresholds.
