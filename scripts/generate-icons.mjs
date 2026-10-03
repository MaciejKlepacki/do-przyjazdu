// Generuje ikony PWA (bez zależności): granatowe tło, biały krzyż, pomarańczowy pasek.
// Uruchomienie: node scripts/generate-icons.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) raw.set(pixel(x / size, y / size), y * (size * 4 + 1) + 1 + x * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const NAVY = [11, 26, 43, 255];
const WHITE = [255, 255, 255, 255];
const ORANGE = [255, 176, 32, 255];

function icon(scale) {
  // scale < 1 zostawia margines bezpieczny dla ikon maskable.
  return (u, v) => {
    const x = (u - 0.5) / scale + 0.5;
    const y = (v - 0.5) / scale + 0.5;
    const arm = 0.13;
    const inCross = (Math.abs(x - 0.5) < arm && y > 0.18 && y < 0.72) || (Math.abs(y - 0.45) < arm && x > 0.23 && x < 0.77);
    if (inCross) return WHITE;
    if (y > 0.8 && y < 0.86 && x > 0.2 && x < 0.8) return ORANGE;
    return NAVY;
  };
}

const out = 'apps/web/public/icons/';
writeFileSync(out + 'icon-192.png', png(192, icon(1)));
writeFileSync(out + 'icon-512.png', png(512, icon(1)));
writeFileSync(out + 'icon-maskable-512.png', png(512, icon(0.75)));
console.log('Ikony zapisane w', out);
