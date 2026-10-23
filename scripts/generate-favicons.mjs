import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const source = new URL('../docs/design/assets/favicon.svg', import.meta.url);
const publicDir = new URL('../public/', import.meta.url);

// The design asset carries a C2PA provenance blob; keep the published favicon lean.
const svg = readFileSync(source, 'utf8').replace(/<metadata>[\s\S]*?<\/metadata>/, '');
writeFileSync(new URL('favicon.svg', publicDir), svg);

const targets = [
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
];
for (const [file, size] of targets) {
  await sharp(Buffer.from(svg), { density: (size / 32) * 72 * 4 })
    .resize(size, size)
    .png()
    .toFile(new URL(file, publicDir).pathname);
}
console.log('Wrote favicon.svg, favicon-32.png, apple-touch-icon.png');
