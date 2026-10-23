// Interactive Space Canvas with Stagnant Galaxy / Starfield Backdrop and Cursor-Responsive Star Particle Constellations
//
// Performance notes:
// - The galaxy gradient and the ~300 background stars never move, so they are
//   painted once into an offscreen canvas and blitted each frame instead of
//   being rebuilt with a fresh radial gradient and hundreds of arcs.
// - The responsive layer is capped, runs at 30 fps, uses squared-distance
//   checks and draws no per-star shadow blur (the single most expensive canvas
//   operation on low-end GPUs).
// - Rendering stops entirely when the tab is hidden or the user prefers
//   reduced motion.
import React, { useEffect, useRef } from 'react';

interface ResponsiveStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

interface StagnantStar {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: string;
}

export const InteractiveCosmicCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationId = 0;
    let width = 0;
    let height = 0;
    let staticLayer: HTMLCanvasElement | null = null;

    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      radius: 170
    };

    const starColors = ['#ffffff', '#e0f2fe', '#bae6fd', '#fef08a', '#e9d5ff'];
    const starHue = ['#38bdf8', '#00f3ff', '#a855f7', '#ec4899', '#ffffff'];
    const responsiveStars: ResponsiveStar[] = [];

    const paintStaticLayer = () => {
      const layer = document.createElement('canvas');
      layer.width = width;
      layer.height = height;
      const lctx = layer.getContext('2d');
      if (!lctx) return null;

      lctx.fillStyle = '#030712';
      lctx.fillRect(0, 0, width, height);

      const galaxyGlow = lctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        50,
        width * 0.5,
        height * 0.45,
        Math.max(width, height) * 0.7
      );
      galaxyGlow.addColorStop(0, 'rgba(30, 27, 75, 0.45)');
      galaxyGlow.addColorStop(0.4, 'rgba(15, 23, 42, 0.35)');
      galaxyGlow.addColorStop(0.8, 'rgba(2, 6, 23, 0.7)');
      galaxyGlow.addColorStop(1, '#030712');
      lctx.fillStyle = galaxyGlow;
      lctx.fillRect(0, 0, width, height);

      const count = Math.min(420, Math.floor((width * height) / 4200));
      for (let i = 0; i < count; i++) {
        lctx.beginPath();
        lctx.arc(
          Math.random() * width,
          Math.random() * height,
          Math.random() * 1.5 + 0.3,
          0,
          Math.PI * 2
        );
        lctx.fillStyle = starColors[Math.floor(Math.random() * starColors.length)];
        lctx.globalAlpha = Math.random() * 0.7 + 0.2;
        lctx.fill();
      }
      lctx.globalAlpha = 1;

      staticLayer = layer;
      return layer;
    };

    const seedResponsiveStars = () => {
      responsiveStars.length = 0;
      const isLowPower = (navigator.hardwareConcurrency || 8) <= 4 || /Mobi|Android/i.test(navigator.userAgent);
      const count = isLowPower ? Math.min(24, Math.max(12, Math.floor((width * height) / 40000))) : Math.min(42, Math.max(18, Math.floor((width * height) / 22000)));
      for (let i = 0; i < count; i++) {
        responsiveStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.8 + 0.9,
          color: starHue[Math.floor(Math.random() * starHue.length)],
          alpha: Math.random() * 0.6 + 0.35
        });
      }
    };

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      mouse.x = mouse.targetX = width / 2;
      mouse.y = mouse.targetY = height / 2;
      paintStaticLayer();
      seedResponsiveStars();
      drawFrame();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
      }
    };

    const drawFrame = () => {
      if (!staticLayer) return;

      // One blit replaces a full-screen gradient rebuild plus hundreds of arcs.
      ctx.drawImage(staticLayer, 0, 0);

      // Cursor gravitational aura (single gradient, only around the pointer).
      if (!reduceMotion) {
        const cursorGlow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius
        );
        cursorGlow.addColorStop(0, 'rgba(0, 243, 255, 0.12)');
        cursorGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.045)');
        cursorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
        ctx.fillStyle = cursorGlow;
        ctx.fill();
      }

      for (let i = 0; i < responsiveStars.length; i++) {
        const p = responsiveStars[i];
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < mouse.radius * mouse.radius) {
          const force = (mouse.radius - Math.sqrt(distSq)) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle + Math.PI / 4) * force * 0.18;
          p.vy += Math.sin(angle + Math.PI / 4) * force * 0.18;
        }

        p.vx *= 0.972;
        p.vy *= 0.972;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Cheap two-circle glow instead of shadowBlur.
        ctx.globalAlpha = p.alpha * 0.16;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        const isLowPower = (navigator.hardwareConcurrency || 8) <= 4 || /Mobi|Android/i.test(navigator.userAgent);
        if (!isLowPower) {
          for (let j = i + 1; j < Math.min(responsiveStars.length, i + 6); j++) {
            const p2 = responsiveStars[j];
            const cdx = p.x - p2.x;
            const cdy = p.y - p2.y;
            const cdistSq = cdx * cdx + cdy * cdy;
            if (cdistSq < 6400) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = '#38bdf8';
              ctx.globalAlpha = (1 - Math.sqrt(cdistSq) / 80) * 0.12;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }

          if (distSq < 10000) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = '#00f3ff';
            ctx.globalAlpha = (1 - Math.sqrt(distSq) / 100) * 0.25;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        } else {
          if (distSq < 6400) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = '#00f3ff';
            ctx.globalAlpha = (1 - Math.sqrt(distSq) / 80) * 0.2;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    // Adaptive fps for smoother performance
    const isLowPower = (navigator.hardwareConcurrency || 8) <= 4 || /Mobi|Android/i.test(navigator.userAgent);
    const FRAME_MS = 1000 / (isLowPower ? 24 : 30);
    let lastFrame = 0;
    const render = (now: number) => {
      animationId = requestAnimationFrame(render);
      if (document.hidden || reduceMotion) return;
      if (now - lastFrame < FRAME_MS) return;
      lastFrame = now;

      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;
      drawFrame();
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    resize();
    if (!reduceMotion) animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationId);
      staticLayer = null;
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
};
