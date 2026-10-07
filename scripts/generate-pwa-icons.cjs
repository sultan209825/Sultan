const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'binary');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function createPng(w, h, getPixel) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const raw = Buffer.alloc(h * (1 + w * 4));
  let offset = 0;
  for (let y = 0; y < h; y++) {
    raw[offset++] = 0; // Filter None
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = getPixel(x, y, w, h);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }
  const idatChunk = makeChunk('IDAT', zlib.deflateSync(raw));
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function renderSultanIcon(x, y, w, h, isMaskable = false) {
  // Coordinates normalized to -1 .. 1
  const cx = (x / w) * 2 - 1;
  const cy = (y / h) * 2 - 1;
  const dist = Math.sqrt(cx * cx + cy * cy);

  // Background deep royal gradient: #0a0a14 to #030306
  const bgR = Math.floor(10 - 6 * (cy * 0.5 + 0.5));
  const bgG = Math.floor(10 - 7 * (cy * 0.5 + 0.5));
  const bgB = Math.floor(20 - 14 * (cy * 0.5 + 0.5));

  // Radial neon crimson / purple glow from center
  const glow = Math.max(0, 1 - dist * 1.1);
  const glowR = Math.floor(glow * 220);
  const glowG = Math.floor(glow * 35);
  const glowB = Math.floor(glow * 55);

  let r = Math.min(255, bgR + glowR);
  let g = Math.min(255, bgG + glowG);
  let b = Math.min(255, bgB + glowB);
  let a = 255;

  // Outer border ring for standard icon
  const safeScale = isMaskable ? 0.7 : 0.88;
  const normDist = dist / safeScale;

  if (!isMaskable && normDist > 0.94 && normDist < 1.0) {
    // Subtle luxury gold/crimson edge
    const edgeAlpha = Math.sin((normDist - 0.94) / 0.06 * Math.PI);
    r = Math.min(255, Math.floor(r + 200 * edgeAlpha));
    g = Math.min(255, Math.floor(g + 160 * edgeAlpha));
    b = Math.min(255, Math.floor(b + 70 * edgeAlpha));
  }

  // Draw Crown & 'S' symbol at center within safe zone
  // Scale x, y for symbol drawing
  const sx = cx / safeScale;
  const sy = cy / safeScale;

  // Crown shape test
  // Crown base: sy in [0.05, 0.2], sx in [-0.4, 0.4]
  let isCrown = false;
  if (sy >= 0.05 && sy <= 0.22 && Math.abs(sx) <= 0.42) {
    isCrown = true;
  }
  // 3 peaks:
  // Left peak: sx ~ -0.32, sy ~ -0.25
  // Center peak: sx ~ 0, sy ~ -0.38
  // Right peak: sx ~ 0.32, sy ~ -0.25
  if (sy < 0.05 && sy >= -0.4) {
    const leftPeak = Math.abs(sx - (-0.3)) < 0.12 && sy >= -0.28 + Math.abs(sx - (-0.3)) * 2;
    const centerPeak = Math.abs(sx) < 0.14 && sy >= -0.40 + Math.abs(sx) * 2.2;
    const rightPeak = Math.abs(sx - 0.3) < 0.12 && sy >= -0.28 + Math.abs(sx - 0.3) * 2;
    if (leftPeak || centerPeak || rightPeak) {
      isCrown = true;
    }
  }

  // Central ruby/jewel dot in crown
  const isJewel = (Math.abs(sx) < 0.06 && Math.abs(sy - (-0.05)) < 0.06) ||
                  (Math.abs(sx + 0.3) < 0.04 && Math.abs(sy - (-0.05)) < 0.04) ||
                  (Math.abs(sx - 0.3) < 0.04 && Math.abs(sy - (-0.05)) < 0.04);

  // 'S' glyph under the crown in sy in [0.28, 0.65]
  let isGlyph = false;
  if (sy >= 0.28 && sy <= 0.68 && Math.abs(sx) <= 0.35) {
    const sdist = Math.sqrt(sx * sx + (sy - 0.38) * (sy - 0.38));
    const sdist2 = Math.sqrt(sx * sx + (sy - 0.58) * (sy - 0.58));
    if ((sdist < 0.16 && sdist > 0.08) || (sdist2 < 0.16 && sdist2 > 0.08)) {
      isGlyph = true;
    }
  }

  if (isJewel) {
    // Glowing diamond/ruby
    r = 255;
    g = 60;
    b = 80;
  } else if (isCrown) {
    // Imperial gold with vertical shine
    const shine = (sx + 0.5);
    r = Math.min(255, Math.floor(250 + shine * 5));
    g = Math.min(255, Math.floor(200 + shine * 30));
    b = Math.min(255, Math.floor(90 + shine * 40));
  } else if (isGlyph) {
    r = 240;
    g = 240;
    b = 255;
  }

  return [r, g, b, a];
}

const pubDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(pubDir)) {
  fs.mkdirSync(pubDir, { recursive: true });
}

console.log('Generating PWA icons...');
const pwa192 = createPng(192, 192, (x, y, w, h) => renderSultanIcon(x, y, w, h, false));
fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), pwa192);

const pwa512 = createPng(512, 512, (x, y, w, h) => renderSultanIcon(x, y, w, h, false));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), pwa512);

const pwaMaskable = createPng(512, 512, (x, y, w, h) => renderSultanIcon(x, y, w, h, true));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), pwaMaskable);

const appleTouch = createPng(180, 180, (x, y, w, h) => renderSultanIcon(x, y, w, h, false));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), appleTouch);

const favicon = createPng(64, 64, (x, y, w, h) => renderSultanIcon(x, y, w, h, false));
fs.writeFileSync(path.join(pubDir, 'favicon.ico'), favicon);

// Generate SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ef4444" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="#7c3aed" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#05050a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
    <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f87171"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="#08080f"/>
  <circle cx="256" cy="256" r="220" fill="url(#bgGlow)"/>
  <circle cx="256" cy="256" r="236" fill="none" stroke="url(#goldGrad)" stroke-width="3" stroke-opacity="0.6"/>

  <!-- Crown -->
  <path d="M 140 260 L 170 170 L 220 225 L 256 140 L 292 225 L 342 170 L 372 260 Z" fill="url(#goldGrad)" filter="drop-shadow(0 4px 12px rgba(234,179,8,0.4))"/>
  <rect x="140" y="260" width="232" height="30" rx="8" fill="url(#goldGrad)"/>

  <!-- Jewels -->
  <circle cx="170" cy="170" r="10" fill="url(#redGrad)"/>
  <circle cx="256" cy="140" r="13" fill="url(#redGrad)"/>
  <circle cx="342" cy="170" r="10" fill="url(#redGrad)"/>
  <circle cx="200" cy="275" r="6" fill="#38bdf8"/>
  <circle cx="256" cy="275" r="7" fill="#ef4444"/>
  <circle cx="312" cy="275" r="6" fill="#38bdf8"/>

  <!-- Sultan Text -->
  <text x="256" y="375" text-anchor="middle" font-family="'Cairo', sans-serif" font-weight="900" font-size="64" fill="#ffffff" letter-spacing="4">سلطان</text>
  <text x="256" y="420" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="22" fill="#eab308" letter-spacing="8">𓆩SULTAN𓆪</text>
</svg>`;

fs.writeFileSync(path.join(pubDir, 'icon.svg'), svgContent);
console.log('Successfully generated all PWA icons & icon.svg!');
