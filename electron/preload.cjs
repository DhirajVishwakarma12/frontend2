const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopSetup", {
  getSettings: () => ipcRenderer.invoke("setup:get-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("setup:save-settings", settings),
});
