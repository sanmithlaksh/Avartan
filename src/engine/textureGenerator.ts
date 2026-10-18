// ============================================================
// PHOTOREALISTIC Procedural Texture Generator  v3.0
// 2048×1024 (planets) | 1024×64 (rings)
// Uses multi-octave FBM noise, radial gradients, and layered
// painting techniques to achieve a near-photographic look.
// ============================================================
import * as THREE from 'three';

const textureCache: Record<string, THREE.CanvasTexture> = {};

// ── MATH HELPERS ────────────────────────────────────────────
function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

/** Bilinear-smoothed value noise (0-1) */
function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx); // smoothstep
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix,     iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix,     iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + ((a - b - c + d) * ux * uy);
}

/** Fractional Brownian Motion: multiple octaves of value noise */
function fbm(x: number, y: number, octaves = 6, lacunarity = 2.0, gain = 0.5): number {
  let v = 0, amp = 0.5, freq = 1.0;
  for (let i = 0; i < octaves; i++) {
    v += amp * valueNoise(x * freq, y * freq);
    freq *= lacunarity;
    amp *= gain;
  }
  return v;
}

/** Turbulence (abs-sum FBM for sharp ridges) */
function turbulence(x: number, y: number, octaves = 6): number {
  let v = 0, amp = 0.5, freq = 1.0;
  for (let i = 0; i < octaves; i++) {
    v += amp * Math.abs(valueNoise(x * freq, y * freq) - 0.5) * 2;
    freq *= 2.0;
    amp *= 0.5;
  }
  return v;
}

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }

