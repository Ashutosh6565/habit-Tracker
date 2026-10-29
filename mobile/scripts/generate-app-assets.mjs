import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(process.cwd());
const outDir = path.join(root, "assets");
fs.mkdirSync(outDir, { recursive: true });

const GREEN_LIGHT = "#22C55E";
const GREEN = "#16A34A";
const GREEN_DEEP = "#0B6B3A";
const INK = "#0C1F16";

const flamePath =
  "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z";

const flame = (size, stroke = 2, color = "#FFFFFF") =>
  `<g transform="translate(${512 - size / 2} ${512 - size / 2}) scale(${size / 24})">
     <path d="${flamePath}" fill="none" stroke="${color}" stroke-width="${stroke}"
       stroke-linecap="round" stroke-linejoin="round"/>
   </g>`;

const gradient = `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${GREEN_LIGHT}"/>
    <stop offset="0.55" stop-color="${GREEN}"/>
    <stop offset="1" stop-color="${GREEN_DEEP}"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/>
    <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
</defs>`;

const iconBackgroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${gradient}
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  <g opacity="0.10" fill="none" stroke="#FFFFFF" stroke-width="2">
    <circle cx="512" cy="512" r="330"/>
    <circle cx="512" cy="512" r="430"/>
  </g>
</svg>`;

const iconForegroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${flame(620, 2)}
</svg>`;

const iconOnlySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${gradient}
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  <g opacity="0.10" fill="none" stroke="#FFFFFF" stroke-width="2">
    <circle cx="512" cy="512" r="330"/>
    <circle cx="512" cy="512" r="430"/>
  </g>
  ${flame(470, 2.1)}
</svg>`;

const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
  <defs>
    <radialGradient id="splashGlow" cx="0.5" cy="0.46" r="0.5">
      <stop offset="0" stop-color="${GREEN}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="${INK}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GREEN_LIGHT}"/>
      <stop offset="0.55" stop-color="${GREEN}"/>
      <stop offset="1" stop-color="${GREEN_DEEP}"/>
    </linearGradient>
    <linearGradient id="word" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#D6F5E3"/>
    </linearGradient>
  </defs>
  <rect width="2732" height="2732" fill="${INK}"/>
  <rect width="2732" height="2732" fill="url(#splashGlow)"/>
  <g transform="translate(1366 1120)">
    <rect x="-330" y="-330" width="660" height="660" rx="170" fill="url(#tile)"/>
    <g transform="translate(-165 -169) scale(13.75)">
      <path d="${flamePath}" fill="none" stroke="#FFFFFF" stroke-width="2.1"
        stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <text x="1366" y="1720" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif"
    font-size="190" font-weight="700" letter-spacing="-4" fill="url(#word)">Habbiters</text>
  <text x="1366" y="1840" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif"
    font-size="64" font-weight="500" letter-spacing="2" fill="#9CB8A8">SMALL REPS. UNFAIR MOMENTUM.</text>
</svg>`;

const write = async (name, svg) => {
  const file = path.join(outDir, name);
  await sharp(Buffer.from(svg)).png().toFile(file);
  console.log("wrote", path.relative(root, file));
};

await write("icon-background.png", iconBackgroundSvg);
await write("icon-foreground.png", iconForegroundSvg);
await write("icon-only.png", iconOnlySvg);
await write("splash.png", splashSvg);
await write("splash-dark.png", splashSvg);
