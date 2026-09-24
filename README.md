# DOCK

> **Local Developer Workspace & Command Center**

DOCK is a unified local developer command center for codebases. Instead of jumping between terminal windows, file explorers, Git tools, and documentation, DOCK gives developers a single visual cockpit to understand, navigate, and operate a software project.

---

## ⚡ Features (Phase 1)

- **Landing & Project Switcher:** Quickly open any local repository with a native macOS folder picker dialog or path input (`Cmd+O`).
- **Repository Telemetry & Tech Detector:** Automatically detects manifests and frameworks (Node.js, TypeScript, React, Vite, Tailwind CSS, Python, Rust, Go, Docker, Maven/Gradle).
- **Executive Overview Dashboard:**
  - Tech Stack & Ecosystem breakdown with source file indicators.
  - Git status: active branch, dirty file count, latest commit hash/author, and upstream remote.
  - Interactive Scripts Runner preview: view and copy configured run commands with 1-click.
  - Dependencies inspector: runtime vs development package breakdown.
  - Repository Statistics: total files, directory counts, size, and segmented language breakdown bar.
  - Important project files and manifests.
- **VS Code-Style File Explorer:**
  - Collapsible directory tree filtering out noise (`node_modules`, `.git`, `dist`, `build`, etc.).
  - File extension icon mapping.
  - Integrated code viewer with line numbers and copy capability.
- **Decoupled Architecture:**
  - React 19 + TypeScript + Vite + Tailwind CSS frontend.
  - Lightweight local Node read-only engine (`IDockBackend` service contract).
  - Ready for drop-in Tauri/Rust IPC binding.

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- npm / pnpm

### Run Locally
```bash
# Install dependencies
npm install

# Start both local server engine & UI
npm run dev
```

Visit `http://localhost:5173/` in your browser.
