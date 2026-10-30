// Interactive deep-space backdrop.
//
// Layers, cheapest first:
//  1. A pre-rendered plate (nebula clouds, spiral galaxy, dust stars) painted
//     once per resize into an offscreen canvas and blitted each frame. The plate
//     is padded so it can slide a few pixels for mouse parallax without seams.
//  2. Twinkling stars, drawn per frame with a sine alpha — cheap arcs, no blur.
//  3. Shooting stars / meteors, spawned on a timer.
//  4. The constellation layer: drifting points that link to each other and to
//     the pointer, which is what makes the background feel interactive.
//
// Performance: the loop runs at 24-30 fps, skips work while the tab is hidden,
// halves particle counts on low-power devices, and paints a single still frame
// when the user prefers reduced motion.
import React, { useEffect, useRef } from 'react';

interface TwinkleStar {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  color: string;
  base: number;
}

interface ConstellationStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  alpha: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  len: number;
}

const STAR_COLORS = ['#ffffff', '#e0f2fe', '#bae6fd', '#fef08a', '#e9d5ff', '#c7d2fe'];
const NODE_COLORS = ['#38bdf8', '#22d3ee', '#a855f7', '#ec4899', '#ffffff'];

export const InteractiveCosmicCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowPower =
      (navigator.hardwareConcurrency || 8) <= 4 || /Mobi|Android/i.test(navigator.userAgent);

    const PAD = 40; // overscan so parallax never exposes an edge
    let w = 0;
    let h = 0;
    let raf = 0;
    let plate: HTMLCanvasElement | null = null;

    const pointer = { x: 0, y: 0, tx: 0, ty: 0, radius: 190 };
    const twinkles: TwinkleStar[] = [];
    const nodes: ConstellationStar[] = [];
    const meteors: Meteor[] = [];
    let nextMeteorAt = 0;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    /* ---------- the still plate: nebulae + galaxy + field stars ---------- */
    const paintPlate = () => {
      const layer = document.createElement('canvas');
      layer.width = w + PAD * 2;
      layer.height = h + PAD * 2;
      const c = layer.getContext('2d');
      if (!c) return null;

      c.fillStyle = '#01040c';
      c.fillRect(0, 0, layer.width, layer.height);

      const cx = w * 0.5 + PAD;
      const cy = h * 0.42 + PAD;

      // Deep base wash
      const base = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.85);
      base.addColorStop(0, 'rgba(24, 21, 62, 0.85)');
      base.addColorStop(0.45, 'rgba(9, 13, 35, 0.9)');
      base.addColorStop(1, '#01040c');
      c.fillStyle = base;
      c.fillRect(0, 0, layer.width, layer.height);

      // Nebula clouds, pushed out towards the edges so the glass card does not
      // sit on top of the only interesting colour on the page.
      const clouds: Array<[number, number, number, string]> = [
        [PAD + w * 0.14, PAD + h * 0.16, Math.max(w, h) * 0.38, 'rgba(109, 40, 217, 0.40)'],
        [PAD + w * 0.86, PAD + h * 0.20, Math.max(w, h) * 0.34, 'rgba(8, 145, 178, 0.30)'],
        [PAD + w * 0.80, PAD + h * 0.82, Math.max(w, h) * 0.36, 'rgba(190, 24, 93, 0.26)'],
        [PAD + w * 0.16, PAD + h * 0.86, Math.max(w, h) * 0.32, 'rgba(67, 56, 202, 0.30)'],
        [PAD + w * 0.50, PAD + h * 0.12, Math.max(w, h) * 0.26, 'rgba(139, 92, 246, 0.22)']
      ];
      for (const [nx, ny, nr, color] of clouds) {
        const g = c.createRadialGradient(nx, ny, 0, nx, ny, nr);
        g.addColorStop(0, color);
        g.addColorStop(0.55, color.replace(/[\d.]+\)$/, '0.06)'));
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        c.fillStyle = g;
        c.fillRect(0, 0, layer.width, layer.height);
      }

      // A diagonal dust band: the pale streak that makes a galaxy read as a
      // galaxy rather than a blob of light.
      c.save();
      c.translate(PAD + w * 0.5, PAD + h * 0.5);
      c.rotate(-0.42);
      const band = c.createLinearGradient(0, -Math.max(w, h) * 0.18, 0, Math.max(w, h) * 0.18);
      band.addColorStop(0, 'rgba(0, 0, 0, 0)');
      band.addColorStop(0.5, 'rgba(196, 181, 253, 0.18)');
      band.addColorStop(1, 'rgba(0, 0, 0, 0)');
      c.fillStyle = band;
      c.fillRect(-w, -Math.max(w, h) * 0.18, w * 2, Math.max(w, h) * 0.36);
      c.restore();

      // Spiral galaxy, seen at an angle. It is deliberately bigger than the card
      // so the arms stay visible around it.
      const arms = 4;
      const spin = 2.5;
      const maxR = Math.max(w, h) * 0.58;
      const particles = lowPower ? 900 : 2600;
      const tilt = 0.5;

      for (let i = 0; i < particles; i++) {
        const t = Math.pow(Math.random(), 0.62);
        // Keep the arm particles off the very centre: crossing arms pile up there
        // and read as glare rather than structure.
        const radius = (0.16 + 0.84 * t) * maxR;
        const armIndex = i % arms;
        const armAngle = (armIndex / arms) * Math.PI * 2;
        const spread = (1 - t) * 0.55 + 0.12;
        const angle = armAngle + radius / maxR * spin + rand(-spread, spread);

        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius * tilt + rand(-2, 2);

        const edge = t;
        const color =
          edge < 0.22
            ? 'rgba(255, 248, 238, 0.62)'
            : edge < 0.5
            ? 'rgba(224, 195, 255, 0.72)'
            : edge < 0.78
            ? 'rgba(147, 112, 255, 0.58)'
            : 'rgba(56, 189, 248, 0.5)';

        c.fillStyle = color;
        c.globalAlpha = rand(0.4, 1);
        c.beginPath();
        c.arc(x, y, rand(0.35, 1.25), 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;

      // Bright galactic core
      const core = c.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.26);
      core.addColorStop(0, 'rgba(255, 252, 245, 0.34)');
      core.addColorStop(0.3, 'rgba(233, 213, 255, 0.14)');
      core.addColorStop(1, 'rgba(139, 92, 246, 0)');
      c.fillStyle = core;
      c.beginPath();
      c.arc(cx, cy, maxR * 0.26, 0, Math.PI * 2);
      c.fill();

      // A second, smaller galaxy in the top-right so the page has more than one
      // focal point and no corner reads as empty space.
      const gx = PAD + w * 0.87;
      const gy = PAD + h * 0.13;
      const g2Max = Math.min(w, h) * 0.2;
      const g2Particles = lowPower ? 180 : 480;
      c.save();
      c.translate(gx, gy);
      c.rotate(0.7);
      c.scale(1, 0.42);
      for (let i = 0; i < g2Particles; i++) {
        const t = Math.pow(Math.random(), 0.6);
        const radius = t * g2Max;
        const armAngle = (i % 2) / 2 * Math.PI * 2;
        const angle = armAngle + radius / g2Max * 3.1 + rand(-0.5, 0.5) * (1 - t);
        c.fillStyle = t < 0.4 ? 'rgba(255, 246, 240, 0.9)' : 'rgba(165, 180, 252, 0.55)';
        c.globalAlpha = rand(0.3, 0.85);
        c.beginPath();
        c.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, rand(0.35, 1.05), 0, Math.PI * 2);
        c.fill();
      }
      const g2core = c.createRadialGradient(0, 0, 0, 0, 0, g2Max * 0.4);
      g2core.addColorStop(0, 'rgba(255, 255, 250, 0.75)');
      g2core.addColorStop(1, 'rgba(165, 180, 252, 0)');
      c.fillStyle = g2core;
      c.beginPath();
      c.arc(0, 0, g2Max * 0.4, 0, Math.PI * 2);
      c.fill();
      c.restore();
      c.globalAlpha = 1;

      // Background field stars
      const fieldCount = lowPower ? 260 : 520;
      for (let i = 0; i < fieldCount; i++) {
        c.fillStyle = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
        c.globalAlpha = rand(0.15, 0.9);
        c.beginPath();
        c.arc(Math.random() * layer.width, Math.random() * layer.height, rand(0.3, 1.4), 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;

      // A handful of bright stars with a light cross
      const bright = lowPower ? 4 : 9;
      for (let i = 0; i < bright; i++) {
        const x = rand(PAD, layer.width - PAD);
        const y = rand(PAD, layer.height - PAD);
        const flare = rand(5, 13);
        const g = c.createRadialGradient(x, y, 0, x, y, flare);
        g.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        g.addColorStop(0.4, 'rgba(191, 219, 254, 0.25)');
        g.addColorStop(1, 'rgba(191, 219, 254, 0)');
        c.fillStyle = g;
        c.beginPath();
        c.arc(x, y, flare, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = 'rgba(255, 255, 255, 0.32)';
        c.lineWidth = 0.7;
        c.beginPath();
        c.moveTo(x - flare, y);
        c.lineTo(x + flare, y);
        c.moveTo(x, y - flare);
        c.lineTo(x, y + flare);
        c.stroke();
      }

      plate = layer;
      return layer;
    };

    /* ---------- animated layers ---------- */
    const seedStars = () => {
      twinkles.length = 0;
      const count = lowPower ? 70 : 130;
      for (let i = 0; i < count; i++) {
        twinkles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: rand(0.4, 1.7),
          phase: Math.random() * Math.PI * 2,
          speed: rand(0.4, 1.5),
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          base: rand(0.45, 1)
        });
      }

      nodes.length = 0;
      const nodeCount = lowPower ? 22 : 40;
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: rand(-0.18, 0.18),
          vy: rand(-0.18, 0.18),
          r: rand(0.9, 2.1),
          color: NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)],
          alpha: rand(0.4, 0.95)
        });
      }

      meteors.length = 0;
      nextMeteorAt = 1500;
    };

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      pointer.x = pointer.tx = w / 2;
      pointer.y = pointer.ty = h / 2;
      paintPlate();
      seedStars();
      if (reduceMotion) {
        ctx.drawImage(plate as HTMLCanvasElement, -PAD, -PAD);
      }
    };

    const spawnMeteor = () => {
      const fromLeft = Math.random() > 0.35;
      const startX = fromLeft ? rand(-80, w * 0.35) : rand(w * 0.65, w + 80);
      const startY = rand(-60, h * 0.45);
      const speed = rand(7, 13);
      const angle = fromLeft ? rand(0.35, 0.62) : Math.PI - rand(0.35, 0.62);
      meteors.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: rand(48, 78),
        len: rand(90, 190)
      });
    };

    const drawFrame = (now: number) => {
      if (!plate) return;

      // Parallax: the plate slides opposite the pointer for depth.
      const px = (pointer.x / w - 0.5) * -22;
      const py = (pointer.y / h - 0.5) * -22;
      ctx.drawImage(plate, -PAD + px, -PAD + py);

      // Twinkling stars
      for (const s of twinkles) {
        const flicker = 0.55 + 0.45 * Math.sin(now / 620 * s.speed + s.phase);
        ctx.globalAlpha = s.base * flicker;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Pointer aura
      const aura = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, pointer.radius);
      aura.addColorStop(0, 'rgba(34, 211, 238, 0.10)');
      aura.addColorStop(0.45, 'rgba(168, 85, 247, 0.05)');
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, pointer.radius, 0, Math.PI * 2);
      ctx.fill();

      // Meteors
      if (now > nextMeteorAt) {
        spawnMeteor();
        nextMeteorAt = now + rand(4000, 9000);
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life += 1;

        const fade = 1 - m.life / m.maxLife;
        const tailX = m.x - m.vx * (m.len / 10);
        const tailY = m.y - m.vy * (m.len / 10);

        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${0.75 * fade})`);
        grad.addColorStop(0.4, `rgba(147, 197, 253, ${0.28 * fade})`);
        grad.addColorStop(1, 'rgba(147, 197, 253, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        if (m.life >= m.maxLife || m.x < -200 || m.x > w + 200 || m.y > h + 200) {
          meteors.splice(i, 1);
        }
      }
      ctx.lineWidth = 1;

      // Constellation nodes: drift, link, react to the pointer
      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const d2 = dx * dx + dy * dy;

        if (d2 < pointer.radius * pointer.radius) {
          const pull = (pointer.radius - Math.sqrt(d2)) / pointer.radius;
          p.vx += (dx / (Math.sqrt(d2) + 0.001)) * pull * 0.06;
          p.vy += (dy / (Math.sqrt(d2) + 0.001)) * pull * 0.06;
        }

        p.vx *= 0.982;
        p.vy *= 0.982;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // soft halo + core, no shadowBlur
        ctx.globalAlpha = p.alpha * 0.14;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        // links to nearby nodes
        for (let j = i + 1; j < Math.min(nodes.length, i + 5); j++) {
          const q = nodes[j];
          const lx = p.x - q.x;
          const ly = p.y - q.y;
          const ld2 = lx * lx + ly * ly;
          if (ld2 < 12100) {
            ctx.strokeStyle = '#38bdf8';
            ctx.globalAlpha = (1 - Math.sqrt(ld2) / 110) * 0.14;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        // links to the pointer
        if (d2 < 32400) {
          ctx.strokeStyle = '#22d3ee';
          ctx.globalAlpha = (1 - Math.sqrt(d2) / 180) * 0.3;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    const FRAME_MS = 1000 / (lowPower ? 24 : 30);
    let last = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      if (now - last < FRAME_MS) return;
      last = now;

      pointer.x += (pointer.tx - pointer.x) * 0.075;
      pointer.y += (pointer.ty - pointer.y) * 0.075;
      drawFrame(now);
    };

    const onPointerMove = (e: PointerEvent) => {
      pointer.tx = e.clientX;
      pointer.ty = e.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        pointer.tx = e.touches[0].clientX;
        pointer.ty = e.touches[0].clientY;
      }
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    resize();
    if (!reduceMotion) raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onTouchMove);
      cancelAnimationFrame(raf);
      plate = null;
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 pointer-events-none z-0" />;
};

export default InteractiveCosmicCanvas;
