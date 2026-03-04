# SpectraView

A scientific spectral data viewer built with Tauri v2, React 19, and D3.js. Visualize XRD, dielectric, and general scientific data with interactive plots.

![Windows](https://img.shields.io/badge/platform-Windows-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Multi-format support** — CSV, TSV, TXT, DAT, XY, XRDML (PANalytical XRD)
- **Interactive plotting** — Zoom, pan, box-zoom (Shift+drag), double-click to reset
- **Multi-dataset overlay** — Load multiple files and compare on a single plot
- **Auto-plot** — Automatically plots data and sets axis labels on file load
- **Column mapping** — Select which columns to plot as X/Y axes
- **Log/Linear scales** — Toggle between scale types for each axis
- **Drag & drop** — Drop files directly onto the app to load
- **Dark theme** — Easy on the eyes for long analysis sessions

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+O` | Open file |
| `G` | Toggle grid |
| `R` | Reset zoom |
| `1-9` | Toggle dataset visibility |
| `Shift+Drag` | Box zoom |
| `Double-click` | Reset zoom |

## Supported File Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| CSV | `.csv` | Comma-separated values |
| TSV | `.tsv` | Tab-separated values |
| Text | `.txt`, `.dat` | Whitespace/delimiter-separated data |
| XY | `.xy` | Two-column XY data |
| XRDML | `.xrdml` | PANalytical X-ray diffraction data |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v22+)
- [Rust](https://rustup.rs/) (stable)
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/)

### Setup

```bash
npm install
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

Installers are generated in `src-tauri/target/release/bundle/`.

## Tech Stack

- **Frontend:** React 19, TypeScript, D3.js 7, Zustand 5, Tailwind CSS 4
- **Backend:** Rust, Tauri 2, quick-xml, encoding_rs
- **Build:** Vite 6, Tauri CLI 2

## CI/CD

Automated via GitHub Actions:

- **CI** — TypeScript + Rust checks on every push/PR
- **Release** — Auto-version bump, build `.msi` + `.exe` installers, publish GitHub Release on push to `main`
