# Build Guide - 3DPC

## Prerequisites

- Node.js 18+ and npm
- Git

## Installation

```bash
# Clone the repository
git clone https://github.com/demshin/3dpc.git
cd 3dpc

# Install dependencies
npm install
```

## Development

```bash
# Run in development mode
npm start
```

## Building

### Build for Current Platform

```bash
npm run build
```

### Build for Specific Platform

**Windows:**
```bash
npm run build:win
```
Output: `dist/3DPC Setup 1.0.0.exe` (NSIS installer)

**macOS:**
```bash
npm run build:mac
```
Output:
- `dist/3DPC-1.0.0.dmg` (DMG installer)
- `dist/3DPC-1.0.0-mac.zip` (ZIP archive)

Architectures: Intel (x64) and Apple Silicon (arm64)

### Build for All Platforms

```bash
npm run build:all
```

## Build Configuration

### Windows
- **Target:** NSIS installer
- **Architecture:** x64
- **Icon:** `assets/icons/app.ico`
- **Features:**
  - Custom installation directory
  - Desktop shortcut
  - Start menu shortcut

### macOS
- **Targets:** DMG installer, ZIP archive
- **Architectures:** x64 (Intel), arm64 (Apple Silicon)
- **Icon:** `assets/icon-512.png` (512×512 PNG)
- **Minimum System:** macOS 10.13 (High Sierra)
- **Features:**
  - Universal binary (both architectures in one app)
  - Dark mode support
  - Ad-hoc code signing (development)

## Platform-Specific Notes

### Windows
- Icon must be `.ico` format
- NSIS creates a traditional installer with options

### macOS
- Icon must be at least 512×512 PNG
- DMG provides drag-to-Applications installation
- App is signed with ad-hoc signature (development)
- For distribution, proper code signing certificate needed

## File Structure

```
3dpc/
├── main.js              # Electron main process
├── preload.js           # IPC bridge
├── index.html           # Main calculator UI
├── settings.html        # Settings modal
├── about.html           # About dialog
├── save-printer.html    # New printer dialog
├── rename-printer.html  # Rename dialog
├── logic/
│   └── printersStore.js # Data persistence
├── assets/
│   ├── icons/
│   │   └── app.ico      # Windows icon
│   ├── icon-512.png     # macOS icon (512×512)
│   └── icon.png         # Original icon (256×256)
└── package.json         # Build configuration

dist/                    # Build output (gitignored)
├── win-unpacked/        # Windows build (dev)
├── mac-arm64/           # macOS ARM build (dev)
├── 3DPC Setup 1.0.0.exe # Windows installer
├── 3DPC-1.0.0.dmg      # macOS installer
└── 3DPC-1.0.0-mac.zip  # macOS archive
```

## Troubleshooting

### macOS Icon Error
**Error:** `image must be at least 512x512`

**Solution:** Use `assets/icon-512.png` instead of `assets/icon.png`

### Code Signing on macOS
For development builds, ad-hoc signing is used automatically.

For distribution (Mac App Store or notarization):
1. Get Apple Developer certificate
2. Configure signing in `package.json`:
   ```json
   "mac": {
     "identity": "Developer ID Application: Your Name (TEAM_ID)"
   }
   ```
3. Enable notarization

### Windows Build on macOS
Cross-platform builds require Wine or Docker.

**Option 1: Using Docker**
```bash
docker run --rm -ti \
  -v ${PWD}:/project \
  electronuserland/builder:wine \
  /bin/bash -c "npm install && npm run build:win"
```

**Option 2: Use GitHub Actions** (recommended)
Set up CI/CD to build on native platforms.

## Distribution

### GitHub Releases
1. Tag the version: `git tag v1.0.0`
2. Push tag: `git push origin v1.0.0`
3. Build installers for both platforms
4. Upload to GitHub Releases

### File Naming Convention
- Windows: `3DPC Setup {version}.exe`
- macOS DMG: `3DPC-{version}.dmg`
- macOS ZIP: `3DPC-{version}-mac.zip`

## Version Management

Update version in `package.json`:
```json
{
  "version": "1.0.1"
}
```

This will automatically update installer names.

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Documentation](https://www.electron.build/)
- [Electron Forge vs Builder Comparison](https://www.electron.build/index.html#comparison)
