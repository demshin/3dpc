// ================== IMPORTS ==================
const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const printersStore = require('./logic/printersStore')

// ================== WINDOWS ==================
let mainWindow
let settingsWindow
let savePrinterWindow
let renamePrinterWindow
let aboutWindow
let renameOldName = null
let currentLang = 'ru'

// ================== MAIN WINDOW ==================
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 780,
	icon: path.join(__dirname, 'assets/icons/app.ico'),
	resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })

  mainWindow.loadFile('index.html')

 
}

// ================== SETTINGS ==================
function createSettingsWindow() {
  if (settingsWindow) return

  settingsWindow = new BrowserWindow({
    width: 520,
    height: 460,
	icon: path.join(__dirname, 'assets/icons/app.ico'),
    parent: mainWindow,
    modal: true,
	resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })

  settingsWindow.loadFile('settings.html')
  settingsWindow.on('closed', () => settingsWindow = null)
}

// ================== ABOUT ==================
function createAboutWindow() {
  if (aboutWindow) return

  aboutWindow = new BrowserWindow({
    width: 420,
    height: 380,
	icon: path.join(__dirname, 'assets/icons/app.ico'),
    parent: mainWindow,
    modal: true,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })

  aboutWindow.loadFile('about.html')
  aboutWindow.on('closed', () => aboutWindow = null)
}

// ================== SAVE / RENAME ==================
function openSavePrinterWindow() {
  if (savePrinterWindow) return

  savePrinterWindow = new BrowserWindow({
    width: 420,
    height: 220,
	icon: path.join(__dirname, 'assets/icons/app.ico'),
    parent: mainWindow,
    modal: true,
	resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })

  savePrinterWindow.loadFile('save-printer.html')
  savePrinterWindow.on('closed', () => savePrinterWindow = null)
}

function openRenamePrinterWindow(oldName) {
  if (renamePrinterWindow) return
  renameOldName = oldName

  renamePrinterWindow = new BrowserWindow({
    width: 420,
    height: 220,
	icon: path.join(__dirname, 'assets/icons/app.ico'),
    parent: mainWindow,
    modal: true,
	resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })

  renamePrinterWindow.loadFile('rename-printer.html')
  renamePrinterWindow.on('closed', () => {
    renamePrinterWindow = null
    renameOldName = null
  })
}

// ================== MENU ==================
function buildPrintersMenu() {
  const store = printersStore.loadStore()
  const active = store.activePrinter

  const items = Object.keys(store.printers).map(name => ({
    label: name,
    type: 'radio',
    checked: name === active,
    click() {
      printersStore.setActivePrinter(name)
      setMenu()
    }
  }))

  if (active !== 'Default Printer') {
    items.push({ type: 'separator' })
    items.push({
      label: currentLang === 'ru' ? 'Управление' : 'Manage',
      submenu: [
        {
          label: currentLang === 'ru' ? 'Переименовать' : 'Rename',
          click: () => openRenamePrinterWindow(active)
        },
        {
          label: currentLang === 'ru' ? 'Удалить' : 'Delete',
          click: () => {
            printersStore.deletePrinter(active)
            setMenu()
          }
        }
      ]
    })
  }

  return items
}

function setMenu() {
  const L = {
    ru: {
      file: '🗄️ Файл',
      save: '💾 Сохранить принтер',
      printers: '🖨️ Принтеры',
      exit: 'Выход',
      settings: '⚙ Настройки',
      about: 'ℹ О программе'
    },
    en: {
      file: '🗄️ File',
      save: '💾 Save printer',
      printers: '🖨️ Printers',
      exit: 'Exit',
      settings: '⚙ Settings',
      about: 'ℹ About'
    }
  }[currentLang]

  const menu = Menu.buildFromTemplate([
    {
      label: L.file,
      submenu: [
        { label: L.save, click: openSavePrinterWindow },
        { label: L.printers, submenu: buildPrintersMenu() },
        { type: 'separator' },
        { role: 'quit', label: L.exit }
      ]
    },
    { label: L.settings, click: createSettingsWindow },
    { label: L.about, click: createAboutWindow }
  ])

  Menu.setApplicationMenu(menu)
}

// ================== APP ==================
app.whenReady().then(() => {
  setMenu()
  createMainWindow()
})

// ================== IPC ==================
ipcMain.on('menu:setLang', (_, lang) => {
  currentLang = lang
  setMenu()
})

ipcMain.handle('printers:load', () => printersStore.loadStore())
ipcMain.handle('printers:setActive', (_, name) => {
  printersStore.setActivePrinter(name)
  setMenu()
  return true
})

ipcMain.on('save-printer:submit', (_, name) => {
  const store = printersStore.loadStore()
  printersStore.savePrinter(name, store.printers[store.activePrinter])
  setMenu()
  savePrinterWindow?.close()
})

ipcMain.on('rename-printer:submit', (e, newName) => {
  if (!renameOldName) return
  if (!newName || !newName.trim()) return   // ← ЗАЩИТА

  const ok = printersStore.renamePrinter(renameOldName, newName.trim())
  if (!ok) return

  setMenu()
  renamePrinterWindow?.close()
  renamePrinterWindow = null
  renameOldName = null
})

ipcMain.handle('settings:getActive', () => {
  const store = printersStore.loadStore()
  return { name: store.activePrinter, settings: store.printers[store.activePrinter] }
})

ipcMain.handle('settings:saveActive', (_, settings) => {
  const store = printersStore.loadStore()
  store.printers[store.activePrinter] = settings
  printersStore.saveStore(store)
})
ipcMain.on('save-printer:cancel', () => {
  savePrinterWindow?.close()
  savePrinterWindow = null
})

ipcMain.on('rename-printer:cancel', () => {
  renamePrinterWindow?.close()
  renamePrinterWindow = null
  renameOldName = null
})
