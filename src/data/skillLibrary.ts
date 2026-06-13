/**
 * Skill Atlas — Curated Skill Library
 *
 * This file defines the base skill templates available when creating a new skill.
 * It is designed to be extended by LLMs and agents: add a new SkillTemplate object
 * to SKILL_LIBRARY following the same shape. Each entry is self-contained and
 * references only primitive values (no DB IDs).
 *
 * To add a skill programmatically:
 *   1. Create a SkillTemplate object with a unique kebab-case `id`
 *   2. Add it to SKILL_LIBRARY
 *   3. The app will show it in the skill picker automatically
 */

export interface QuestTemplate {
  level_num: number;        // 1–10: which level this quest is associated with
  title: string;
  description?: string;
  xp_reward: number;        // recommended range: 20–150
  is_repeatable: boolean;   // true = can be completed many times (e.g. "practice 15 min")
}

export interface ResourceTemplate {
  title: string;
  type: "book" | "article" | "video" | "course" | "website";
  url?: string;
  author?: string;
  notes?: string;
}

export interface SkillTemplate {
  id: string;               // stable kebab-case slug — used as a reference key for LLMs
  name: string;
  description: string;
  category: string;
  icon: string;             // single emoji
  color: string;            // hex color from the muted palette
  quests: QuestTemplate[];
  resources: ResourceTemplate[];
}

// ─── Base Skill Library ────────────────────────────────────────────────────
// 8 curated starter skills. Extend by appending new SkillTemplate objects.

