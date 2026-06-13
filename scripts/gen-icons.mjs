/**
 * Skill Atlas — icon generator
 * Renders the compass-rose SVG to all sizes required by Tauri on Windows/macOS.
 * Run: node scripts/gen-icons.mjs
 */
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS = join(__dirname, "../src-tauri/icons");
mkdirSync(ICONS, { recursive: true });

// ─── Icon design ─────────────────────────────────────────────────────────────
// Compass rose on a warm dark background — fits the "atlas" metaphor.
// Colors match the app's warm dark palette.

const SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="512" height="512" rx="88" fill="#1C1C1A"/>

  <!-- Outer ring -->
  <circle cx="256" cy="256" r="172" fill="none" stroke="#2D2D2B" stroke-width="8"/>

  <!-- Cardinal tick marks -->
  <line x1="256" y1="82"  x2="256" y2="110" stroke="#4A4944" stroke-width="7" stroke-linecap="round"/>
  <line x1="256" y1="402" x2="256" y2="430" stroke="#4A4944" stroke-width="7" stroke-linecap="round"/>
  <line x1="82"  y1="256" x2="110" y2="256" stroke="#4A4944" stroke-width="7" stroke-linecap="round"/>
  <line x1="402" y1="256" x2="430" y2="256" stroke="#4A4944" stroke-width="7" stroke-linecap="round"/>

  <!-- North needle — cream/bright (N is the highlighted cardinal) -->
  <path d="M256,90 L276,244 L256,262 L236,244 Z" fill="#F4F3EE"/>

  <!-- South needle — muted -->
  <path d="M256,422 L236,268 L256,250 L276,268 Z" fill="#4A4944"/>

  <!-- East needle — muted -->
  <path d="M422,256 L268,276 L250,256 L268,236 Z" fill="#4A4944"/>

  <!-- West needle — muted -->
  <path d="M90,256 L244,236 L262,256 L244,276 Z" fill="#4A4944"/>

  <!-- Center dot -->
  <circle cx="256" cy="256" r="22" fill="#F4F3EE"/>
  <circle cx="256" cy="256" r="9"  fill="#1C1C1A"/>
</svg>`;

const svgBuf = Buffer.from(SVG);

async function pngAt(size) {
  return sharp(svgBuf).resize(size, size).png().toBuffer();
}

// ─── Multi-size ICO (PNG-in-ICO, Vista+ format) ───────────────────────────
function buildIco(entries) {
  // entries: [{ size, png }]
  const count = entries.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: ICO
  header.writeUInt16LE(count, 4);

  const dirEntries = entries.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry[2] = 0; // color count
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4);  // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...dirEntries, ...entries.map((e) => e.png)]);
}

// ─── Minimal ICNS (macOS) ─────────────────────────────────────────────────
// ic07=128, ic08=256, ic09=512 — wrap each PNG in an ICNS atom
function buildIcns(pngs) {
  const types = ["ic07", "ic08", "ic09"]; // 128, 256, 512
  const atoms = pngs.map((png, i) => {
    const type = Buffer.from(types[i]);
    const size = 8 + png.length;
    const header = Buffer.alloc(8);
    type.copy(header, 0);
    header.writeUInt32BE(size, 4);
    return Buffer.concat([header, png]);
  });
  const body = Buffer.concat(atoms);
  const totalSize = 8 + body.length;
  const fileHeader = Buffer.alloc(8);
  Buffer.from("icns").copy(fileHeader, 0);
  fileHeader.writeUInt32BE(totalSize, 4);
  return Buffer.concat([fileHeader, body]);
}

// ─── Generate ─────────────────────────────────────────────────────────────
console.log("Rendering icon SVG…");
const [p16, p32, p48, p128, p256, p512] = await Promise.all([
  pngAt(16), pngAt(32), pngAt(48), pngAt(128), pngAt(256), pngAt(512),
]);

writeFileSync(join(ICONS, "32x32.png"),       p32);
writeFileSync(join(ICONS, "128x128.png"),     p128);
writeFileSync(join(ICONS, "128x128@2x.png"),  p256);
writeFileSync(join(ICONS, "icon.png"),        p512);

writeFileSync(join(ICONS, "icon.ico"),
  buildIco([
    { size: 16,  png: p16  },
    { size: 32,  png: p32  },
    { size: 48,  png: p48  },
    { size: 256, png: p256 },
  ])
);

writeFileSync(join(ICONS, "icon.icns"),
  buildIcns([p128, p256, p512])
);

console.log("✓ Icons written to src-tauri/icons/");
