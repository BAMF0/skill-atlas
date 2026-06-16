# Skill Atlas

A local-first desktop app for tracking skill progression through quests, XP, and levels. Built with Tauri, React, and SQLite.

## What it does

You pick a skill — guitar, Python, running, whatever — and the app gives it a structured progression: quests to complete, XP to earn, levels to reach. Everything stays on your machine.

- **Quests** are tasks tied to skill levels. Completing them earns XP.
- **XP** accumulates into levels (1–10) with an exponential curve.
- **Resources** are books, videos, courses, and links attached to a skill.
- **Materials** track equipment or prerequisites a skill requires.
- A full **XP log** keeps an immutable record of every completion.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs) (stable toolchain)
- [Tauri CLI prerequisites](https://tauri.app/start/prerequisites/) for your platform

### Run in development

```bash
npm install
npm run tauri dev
```

### Build a release binary

```bash
npm run build:app
```

The installer is written to `src-tauri/target/release/bundle/`.

## Skill library

When you add a new skill, you can pick from the built-in library or browse a remote registry of community modules. Skills are defined as JSON files — you can drop them into a folder on your machine without touching the app.

See [doc/modules.md](doc/modules.md) for the module format and [doc/registry.md](doc/registry.md) for how to set up your own registry.

## Data

Everything is stored in a SQLite database at:

| Platform | Path |
|----------|------|
| Windows  | `%APPDATA%\skill-atlas\skillatlas.db` |
| macOS    | `~/Library/Application Support/skill-atlas/skillatlas.db` |
| Linux    | `~/.local/share/skill-atlas/skillatlas.db` |

Use **Export** in the sidebar to save a full JSON backup. Use **Import** to restore or merge skills from a backup file.

## License

MIT
