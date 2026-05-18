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
        const subscription = (event, data) => callback(data);
        ipcRenderer.on('voice-event', subscription);
        return () => {
            ipcRenderer.removeListener('voice-event', subscription);
        };
    },
    onSystemStats: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on('system-stats', subscription);
        return () => {
            ipcRenderer.removeListener('system-stats', subscription);
        };
    }
});
