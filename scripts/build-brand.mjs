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
import { mkdir, writeFile } from "node:fs/promises";
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
/* The Archmage mark: a rift gate (elongated diamond) torn by a gold bolt.
     pad     — inset fraction (0.10 standard, 0.24 maskable safe zone)
     stroke  — gate outline weight in the 512 viewBox
     bg      — background rect ("none" = transparent)
     corner  — background corner radius (0 = square full-bleed)             */
function sigilSvg({ pad = 0.1, stroke = 30, bg = NIGHT, corner = 112, embers = true } = {}) {
  const inset = 512 * pad;
  const s = (512 - inset * 2) / 512; // content scale for this padding
  const cx = 256, cy = 256;
  const P = (x, y) => {
    const px = cx + (x - cx) * s, py = cy + (y - cy) * s;
    return [px.toFixed(1), py.toFixed(1)];
  };
  const [gx1, gy1] = P(256, 78), [gx2, gy2] = P(410, 256), [gx3, gy3] = P(256, 434), [gx4, gy4] = P(102, 256);
  const [kx1, ky1] = P(256, 128), [kx2, ky2] = P(356, 256), [kx3, ky3] = P(256, 384), [kx4, ky4] = P(156, 256);
  const [b1x, b1y] = P(265, 121), [b2x, b2y] = P(129, 275), [b3x] = P(220, 275), [b4x, b4y] = P(224, 384), [b5x, b5y] = P(386, 234), [b6x] = P(265, 234), [b7x, b7y] = P(283, 121);
  const [e1x, e1y] = P(122, 118), [e2x, e2y] = P(396, 152), [e3x, e3y] = P(384, 396);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${GOLD_L}"/><stop offset="0.55" stop-color="${GOLD}"/><stop offset="1" stop-color="${GOLD_D}"/>
</linearGradient>
<linearGradient id="r" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${VIOLET}"/><stop offset="1" stop-color="#5a3fae"/>
</linearGradient>
<radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
<stop offset="0" stop-color="${VIOLET}" stop-opacity="0.5"/><stop offset="0.75" stop-color="${VIOLET}" stop-opacity="0.12"/><stop offset="1" stop-color="${VIOLET}" stop-opacity="0"/>
</radialGradient>
</defs>
${bg !== "none" ? `<rect width="512" height="512" rx="${corner}" fill="${bg}"/>` : ""}
<circle cx="256" cy="256" r="${(230 * s + inset * 0.35).toFixed(1)}" fill="url(#halo)"/>
<path d="M${gx1} ${gy1} L${gx2} ${gy2} L${gx3} ${gy3} L${gx4} ${gy4} Z" fill="none" stroke="url(#g)" stroke-width="${(stroke * s).toFixed(1)}" stroke-linejoin="miter" stroke-miterlimit="16"/>
<path d="M${kx1} ${ky1} L${kx2} ${ky2} L${kx3} ${ky3} L${kx4} ${ky4} Z" fill="url(#r)" opacity="0.55"/>
<path d="M${b1x} ${b1y} L${b2x} ${b2y} H${b3x} L${b4x} ${b4y} L${b5x} ${b5y} H${b6x} L${b7x} ${b7y} Z" fill="url(#g)"/>
${embers ? `
<circle cx="${e1x}" cy="${e1y}" r="${(7 * s).toFixed(1)}" fill="${GOLD_L}" opacity="0.9"/>
<circle cx="${e2x}" cy="${e2y}" r="${(5 * s).toFixed(1)}" fill="${GOLD}" opacity="0.85"/>
<circle cx="${e3x}" cy="${e3y}" r="${(6 * s).toFixed(1)}" fill="${VIOLET}" opacity="0.95"/>` : ""}
</svg>`;
}

async function renderSvg(svg, out, size) {
  await sharp(Buffer.from(svg), { density: 300 })
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
    const png = await sharp(Buffer.from(buf), { density: 300 })
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
   rasterized text is crisp and crawler-safe (no font dependency in the
   raster). DejaVu Serif Bold ≈ the in-game Cinzel display voice. */
function bannerOverlaySvg(w, h, { titleSize, subSize, chip = true, tagline = true } = {}) {
  const cx = w / 2;
  const titleY = Math.round(h * 0.30);
  const subY = Math.round(h * 0.30 + titleSize * 0.52);
  const tagY = h - 42;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
<defs>
<linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${NIGHT}" stop-opacity="0.92"/>
<stop offset="0.45" stop-color="${NIGHT}" stop-opacity="0.30"/>
<stop offset="1" stop-color="${NIGHT}" stop-opacity="0.78"/>
</linearGradient>
<linearGradient id="gline" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="${GOLD}" stop-opacity="0"/><stop offset="0.5" stop-color="${GOLD}" stop-opacity="0.9"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
</linearGradient>
<filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
<feGaussianBlur stdDeviation="${(titleSize * 0.07).toFixed(1)}" result="b"/>
<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
</defs>
<rect width="${w}" height="${h}" fill="url(#scrim)"/>
<text x="${cx}" y="${titleY}" text-anchor="middle" font-family="DejaVu Serif" font-weight="bold"
 font-size="${titleSize}" letter-spacing="${Math.round(titleSize * 0.16)}" fill="#f5e3b3" filter="url(#glow)">ARCHMAGE</text>
<rect x="${cx - w * 0.26}" y="${subY - 4}" width="${w * 0.52}" height="2" fill="url(#gline)"/>
<text x="${cx}" y="${subY + subSize + 2}" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold"
 font-size="${subSize}" letter-spacing="${Math.round(subSize * 0.55)}" fill="#c9bdf0">RIFT SURVIVOR</text>
${tagline ? `<text x="${cx}" y="${tagY}" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold"
 font-size="${Math.max(16, Math.round(h * 0.032))}" letter-spacing="2" fill="#9a7bff">13 dark arts · 78 resonances · 5 shuffled tyrants · one rift</text>` : ""}
${chip ? `
<rect x="${cx - 132}" y="${tagY - 62}" width="264" height="36" rx="18" fill="rgba(245,201,107,0.12)" stroke="rgba(245,201,107,0.65)" stroke-width="1.5"/>
<text x="${cx}" y="${tagY - 38}" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold"
 font-size="15" letter-spacing="3" fill="${GOLD}">V 1 . 1 · TRUE DIRECTION</text>` : ""}
</svg>`;
}

