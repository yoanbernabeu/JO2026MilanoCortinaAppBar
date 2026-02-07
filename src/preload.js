const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jo2026', {
  getMedals: () => ipcRenderer.invoke('get-medals'),
  getMedallists: () => ipcRenderer.invoke('get-medallists'),
  getDailySchedule: (date) => ipcRenderer.invoke('get-daily-schedule', date),
  refresh: () => ipcRenderer.invoke('refresh'),
  getLastUpdate: () => ipcRenderer.invoke('get-last-update'),
  getLoginItemSettings: () => ipcRenderer.invoke('get-login-item-settings'),
  setLoginItemSettings: (val) => ipcRenderer.invoke('set-login-item-settings', val),
  quit: () => ipcRenderer.invoke('quit-app'),
  onDataUpdated: (callback) => {
    ipcRenderer.on('data-updated', (_event) => callback());
  }
});
