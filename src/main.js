const { app, ipcMain } = require('electron');
const path = require('path');
const { menubar } = require('menubar');
const api = require('./api');

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

let mb;
let refreshTimer;

app.whenReady().then(() => {
  mb = menubar({
    index: `file://${path.join(__dirname, 'renderer', 'index.html')}`,
    icon: path.join(__dirname, 'assets', 'iconTemplate.png'),
    preloadWindow: true,
    showDockIcon: false,
    browserWindow: {
      width: 550,
      height: 650,
      resizable: false,
      skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    }
  });

  mb.on('ready', () => {
    console.log('JO 2026 menubar ready');
    setupIPC();
    startAutoRefresh();
  });

  mb.on('after-show', () => {
    notifyRenderer();
  });
});

function setupIPC() {
  ipcMain.handle('get-medals', async () => {
    try {
      return await api.fetchMedals();
    } catch (e) {
      console.error('get-medals error:', e.message);
      return { error: e.message };
    }
  });

  ipcMain.handle('get-medallists', async () => {
    try {
      return await api.fetchMedallists();
    } catch (e) {
      console.error('get-medallists error:', e.message);
      return { error: e.message };
    }
  });

  ipcMain.handle('get-daily-schedule', async (_event, date) => {
    try {
      return await api.fetchDailySchedule(date);
    } catch (e) {
      console.error('get-daily-schedule error:', e.message);
      return { error: e.message };
    }
  });

  ipcMain.handle('refresh', async () => {
    try {
      await api.refreshAll();
      notifyRenderer();
      return { success: true, lastUpdate: api.getLastUpdate() };
    } catch (e) {
      console.error('refresh error:', e.message);
      return { error: e.message };
    }
  });

  ipcMain.handle('get-last-update', () => {
    return api.getLastUpdate();
  });

  ipcMain.handle('get-login-item-settings', () => {
    return app.getLoginItemSettings();
  });

  ipcMain.handle('set-login-item-settings', (_event, openAtLogin) => {
    app.setLoginItemSettings({ openAtLogin });
    return { success: true };
  });

  ipcMain.handle('quit-app', () => {
    app.quit();
  });
}

function startAutoRefresh() {
  refreshTimer = setInterval(async () => {
    try {
      await api.refreshAll();
      notifyRenderer();
    } catch (e) {
      console.error('Auto-refresh error:', e.message);
    }
  }, REFRESH_INTERVAL);
}

function notifyRenderer() {
  if (mb && mb.window && !mb.window.isDestroyed()) {
    mb.window.webContents.send('data-updated');
  }
}

app.on('will-quit', () => {
  if (refreshTimer) clearInterval(refreshTimer);
});