// Hex string → [r, g, b] 0-255
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function rgbLerp(c1: [number,number,number], c2: [number,number,number], t: number): [number,number,number] {
  return [Math.round(lerp(c1[0],c2[0],t)), Math.round(lerp(c1[1],c2[1],t)), Math.round(lerp(c1[2],c2[2],t))];
}
function rgbStr(r: number, g: number, b: number, a = 1): string {
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a.toFixed(3)})`;
}

// ── MAIN TEXTURE FACTORY ────────────────────────────────────
export function getProceduralPlanetTexture(type: string): THREE.CanvasTexture {
  if (textureCache[type]) return textureCache[type];

  // 512x256 generates in <50ms without blocking the UI main thread while maintaining crisp sphere mapping
  const W = 512, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(W, H);
  const data = imageData.data;

  switch (type) {
    // ── SUN ─────────────────────────────────────────────────
    case 'sun': {
      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const u = px / W, v = py / H;
          const n = fbm(u * 8, v * 8, 7);
          const t = turbulence(u * 5, v * 5, 5) * 0.4;
          const heat = clamp(n + t, 0, 1);

          // Colour map: dark orange → golden → white core
          let r, g, b;
          if (heat < 0.3) {
            const tt = heat / 0.3;
            r = lerp(120, 220, tt); g = lerp(40, 100, tt); b = lerp(0, 0, tt);
          } else if (heat < 0.6) {
            const tt = (heat - 0.3) / 0.3;
            r = lerp(220, 255, tt); g = lerp(100, 180, tt); b = lerp(0, 20, tt);
          } else if (heat < 0.85) {
            const tt = (heat - 0.6) / 0.25;
            r = lerp(255, 255, tt); g = lerp(180, 240, tt); b = lerp(20, 120, tt);
          } else {
            const tt = (heat - 0.85) / 0.15;
            r = lerp(255, 255, tt); g = lerp(240, 255, tt); b = lerp(120, 240, tt);
          }

          // Sunspot chance
          const spot = fbm(u * 14 + 2, v * 14 + 3, 4);
          if (spot < 0.18) { r *= 0.45; g *= 0.35; b *= 0.25; }

          const i4 = (py * W + px) * 4;
          data[i4]   = clamp(r, 0, 255);
          data[i4+1] = clamp(g, 0, 255);
          data[i4+2] = clamp(b, 0, 255);
          data[i4+3] = 255;
        }
      }
      break;
    }

    // ── MERCURY (rocky) ─────────────────────────────────────
    case 'rocky': {
      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const u = px / W, v = py / H;
          const n  = fbm(u * 9, v * 9, 7);
          const t  = turbulence(u * 6, v * 6, 5);

          // Base tone: dark grey basalt → lighter highland
          const base = lerp(55, 145, n);
          let r = base + t * 20, g = base + t * 18, b = base + t * 15;

          // Lighter highlands
          if (n > 0.62) { r += 40; g += 38; b += 36; }

          // Craters via local circular noise
          const cx = (u * 22) % 1, cy = (v * 22) % 1;
          const cr = fbm(cx * 4 + 7, cy * 4 + 9, 3);
          if (cr < 0.2) { r -= 35; g -= 32; b -= 30; } // crater floor
          else if (cr < 0.26) { r += 50; g += 48; b += 45; } // rim highlight

          const i4 = (py * W + px) * 4;
          data[i4]   = clamp(r, 0, 255);
          data[i4+1] = clamp(g, 0, 255);
          data[i4+2] = clamp(b, 0, 255);
          data[i4+3] = 255;
        }
      }
      break;
    }

    // ── VENUS (dense_atmosphere) ────────────────────────────
    case 'dense_atmosphere': {
      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const u = px / W, v = py / H;
          // Banded chevron cloud patterns with turbulence
          const band = fbm(u * 4, v * 12 + Math.sin(u * 6) * 0.3, 6);
          const turb = turbulence(u * 6, v * 8, 4) * 0.3;
          const n = clamp(band + turb, 0, 1);

          // Vivid golden sulphur → cream → amber
          let r, g, b;
          if (n < 0.35) {
            const tt = n / 0.35;
            r = lerp(200, 255, tt); g = lerp(140, 220, tt); b = lerp(30, 100, tt);
          } else if (n < 0.65) {
            const tt = (n - 0.35) / 0.3;
            r = lerp(255, 255, tt); g = lerp(220, 250, tt); b = lerp(100, 200, tt);
          } else {
            const tt = (n - 0.65) / 0.35;
            r = lerp(255, 210, tt); g = lerp(250, 170, tt); b = lerp(200, 60, tt);
          }

          const i4 = (py * W + px) * 4;
          data[i4]   = clamp(r, 0, 255);
          data[i4+1] = clamp(g, 0, 255);
          data[i4+2] = clamp(b, 0, 255);
          data[i4+3] = 255;
        }
      }
      break;
    }

    // ── EARTH ───────────────────────────────────────────────
    case 'earth': {
      // We will use canvas 2D drawing for Earth (best for continents)
      // Phase 1: Deep ocean base
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, H);
      oceanGrad.addColorStop(0.0, '#0a3352');
      oceanGrad.addColorStop(0.3, '#0c4a6e');
      oceanGrad.addColorStop(0.5, '#075985');
      oceanGrad.addColorStop(0.7, '#0369a1');
      oceanGrad.addColorStop(1.0, '#0c4a6e');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, W, H);

      // Phase 2: Shallow ocean regions (lighter blue)
      ctx.fillStyle = 'rgba(14,116,144,0.45)';
      for (let i = 0; i < 80; i++) {
        const rx = Math.random() * W, ry = Math.random() * H;
        const rw = 60 + Math.random() * 200, rh = 30 + Math.random() * 80;
        ctx.beginPath();
        ctx.ellipse(rx, ry, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      // Phase 3: Realistic continent painting
      const drawLandmass = (
        pts: [number, number][], baseColor: string, highlightColor: string, shadowColor: string
      ) => {
        // Base land
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        pts.forEach(([x, y], i) => {
          if (i === 0) ctx.moveTo(x * W, y * H);
          else ctx.lineTo(x * W, y * H);
        });
        ctx.closePath();
        ctx.fill();
        // Highlight ridge
        ctx.fillStyle = highlightColor;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        pts.forEach(([x, y], i) => {
          if (i === 0) ctx.moveTo((x - 0.005) * W, y * H);
          else ctx.lineTo((x - 0.005) * W, y * H);
        });
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;
        // Mountain shadow
        ctx.fillStyle = shadowColor;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        pts.forEach(([x, y], i) => {
          if (i === 0) ctx.moveTo((x + 0.005) * W, y * H);
          else ctx.lineTo((x + 0.005) * W, y * H);
        });
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;
      };

      // North America
      drawLandmass(
        [[0.06,0.28],[0.11,0.22],[0.17,0.2],[0.22,0.25],[0.25,0.32],[0.24,0.42],[0.2,0.48],[0.16,0.52],[0.12,0.58],[0.08,0.6],[0.05,0.55],[0.04,0.44],[0.06,0.36]],
        '#1a6b35','#34d058','#0f3d1f'
      );
      // Greenland
      drawLandmass(
        [[0.23,0.08],[0.27,0.06],[0.31,0.09],[0.3,0.18],[0.25,0.2],[0.21,0.14]],
        '#d1fae5','#f0fdf4','#6ee7b7'
      );
      // South America
      drawLandmass(
        [[0.15,0.6],[0.18,0.57],[0.23,0.6],[0.25,0.67],[0.26,0.78],[0.22,0.88],[0.17,0.93],[0.13,0.9],[0.11,0.82],[0.12,0.72],[0.13,0.65]],
        '#15803d','#22c55e','#064e1a'
      );
      // Sahara + North Africa
      drawLandmass(
        [[0.5,0.32],[0.55,0.3],[0.61,0.31],[0.64,0.36],[0.63,0.45],[0.59,0.52],[0.52,0.55],[0.47,0.52],[0.46,0.44],[0.48,0.36]],
        '#ca8a04','#fde047','#78350f'
      );
      // Sub-Saharan Africa (jungle green)
      drawLandmass(
        [[0.5,0.52],[0.56,0.52],[0.62,0.55],[0.64,0.65],[0.61,0.76],[0.55,0.84],[0.49,0.86],[0.45,0.82],[0.44,0.72],[0.46,0.6],[0.48,0.55]],
        '#166534','#4ade80','#052e16'
      );
      // Europe
      drawLandmass(
        [[0.53,0.22],[0.57,0.19],[0.62,0.2],[0.65,0.26],[0.63,0.31],[0.57,0.32],[0.52,0.29]],
        '#16a34a','#4ade80','#052e16'
      );
      // Russia / Siberia
      drawLandmass(
        [[0.56,0.15],[0.63,0.1],[0.78,0.1],[0.88,0.15],[0.9,0.25],[0.82,0.32],[0.72,0.34],[0.63,0.3],[0.57,0.24]],
        '#15803d','#34d058','#052e16'
      );
      // China / East Asia
      drawLandmass(
        [[0.8,0.32],[0.87,0.3],[0.92,0.35],[0.91,0.44],[0.85,0.5],[0.78,0.5],[0.75,0.43],[0.77,0.36]],
        '#1a6b35','#4ade80','#052e16'
      );
      // India
      drawLandmass(
        [[0.72,0.44],[0.76,0.43],[0.78,0.5],[0.76,0.6],[0.73,0.65],[0.7,0.63],[0.69,0.55],[0.7,0.47]],
        '#166534','#22c55e','#052e16'
      );
      // Australia
      drawLandmass(
        [[0.85,0.68],[0.9,0.66],[0.94,0.7],[0.95,0.78],[0.9,0.84],[0.83,0.83],[0.8,0.78],[0.81,0.71]],
        '#b45309','#fbbf24','#7c2d12'
      );
      // Antarctica
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(0, H * 0.9, W, H * 0.1);
      ctx.fillStyle = 'rgba(241,245,249,0.85)';
      ctx.fillRect(0, H * 0.88, W, H * 0.07);

      // North polar ice
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(0, 0, W, H * 0.08);
      ctx.fillStyle = 'rgba(241,245,249,0.7)';
      ctx.fillRect(0, 0, W, H * 0.05);

      // Phase 4: White cloud cover (realistic swirl)
      ctx.globalAlpha = 0.72;
      for (let i = 0; i < 180; i++) {
        const cx = Math.random() * W;
        const cy = H * 0.06 + Math.random() * H * 0.88;
        const cw = 100 + Math.random() * 220;
        const ch = 18 + Math.random() * 40;
        const angle = Math.sin(cy / H * Math.PI * 3) * 0.4;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, cw, ch, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      // Cyclonic storms
      for (let s = 0; s < 3; s++) {
        const scx = (0.2 + Math.random() * 0.6) * W;
        const scy = (0.25 + Math.random() * 0.5) * H;
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 22;
        ctx.beginPath();
        for (let t = 0; t < Math.PI * 4; t += 0.15) {
          const r = t * (12 + Math.random() * 4);
          const px = scx + Math.cos(t) * r;
          const py = scy + Math.sin(t) * r * 0.7;
          t < 0.15 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // (return early since we used canvas 2D directly)
      const texE = new THREE.CanvasTexture(canvas);
      texE.wrapS = THREE.RepeatWrapping;
      texE.wrapT = THREE.ClampToEdgeWrapping;
      texE.colorSpace = THREE.SRGBColorSpace;
      texE.anisotropy = 16;
      textureCache[type] = texE;
      return texE;
    }

    // ── MARS (red_rock) ─────────────────────────────────────
    case 'red_rock': {
      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const u = px / W, v = py / H;
          const n = fbm(u * 7, v * 7, 7);
          const t = turbulence(u * 5, v * 5, 5) * 0.35;
          const heat = clamp(n + t, 0, 1);

          // Deep crimson → terracotta → rust orange
          let r, g, b;
          if (heat < 0.3) {
            r = lerp(130, 180, heat/0.3); g = lerp(20, 50, heat/0.3); b = lerp(10, 15, heat/0.3);
          } else if (heat < 0.65) {
            const tt = (heat - 0.3) / 0.35;
            r = lerp(180, 220, tt); g = lerp(50, 80, tt); b = lerp(15, 25, tt);
          } else {
            const tt = (heat - 0.65) / 0.35;
            r = lerp(220, 200, tt); g = lerp(80, 65, tt); b = lerp(25, 20, tt);
          }

          // Dark lowland basins
          const basin = fbm(u * 3 + 10, v * 3 + 10, 4);
          if (basin < 0.28) { r *= 0.65; g *= 0.6; b *= 0.6; }

          // Polar ice caps
          const pole = Math.abs(v - 0.5) * 2.0;
          if (pole > 0.88) {
            const ice = (pole - 0.88) / 0.12;
            r = lerp(r, 240, ice); g = lerp(g, 240, ice); b = lerp(b, 255, ice);
          }

          const i4 = (py * W + px) * 4;
          data[i4]   = clamp(r, 0, 255);
          data[i4+1] = clamp(g, 0, 255);
          data[i4+2] = clamp(b, 0, 255);
          data[i4+3] = 255;
        }
      }
      break;
    }

    // ── JUPITER (gas_giant_bands) ────────────────────────────
    case 'gas_giant_bands': {
      // Band color stops (rich golden caramel)
      const jupBands: [number, [number,number,number]][] = [
        [0.0,  [200, 130,  55]],
        [0.07, [255, 220, 140]],
        [0.14, [160,  80,  30]],
        [0.20, [255, 240, 180]],
        [0.27, [140,  65,  20]],
        [0.34, [255, 210, 120]],
        [0.41, [170,  90,  35]],
        [0.48, [255, 235, 160]],
        [0.55, [145,  70,  25]],
        [0.62, [255, 220, 140]],
        [0.68, [190, 100,  40]],
        [0.75, [255, 245, 190]],
        [0.82, [160,  80,  30]],
        [0.90, [255, 220, 140]],
        [1.0,  [200, 130,  55]],
      ];

      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const u = px / W, v = py / H;

          // Band v with turbulent distortion
          const turbV = v + fbm(u * 6, v * 4, 5) * 0.04 + Math.sin(u * 18) * 0.012;
          const tv = clamp(turbV, 0, 1);

          // Interpolate band color
          let bc: [number,number,number] = [200,130,55];
          for (let b2 = 0; b2 < jupBands.length - 1; b2++) {
            if (tv >= jupBands[b2][0] && tv <= jupBands[b2+1][0]) {
              const tt = (tv - jupBands[b2][0]) / (jupBands[b2+1][0] - jupBands[b2][0]);
              bc = rgbLerp(jupBands[b2][1], jupBands[b2+1][1], tt);
              break;
            }
          }

          let [r, g, b3] = bc;

          // Fine turbulence variation
          const fine = fbm(u * 22, v * 8, 4) - 0.5;
          r = clamp(r + fine * 30, 0, 255);
          g = clamp(g + fine * 20, 0, 255);
          b3 = clamp(b3 + fine * 10, 0, 255);

          // Great Red Spot (centred around u=0.62, v=0.63)
          const du = ((u - 0.62 + 1) % 1) - 0.5;
          const dv = v - 0.63;
          const grs = (du * du) / (0.09 * 0.09) + (dv * dv) / (0.03 * 0.03);
          if (grs < 1) {
            const t2 = 1 - Math.sqrt(grs);
            r = lerp(r, 185, t2 * 0.85); g = lerp(g, 40, t2 * 0.85); b3 = lerp(b3, 15, t2 * 0.85);
            // White core of GRS
            if (grs < 0.06) { r = lerp(r,255,0.5); g = lerp(g,200,0.5); b3 = lerp(b3,150,0.5); }
          }

          // White oval storms along southern belt
          for (let ov = 0; ov < 6; ov++) {
            const ox = (ov / 6 + 0.1) % 1;
            const odu = ((u - ox + 1) % 1) - 0.5;
            const odv = v - 0.77;
            const oval = (odu * odu) / (0.02 * 0.02) + (odv * odv) / (0.012 * 0.012);
            if (oval < 1) { const tp = 1 - Math.sqrt(oval); r = lerp(r, 255, tp * 0.7); g = lerp(g, 255, tp * 0.7); b3 = lerp(b3, 230, tp * 0.7); }
          }

          const i4 = (py * W + px) * 4;
          data[i4]   = clamp(r, 0, 255);
          data[i4+1] = clamp(g, 0, 255);
          data[i4+2] = clamp(b3, 0, 255);
          data[i4+3] = 255;
        }
      }
      break;
    }

    // ── SATURN (ringed_gas) ──────────────────────────────────
    case 'ringed_gas': {
      const satBands: [number, [number,number,number]][] = [
        [0.0,  [240, 215, 160]],
        [0.1,  [220, 185, 110]],
        [0.2,  [255, 235, 175]],
        [0.3,  [205, 170,  95]],
        [0.4,  [255, 245, 200]],
        [0.5,  [215, 180, 115]],
        [0.6,  [255, 240, 185]],
        [0.7,  [205, 165,  90]],
        [0.8,  [240, 215, 155]],
        [0.9,  [220, 195, 130]],
        [1.0,  [240, 215, 160]],
      ];

      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const u = px / W, v = py / H;
          const turbV = v + fbm(u * 4, v * 5, 4) * 0.025 + Math.sin(u * 14) * 0.008;
          const tv = clamp(turbV, 0, 1);

          let bc: [number,number,number] = [240,215,160];
          for (let b2 = 0; b2 < satBands.length - 1; b2++) {
            if (tv >= satBands[b2][0] && tv <= satBands[b2+1][0]) {
              const tt = (tv - satBands[b2][0]) / (satBands[b2+1][0] - satBands[b2][0]);
              bc = rgbLerp(satBands[b2][1], satBands[b2+1][1], tt);
              break;
            }
          }
          let [r, g, b3] = bc;
          const fine = fbm(u * 18, v * 6, 4) - 0.5;
          r = clamp(r + fine * 18, 0, 255);
          g = clamp(g + fine * 14, 0, 255);
          b3 = clamp(b3 + fine * 8, 0, 255);

          // Subtle polar hexagon
          if (v < 0.1 || v > 0.9) {
            r = lerp(r, 215, 0.25); g = lerp(g, 195, 0.25); b3 = lerp(b3, 160, 0.2);
          }

          const i4 = (py * W + px) * 4;
          data[i4]   = clamp(r, 0, 255);
          data[i4+1] = clamp(g, 0, 255);
          data[i4+2] = clamp(b3, 0, 255);
          data[i4+3] = 255;
        }
      }
      break;
    }

    // ── URANUS (ice_giant) ───────────────────────────────────
    case 'ice_giant': {
      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const u = px / W, v = py / H;
          const n = fbm(u * 5, v * 8, 5);
          const band = Math.sin(v * Math.PI * 12) * 0.05;

          // Vibrant aquamarine / mint
          const base = clamp(n + band, 0, 1);
          const r = lerp(120, 200, base);
          const g = lerp(230, 255, base);
          const b = lerp(240, 255, base);

          // Subtle pale cloud streaks
          const cloud = fbm(u * 8, v * 4 + 5, 4);
          const cr = clamp(r + (cloud > 0.6 ? (cloud - 0.6) * 60 : 0), 0, 255);
          const cg = clamp(g + (cloud > 0.6 ? (cloud - 0.6) * 40 : 0), 0, 255);
          const cb = clamp(b + (cloud > 0.6 ? (cloud - 0.6) * 20 : 0), 0, 255);

          const i4 = (py * W + px) * 4;
          data[i4]   = cr; data[i4+1] = cg; data[i4+2] = cb; data[i4+3] = 255;
        }
      }
      break;
    }

    // ── NEPTUNE (blue_ice) ───────────────────────────────────
    case 'blue_ice': {
      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const u = px / W, v = py / H;
          const n = fbm(u * 6, v * 9, 7);
          const t = turbulence(u * 4, v * 4, 4) * 0.3;
          const val = clamp(n + t, 0, 1);

          // Deep royal blue → cobalt → electric
          const r = lerp(10,  55,  val);
          const g = lerp(30,  90,  val);
          const b = lerp(160, 240, val);

          // Great Dark Spot
          const du = ((u - 0.45 + 1) % 1) - 0.5;
          const dv = v - 0.44;
          const ds = (du * du) / (0.08 * 0.08) + (dv * dv) / (0.04 * 0.04);
          let fr = r, fg = g, fb = b;
          if (ds < 1) {
            const dp = 1 - Math.sqrt(ds);
            fr = lerp(r, 5, dp * 0.8); fg = lerp(g, 10, dp * 0.8); fb = lerp(b, 40, dp * 0.7);
          }

          // Cirrus methane clouds (bright white streaks)
          const cir = fbm(u * 14, v * 5 + 8, 3);
          if (cir > 0.66) {
            const cp = (cir - 0.66) / 0.34;
            fr = lerp(fr, 200, cp * 0.8); fg = lerp(fg, 220, cp * 0.8); fb = lerp(fb, 255, cp * 0.7);
          }

          const i4 = (py * W + px) * 4;
          data[i4]   = clamp(fr, 0, 255);
          data[i4+1] = clamp(fg, 0, 255);
          data[i4+2] = clamp(fb, 0, 255);
          data[i4+3] = 255;
        }
      }
      break;
    }

    default: {
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, W, H);
    }
  }

  // For pixel-data based types, put the imageData onto the canvas
  if (type !== 'earth') {
    ctx.putImageData(imageData, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  textureCache[type] = texture;
  return texture;
}

// ── RING TEXTURES ────────────────────────────────────────────
export function getProceduralRingTexture(type: 'saturn' | 'uranus'): THREE.CanvasTexture {
  const key = `ring_${type}`;
  if (textureCache[key]) return textureCache[key];

  const W = 2048, H = 64;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(W, H);
  const data = imageData.data;

  if (type === 'saturn') {
    // Photorealistic Saturn ring system pixel-by-pixel
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const u = px / W;
        // Noise for ring grain
        const grain = valueNoise(u * 180, py * 3 + 7);

        // Ring zones: C-ring, B-ring, Cassini Division, A-ring, Encke gap, F-ring
        let r = 0, g = 0, b = 0, a = 0;
        if (u < 0.05) {
          // Inner C ring – faint translucent
          a = u / 0.05 * 0.3 + grain * 0.1;
          r = 210; g = 180; b = 140;
        } else if (u < 0.14) {
          // C ring – pale
          const t2 = (u - 0.05) / 0.09;
          a = lerp(0.3, 0.5, t2) + grain * 0.12;
          r = 200; g = 175; b = 130;
        } else if (u < 0.54) {
          // B ring – dense bright
          const t2 = (u - 0.14) / 0.4;
          a = lerp(0.7, 0.95, t2) + grain * 0.05;
          r = lerp(255, 240, t2); g = lerp(230, 215, t2); b = lerp(170, 150, t2);
        } else if (u < 0.60) {
          // Cassini Division – dark gap
          const t2 = Math.abs(u - 0.57) / 0.03;
          a = lerp(0.04, 0.35, t2) + grain * 0.05;
          r = 30; g = 25; b = 20;
        } else if (u < 0.86) {
          // A ring – moderately bright
          const t2 = (u - 0.60) / 0.26;
          a = lerp(0.75, 0.55, t2) + grain * 0.08;
          r = lerp(255, 230, t2); g = lerp(210, 185, t2); b = lerp(155, 130, t2);
        } else if (u < 0.91) {
          // Encke gap
          const t2 = Math.abs(u - 0.88) / 0.03;
          a = lerp(0.02, 0.4, t2) + grain * 0.04;
          r = 25; g = 20; b = 15;
        } else if (u < 0.97) {
          // F ring – narrow bright strand
          const t2 = (u - 0.91) / 0.06;
          a = lerp(0.4, 0.1, t2) + grain * 0.05;
          r = 255; g = 235; b = 180;
        } else {
          a = (1 - u) / 0.03 * 0.1;
          r = 200; g = 180; b = 140;
        }

        const i4 = (py * W + px) * 4;
        data[i4]   = r; data[i4+1] = g; data[i4+2] = b;
        data[i4+3] = Math.round(clamp(a, 0, 1) * 255);
      }
    }
  } else {
    // Uranus delicate ice rings
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const u = px / W;
        const grain = valueNoise(u * 120, py * 4 + 11);
        let r = 165, g = 243, b = 252, a = 0;
        if (u < 0.08 || u > 0.92) {
          a = 0;
        } else if (u < 0.18 || (u > 0.42 && u < 0.52) || (u > 0.68 && u < 0.78)) {
          const d = Math.min(Math.abs(u - 0.13), Math.abs(u - 0.47), Math.abs(u - 0.73));
          a = 0.4 + grain * 0.2 + (0.04 - Math.min(0.04, d)) / 0.04 * 0.4;
          r = 150; g = 220; b = 240;
        } else {
          a = grain * 0.1;
        }
        const i4 = (py * W + px) * 4;
        data[i4]   = r; data[i4+1] = g; data[i4+2] = b;
        data[i4+3] = Math.round(clamp(a, 0, 1) * 255);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache[key] = texture;
  return texture;
}

// ── NORMAL/BUMP MAP GENERATORS ───────────────────────────────
/** Generates a grayscale bump map canvas texture from an FBM pattern */
export function getProceduralBumpTexture(type: string): THREE.CanvasTexture {
  const key = `bump_${type}`;
  if (textureCache[key]) return textureCache[key];
  const W = 256, H = 128;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const id = ctx.createImageData(W, H);
  const data = id.data;
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const u = px / W, v = py / H;
      let val = fbm(u * 8, v * 8, 6);
      if (type === 'rocky') val = turbulence(u * 10, v * 10, 6);
      const b = Math.round(clamp(val, 0, 1) * 255);
      const i4 = (py * W + px) * 4;
      data[i4] = b; data[i4+1] = b; data[i4+2] = b; data[i4+3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  textureCache[key] = tex;
  return tex;
}
