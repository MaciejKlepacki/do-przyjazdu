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

function segmentDistance(x,y,a,b) {
  const dx=b[0]-a[0], dy=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
  return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);
}

function icon(size,scale) {
  return (u,v) => {
    const color=[0,0,0];
    const samples=4;
    for(let sy=0;sy<samples;sy++)for(let sx=0;sx<samples;sx++) {
      const x=((u+(sx+.5)/(samples*size)-.5)/scale+.5)*64;
      const y=((v+(sy+.5)/(samples*size)-.5)/scale+.5)*64;
      const cream=(Math.abs(Math.hypot(x-18,y-39)-10)<=3 && !(x>18 && y<39))
        || segmentDistance(x,y,[28,14],[28,39])<=3 || segmentDistance(x,y,[18,29],[28,29])<=3;
      const lime=(Math.abs(Math.hypot(x-46,y-25)-10)<=3 && !(x<46 && y>25))
        || segmentDistance(x,y,[36,50],[36,25])<=3 || segmentDistance(x,y,[46,35],[36,35])<=3;
      const sample=lime?[213,232,161]:cream?[247,249,252]:[24,36,58];
      for(let k=0;k<3;k++)color[k]+=sample[k]/(samples*samples);
    }
    return [...color.map(Math.round),255];
  };
}

const out = 'apps/web/public/icons/';
writeFileSync(out + 'icon-192.png', png(192, icon(192,1)));
writeFileSync(out + 'icon-512.png', png(512, icon(512,1)));
writeFileSync(out + 'icon-maskable-512.png', png(512, icon(512,0.75)));
console.log('Ikony zapisane w', out);
