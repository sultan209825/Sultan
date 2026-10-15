import React, { useEffect, useRef } from 'react';
import { BackgroundStyle, AtmosphericEffect } from '../types';

interface BackgroundCanvasProps {
  effect?: 'auto' | 'winter' | 'summer' | 'cyber' | 'rain' | 'none';
  bgStyle?: BackgroundStyle;
  atmosphericEffect?: AtmosphericEffect;
  accentColor?: string;
  ecoMode?: boolean;
  customGradient?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return [239, 68, 68];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
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
  bgStyle = 'particle',
  atmosphericEffect = 'stars',
  accentColor = '#ef4444',
  ecoMode = false,
  customGradient
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if ((effect === 'none' && bgStyle === 'particle') || ecoMode) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let time = 0;

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

    let lastTime = 0;
    const isSmallScreen = window.innerWidth < 768;
    const frameInterval = (isSmallScreen || ecoMode) ? (1000 / 30) : (1000 / 60);

    const render = (time: number) => {
      animId = requestAnimationFrame(render);
      if (document.hidden) return;
      if (time - lastTime < frameInterval) return;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);
      const [rAccent, gAccent, bAccent] = hexToRgb(accentColor);

      // --- 1. STATIC MODE ---
      if (bgStyle === 'static') {
        const grad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.7
        );
        grad.addColorStop(0, `rgba(${rAccent}, ${gAccent}, ${bAccent}, 0.08)`);
        grad.addColorStop(1, 'rgba(6, 6, 10, 0.98)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        return;
      }

      // --- 2. AMBIENT GLOW MODE ---
      if (bgStyle === 'glow') {
        time += 0.015;
        const pulse = 0.5 + Math.sin(time) * 0.5;
        const grad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          Math.max(width, height) * (0.55 + pulse * 0.08)
        );
        grad.addColorStop(0, `rgba(${rAccent}, ${gAccent}, ${bAccent}, ${0.12 + pulse * 0.08})`);
        grad.addColorStop(0.5, `rgba(124, 58, 237, ${0.06 + pulse * 0.04})`);
        grad.addColorStop(1, 'rgba(6, 6, 10, 0.95)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        animId = requestAnimationFrame(render);
        return;
      }

      // --- 3. FLOWING ROYAL WAVES MODE (أمواج متدفقة) ---
      if (bgStyle === 'waves') {
        time += 0.015;

        // Base atmospheric vignette
        const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
        baseGrad.addColorStop(0, 'rgba(6, 6, 12, 0.65)');
        baseGrad.addColorStop(1, 'rgba(3, 3, 6, 0.95)');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, width, height);

        // 4 Harmonic flowing wave layers with luxurious undulating physics
        const waveLayers = [
          {
            yBase: height * 0.66,
            amp: Math.min(65, height * 0.09),
            wavelength: 0.003,
            speed: 0.012,
            phase: 0,
            colorTop: `rgba(${rAccent}, ${gAccent}, ${bAccent}, 0.22)`,
            colorBottom: 'rgba(6, 6, 10, 0.95)',
            stroke: `rgba(${rAccent}, ${gAccent}, ${bAccent}, 0.5)`,
            lineWidth: 1.6
          },
          {
            yBase: height * 0.74,
            amp: Math.min(52, height * 0.075),
            wavelength: 0.0045,
            speed: -0.016,
            phase: Math.PI / 2.5,
            colorTop: 'rgba(124, 58, 237, 0.26)', // Royal purple
            colorBottom: 'rgba(6, 6, 10, 0.92)',
            stroke: 'rgba(168, 85, 247, 0.65)',
            lineWidth: 1.8
          },
          {
            yBase: height * 0.82,
            amp: Math.min(42, height * 0.06),
            wavelength: 0.0065,
            speed: 0.022,
            phase: Math.PI * 0.8,
            colorTop: 'rgba(245, 158, 11, 0.22)', // Royal gold
            colorBottom: 'rgba(6, 6, 10, 0.95)',
            stroke: 'rgba(251, 191, 36, 0.75)',
            lineWidth: 2.2
          },
          {
            yBase: height * 0.89,
            amp: Math.min(32, height * 0.045),
            wavelength: 0.0088,
            speed: -0.026,
            phase: Math.PI * 1.35,
            colorTop: `rgba(${rAccent}, ${gAccent}, ${bAccent}, 0.35)`,
            colorBottom: 'rgba(3, 3, 6, 0.98)',
            stroke: '#ffffff',
            lineWidth: 2.5
          }
        ];

