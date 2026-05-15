const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { initWhisper } = require('@fugood/whisper.node');

let mainWindow;
let whisperCtx = null;

async function setupWhisper() {
    const modelPath = path.join(__dirname, 'public', 'ggml-tiny.en.bin');
    if (fs.existsSync(modelPath)) {
        try {
            // Note: whisper.node uses filePath in NativeContextOptions
            whisperCtx = await initWhisper({ filePath: modelPath });
            console.log("Whisper.cpp initialized from:", modelPath);
        } catch (e) {
            console.error("Whisper init error:", e);
        }
    } else {
        console.warn("Whisper model not found at", modelPath);
    }
}

function createWindow() {
  // Get primary display size
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    hasShadow: false,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Force window to be top-level above other apps
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Hide from Dock for a true ambient background experience
  if (app.dock) {
    app.dock.hide();
  }

  // Allow clicks to pass through when idle
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Load the Vite dev server URL
  // If we were building for production, we'd load the local index.html
  mainWindow.loadURL('http://localhost:5173');

  // Handle IPC calls to toggle mouse events
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setIgnoreMouseEvents(ignore, options);
    }
  });

  // Handle IPC call to quit the application
  ipcMain.on('quit-app', () => {
    app.quit();
  });

  // Handle Whisper IPC
  ipcMain.handle('transcribe-audio', async (event, audioBuffer) => {
    if (!whisperCtx) return { text: "" };
    try {
        // audioBuffer arrives from renderer via IPC (likely as a Buffer or Uint8Array).
        // The C++ N-API bindings strictly require an ArrayBuffer, not a Node Buffer view.
        // Node Buffers share underlying memory pools, so we must slice it exactly.
        const nodeBuffer = Buffer.from(audioBuffer);
        const arrayBuffer = nodeBuffer.buffer.slice(
            nodeBuffer.byteOffset, 
            nodeBuffer.byteOffset + nodeBuffer.byteLength
        );
        
        const result = await whisperCtx.transcribeData(arrayBuffer, { language: 'en' }).promise;
        return { text: result.result || "" };
    } catch (e) {
        console.error("Transcribe error:", e);
        return { text: "" };
    }
  });
}

app.whenReady().then(async () => {
  if (process.platform === 'darwin') {
    const { systemPreferences } = require('electron');
    const status = systemPreferences.getMediaAccessStatus('microphone');
    if (status !== 'granted') {
      await systemPreferences.askForMediaAccess('microphone');
    }
  }

  // Auto-grant permissions for microphone in development
  const { session } = require('electron');
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
  });

  await setupWhisper();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