export const SKILL_LIBRARY: SkillTemplate[] = [
  {
    id: "guitar",
    name: "Guitar",
    description: "Learn to play guitar from open chords through fingerpicking and beyond.",
    category: "Music",
    icon: "🎸",
    color: "#6B8EAD",
    quests: [
      { level_num: 1, title: "Learn the 5 essential open chords (C, G, D, Em, Am)", description: "Practice each chord until you can press it cleanly without buzzing", xp_reward: 50, is_repeatable: false },
      { level_num: 1, title: "Practice chord transitions for 10 minutes", description: "Move between any two chords in time with a metronome", xp_reward: 30, is_repeatable: true },
      { level_num: 1, title: "Learn to tune your guitar by ear using a reference pitch", xp_reward: 40, is_repeatable: false },
      { level_num: 1, title: "Play through a 4-chord song from beginning to end", description: "Doesn't need to be perfect — just finish it", xp_reward: 60, is_repeatable: false },
      { level_num: 2, title: "Learn the F barre chord", description: "The most-dreaded milestone. Keep at it.", xp_reward: 80, is_repeatable: false },
      { level_num: 2, title: "Learn a pentatonic scale pattern in one position", xp_reward: 60, is_repeatable: false },
      { level_num: 2, title: "Play along to a recording at full speed", description: "Even if you miss some notes — keep up with the rhythm", xp_reward: 70, is_repeatable: true },
      { level_num: 3, title: "Record yourself playing a song and listen back", description: "Honest self-assessment is one of the fastest ways to improve", xp_reward: 80, is_repeatable: false },
      { level_num: 3, title: "Learn a fingerpicking pattern on a simple melody", xp_reward: 90, is_repeatable: false },
      { level_num: 3, title: "Learn a song in a genre you've never played before", xp_reward: 80, is_repeatable: false },
    ],
    resources: [
      { title: "JustinGuitar", type: "website", url: "https://www.justinguitar.com", notes: "The best free structured guitar course online" },
      { title: "Hal Leonard Guitar Method (Complete Edition)", type: "book", author: "Will Schmid & Greg Koch", notes: "Classic method book — good for reading notation too" },
      { title: "Fender Play", type: "course", url: "https://www.fender.com/play", notes: "Song-based learning, great for motivation" },
    ],
  },

  {
    id: "python",
    name: "Python",
    description: "Learn Python programming from first principles to building real projects.",
    category: "Programming",
    icon: "🐍",
    color: "#5F8A8B",
    quests: [
      { level_num: 1, title: "Write Hello World and explain every line", description: "Can you describe what each token does?", xp_reward: 20, is_repeatable: false },
      { level_num: 1, title: "Understand variables, loops, and conditionals", description: "Write a small program that uses all three", xp_reward: 50, is_repeatable: false },
      { level_num: 1, title: "Build a number guessing game in the terminal", description: "Computer picks 1–100, user guesses, program gives hints", xp_reward: 60, is_repeatable: false },
      { level_num: 1, title: "Solve 5 beginner exercises on a practice site", description: "Codewars, Exercism, or similar", xp_reward: 50, is_repeatable: true },
      { level_num: 2, title: "Write a script that reads, processes, and writes a file", xp_reward: 70, is_repeatable: false },
      { level_num: 2, title: "Replace 3 for-loops in your code with list comprehensions", xp_reward: 50, is_repeatable: false },
      { level_num: 2, title: "Build a simple web scraper with requests and BeautifulSoup", xp_reward: 90, is_repeatable: false },
      { level_num: 3, title: "Build a command-line tool with argparse or Click", xp_reward: 80, is_repeatable: false },
      { level_num: 3, title: "Write a module with unit tests using pytest", xp_reward: 90, is_repeatable: false },
      { level_num: 3, title: "Automate a real task in your own life using Python", description: "Rename files, process a spreadsheet, send an email — make it useful", xp_reward: 120, is_repeatable: false },
    ],
    resources: [
      { title: "Automate the Boring Stuff with Python", type: "book", author: "Al Sweigart", url: "https://automatetheboringstuff.com", notes: "Free online — practical projects from the start" },
      { title: "Python Official Tutorial", type: "website", url: "https://docs.python.org/3/tutorial/", notes: "Comprehensive, authoritative, worth reading fully" },
      { title: "Exercism — Python Track", type: "website", url: "https://exercism.org/tracks/python", notes: "Mentored exercises with feedback from real developers" },
    ],
  },

  {
    id: "drawing",
    name: "Drawing",
    description: "Develop foundational drawing skills through observation, form, and mark-making.",
    category: "Visual Arts",
    icon: "✏️",
    color: "#8B7B9E",
    quests: [
      { level_num: 1, title: "Complete Drawabox Lesson 1 — lines, ellipses, and boxes", description: "Follow the instructions carefully. Ghosting method matters.", xp_reward: 60, is_repeatable: false },
      { level_num: 1, title: "Do a 30-minute gesture drawing session", description: "Use Line of Action or Quickposes (2-minute poses)", xp_reward: 40, is_repeatable: true },
      { level_num: 1, title: "Draw a still life from direct observation", description: "Arrange 3 objects and draw them from life — no photo", xp_reward: 70, is_repeatable: false },
      { level_num: 1, title: "Fill a page with varied marks and lines to explore your tools", xp_reward: 30, is_repeatable: false },
      { level_num: 2, title: "Complete Drawabox Lesson 2 — contour lines and texture", xp_reward: 80, is_repeatable: false },
      { level_num: 2, title: "Draw 5 organic forms from imagination with shading", xp_reward: 60, is_repeatable: false },
      { level_num: 2, title: "Study and draw a reference hand from 3 different angles", xp_reward: 90, is_repeatable: false },
      { level_num: 3, title: "Complete a finished portrait from photographic reference", description: "Spend at least 2 hours on a single drawing", xp_reward: 120, is_repeatable: false },
      { level_num: 3, title: "Draw a 1-point perspective interior scene", xp_reward: 90, is_repeatable: false },
      { level_num: 3, title: "Create an illustration from thumbnail sketch to finished piece", description: "Thumbnail → rough → final", xp_reward: 130, is_repeatable: false },
    ],
    resources: [
      { title: "Drawabox", type: "website", url: "https://drawabox.com", notes: "Rigorous, free fundamentals curriculum — do the homework" },
      { title: "Drawing on the Right Side of the Brain", type: "book", author: "Betty Edwards", notes: "A classic for learning to see and draw what you actually see" },
      { title: "Line of Action", type: "website", url: "https://line-of-action.com", notes: "Timed figure and gesture drawing practice" },
    ],
  },

  {
    id: "running",
    name: "Running",
    description: "Build aerobic fitness and endurance from first run to race-ready.",
    category: "Fitness",
    icon: "🏃",
    color: "#7B9E8B",
    quests: [
      { level_num: 1, title: "Complete a 20-minute run without stopping", description: "Slow is fine — the goal is continuous movement", xp_reward: 50, is_repeatable: false },
      { level_num: 1, title: "Run 3 times in one week", xp_reward: 60, is_repeatable: true },
      { level_num: 1, title: "Learn and execute a proper warm-up and cool-down routine", xp_reward: 30, is_repeatable: false },
      { level_num: 1, title: "Record your baseline 1-mile time", xp_reward: 40, is_repeatable: false },
      { level_num: 2, title: "Run a continuous 5 km", description: "No walk breaks — any pace", xp_reward: 80, is_repeatable: false },
      { level_num: 2, title: "Complete a 4-week beginner running plan (e.g. Couch to 5K)", xp_reward: 100, is_repeatable: false },
      { level_num: 2, title: "Add interval training to a run", description: "Alternate 1 min fast / 2 min easy × 6", xp_reward: 60, is_repeatable: true },
      { level_num: 3, title: "Run 10 km without stopping", xp_reward: 100, is_repeatable: false },
      { level_num: 3, title: "Complete a local 5K race or virtual race", xp_reward: 120, is_repeatable: false },
      { level_num: 3, title: "Maintain a training log for 30 consecutive days", xp_reward: 90, is_repeatable: false },
    ],
    resources: [
      { title: "Couch to 5K (C25K)", type: "website", url: "https://c25k.com", notes: "The gold-standard beginner running program" },
      { title: "Born to Run", type: "book", author: "Christopher McDougall", notes: "A compelling read that makes you want to run" },
    ],
  },

  {
    id: "chess",
    name: "Chess",
    description: "Learn chess from first moves through tactical patterns and strategic thinking.",
    category: "Strategy",
    icon: "♟️",
    color: "#708090",
    quests: [
      { level_num: 1, title: "Learn all piece movements, rules, and special moves", description: "Castling, en passant, promotion, check, checkmate, stalemate", xp_reward: 30, is_repeatable: false },
      { level_num: 1, title: "Complete 20 basic tactics puzzles (fork, pin, skewer)", xp_reward: 50, is_repeatable: false },
      { level_num: 1, title: "Play 5 games against a computer at easy/beginner level", xp_reward: 40, is_repeatable: true },
      { level_num: 1, title: "Learn 3 basic checkmate patterns (back rank, ladder, smothered)", xp_reward: 60, is_repeatable: false },
      { level_num: 2, title: "Study one opening as White and one as Black", description: "Understand the ideas behind each move, not just the moves", xp_reward: 70, is_repeatable: false },
      { level_num: 2, title: "Complete 50 intermediate tactics puzzles", xp_reward: 80, is_repeatable: false },
      { level_num: 2, title: "Analyze 3 of your own games with an engine", description: "Find where you went wrong and what you should have played", xp_reward: 60, is_repeatable: true },
      { level_num: 3, title: "Reach 1000 Elo on Lichess or Chess.com", xp_reward: 100, is_repeatable: false },
      { level_num: 3, title: "Study a grandmaster game and write notes explaining the ideas", xp_reward: 90, is_repeatable: false },
      { level_num: 3, title: "Complete an endgame fundamentals course (king+pawn, rook endings)", xp_reward: 80, is_repeatable: false },
    ],
    resources: [
      { title: "Lichess", type: "website", url: "https://lichess.org", notes: "Free, open-source — puzzles, analysis, lessons, no ads" },
      { title: "Chess Fundamentals", type: "book", author: "José Raúl Capablanca", notes: "Timeless introduction from a world champion" },
      { title: "Silman's Complete Endgame Course", type: "book", author: "Jeremy Silman", notes: "Organized by skill level — work through what's relevant to you now" },
    ],
  },

  {
    id: "spanish",
    name: "Spanish",
    description: "Build Spanish from survival phrases through conversational fluency.",
    category: "Language",
    icon: "🌍",
    color: "#B08840",
    quests: [
      { level_num: 1, title: "Learn and retain the 100 most common Spanish words", xp_reward: 60, is_repeatable: false },
      { level_num: 1, title: "Complete 30 days of daily Duolingo or Anki practice", xp_reward: 70, is_repeatable: true },
      { level_num: 1, title: "Introduce yourself and sustain a 2-minute conversation", xp_reward: 50, is_repeatable: false },
      { level_num: 1, title: "Learn present tense conjugations for 10 high-frequency verbs", description: "ser, estar, tener, hacer, ir, querer, poder, saber, venir, decir", xp_reward: 60, is_repeatable: false },
      { level_num: 2, title: "Watch a Spanish-language video with Spanish subtitles", description: "30 minutes minimum", xp_reward: 50, is_repeatable: true },
      { level_num: 2, title: "Have a 5-minute conversation with a native speaker", description: "Use italki, Tandem, or a language exchange partner", xp_reward: 90, is_repeatable: false },
      { level_num: 2, title: "Learn past tense (preterite) and use it in writing", xp_reward: 80, is_repeatable: false },
      { level_num: 3, title: "Read a Spanish graded reader from start to finish", description: "Choose a level-appropriate reader (A2 or B1)", xp_reward: 100, is_repeatable: false },
      { level_num: 3, title: "Keep a journal entirely in Spanish for 2 weeks", xp_reward: 100, is_repeatable: false },
      { level_num: 3, title: "Complete an intermediate Spanish course", xp_reward: 120, is_repeatable: false },
    ],
    resources: [
      { title: "Language Transfer — Complete Spanish", type: "course", url: "https://www.languagetransfer.org/complete-spanish", notes: "Free, conversation-based course — builds intuition, not just memorization" },
      { title: "Dreaming Spanish", type: "website", url: "https://www.dreamingspanish.com", notes: "Comprehensible input videos across all levels" },
      { title: "Practice Makes Perfect: Complete Spanish Grammar", type: "book", author: "Gilda Nissenberg", notes: "Clear explanations with lots of exercises" },
    ],
  },

  {
    id: "cooking",
    name: "Cooking",
    description: "Learn to cook from kitchen fundamentals through confident improvisation.",
    category: "Culinary",
    icon: "🍳",
    color: "#A86B55",
    quests: [
      { level_num: 1, title: "Cook a perfect omelette", description: "Silky, folded, unbrowned. Deceptively hard.", xp_reward: 40, is_repeatable: false },
      { level_num: 1, title: "Learn proper knife skills: dice an onion finely and consistently", xp_reward: 30, is_repeatable: false },
      { level_num: 1, title: "Cook a complete dinner (protein + side + veg) from scratch", xp_reward: 60, is_repeatable: false },
      { level_num: 1, title: "Master a basic sauce from scratch (béchamel, tomato, or pan sauce)", xp_reward: 50, is_repeatable: false },
      { level_num: 2, title: "Roast a whole chicken with vegetables", description: "Crispy skin, juicy meat — learn temperature and resting", xp_reward: 70, is_repeatable: false },
      { level_num: 2, title: "Make fresh pasta from scratch and cook it", description: "Flour, eggs, patience", xp_reward: 80, is_repeatable: false },
      { level_num: 2, title: "Cook a full meal from a cuisine you've never cooked before", xp_reward: 70, is_repeatable: true },
      { level_num: 3, title: "Execute a dish that takes 3+ hours of active cooking", description: "Braised short ribs, coq au vin, slow-roasted pork — something that requires patience", xp_reward: 120, is_repeatable: false },
      { level_num: 3, title: "Host a dinner for 4 or more people and cook everything yourself", xp_reward: 100, is_repeatable: false },
      { level_num: 3, title: "Improvise a complete meal using only what's already in the kitchen", description: "No recipe, no shopping — cook with what you have", xp_reward: 80, is_repeatable: true },
    ],
    resources: [
      { title: "Salt, Fat, Acid, Heat", type: "book", author: "Samin Nosrat", notes: "Teaches the principles behind great cooking, not just recipes" },
      { title: "Jacques Pépin: More Fast Food My Way", type: "video", notes: "Watch how a master works — technique over recipes" },
      { title: "Serious Eats", type: "website", url: "https://www.seriouseats.com", notes: "Science-backed recipes that explain the why behind every step" },
    ],
  },

  {
    id: "creative-writing",
    name: "Creative Writing",
    description: "Develop your voice and craft through regular writing, feedback, and experimentation.",
    category: "Writing",
    icon: "✍️",
    color: "#B07878",
    quests: [
      { level_num: 1, title: "Write every day for 7 days", description: "Any length, any topic — the habit matters more than the output", xp_reward: 60, is_repeatable: true },
      { level_num: 1, title: "Write a 500-word short story with a clear beginning, middle, and end", xp_reward: 60, is_repeatable: false },
      { level_num: 1, title: "Write a character description that makes a stranger vivid", description: "Use specific physical details and a revealing gesture or habit", xp_reward: 40, is_repeatable: false },
      { level_num: 1, title: "Respond to a writing prompt you wouldn't normally choose", xp_reward: 30, is_repeatable: true },
      { level_num: 2, title: "Write and revise a 1500-word short story", description: "Let it sit for a day before revising", xp_reward: 80, is_repeatable: false },
      { level_num: 2, title: "Share a piece of writing and receive substantive feedback", description: "Writing group, workshop, trusted reader — external perspective matters", xp_reward: 70, is_repeatable: true },
      { level_num: 2, title: "Write a scene in the style of a writer you admire", description: "Study their sentence structure, vocabulary, and rhythm — then imitate deliberately", xp_reward: 60, is_repeatable: false },
      { level_num: 3, title: "Complete a 5000-word story or a full first chapter of a novel", xp_reward: 130, is_repeatable: false },
      { level_num: 3, title: "Rewrite the same scene three times in three different styles", description: "Same events, different narrator voice, tense, or point of view", xp_reward: 90, is_repeatable: false },
      { level_num: 3, title: "Submit a piece of writing to a contest, journal, or publication", xp_reward: 100, is_repeatable: false },
    ],
    resources: [
      { title: "On Writing", type: "book", author: "Stephen King", notes: "Half memoir, half craft manual — essential reading" },
      { title: "Bird by Bird", type: "book", author: "Anne Lamott", notes: "Warm, honest guidance on the writing life" },
      { title: "The Story Grid", type: "website", url: "https://storygrid.com", notes: "Systematic approach to understanding how stories work" },
    ],
  },
];
