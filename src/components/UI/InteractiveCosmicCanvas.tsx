// Interactive Space Canvas with Stagnant Galaxy / Starfield Backdrop and Cursor-Responsive Star Particle Constellations
import React, { useEffect, useRef } from 'react';

interface ResponsiveStar {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 170
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStagnantStars();
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

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    // 1. Stagnant deep galaxy & background stars (remain still)
    let stagnantStars: StagnantStar[] = [];
    const initStagnantStars = () => {
      stagnantStars = [];
      const count = Math.floor((width * height) / 3500);
      const starColors = ['#ffffff', '#e0f2fe', '#bae6fd', '#fef08a', '#e9d5ff'];
      for (let i = 0; i < count; i++) {
        stagnantStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.3,
          alpha: Math.random() * 0.7 + 0.2,
          color: starColors[Math.floor(Math.random() * starColors.length)]
        });
      }
    };
    initStagnantStars();

    // 2. Responsive foreground star layer (deflects & interconnects strictly with cursor)
    const responsiveStarCount = Math.min(100, Math.floor((width * height) / 10000));
    const starHue = ['#38bdf8', '#00f3ff', '#a855f7', '#ec4899', '#ffffff'];
    const responsiveStars: ResponsiveStar[] = [];

    for (let i = 0; i < responsiveStarCount; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      responsiveStars.push({
        x: rx,
        y: ry,
        baseX: rx,
        baseY: ry,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        color: starHue[Math.floor(Math.random() * starHue.length)],
        alpha: Math.random() * 0.7 + 0.3
      });
    }

    // Animation Loop
    const render = () => {
      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      // Deep space clear
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Render stagnant deep galaxy nebulae glows
      const galaxyGlow = ctx.createRadialGradient(
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
      ctx.fillStyle = galaxyGlow;
      ctx.fillRect(0, 0, width, height);

      // Render Stagnant Background Stars
      for (let i = 0; i < stagnantStars.length; i++) {
        const s = stagnantStars[i];
        ctx.save();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.fill();
        ctx.restore();
      }

      // Cursor Gravitational Nebula Aura
      const cursorGlow = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        mouse.radius
      );
      cursorGlow.addColorStop(0, 'rgba(0, 243, 255, 0.14)');
      cursorGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.05)');
      cursorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
      ctx.fillStyle = cursorGlow;
      ctx.fill();

      // Render Responsive Stars (Reacting only to cursor)
      for (let i = 0; i < responsiveStars.length; i++) {
        const p = responsiveStars[i];

        // Cursor distance
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          // Swirl and attract slightly around mouse cursor
          p.vx += Math.cos(angle + Math.PI / 4) * force * 0.22;
          p.vy += Math.sin(angle + Math.PI / 4) * force * 0.22;
        }

        // Damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw star particle
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.restore();

        // Connect nearby responsive stars with subtle stellar rays
        for (let j = i + 1; j < responsiveStars.length; j++) {
          const p2 = responsiveStars[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#38bdf8';
            ctx.globalAlpha = (1 - cdist / 100) * 0.2;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Draw laser connector to cursor when near
        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = '#00f3ff';
          ctx.globalAlpha = (1 - dist / 130) * 0.35;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
    />
  );
};