        waveLayers.forEach((w) => {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(0, height);
          ctx.lineTo(0, w.yBase);

          const step = width < 768 ? 8 : 5;
          for (let x = 0; x <= width; x += step) {
            const s1 = Math.sin(x * w.wavelength + time * w.speed * 60 + w.phase);
            const s2 = Math.cos(x * (w.wavelength * 0.5) + time * w.speed * 35);
            // Interactive mouse wave perturbation
            const mDist = Math.abs(x - mouseX);
            const mouseEffect = mDist < 200 ? (1 - mDist / 200) * 28 * Math.sin(time * 6) : 0;
            const y = w.yBase + (s1 * 0.7 + s2 * 0.3) * w.amp + mouseEffect;
            ctx.lineTo(x, y);
          }

          ctx.lineTo(width, height);
          ctx.closePath();

          const waveGrad = ctx.createLinearGradient(0, w.yBase - w.amp, 0, height);
          waveGrad.addColorStop(0, w.colorTop);
          waveGrad.addColorStop(1, w.colorBottom);
          ctx.fillStyle = waveGrad;
          ctx.fill();

          ctx.strokeStyle = w.stroke;
          ctx.lineWidth = w.lineWidth;
          ctx.stroke();
          ctx.restore();
        });

        // Floating luminous embers drifting above waves
        embers.slice(0, 24).forEach((em) => {
          em.y += em.vy * 0.6;
          em.x += em.vx + Math.sin(em.pulse) * 0.25;
          em.pulse += em.pulseSpeed;
          if (em.y < 0) em.y = height;
          if (em.x < 0) em.x = width;
          if (em.x > width) em.x = 0;
          ctx.save();
          ctx.fillStyle = em.color;
          ctx.globalAlpha = Math.max(0.1, em.maxAlpha * (0.45 + Math.sin(em.pulse) * 0.45));
          ctx.beginPath();
          ctx.arc(em.x, em.y, em.size * 0.85, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        animId = requestAnimationFrame(render);
        return;
      }

      // --- 4. ANIMATED CHROMATIC GRADIENTS MODE (تدرجات لونية متحركة) ---
      if (bgStyle === 'gradient') {
        time += 0.008;

        ctx.fillStyle = '#06060a';
        ctx.fillRect(0, 0, width, height);

        const maxDim = Math.max(width, height);
        const orbs = [
          {
            x: width * 0.35 + Math.sin(time * 0.7) * (width * 0.24),
            y: height * 0.38 + Math.cos(time * 0.85) * (height * 0.22),
            r: maxDim * 0.52,
            color: `rgba(${rAccent}, ${gAccent}, ${bAccent}, 0.38)`
          },
          {
            x: width * 0.68 + Math.cos(time * 0.65) * (width * 0.25),
            y: height * 0.62 + Math.sin(time * 0.78) * (height * 0.24),
            r: maxDim * 0.48,
            color: 'rgba(124, 58, 237, 0.34)'
          },
          {
            x: width * 0.5 + Math.sin(time * 1.05 + Math.PI) * (width * 0.26),
            y: height * 0.22 + Math.cos(time * 0.55) * (height * 0.16),
            r: maxDim * 0.42,
            color: 'rgba(245, 158, 11, 0.28)'
          },
          {
            x: width * 0.82 + Math.cos(time * 0.9) * (width * 0.16),
            y: height * 0.28 + Math.sin(time * 1.1) * (height * 0.18),
            r: maxDim * 0.44,
            color: 'rgba(6, 182, 212, 0.28)'
          },
          // Interactive cursor light orb
          {
            x: mouseX,
            y: mouseY,
            r: Math.min(width, height) * 0.36,
            color: `rgba(${rAccent}, ${gAccent}, ${bAccent}, 0.24)`
          }
        ];

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        orbs.forEach((orb) => {
          const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
          grad.addColorStop(0, orb.color);
          grad.addColorStop(0.5, orb.color.replace(/[\d\.]+\)$/, '0.10)'));
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();

        // Shimmering stardust sparkles over the chromatic fluid
        embers.slice(0, 20).forEach((em) => {
          em.y += em.vy * 0.5;
          em.x += em.vx + Math.sin(em.pulse) * 0.2;
          em.pulse += em.pulseSpeed;
          if (em.y < 0) em.y = height;
          if (em.x < 0) em.x = width;
          if (em.x > width) em.x = 0;
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = Math.max(0.05, em.maxAlpha * (0.35 + Math.sin(em.pulse) * 0.35));
          ctx.beginPath();
          ctx.arc(em.x, em.y, em.size * 0.75, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        animId = requestAnimationFrame(render);
        return;
      }

      // --- 5. PARTICLE & CELESTIAL EMBERS MODE (الجسيمات) ---
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
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleWindowClick);
    };
  }, [effect, bgStyle, accentColor, ecoMode]);

  // --- ATMOSPHERIC EFFECTS OVERLAY CANVAS ENGINE (فوق واجهة الموقع) ---
  const atmosCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (atmosphericEffect === 'none' || ecoMode) {
      const canvas = atmosCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = atmosCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let time = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let mouseX = width / 2;
    let mouseY = height / 2;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Interactive spark burst on click
    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      decay: number;
      size: number;
      color: string;
    }
    const sparks: Spark[] = [];

    const handleWindowClick = (e: MouseEvent) => {
      const sparkColors = ['#ffd700', '#fbbf24', '#ef4444', '#38bdf8', '#ffffff'];
      const count = 12;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = Math.random() * 3.5 + 1.5;
        sparks.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: Math.random() * 0.03 + 0.02,
          size: Math.random() * 2 + 1,
          color: sparkColors[Math.floor(Math.random() * sparkColors.length)]
        });
      }
    };
    window.addEventListener('click', handleWindowClick);

    // 1. Shooting Stars (شهب متساقطة) Pool
    interface ShootingStar {
      x: number;
      y: number;
      vx: number;
      vy: number;
      length: number;
      speed: number;
      alpha: number;
      maxAlpha: number;
      size: number;
      trailColor: string;
    }
    const shootingStars: ShootingStar[] = [];

    const spawnShootingStar = () => {
      const angle = Math.PI * 0.22 + (Math.random() - 0.5) * 0.15; // ~40 degrees diagonal
      const speed = Math.random() * 8 + 14;
      const startX = Math.random() * (width * 1.2) - width * 0.1;
      const startY = -Math.random() * 60 - 20;
      shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 70 + 80,
        speed,
        alpha: 0,
        maxAlpha: Math.random() * 0.4 + 0.6,
        size: Math.random() * 1.5 + 1.5,
        trailColor: Math.random() > 0.4 ? accentColor : '#fbbf24'
      });
    };

    // 2. Cosmic Twinkling Stars (نجوم ساطعة متساقطة ببطء) Pool
    const starCount = width < 768 ? 35 : 65;
    const twinklingStars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: Math.random() * 0.35 + 0.15,
      size: Math.random() * 2 + 0.8,
      baseAlpha: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.04 + 0.02,
      isCross: Math.random() > 0.65,
      sway: Math.random() * 0.5 + 0.2
    }));

    // 3. Glowing Royal Embers Pool (جزيئات ملكية متوهجة)
    const emberCount = width < 768 ? 32 : 55;
    const floatingEmbers = Array.from({ length: emberCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.65 - 0.25, // rising upward
      size: Math.random() * 2.2 + 1.1,
      baseAlpha: Math.random() * 0.6 + 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.035 + 0.02,
      color: Math.random() > 0.4 ? '#f59e0b' : Math.random() > 0.3 ? '#ef4444' : '#ffd700'
    }));

    // 4. Crystal Snowflakes Pool (ثلج ناعم)
    const snowCount = width < 768 ? 40 : 75;
    const snowflakes = Array.from({ length: snowCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: Math.random() * 0.8 + 0.4,
      size: Math.random() * 2.2 + 1,
      alpha: Math.random() * 0.5 + 0.3,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.01
    }));

    // 5. Rain Drops Pool
    const rainCount = width < 768 ? 45 : 85;
    const rainDrops = Array.from({ length: rainCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: Math.random() * 9 + 12,
      length: Math.random() * 16 + 12,
      thickness: Math.random() * 0.8 + 0.8,
      alpha: Math.random() * 0.35 + 0.2
    }));

    let lastShootingStarSpawn = 0;
    let lastAtmosTime = 0;
    const isSmallAtmos = window.innerWidth < 768;
    const atmosInterval = (isSmallAtmos || ecoMode) ? (1000 / 30) : (1000 / 60);

    const renderAtmos = (timestamp: number) => {
      animId = requestAnimationFrame(renderAtmos);
      if (document.hidden) return;
      if (timestamp - lastAtmosTime < atmosInterval) return;
      lastAtmosTime = timestamp;

      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      // --- CLICK SPARKS BURSTS (Available across all modes) ---
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.96;
        sp.vy *= 0.96;
        sp.alpha -= sp.decay;
        if (sp.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, sp.alpha);
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- EFFECT 1: STARS (تساقط النجوم والشهب المتلألئة) ---
      if (atmosphericEffect === 'stars') {
        if (timestamp - lastShootingStarSpawn > 1400 && Math.random() < 0.035) {
          spawnShootingStar();
          lastShootingStarSpawn = timestamp;
        }

        twinklingStars.forEach((star) => {
          star.y += star.vy;
          star.pulse += star.pulseSpeed;
          star.x += Math.sin(star.pulse) * star.sway * 0.35;
          if (star.y > height + 10) {
            star.y = -10;
            star.x = Math.random() * width;
          }

          const alpha = Math.max(0.1, star.baseAlpha * (0.6 + Math.sin(star.pulse) * 0.4));
          ctx.save();
          ctx.globalAlpha = alpha;

          if (star.isCross && alpha > 0.4) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            const arm = star.size * 2.8;
            ctx.moveTo(star.x - arm, star.y);
            ctx.lineTo(star.x + arm, star.y);
            ctx.moveTo(star.x, star.y - arm);
            ctx.lineTo(star.x, star.y + arm);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();

            ctx.arc(star.x, star.y, star.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 2.2);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.45)');
            grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });

        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const s = shootingStars[i];
          s.x += s.vx;
          s.y += s.vy;
          s.alpha = Math.min(s.maxAlpha, s.alpha + 0.08);

          const hx = s.x;
          const hy = s.y;
          const hyp = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
          const dirX = s.vx / hyp;
          const dirY = s.vy / hyp;
          const tx = hx - dirX * s.length;
          const ty = hy - dirY * s.length;

          const trailGrad = ctx.createLinearGradient(hx, hy, tx, ty);
          trailGrad.addColorStop(0, '#ffffff');
          trailGrad.addColorStop(0.25, `rgba(255, 255, 255, ${s.alpha})`);
          trailGrad.addColorStop(0.6, `${s.trailColor}88`);
          trailGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(tx, ty);
          ctx.strokeStyle = trailGrad;
          ctx.lineWidth = s.size;
          ctx.lineCap = 'round';
          ctx.stroke();

          const headGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, s.size * 4);
          headGrad.addColorStop(0, '#ffffff');
          headGrad.addColorStop(0.4, s.trailColor);
          headGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = headGrad;
          ctx.beginPath();
          ctx.arc(hx, hy, s.size * 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (s.x > width + 100 || s.y > height + 100) {
            shootingStars.splice(i, 1);
          }
        }
      }

      // --- EFFECT 2: EMBERS (جزيئات ملكية متوهجة) ---
      else if (atmosphericEffect === 'embers') {
        floatingEmbers.forEach((em) => {
          em.y += em.vy;
          em.pulse += em.pulseSpeed;
          em.x += Math.sin(time * 2 + em.pulse) * 0.45;

          const mdx = em.x - mouseX;
          const mdy = em.y - mouseY;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mDist < 120 && mDist > 0) {
            const force = (1 - mDist / 120) * 1.8;
            em.x += (mdx / mDist) * force;
            em.y += (mdy / mDist) * force;
          }

          if (em.y < -15) {
            em.y = height + 15;
            em.x = Math.random() * width;
          }
          if (em.x < -15) em.x = width + 15;
          if (em.x > width + 15) em.x = -15;

          const currentAlpha = Math.max(0.12, em.baseAlpha * (0.55 + Math.sin(em.pulse) * 0.45));

          const grad = ctx.createRadialGradient(em.x, em.y, 0, em.x, em.y, em.size * 4);
          grad.addColorStop(0, em.color);
          grad.addColorStop(0.35, `${em.color}80`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.save();
          ctx.globalAlpha = currentAlpha;
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(em.x, em.y, em.size * 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(em.x, em.y, em.size * 0.65, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // --- EFFECT 3: AURORA (شفق أورورا وسديم متوهج) ---
      else if (atmosphericEffect === 'aurora') {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const ribbonCount = 3;
        for (let r = 0; r < ribbonCount; r++) {
          const yBase = height * (0.2 + r * 0.16);
          const phase = time * (0.4 + r * 0.15) + r * 1.5;
          const [rAccent, gAccent, bAccent] = hexToRgb(accentColor);
          const color = r === 0
            ? `rgba(${rAccent}, ${gAccent}, ${bAccent}, 0.16)`
            : r === 1
            ? 'rgba(6, 182, 212, 0.14)'
            : 'rgba(168, 85, 247, 0.15)';

          ctx.beginPath();
          ctx.moveTo(0, yBase);
          for (let x = 0; x <= width; x += 15) {
            const y = yBase + Math.sin(x * 0.003 + phase) * 45 + Math.cos(x * 0.006 + phase * 0.8) * 25;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
        }
        ctx.restore();

        twinklingStars.slice(0, 30).forEach((star) => {
          star.y += star.vy * 0.6;
          star.pulse += star.pulseSpeed;
          if (star.y > height) star.y = 0;
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = Math.max(0.1, star.baseAlpha * 0.7);
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // --- EFFECT 4: SNOW (تساقط بلورات الثلج) ---
      else if (atmosphericEffect === 'snow') {
        snowflakes.forEach((flake) => {
          flake.y += flake.vy;
          flake.sway += flake.swaySpeed;
          flake.x += Math.sin(flake.sway) * 0.6;
          if (flake.y > height + 10) {
            flake.y = -10;
            flake.x = Math.random() * width;
          }
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.globalAlpha = flake.alpha;
          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // --- EFFECT 5: RAIN (رذاذ مطر متفاعل) ---
      else if (atmosphericEffect === 'rain') {
        ctx.save();
        rainDrops.forEach((drop) => {
          drop.y += drop.vy;
          drop.x += 1.2;
          if (drop.y > height) {
            drop.y = -drop.length - 10;
            drop.x = Math.random() * width;
          }
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x + 1.2, drop.y + drop.length);
          ctx.strokeStyle = `rgba(186, 230, 253, ${drop.alpha})`;
          ctx.lineWidth = drop.thickness;
          ctx.lineCap = 'round';
          ctx.stroke();
        });
        ctx.restore();
      }
    };

    animId = requestAnimationFrame(renderAtmos);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleWindowClick);
    };
  }, [atmosphericEffect, accentColor, ecoMode]);

  return (
    <>
      {customGradient && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-all duration-700 ease-in-out"
          style={{
            background: customGradient,
            opacity: 0.95
          }}
          aria-hidden="true"
        />
      )}
      {(effect !== 'none' || bgStyle !== 'particle') && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-0"
          style={{ opacity: 0.9 }}
        />
      )}
      {/* Atmospheric Overlays Layer (فوق واجهة الموقع) */}
      {atmosphericEffect && atmosphericEffect !== 'none' && !ecoMode && (
        <canvas
          ref={atmosCanvasRef}
          className="fixed inset-0 pointer-events-none z-15 sm:z-20"
          style={{ opacity: 0.95 }}
        />
      )}
    </>
  );
};
