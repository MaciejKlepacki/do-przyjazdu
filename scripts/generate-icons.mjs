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

const points = [[16,40],[25,40]];
for (let n=1;n<=40;n++) {
  const t=n/40, a=1-t;
  points.push([a*a*a*25+3*a*a*t*35+3*a*t*t*29+t*t*t*40, a*a*a*40+3*a*a*t*40+3*a*t*t*24+t*t*t*24]);
}
points.push([48,24]);

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
      const orange=Math.hypot(x-16,y-40)<=5;
      const cream=Math.hypot(x-48,y-24)<=5 || points.some((p,n)=>n>0 && segmentDistance(x,y,points[n-1],p)<=2.5);
      const sample=orange?[237,135,86]:cream?[255,254,248]:[25,46,40];
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
