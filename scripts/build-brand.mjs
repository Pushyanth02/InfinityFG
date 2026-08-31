/* ============================================================================
   ARCHMAGE brand-asset pipeline (v1.1).
   ----------------------------------------------------------------------------
   One command rebuilds EVERY icon / favicon / banner / logo in public/ from
   the committed source art in public/art/src/:

     node scripts/build-brand.mjs        (or: bun run brand)

   Outputs
   ─ icons     : favicon.ico (16/32/48), favicon.svg, favicon-16x16.png,
                 favicon-32x32.png, apple-touch-icon.png (180),
                 icon-192.png, icon-512.png, maskable-icon.png (512),
                 site.webmanifest, logo.svg (the sigil mark)
   ─ banners   : art/og-image.png (1200×630 Open Graph),
                 art/twitter-card.png (1200×600),
                 art/banner.png (1280×640 — GitHub social preview),
                 art/preview.png (1600×900 — store/itch preview)
   ─ cover     : art/cover.png (1600×900 true-PNG menu backdrop)

   The sigil (rift-gate diamond + gold bolt) is authored here as parameterized
   SVG so every raster stays pixel-crisp at any size. Brand palette:
   night #0b0716 · gold #f5c96b/#ffe9ad · violet #9a7bff.
   ============================================================================ */

import sharp from "sharp";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(ROOT, "public");
const ART = path.join(PUB, "art");
const SRC = path.join(ART, "src");
await mkdir(SRC, { recursive: true });

const NIGHT = "#0b0716";
const GOLD = "#f5c96b";
const GOLD_L = "#ffe9ad";
const GOLD_D = "#c98a2e";
const VIOLET = "#9a7bff";

/* ----------------------------------------------------------------- sigil --- */
// Sigil is now provided via an external raster image (logo.png)

async function renderImage(buf, out, size) {
  await sharp(buf)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: size <= 512 })
    .toFile(out);
}

/* ----------------------------------------------------------------- ICO ----- */
/* Multi-size favicon.ico with PNG-encoded frames (Vista+; every modern
   browser). Layout: 6-byte header + N×16-byte directory + PNG blobs. */
