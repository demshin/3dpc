const { contextBridge, ipcRenderer } = require('electron')

console.log('🔥 PRELOAD LOADED')

contextBridge.exposeInMainWorld('printersAPI', {
  load: () => ipcRenderer.invoke('printers:load'),
  setActive: (name) => ipcRenderer.invoke('printers:setActive', name)
})

contextBridge.exposeInMainWorld('savePrinterAPI', {
  submit: (name) => ipcRenderer.send('save-printer:submit', name),
  cancel: () => ipcRenderer.send('save-printer:cancel')
})

contextBridge.exposeInMainWorld('renamePrinterAPI', {
  submit: (newName) => ipcRenderer.send('rename-printer:submit', newName),
  cancel: () => ipcRenderer.send('rename-printer:cancel')
})

/* 🔴 ВОТ ЭТОГО У ТЕБЯ СЕЙЧАС НЕТ */
contextBridge.exposeInMainWorld('settingsAPI', {
  getActive: () => ipcRenderer.invoke('settings:getActive'),
  saveActive: (settings) => ipcRenderer.invoke('settings:saveActive', settings)
})
contextBridge.exposeInMainWorld('menuAPI', {
  setLang: (lang) => ipcRenderer.send('menu:setLang', lang)
})