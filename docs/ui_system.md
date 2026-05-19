# 📄 User Interface & WebGL Orb Design

This document details the frontend visual design, React architecture, transparent desktop overlay compositing, and custom WebGL shaders that give PIHU OS its holographic visual language.

---

## 🎨 Holographic Visual Language

PIHU OS is styled to look premium, modern, and alive. It adopts three core aesthetic pillars:
1.  **Glassmorphism:** Frosted panel overlays, utilizing heavy CSS backdrops (`backdrop-filter: blur(20px)`), translucent cyan/blue borders, and soft cinematic drop-shadows.
2.  **Cinematic Typography:** Standardizes on highly readable, modern san-serif typography (e.g. Inter/Outfit) instead of system defaults.
3.  **Active UI Micro-Animations:** Subtle hover transitions, responsive border pulses, and scale-up triggers make panels feel organic.

---

## 🖥️ Transparent Window Compositing

To allow the translucent assistant overlay to float smoothly above active macOS windows, Electron's browser window is initialized with native transparency layers:

```javascript
// main.cjs
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  transparent: true,      // Enables compositing with desktop workspace
  frame: false,            // Hides macOS window borders and top bar
  hasShadow: false,        // Prevents default window shadow clipping
  alwaysOnTop: true,       // Keeps overlay visible
  webPreferences: {
    preload: path.join(__dirname, 'preload.cjs')
  }
});
```

To let clicks fall through empty areas of the overlay while retaining interactions on floating panels:
*   The React main wrapper sets `window.electronAPI.setIgnoreMouseEvents(true, { forward: true })` on background divs.
*   Interactive UI panels capture mouse hovers and toggle `setIgnoreMouseEvents(false)` so buttons can be clicked.

---

## 🌀 WebGL GLSL Plasma Orb Shader

The centerpiece of the PIHU interface is the reactive **Plasma Orb**—a high-fidelity WebGL shader running inside a custom React Three Fiber (`@react-three/fiber`) element.

### Reactive States
The energy ribbons in the WebGL canvas pulse and flow based on the current **Voice State**:

| Voice State | Visual Color Scheme | Speed & Turbulence |
| :--- | :--- | :--- |
| `idle` | Quiet, deep translucent indigo | Slow, ambient drift |
| `waking` | Electric violet flash | Medium acceleration |
| `listening` | Radiant glowing cyan waveforms | Highly turbulent ripples |
| `speaking` | Waveform pulses syncing with voice | Harmonious harmonic ripples |
| `thinking` | Swirling emerald ring | Hyper-speed cyclic rotation |

### Core Vertex & Fragment Shader Structure
The orb's smooth flowing ribbons are generated procedurally on the GPU using fractional Brownian motion (fBm) noise algorithms inside a custom GLSL fragment shader:

```glsl
// Fragment Shader preview
uniform float uTime;
uniform vec3 uColor;
uniform float uTurbulence;
varying vec2 vUv;
varying vec3 vNormal;

// Fractal Brownian Motion Simplex Noise
float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 4; i++) {
        value += amplitude * snoise(p * frequency);
        p.y += uTime * 0.2; // vertical drift
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return value;
}

void main() {
    vec3 normal = normalize(vNormal);
    float noise = fbm(normal + vec3(0.0, 0.0, uTime * uTurbulence));
    
    // Create soft transparent rim glow
    float fresnel = pow(1.0 - dot(normal, vec3(0.0, 0.0, 1.0)), 3.0);
    vec3 finalColor = mix(uColor, vec3(1.0), fresnel * 0.6) + noise * 0.15;
    
    gl_FragColor = vec4(finalColor, 0.35 + fresnel * 0.65);
}
```

---

## 📂 React Layout File Hierarchy

-   **`src/App.jsx`:** Parent coordinator. Hooks into the IPC `electronAPI` channel, updates system state logs, handles vocal playback via speech synthesis, and controls mute transitions.
-   **`src/components/ui/orb/`:**
    *   `OrbScene.jsx` — Canvas container holding WebGL cameras and lighting.
    *   `Orb.jsx` — Instantiates the shader material and handles frame updates.
-   **`src/components/ui/BottomActionPanel.jsx`:** Contains wave visualizations, active listening text indicator, and manual activation toggles.
-   **`src/components/ui/SettingsPanel.jsx`:** Provides fields to customize configuration, toggle wake word models, and update user names.
