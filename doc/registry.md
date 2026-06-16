# Hosting a Skill Registry

A registry is a static collection of JSON files served over HTTP. The app fetches a lightweight `index.json` to list available modules, then downloads individual module files only when a user clicks Install. No server-side logic is required — a GitHub repository works perfectly.

## What a registry consists of

```
index.json          ← required: lists all modules
modules/
  guitar.json       ← one file per module
  python.json
  running.json
```

The `index.json` file and the `modules/` directory can be at any path, as long as the module file paths in `index.json` are relative to the directory that contains it.

## index.json format

```json
{
  "schema_version": 1,
  "modules": [
    {
      "id": "guitar",
      "name": "Guitar",
      "description": "Learn to play guitar from open chords through fingerpicking and beyond.",
      "category": "Music",
      "icon": "🎸",
      "color": "#6B8EAD",
      "version": "1.0.0",
      "author": "Your Name",
      "tags": ["beginner-friendly", "creative"],
      "file": "modules/guitar.json"
    },
    {
      "id": "python",
      "name": "Python",
      "description": "Learn Python from first principles to building real projects.",
      "category": "Programming",
      "icon": "🐍",
      "color": "#5F8A8B",
      "version": "1.0.0",
      "author": "Your Name",
      "tags": [],
      "file": "modules/python.json"
    }
  ]
}
```

### index.json fields

| Field | Notes |
|-------|-------|
| `schema_version` | Must be `1` |
| `modules` | Array of module listing entries |
| `modules[].id` | Must match the `id` inside the module file |
| `modules[].file` | Path to the full module JSON, **relative to the directory containing `index.json`** |
| `modules[].name`, `description`, `category`, `icon`, `color`, `version`, `author`, `tags` | Metadata shown in the Remote tab before the user installs — copy these from the top of the module file |

The app shows these metadata fields in the Remote tab without downloading the full module, so keep them accurate.

## Module files

Each file in `modules/` is a full `SkillModule` object. See [modules.md](modules.md) for the complete format. The `id` in the file must match the `id` in `index.json`.

## Hosting on GitHub

GitHub serves raw file content at predictable URLs, requires no configuration, and allows CORS requests from browser contexts — which is exactly what the app needs.

**Step 1 — Create a repository**

Create a new public GitHub repository (e.g. `skill-atlas-registry`).

**Step 2 — Add your files**

Commit `index.json` at the root and your module files under `modules/`:

```
skill-atlas-registry/
  index.json
  modules/
    guitar.json
    python.json
```

**Step 3 — Get the raw URL for index.json**

In GitHub, navigate to `index.json` and click **Raw**. The URL will look like:

```
https://raw.githubusercontent.com/your-username/skill-atlas-registry/main/index.json
```

**Step 4 — Paste the URL into the app**

Open Skill Atlas → Settings (⚙ in the sidebar) → paste the URL into **Library Registry URL** → Done.

Open New Skill → Browse Skill Library → Remote tab. Your modules will appear.

## Adding a module

1. Create `modules/your-skill-id.json` following the format in [modules.md](modules.md)
2. Add an entry for it in `index.json` (copy the metadata fields from the file)
3. Commit and push — the app picks up changes on the next time the Remote tab is opened

## Versioning

Bump the `version` field in the module file (and the corresponding entry in `index.json`) when you make meaningful content changes. The app doesn't auto-update installed modules — users need to reinstall to get a new version. Keeping the version accurate helps users know when their local copy is stale.

## How the app resolves module URLs

When a user clicks Install on a Remote module, the app:

1. Takes the registry URL from settings (e.g. `https://raw.githubusercontent.com/.../main/index.json`)
2. Strips the filename to get the base URL: `https://raw.githubusercontent.com/.../main/`
3. Appends the `file` path from the index entry: `https://raw.githubusercontent.com/.../main/modules/guitar.json`
4. Fetches, validates, and saves the file to the local library directory

This means the `file` paths in `index.json` must always be **relative to the directory containing `index.json`**, not absolute URLs and not paths from the repo root.

## Self-hosting

Any static file server works. The only requirement is that it serves the files with an `Access-Control-Allow-Origin: *` response header, since the app makes browser `fetch()` calls and is subject to CORS restrictions.

GitHub raw content URLs already include this header. For self-hosted options:

- **Nginx**: add `add_header Access-Control-Allow-Origin "*";` to the location block
- **Caddy**: add `header Access-Control-Allow-Origin *` to the route
- **GitHub Pages**: serves with permissive CORS headers by default
- **Cloudflare R2 / S3**: enable CORS in the bucket settings with `AllowedOrigins: ["*"]`

## Relation to the LLM import flow

The app has a separate **Import from JSON** flow (New Skill → Import from JSON) that generates a skill via an LLM prompt. That prompt produces a `SkillJson` object with `short_description`, `level_roadmap`, `materials`, `resources`, and an empty `quests` array. These fields map directly to the module format — see [modules.md § Using the app's LLM prompt output as a module](modules.md#using-the-apps-llm-prompt-output-as-a-module) for how to bridge the two.

The key difference: the LLM skill flow is designed for generating one skill interactively, while the registry is designed for distributing polished, complete modules (with full quests across all levels) to other users.
