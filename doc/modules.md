# Skill Modules

A skill module is a single JSON file that defines a skill — its quests, resources, materials, and metadata. You can drop module files into the library directory to make them available in the app without restarting or editing any code.

## Library directory

The app reads modules from a local directory:

| Platform | Path |
|----------|------|
| Windows  | `%APPDATA%\skill-atlas\library\` |
| macOS    | `~/Library/Application Support/skill-atlas/library/` |
| Linux    | `~/.local/share/skill-atlas/library/` |

The exact path is shown at the bottom of the **Local** tab in the Skill Library browser (New Skill → Browse Skill Library).

Drop any `.json` file that matches the module format into this directory. The next time you open the library browser it will appear — no app restart needed.

## Module format

```json
{
  "schema_version": 1,
  "id": "your-skill-id",
  "name": "Your Skill",
  "description": "One or two sentences describing the skill and what the learner will achieve.",
  "short_description": "One sentence shown in skill cards.",
  "level_roadmap": "Level 1 (Novice): ...\nLevel 2 (Beginner): ...\n...\nLevel 10 (Grandmaster): ...",
  "category": "Music",
  "icon": "🎸",
  "color": "#6B8EAD",
  "version": "1.0.0",
  "author": "Your Name",
  "tags": ["beginner-friendly", "creative"],
  "quests": [...],
  "resources": [...],
  "materials": [...]
}
```

### Top-level fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `schema_version` | number | yes | Must be `1` |
| `id` | string | yes | Kebab-case, globally unique (e.g. `"finger-drumming"`). Used as the filename and as a stable key — don't change it after publishing. |
| `name` | string | yes | Display name shown in the UI |
| `description` | string | yes | Short description (1–2 sentences) |
| `short_description` | string | no | One-sentence summary shown in skill cards inside the app |
| `level_roadmap` | string | no | 10-line progression description, one line per level. Used to give context to quest generation. Format: `"Level 1 (Novice): ...\nLevel 2 (Beginner): ..."` |
| `category` | string | yes | Freeform category label (e.g. `"Music"`, `"Fitness"`) |
| `icon` | string | yes | A single emoji |
| `color` | string | yes | Hex color code (e.g. `"#6B8EAD"`). Use a muted, desaturated tone — the app uses this as an accent color against light and dark backgrounds. |
| `version` | string | yes | Semver string (e.g. `"1.0.0"`) |
| `author` | string | no | Your name or handle |
| `tags` | string[] | no | Descriptive tags for filtering |
| `quests` | Quest[] | yes | Array of quest objects (see below) |
| `resources` | Resource[] | yes | Array of resource objects (see below). Can be empty (`[]`). |
| `materials` | Material[] | no | Physical or software prerequisites the learner needs (see below) |

## Quests

Each quest belongs to a level (1–10) and awards XP on completion. A good module covers at least levels 1–5, ideally all 10.

```json
{
  "level_num": 1,
  "title": "Learn the 5 essential open chords",
  "description": "Practice each chord until you can press it cleanly without buzzing.",
  "xp_reward": 50,
  "is_repeatable": false
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `level_num` | number | yes | 1–10. Multiple quests per level is fine. |
| `title` | string | yes | Short imperative phrase — what the learner does |
| `description` | string | no | Extra context, tips, or success criteria |
| `xp_reward` | number | yes | Recommended range: 20–150. Scale with effort: a 10-minute drill might be 30 XP; finishing a project might be 120 XP. |
| `is_repeatable` | boolean | yes | `true` for recurring habits (daily practice, weekly sessions). `false` for one-off milestones. |

### XP guidelines

| Effort | Suggested XP |
|--------|-------------|
| Quick drill / warmup | 20–40 |
| Focused session (30–60 min) | 40–70 |
| Meaningful milestone | 70–100 |
| Major project / long-form work | 100–150 |

Avoid giving all quests the same XP — varied rewards make progression feel more meaningful.

### Level structure

Think of each level as a phase in the learner's journey:

- **Levels 1–2** — Foundations. Complete beginner, building the base habit.
- **Levels 3–4** — Early progress. Core techniques, first real challenges.
- **Levels 5–6** — Competency. Consistent practice, tackling harder material.
- **Levels 7–8** — Fluency. Independent work, applying the skill in context.
- **Levels 9–10** — Mastery. Deep specialization, creative output, teaching others.

Aim for 3–6 quests per level. Mix repeatable drills with one-off milestones at every level.

## Resources

Resources are links or references that help the learner. They're optional but strongly encouraged.

```json
{
  "title": "JustinGuitar",
  "type": "website",
  "url": "https://www.justinguitar.com",
  "author": null,
  "notes": "The best free structured guitar course online."
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | Name of the resource |
| `type` | string | yes | One of: `"book"`, `"article"`, `"video"`, `"course"`, `"website"` |
| `url` | string | no | Direct link |
| `author` | string | no | Author or creator name |
| `notes` | string | no | One sentence on what makes it worth using |

## Materials

Materials are things the learner needs before they can practise — equipment, software, consumables, and so on. They appear in the skill's Materials section after creation.

```json
{
  "name": "Classical guitar, nylon-string",
  "category": "equipment",
  "notes": "A half-size or full-size classical guitar. Nylon strings are easier on fingertips for beginners.",
  "url": "https://example.com/guitars",
  "is_optional": false
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | Specific name of the item |
| `category` | string | no | One of: `"equipment"`, `"software"`, `"consumables"`, `"space"`, `"other"` |
| `notes` | string | no | What to look for, why it matters, or what to avoid |
| `url` | string | no | Purchase or download link |
| `is_optional` | boolean | no | `true` for nice-to-haves. Defaults to `false`. |

## Using the app's LLM prompt output as a module

The app's **Import from JSON** flow (New Skill → Import from JSON) uses a prompt that produces a `SkillJson` object. That object already contains `short_description`, `level_roadmap`, `materials`, and `resources` — the same fields a module supports. To turn LLM output into a publishable module, add the four required module metadata fields:

```json
{
  "schema_version": 1,
  "id": "your-skill-id",
  "icon": "🎸",
  "version": "1.0.0",

  // everything below comes directly from the LLM output:
  "name": "...",
  "short_description": "...",
  "level_roadmap": "...",
  "category": "...",
  "color": "#6B8EAD",
  "quests": [],
  "resources": [...],
  "materials": [...]
}
```

Note that the skill prompt intentionally leaves `quests` empty — quests are generated in a separate step via the **Import Quests** flow on the skill detail page. Fill in the quests array before publishing as a module.

## Complete example

```json
{
  "schema_version": 1,
  "id": "finger-drumming",
  "name": "Finger Drumming",
  "description": "Learn to play beats and grooves on a MIDI pad controller, from basic patterns through polyrhythm.",
  "short_description": "Play beats on a MIDI pad, from simple grooves to complex polyrhythm.",
  "level_roadmap": "Level 1 (Novice): Basic kick-snare patterns in 4/4.\nLevel 2 (Beginner): Add hi-hats and simple fills.\nLevel 3 (Apprentice): Syncopated patterns and ghost notes.\nLevel 4 (Intermediate): Triplet-based grooves and shuffle feel.\nLevel 5 (Competent): Two-hand independence and odd time signatures.\nLevel 6 (Proficient): Polyrhythm and cross-rhythm patterns.\nLevel 7 (Advanced): Genre-specific idioms (jazz, Latin, Afrobeat).\nLevel 8 (Expert): Full arrangement performance with dynamics.\nLevel 9 (Master): Original compositions and live improvisation.\nLevel 10 (Grandmaster): Teaching, publishing, and performing at a professional level.",
  "category": "Music",
  "icon": "🥁",
  "color": "#8B6B6B",
  "version": "1.0.0",
  "author": "example",
  "tags": ["music", "rhythm", "beginner-friendly"],
  "quests": [
    {
      "level_num": 1,
      "title": "Learn a basic 4/4 kick-snare pattern",
      "description": "Kick on beats 1 and 3, snare on 2 and 4. Loop it for 5 minutes.",
      "xp_reward": 40,
      "is_repeatable": false
    },
    {
      "level_num": 1,
      "title": "Practice a groove for 15 minutes",
      "description": "Any pattern — consistency matters more than complexity at this stage.",
      "xp_reward": 30,
      "is_repeatable": true
    },
    {
      "level_num": 2,
      "title": "Add a hi-hat on every eighth note",
      "description": "Keep the kick-snare pattern going while adding constant eighth notes on the hat.",
      "xp_reward": 60,
      "is_repeatable": false
    }
  ],
  "resources": [
    {
      "title": "Melodics",
      "type": "course",
      "url": "https://melodics.com",
      "author": null,
      "notes": "Daily lessons designed specifically for pad-based finger drumming."
    }
  ],
  "materials": [
    {
      "name": "MIDI pad controller (e.g. Ableton Push, Akai MPD)",
      "category": "equipment",
      "notes": "Velocity-sensitive pads are important — avoid cheap controllers with unresponsive pads.",
      "is_optional": false
    },
    {
      "name": "DAW or standalone app (Ableton Live, GarageBand, Melodics)",
      "category": "software",
      "notes": "Melodics is free to start and designed specifically for pad practice.",
      "is_optional": false
    }
  ]
}
```

Save this as `finger-drumming.json` in your library directory and it will appear in the app immediately.
