import { mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

/**
 * Generates the catalogue imagery locally: monochrome line-art "product plates"
 * on a zinc gradient, with the product name set in a serif face.
 *
 * Why generated instead of stock photography: keyword-searched photo pools are
 * unpredictable (wrong subjects, and in one audit run, unacceptable imagery), and
 * a public portfolio repo cannot ship unreviewed third-party photos. These plates
 * are deterministic, license-free, and visually consistent. Curated photography
 * is tracked separately and reviewed before it ever lands in the repo.
 */

type ShapeKey =
  | "headphones"
  | "headphones-open"
  | "speaker"
  | "dac"
  | "earbuds"
  | "mat"
  | "riser"
  | "keyboard"
  | "lamp"
  | "pen"
  | "pouch"
  | "cable"
  | "adapter"
  | "keyring";

type Plate = { slug: string; name: string; category: string; shape: ShapeKey };

const plates: Plate[] = [
  { slug: "monolith", name: "Monolith", category: "Audio", shape: "headphones" },
  { slug: "drift", name: "Drift", category: "Audio", shape: "headphones-open" },
  { slug: "ember", name: "Ember", category: "Audio", shape: "dac" },
  { slug: "halo", name: "Halo", category: "Audio", shape: "earbuds" },
  { slug: "cadence", name: "Cadence", category: "Audio", shape: "speaker" },
  { slug: "slate", name: "Slate", category: "Workspace", shape: "mat" },
  { slug: "axis", name: "Axis", category: "Workspace", shape: "riser" },
  { slug: "quill", name: "Quill", category: "Workspace", shape: "keyboard" },
  { slug: "lumen", name: "Lumen", category: "Workspace", shape: "lamp" },
  { slug: "ledger", name: "Ledger", category: "Workspace", shape: "pen" },
  { slug: "carry-01", name: "Carry 01", category: "Accessories", shape: "pouch" },
  { slug: "tether", name: "Tether", category: "Accessories", shape: "cable" },
  { slug: "anchor", name: "Anchor", category: "Accessories", shape: "adapter" },
  { slug: "orbit", name: "Orbit", category: "Accessories", shape: "keyring" },
];

const WIDTH = 1200;
const HEIGHT = 1500;

function keyboardKeys() {
  const keys: string[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const x = 128 + col * 44;
      const y = 248 + row * 40;
      keys.push(`<rect x="${x}" y="${y}" width="32" height="28" rx="4"/>`);
    }
  }
  keys.push(`<rect x="196" y="368" width="208" height="26" rx="5"/>`);
  return keys.join("");
}

function shape(key: ShapeKey): string {
  const common = 'fill="none" stroke="#52525b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"';

  switch (key) {
    case "headphones":
      return `<g ${common}>
        <path d="M120 340 v-50 a180 180 0 0 1 360 0 v50"/>
        <rect x="78" y="330" width="72" height="150" rx="32"/>
        <rect x="450" y="330" width="72" height="150" rx="32"/>
      </g>`;
    case "headphones-open":
      return `<g ${common}>
        <path d="M110 350 v-40 a190 190 0 0 1 380 0 v40"/>
        <circle cx="150" cy="400" r="62"/>
        <circle cx="450" cy="400" r="62"/>
        <circle cx="150" cy="400" r="26"/>
        <circle cx="450" cy="400" r="26"/>
        <path d="M188 400 h38 M424 400 h38" stroke-dasharray="6 8"/>
      </g>`;
    case "speaker":
      return `<g ${common}>
        <rect x="180" y="110" width="240" height="390" rx="20"/>
        <circle cx="300" cy="215" r="42"/>
        <circle cx="300" cy="380" r="72"/>
        <line x1="180" y1="292" x2="420" y2="292"/>
      </g>`;
    case "dac":
      return `<g ${common}>
        <rect x="140" y="215" width="320" height="185" rx="24"/>
        <rect x="175" y="250" width="130" height="56" rx="8"/>
        <circle cx="380" cy="278" r="30"/>
        <circle cx="380" cy="278" r="8"/>
        <path d="M175 340 h90 M290 340 h30 M345 340 h60"/>
      </g>`;
    case "earbuds":
      return `<g ${common}>
        <circle cx="215" cy="240" r="46"/>
        <path d="M215 286 v120"/>
        <circle cx="385" cy="240" r="46"/>
        <path d="M385 286 v120"/>
        <rect x="250" y="440" width="100" height="62" rx="18"/>
      </g>`;
    case "mat":
      return `<g ${common}>
        <path d="M120 200 h360 l-40 250 h-360 z" rx="8"/>
        <path d="M150 232 h300 l-30 186 h-300 z" stroke-dasharray="7 11"/>
        <circle cx="452" cy="222" r="8" fill="#52525b" stroke="none"/>
      </g>`;
    case "riser":
      return `<g ${common}>
        <rect x="205" y="120" width="190" height="122" rx="10"/>
        <path d="M265 242 v22 M335 242 v22"/>
        <path d="M150 300 h300 v40 h-300 z"/>
        <path d="M185 340 v96 M415 340 v96"/>
      </g>`;
    case "keyboard":
      return `<g ${common}>
        <rect x="100" y="220" width="400" height="180" rx="18"/>
        ${keyboardKeys()}
      </g>`;
    case "lamp":
      return `<g ${common}>
        <path d="M300 470 v-120"/>
        <path d="M180 350 h120 l-32 -86 h-56 z"/>
        <path d="M240 470 h120"/>
      </g>`;
    case "pen":
      return `<g ${common}>
        <rect x="270" y="110" width="60" height="330" rx="10"/>
        <path d="M270 440 l30 62 l30 -62 z"/>
        <line x1="300" y1="150" x2="300" y2="410"/>
      </g>`;
    case "pouch":
      return `<g ${common}>
        <path d="M160 225 h280 v215 a42 42 0 0 1 -42 42 h-196 a42 42 0 0 1 -42 -42 z"/>
        <path d="M160 305 h280" stroke-dasharray="5 7"/>
        <path d="M245 225 v-38 h110 v38"/>
        <circle cx="391" cy="305" r="11"/>
      </g>`;
    case "cable":
      return `<g ${common}>
        <path d="M140 380 c 80 -190 220 190 300 0"/>
        <rect x="110" y="352" width="40" height="56" rx="10"/>
        <rect x="450" y="352" width="40" height="56" rx="10"/>
      </g>`;
    case "adapter":
      return `<g ${common}>
        <rect x="190" y="210" width="220" height="210" rx="20"/>
        <rect x="235" y="168" width="20" height="52" rx="4"/>
        <rect x="345" y="168" width="20" height="52" rx="4"/>
        <circle cx="255" cy="315" r="26"/>
        <circle cx="345" cy="315" r="26"/>
        <path d="M255 315 h90" stroke-dasharray="5 7"/>
      </g>`;
    case "keyring":
      return `<g ${common}>
        <circle cx="300" cy="215" r="72"/>
        <rect x="360" y="255" width="120" height="160" rx="16"/>
        <circle cx="300" cy="215" r="18"/>
      </g>`;
  }
}