async function banner(src, out, w, h, opts = {}) {
  const overlay = Buffer.from(bannerOverlaySvg(w, h, opts));
  await sharp(src)
    .resize(w, h, { fit: "cover", position: sharp.strategy.attention })
    .composite([{ input: overlay }])
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(out);
}

/* --------------------------------------------------------------- build ----- */
const keyart = path.join(SRC, "keyart.png");
const coverSrc = path.join(SRC, "cover.png");
if (!existsSync(keyart) || !existsSync(coverSrc)) {
  console.error("Missing source art — expected public/art/src/{keyart,cover}.png");
  process.exit(1);
}

const log = (k) => console.log("  ✓", k);

/* icons — standard padding, rounded night chip */
const std = Buffer.from(sigilSvg({}));
const tiny = Buffer.from(sigilSvg({ pad: 0.08, stroke: 38, embers: false })); // bolder for ≤48px
await writeFile(path.join(PUB, "favicon.svg"), sigilSvg({ pad: 0.06, corner: 96 }));
await writeFile(path.join(PUB, "logo.svg"), sigilSvg({ bg: "none", corner: 0, pad: 0.04 }));
log("favicon.svg / logo.svg");

await renderSvg(tiny, path.join(PUB, "favicon-16x16.png"), 16);
await renderSvg(tiny, path.join(PUB, "favicon-32x32.png"), 32);
await buildIco([[16, tiny], [32, tiny], [48, std]], path.join(PUB, "favicon.ico"));
log("favicon-16x16.png / favicon-32x32.png / favicon.ico (16/32/48)");

await renderSvg(std, path.join(PUB, "apple-touch-icon.png"), 180);
await renderSvg(std, path.join(PUB, "icon-192.png"), 192);
await renderSvg(std, path.join(PUB, "icon-512.png"), 512);
await renderSvg(
  Buffer.from(sigilSvg({ pad: 0.24, corner: 0, embers: false })), // 80%-safe-zone, full-bleed
  path.join(PUB, "maskable-icon.png"), 512,
);
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
await banner(keyart, path.join(ART, "og-image.png"), 1200, 630, { titleSize: 108, subSize: 30 });
log("art/og-image.png (1200×630)");
await banner(keyart, path.join(ART, "twitter-card.png"), 1200, 600, { titleSize: 100, subSize: 28 });
log("art/twitter-card.png (1200×600)");
await banner(keyart, path.join(ART, "banner.png"), 1280, 640, { titleSize: 104, subSize: 29, tagline: false });
log("art/banner.png (1280×640 — GitHub social preview)");
await banner(keyart, path.join(ART, "preview.png"), 1600, 900, { titleSize: 128, subSize: 36 });
log("art/preview.png (1600×900)");

/* cover — the ONE menu backdrop; true PNG, darkened to sit behind the menu */
await sharp(coverSrc)
  .resize(1600, 900, { fit: "cover" })
  .modulate({ brightness: 0.82, saturation: 1.05 })
  .png({ compressionLevel: 9, palette: true, quality: 92 })
  .toFile(path.join(ART, "cover.png"));
log("art/cover.png (1600×900, true PNG)");

console.log("\nArchmage brand assets rebuilt — public/ is fully regenerated.");
