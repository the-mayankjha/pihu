const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

async function setupWhisper() {
    // Legacy setup function left for reference, but Whisper is now handled by Python
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

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log(`[Renderer] ${message}`);
  });

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
}

function startPythonEngine() {
    const pythonScript = path.join(__dirname, 'voice_engine.py');
    const venvPython = path.join(__dirname, 'venv', 'bin', 'python');
    
    console.log("Starting Python Voice Engine...");
    pythonProcess = spawn(venvPython, [pythonScript], { stdio: ['pipe', 'pipe', 'pipe'] });
    
    pythonProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const event = JSON.parse(line);
                if (event.event === 'log') {
                    console.log(`[Python] ${event.message}`);
                } else if (mainWindow) {
                    mainWindow.webContents.send('voice-event', event);
                }
            } catch (e) {
                console.log(`[Python RAW] ${line}`);
            }
        }
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python ERROR] ${data.toString()}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python engine exited with code ${code}`);
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

  createWindow();
  startPythonEngine();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
});