function textLayer(plate: Plate, index: string) {
  const fontSize = plate.name.length > 7 ? 70 : 84;
  return `<g opacity="0.95">
    <text x="90" y="120" fill="#71717a" font-family="ui-monospace, Menlo, monospace"
      font-size="22" letter-spacing="4">${index}</text>
    <text x="1110" y="120" text-anchor="end" fill="#3f3f46"
      font-family="ui-monospace, Menlo, monospace" font-size="20" letter-spacing="8">LUMINA</text>
    <text x="90" y="1318" fill="#fafafa" font-family="Georgia, 'Times New Roman', serif"
      font-size="${fontSize}">${plate.name}</text>
    <text x="92" y="1372" fill="#71717a" font-family="ui-monospace, Menlo, monospace"
      font-size="20" letter-spacing="7">${plate.category.toUpperCase()}</text>
    <line x1="92" y1="1404" x2="152" y2="1404" stroke="#bef264" stroke-width="4"/>
  </g>`;
}

function background() {
  return `<defs>
    <radialGradient id="bg" cx="50%" cy="34%" r="78%">
      <stop offset="0%" stop-color="#1c1c20"/>
      <stop offset="60%" stop-color="#111113"/>
      <stop offset="100%" stop-color="#09090b"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="600" cy="560" r="300" fill="#15151a"/>
  <circle cx="600" cy="560" r="300" fill="none" stroke="#1f1f24" stroke-width="2"/>`;
}

function plateSvg(plate: Plate, variant: 1 | 2 | 3) {
  const index = String(plates.indexOf(plate) + 1).padStart(2, "0");

  const transform =
    variant === 1
      ? "translate(300, 300) scale(1.02)"
      : variant === 2
        ? "translate(160, 120) scale(1.75)"
        : "translate(250, 260) rotate(-7 300 300) scale(1.08)";

  const chrome = variant === 2 ? "" : textLayer(plate, index);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    ${background()}
    <g transform="${transform}">
      ${shape(plate.shape)}
      <circle cx="500" cy="520" r="7" fill="#bef264"/>
    </g>
    ${chrome}
  </svg>`;
}

async function main() {
  for (const plate of plates) {
    const dir = path.join("public", "products", plate.slug);
    await mkdir(dir, { recursive: true });

    for (const variant of [1, 2, 3] as const) {
      const name = `0${variant}`;
      const svg = plateSvg(plate, variant);

      await sharp(Buffer.from(svg))
        .avif({ quality: 62, effort: 5 })
        .toFile(path.join(dir, `${name}.avif`));
      await sharp(Buffer.from(svg))
        .webp({ quality: 84 })
        .toFile(path.join(dir, `${name}.webp`));
    }

    console.log(`${plate.slug}: 3 plates`);
  }

  await mkdir(path.join("public", "collections"), { recursive: true });

  const collections = [
    { slug: "audio", title: "Audio", copy: "Headphones, DACs, speakers" },
    { slug: "workspace", title: "Workspace", copy: "Desk objects that earn their space" },
    { slug: "accessories", title: "Accessories", copy: "Cables, pouches, adapters" },
  ];

  for (const collection of collections) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1125">
      ${background()}
      <text x="120" y="520" fill="#fafafa" font-family="Georgia, 'Times New Roman', serif" font-size="132">${collection.title}</text>
      <text x="124" y="596" fill="#71717a" font-family="ui-monospace, Menlo, monospace" font-size="26" letter-spacing="6">${collection.copy.toUpperCase()}</text>
      <line x1="124" y1="650" x2="224" y2="650" stroke="#bef264" stroke-width="6"/>
      <text x="1880" y="1040" text-anchor="end" fill="#3f3f46" font-family="ui-monospace, Menlo, monospace" font-size="24" letter-spacing="10">LUMINA</text>
    </svg>`;

    await sharp(Buffer.from(svg)).avif({ quality: 60, effort: 5 }).toFile(path.join("public", "collections", `${collection.slug}.avif`));
    await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(path.join("public", "collections", `${collection.slug}.webp`));
    console.log(`collection ${collection.slug}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
