// Generuje ikony PWA (bez zależności): znak „Do przyjazdu” — czerwony gradient, białe szczyty.
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

// Ten sam znak co logo w aplikacji: czerwony gradient, białe szczyty, krzyżyk nad szczytem.
// Współrzędne w siatce 64×64 (jak SVG w components/ui.tsx), wygładzanie 4×4 próbki na piksel.
const MOUNTAIN = [[8, 48], [24, 25], [31, 34], [40, 19], [56, 48]];
const inPoly = (x, y, poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const inCross = (x, y) => (Math.abs(y - 12) < 1.3 && Math.abs(x - 32) < 4.3) || (Math.abs(x - 32) < 1.3 && Math.abs(y - 12) < 4.3);

function icon(scale) {
  // scale < 1 zostawia margines bezpieczny dla ikon maskable.
  return (u, v) => {
    const top = [255, 106, 85];
    const bottom = [232, 38, 28];
    const bg = top.map((c, i) => Math.round(c + (bottom[i] - c) * v));
    let white = 0;
    const N = 4;
    for (let sy = 0; sy < N; sy++) {
      for (let sx = 0; sx < N; sx++) {
        const x = ((u + sx / (N * 640) - 0.5) / scale + 0.5) * 64;
        const y = ((v + sy / (N * 640) - 0.5) / scale + 0.5) * 64;
        if (inPoly(x, y, MOUNTAIN) || inCross(x, y)) white++;
      }
    }
    const a = white / (N * N);
    return [...bg.map((c) => Math.round(c + (255 - c) * a)), 255];
  };
}

const out = 'apps/web/public/icons/';
writeFileSync(out + 'icon-192.png', png(192, icon(1)));
writeFileSync(out + 'icon-512.png', png(512, icon(1)));
writeFileSync(out + 'icon-maskable-512.png', png(512, icon(0.75)));
console.log('Ikony zapisane w', out);
