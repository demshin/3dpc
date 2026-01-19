# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**3DPC (3D Print Calculator)** is a free, open-source desktop application built with Electron for calculating 3D printing costs. It's designed for makers, studios, and small manufacturing setups that need accurate cost calculations for production pricing.

**Key characteristics:**
- Lightweight Electron app (~1.1MB source)
- Vanilla JavaScript/HTML/CSS (no frontend frameworks)
- Multi-window architecture with IPC communication
- Bilingual interface (English/Russian)
- Dark/light theme support

## Development Commands

```bash
# Install dependencies
npm install

# Run application in development mode
npm start

# Build distributable installer (Windows NSIS)
npm run build
```

**Build output:** `dist/` directory contains `.exe` installer and `.zip` archive

## Architecture

### Electron Multi-Window Pattern

The application uses a multi-window Electron architecture with five separate windows:

1. **Main Window** (`index.html`) - Calculator interface (1000×780px, non-resizable)
2. **Settings Window** (`settings.html`) - Printer configuration modal
3. **About Window** (`about.html`) - Application info modal
4. **Rename Dialog** (`rename-printer.html`) - Printer rename modal
5. **Save Printer Dialog** (`save-printer.html`) - New printer creation modal

### IPC Communication Flow

```
Renderer Process (HTML) ↔ preload.js (Context Bridge) ↔ main.js (IPC Handlers) ↔ printersStore.js (Data Layer)
```

- **Context isolation** enabled for security
- **Preload script** (`preload.js`) exposes safe API via `contextBridge.exposeInMainWorld()`
- **IPC methods:**
  - `ipcMain.handle()` for promise-based async operations
  - `ipcMain.on()` for fire-and-forget events
  - Exposed APIs: `getPrinters()`, `savePrinter()`, `deletePrinter()`, `renamePrinter()`, `setActivePrinter()`

### Data Persistence Layer

**File:** `logic/printersStore.js`

**Storage location:** `app.getPath('userData')/printers.json`
- Windows: `%APPDATA%/3DPC/printers.json`

**Data schema:**
```json
{
  "activePrinter": "printer_name",
  "printers": {
    "printer_name": {
      "prices": { "PLA": 40, "PETG": 60, "ABS": 55 },  // $/kg
      "power": 120,      // Watts
      "tariff": 0.15,    // $/kWh
      "amort": 0.5,      // $/hour depreciation
      "markup": 3        // Final price multiplier
    }
  }
}
```

**Key functions:**
- `loadStore()` - Read from JSON file
- `saveStore(store)` - Write to JSON file
- `savePrinter(name, settings)` - Add/update printer and set as active
- `setActivePrinter(name)` - Switch active printer
- `deletePrinter(name)` - Remove printer (protects Default Printer if last one)
- `renamePrinter(oldName, newName)` - Rename printer with validation
- `getPrintersList()` - Get array of printer names

### Cost Calculation Logic

Located in `index.html` JavaScript section:

```
Total Cost = (Material + Electricity + Depreciation + Services) × Markup × (1 + Prototype Factor)
```

Where:
- **Material cost** = weight (g) × material_price ($/kg) / 1000
- **Electricity** = time (min) × power (W) × tariff ($/kWh) / 60 / 1000
- **Depreciation** = time (min) × amort_rate ($/h) / 60
- **Services** = user input (modeling, post-processing, etc.)
- **Prototype Factor** = 0.25 (25% reduction) if "Prototype" checkbox is enabled

## File Organization

```
3dpc/
├── main.js              # Electron main process (window management, IPC handlers, menu)
├── preload.js           # IPC bridge with context isolation
├── package.json         # Dependencies and electron-builder config
│
├── index.html           # Main calculator UI
├── settings.html        # Settings modal (edit active printer)
├── about.html           # About/info modal
├── rename-printer.html  # Rename printer dialog
├── save-printer.html    # New printer dialog
│
├── logic/
│   └── printersStore.js # Data persistence layer (all file I/O)
│
├── assets/
│   ├── icons/app.ico    # Windows application icon
│   ├── logo.png         # Application logo
│   └── icon.png         # Additional icon
│
└── screenshots/         # README documentation images
```

## Adding New Features

### Adding a Printer Parameter

1. Update default config in `printersStore.js` (line 13-26)
2. Add form field to `settings.html`
3. Update form submission handler in `settings.html` JavaScript
4. Update calculation logic in `index.html` if parameter affects cost

### Adding a New Window

1. Create HTML file with inline CSS/JS
2. Add window creation function in `main.js` (follow pattern of `createSettingsWindow()`)
3. Add IPC handlers in `main.js` if needed
4. Expose API methods in `preload.js` via `contextBridge`
5. Add menu item or trigger mechanism

### Modifying UI Styles

All windows use inline CSS with CSS Variables for theming:

**CSS Variables:**
- `--bg` - Background color
- `--text` - Text color
- `--accent` - Accent/border color
- `--input-bg` - Input background
- `--btn-*` - Button colors (primary, hover, disabled, delete, etc.)

Theme switching updates `data-theme` attribute on `<html>` element.

### Internationalization

Language switching handled in `main.js`:
- `currentLang` variable stores active language
- Menu items rebuilt on language change
- Each HTML file contains bilingual labels (no i18n framework)
- To add strings: update menu object in `main.js` and HTML label mappings

## Code Style

- **Vanilla JavaScript** - No build step required
- **Inline CSS** - Each HTML file has embedded `<style>` section
- **Section comments** - Use `// ==========` format for major sections
- **Clear function names** - Descriptive, sequential, minimal abstraction
- **No frameworks** - Deliberate choice for simplicity and maintainability

## Important Notes

- **Main window** must be created before other windows (parent-child relationship)
- **Singleton dialogs** - Check if window already exists before creating new instance
- **Window cleanup** - Set window reference to `null` in `closed` event handler
- **Default Printer** - Cannot be deleted if it's the last printer
- **Data validation** - Printer names are trimmed and checked for empty values
- **Context bridge** - Never expose Node.js APIs directly to renderer; use preload bridge

## Platform Support

**Current:**
- Windows 10/11 (64-bit) - NSIS installer
- macOS 10.13+ (Intel x64 & Apple Silicon ARM64) - DMG installer

**Build Commands:**
```bash
npm run build        # Build for current platform
npm run build:win    # Build Windows installer
npm run build:mac    # Build macOS installer (DMG + ZIP)
npm run build:all    # Build for both platforms
```

## Project Status

v1.0.0 - Pilot/testing phase

**Missing:**
- No automated tests (no Jest, Mocha, or Spectron configured)
- No CI/CD pipeline
- No error logging/telemetry

**Future considerations:**
- Unit tests for `printersStore.js` logic
- Integration tests with Spectron/Playwright
- GitHub Actions for automated builds
