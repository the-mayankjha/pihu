const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    setIgnoreMouseEvents: (ignore) => {
        // We pass { forward: true } so macOS continues forwarding events to underneath apps
        ipcRenderer.send('set-ignore-mouse-events', ignore, { forward: true });
    },
    quitApp: () => {
        ipcRenderer.send('quit-app');
    },
    transcribeAudio: (buffer) => {
        return ipcRenderer.invoke('transcribe-audio', buffer);
    },
    onVoiceEvent: (callback) => {
        ipcRenderer.on('voice-event', (event, data) => callback(data));
    }
});
