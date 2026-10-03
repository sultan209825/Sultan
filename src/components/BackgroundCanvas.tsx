import React, { useEffect, useRef } from 'react';

interface BackgroundCanvasProps {
  effect: 'auto' | 'winter' | 'summer' | 'cyber' | 'rain' | 'none';
  accentColor?: string;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
  color: string;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
  thickness: number;
}

interface Splash {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({
  effect = 'auto',
  accentColor = '#ef4444'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (effect === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool for cyber/winter/summer
    const count = width < 768 ? 32 : 55;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.8,
      alpha: Math.random() * 0.6 + 0.2,
      phase: Math.random() * Math.PI * 2
    }));

    // Royal Golden Embers & Luxury Sparkles for Sultan Identity
    const emberCount = width < 768 ? 24 : 45;
    const embers = Array.from({ length: emberCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -Math.random() * 0.55 - 0.2, // drifting gently upward
      size: Math.random() * 2.2 + 0.8,
      alpha: Math.random() * 0.7 + 0.2,
      maxAlpha: Math.random() * 0.6 + 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.04 + 0.02,
      color: Math.random() > 0.4 ? '#f59e0b' : Math.random() > 0.5 ? '#ef4444' : '#ffd700'
    }));

    // Rain drops pool
    const rainCount = width < 768 ? 60 : 120;
    const rainDrops: RainDrop[] = Array.from({ length: rainCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 18 + 12,
      speed: Math.random() * 8 + 14,
      alpha: Math.random() * 0.4 + 0.25,
      thickness: Math.random() * 1 + 0.8
    }));

    const splashes: Splash[] = [];

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Interactive Water Ripples pool
    const ripples: Ripple[] = [];

    const handleWindowClick = (e: MouseEvent) => {
      const clickX = e.clientX;
      const clickY = e.clientY;

      // Spawn concentric ripples for a natural water effect
      const colors = ['#ef4444', '#f59e0b', '#26d9ff', '#38bdf8'];
      const chosenColor = colors[Math.floor(Math.random() * colors.length)];

      ripples.push({
        x: clickX,
        y: clickY,
        radius: 0,
        maxRadius: Math.min(width, height) * 0.35 + 80,
        alpha: 0.85,
        speed: 3.5,
        color: chosenColor
      });

      // Secondary delayed inner ripple
      setTimeout(() => {
        ripples.push({
          x: clickX,
          y: clickY,
          radius: 0,
          maxRadius: Math.min(width, height) * 0.25 + 50,
          alpha: 0.65,
          speed: 2.8,
          color: '#ffffff'
        });
      }, 70);
    };

    window.addEventListener('click', handleWindowClick);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Render Interactive Water Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.alpha *= 0.965; // Smooth exponential decay

        if (r.alpha < 0.01 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        // Outer soft ripple wave
        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = r.alpha * 0.5;
        ctx.lineWidth = Math.max(1, 3.5 * (1 - r.radius / r.maxRadius));
        ctx.stroke();

        // Inner refracted refraction ring
        ctx.beginPath();
        ctx.arc(r.x, r.y, Math.max(0, r.radius - 8), 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = r.alpha * 0.25;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Push nearby particles with water displacement wave
        particles.forEach((p) => {
          const dx = p.x - r.x;
          const dy = p.y - r.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (Math.abs(dist - r.radius) < 25 && dist > 0) {
            const force = (1 - Math.abs(dist - r.radius) / 25) * 1.5;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        });

        ctx.restore();
      }

      // 2. Determine current mode
      const month = new Date().getMonth();
      const currentMode =
        effect === 'auto'
          ? month === 11 || month === 0 || month === 1
            ? 'winter'
            : month >= 5 && month <= 8
            ? 'summer'
            : 'cyber'
          : effect;

      if (currentMode === 'rain') {
        // --- RAIN EFFECT ---
        ctx.save();

        // Splashes at the bottom / random hits
        for (let sIdx = splashes.length - 1; sIdx >= 0; sIdx--) {
          const sp = splashes[sIdx];
          sp.radius += 0.8;
          sp.alpha *= 0.92;
          if (sp.alpha < 0.02 || sp.radius > sp.maxRadius) {
            splashes.splice(sIdx, 1);
            continue;
          }
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, sp.radius, sp.radius * 0.4, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(147, 197, 253, ${sp.alpha * 0.6})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Falling raindrops with subtle angle
        const angle = 0.15; // wind angle in radians
        rainDrops.forEach((d) => {
          d.y += d.speed;
          d.x += Math.sin(angle) * (d.speed * 0.4);

          // Hit ground or mouse proximity
          if (d.y > height) {
            if (Math.random() < 0.25) {
              splashes.push({
                x: d.x,
                y: height - Math.random() * 20,
                radius: 1,
                maxRadius: Math.random() * 6 + 4,
                alpha: 0.6
              });
            }
            d.y = -d.length - 5;
            d.x = Math.random() * width;
          }

          // Rain streak drawing
          const grad = ctx.createLinearGradient(
            d.x,
            d.y,
            d.x + Math.sin(angle) * d.length,
            d.y + d.length
          );
          grad.addColorStop(0, 'rgba(186, 230, 253, 0)');
          grad.addColorStop(0.7, `rgba(186, 230, 253, ${d.alpha})`);
          grad.addColorStop(1, `rgba(255, 255, 255, ${d.alpha * 0.9})`);

          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + Math.sin(angle) * d.length, d.y + d.length);
          ctx.strokeStyle = grad;
          ctx.lineWidth = d.thickness;
          ctx.lineCap = 'round';
          ctx.stroke();
        });

        // Atmospheric soft mist at bottom
        const mistGrad = ctx.createLinearGradient(0, height - 100, 0, height);
        mistGrad.addColorStop(0, 'rgba(14, 165, 233, 0)');
        mistGrad.addColorStop(1, 'rgba(14, 165, 233, 0.04)');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(0, height - 100, width, 100);

        ctx.restore();
      } else if (currentMode === 'winter') {
        // Falling snowflakes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        particles.forEach((p) => {
          p.y += p.size * 0.6 + 0.3;
          p.x += Math.sin(p.y * 0.02) * 0.5;
          if (p.y > height) {
            p.y = -5;
            p.x = Math.random() * width;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (currentMode === 'summer') {
        // Glowing golden fireflies
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          p.phase += 0.03;
          const currentAlpha = 0.2 + Math.abs(Math.sin(p.phase)) * 0.6;
          ctx.fillStyle = `rgba(255, 215, 0, ${currentAlpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Cyber Constellation
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        });

        // Connecting lines
        const maxDist = 110;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDist) {
              const lineAlpha = (1 - dist / maxDist) * 0.16;
              ctx.strokeStyle = `rgba(239, 68, 68, ${lineAlpha})`;
              ctx.lineWidth = 0.7;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }

        // Draw node circles
        particles.forEach((p) => {
          ctx.fillStyle = p.size > 2 ? accentColor : 'rgba(239, 68, 68, 0.7)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });

        // Mouse reactive soft glow
        const mDist = 140;
        particles.forEach((p) => {
          const mdx = p.x - mouseX;
          const mdy = p.y - mouseY;
          const dist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (dist < mDist) {
            ctx.strokeStyle = `rgba(239, 68, 68, ${(1 - dist / mDist) * 0.35})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();
          }
        });
      }

      // --- Royal Sultan Golden Embers & Sparkles Overlay Layer ---
      embers.forEach((em) => {
        em.y += em.vy;
        em.x += em.vx + Math.sin(em.pulse) * 0.25;
        em.pulse += em.pulseSpeed;

        if (em.y < -10) {
          em.y = height + 10;
          em.x = Math.random() * width;
        }
        if (em.x < -10) em.x = width + 10;
        if (em.x > width + 10) em.x = -10;

        const currentAlpha = Math.max(0.1, em.maxAlpha * (0.5 + Math.sin(em.pulse) * 0.5));

        // Soft royal aura glow
        const grad = ctx.createRadialGradient(em.x, em.y, 0, em.x, em.y, em.size * 3.5);
        grad.addColorStop(0, em.color);
        grad.addColorStop(0.4, `${em.color}80`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(em.x, em.y, em.size * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Sharp bright center spark
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(em.x, em.y, em.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleWindowClick);
    };
  }, [effect, accentColor]);

  if (effect === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.9 }}
    />
  );
};