async function buildIco(frames, out) {
  const pngs = [];
  for (const [size, buf] of frames) {
    const png = await sharp(buf)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toBuffer();
    pngs.push({ size, png });
  }
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + pngs.length * 16;
  const dir = Buffer.alloc(pngs.length * 16);
  pngs.forEach(({ size, png }, i) => {
    const e = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, e);
    dir.writeUInt8(size >= 256 ? 0 : size, e + 1);
    dir.writeUInt8(0, e + 2); dir.writeUInt8(0, e + 3);
    dir.writeUInt16LE(1, e + 4); dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(png.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  await writeFile(out, Buffer.concat([header, dir, ...pngs.map((p) => p.png)]));
}

/* ------------------------------------------------------------- banners ----- */
/* Title lockup composited over the AI key art with a night scrim so the
   rasterized text is crisp and crawler-safe. We use an upgraded layout and
   typography to match the new dynamic brand identity. */
function bannerOverlaySvg(w, h, { titleSize, subSize, chip = true } = {}) {
  const cx = w / 2;
  const titleY = Math.round(h * 0.35);
  const subY = Math.round(h * 0.35 + titleSize * 0.55);
  const tagY = h - 48;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
<defs>
<linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${NIGHT}" stop-opacity="0.85"/>
<stop offset="0.5" stop-color="${NIGHT}" stop-opacity="0.2"/>
<stop offset="1" stop-color="${NIGHT}" stop-opacity="0.95"/>
</linearGradient>
<linearGradient id="gline" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="${VIOLET}" stop-opacity="0"/><stop offset="0.3" stop-color="${VIOLET}" stop-opacity="0.8"/><stop offset="0.5" stop-color="${GOLD}" stop-opacity="1"/><stop offset="0.7" stop-color="${VIOLET}" stop-opacity="0.8"/><stop offset="1" stop-color="${VIOLET}" stop-opacity="0"/>
</linearGradient>
<filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
<feGaussianBlur stdDeviation="${(titleSize * 0.08).toFixed(1)}" result="b"/>
<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="glowSub" x="-20%" y="-20%" width="140%" height="140%">
<feGaussianBlur stdDeviation="${(subSize * 0.15).toFixed(1)}" result="b"/>
<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
</defs>
<rect width="${w}" height="${h}" fill="url(#scrim)"/>
<text x="${cx}" y="${titleY}" text-anchor="middle" font-family="'Pixel Demon', 'Courier New', monospace" font-weight="900"
 font-size="${Math.round(titleSize * 0.95)}" letter-spacing="${Math.round(titleSize * 0.08)}" fill="#ff8a00" filter="url(#glow)">ARCHMAGE</text>
<rect x="${cx - w * 0.4}" y="${subY - 8}" width="${w * 0.8}" height="2" fill="url(#gline)"/>
<text x="${cx}" y="${subY + subSize}" text-anchor="middle" font-family="'Pixel Demon', 'Courier New', monospace" font-weight="900"
 font-size="${Math.round(subSize * 0.9)}" letter-spacing="${Math.round(subSize * 0.4)}" fill="#ffc857" filter="url(#glowSub)">RIFT SURVIVOR</text>
${chip ? `
<rect x="${cx - 160}" y="${tagY - 70}" width="320" height="40" rx="20" fill="rgba(255,138,0,0.15)" stroke="rgba(255,138,0,0.8)" stroke-width="2"/>
<text x="${cx}" y="${tagY - 44}" text-anchor="middle" font-family="'Pixel Demon', 'Courier New', monospace" font-weight="bold"
 font-size="14" letter-spacing="3" fill="#ff8a00">V 1 . 1 · TRUE DIRECTION</text>` : ""}
</svg>`;
}

async function banner(src, out, w, h) {
  await sharp(src)
    .resize(w, h, { fit: "inside" })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(out);
}

/* --------------------------------------------------------------- build ----- */
const keyart = path.join(SRC, "keyart.png");
const coverSrc = path.join(SRC, "cover.png");
const posterSrc = path.join(SRC, "poster.jpg");
const logoSrc = path.join(SRC, "logo.png");
if (!existsSync(keyart) || !existsSync(coverSrc) || !existsSync(logoSrc)) {
  console.error("Missing source art — expected public/art/src/{keyart,cover,logo}.png");
  process.exit(1);
}

const log = (k) => console.log("  ✓", k);

/* icons — using uploaded logo */
const std = await readFile(logoSrc);
const tiny = std;

const b64 = std.toString("base64");
const svgWrap = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><image href="data:image/png;base64,${b64}" width="512" height="512"/></svg>`;
await writeFile(path.join(PUB, "favicon.svg"), svgWrap);
await writeFile(path.join(PUB, "logo.svg"), svgWrap);
await writeFile(path.join(PUB, "logo.png"), std);
log("favicon.svg / logo.svg / logo.png");

await renderImage(tiny, path.join(PUB, "favicon-16x16.png"), 16);
await renderImage(tiny, path.join(PUB, "favicon-32x32.png"), 32);
await buildIco([[16, tiny], [32, tiny], [48, std]], path.join(PUB, "favicon.ico"));
log("favicon-16x16.png / favicon-32x32.png / favicon.ico (16/32/48)");

await renderImage(std, path.join(PUB, "apple-touch-icon.png"), 180);
await renderImage(std, path.join(PUB, "icon-192.png"), 192);
await renderImage(std, path.join(PUB, "icon-512.png"), 512);
await renderImage(std, path.join(PUB, "maskable-icon.png"), 512);
log("apple-touch-icon (180) / icon-192 / icon-512 / maskable-512");

await writeFile(path.join(PUB, "site.webmanifest"), JSON.stringify({
  name: "Archmage — Rift Survivor",
  short_name: "Archmage",
  description: "A pure arcade roguelike. Thirteen dark arts, seventy-eight resonances, five shuffled tyrants — weave the requiem and seal the rift.",
  start_url: ".",
  scope: ".",
  display: "fullscreen",
  orientation: "any",
  background_color: NIGHT,
  theme_color: NIGHT,
  icons: [
    { src: "icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "maskable-icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
}, null, 2) + "\n");
log("site.webmanifest");

/* banners — every social/preview shape the game ships */
await banner(posterSrc, path.join(ART, "og-image.png"), 1200, 630);
log("art/og-image.png (1200×630)");
await banner(posterSrc, path.join(ART, "twitter-card.png"), 1200, 600);
log("art/twitter-card.png (1200×600)");
await banner(posterSrc, path.join(ART, "banner.png"), 1280, 640);
log("art/banner.png (1280×640 — GitHub social preview)");
await banner(posterSrc, path.join(ART, "preview.png"), 1600, 900);
log("art/preview.png (1600×900)");

/* cover — the ONE menu backdrop; true PNG, darkened to sit behind the menu */
await sharp(coverSrc)
  .resize(1600, 900, { fit: "cover" })
  .modulate({ brightness: 0.82, saturation: 1.05 })
  .png({ compressionLevel: 9, palette: true, quality: 92 })
  .toFile(path.join(ART, "cover.png"));
log("art/cover.png (1600×900, true PNG)");

console.log("\nArchmage brand assets rebuilt — public/ is fully regenerated.");
