const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Standard CRC32 table for PNG chunk checksums
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);

  return Buffer.concat([len, body, crcBuf]);
}

function generatePng(width, height, getPixelRgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Scanlines with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRgba(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Ensure directory exists
const targetDir = path.join(__dirname, '..', 'src', 'assets', 'images');
fs.mkdirSync(targetDir, { recursive: true });

// 1. App Icon (1024x1024) - Emerald & Warm Terracotta Red Panda Motif
const iconBuffer = generatePng(256, 256, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  
  // Outer circle (Warm terracotta/emerald badge)
  if (dist < 110) {
    if (dist < 80) {
      // Inner head face (#E66B40)
      return [230, 107, 64, 255];
    }
    // Emerald border (#10B981)
    return [16, 185, 129, 255];
  }
  // Off-white soft background (#FAFAF7)
  return [250, 250, 247, 255];
});

fs.writeFileSync(path.join(targetDir, 'icon.png'), iconBuffer);
console.log('Generated icon.png');

// 2. Adaptive Icon (512x512)
const adaptiveBuffer = generatePng(256, 256, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  
  if (dist < 85) {
    return [230, 107, 64, 255];
  }
  return [0, 0, 0, 0]; // Transparent background for adaptive foreground
});
fs.writeFileSync(path.join(targetDir, 'adaptive-icon.png'), adaptiveBuffer);
console.log('Generated adaptive-icon.png');

// 3. Splash Screen (400x800) - Clean minimalist Warm Organic off-white
const splashBuffer = generatePng(200, 400, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  
  if (dist < 40) {
    return [230, 107, 64, 255]; // Bao avatar dot in center
  }
  return [250, 250, 247, 255]; // Background #FAFAF7
});
fs.writeFileSync(path.join(targetDir, 'splash.png'), splashBuffer);
console.log('Generated splash.png');
