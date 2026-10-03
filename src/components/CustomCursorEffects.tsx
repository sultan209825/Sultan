import React, { useEffect, useState } from 'react';

export const CustomCursorEffects: React.FC = () => {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [glowPos, setGlowPos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [isHoveringClickable, setIsHoveringClickable] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    // Hide native cursor completely across the site when custom cursor runs
    document.documentElement.classList.add('cursor-none');
    document.body.classList.add('cursor-none');

    let rafId: number;
    let targetX = -100;
    let targetY = -100;
    let currentGlowX = -100;
    let currentGlowY = -100;

    const handleMouseMove = (e: MouseEvent) => {
      setIsVisible(true);
      targetX = e.clientX;
      targetY = e.clientY;
      setPos({ x: targetX, y: targetY });

      const target = e.target as HTMLElement | null;
      if (target?.closest('button, a, input, select, textarea, [role="button"], .cursor-pointer, [data-tooltip], [title]')) {
        setIsHoveringClickable(true);
      } else {
        setIsHoveringClickable(false);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    // Smooth and responsive trailing for the glow halo (optimized lerp factor for low latency and eye comfort)
    const loop = () => {
      currentGlowX += (targetX - currentGlowX) * 0.30;
      currentGlowY += (targetY - currentGlowY) * 0.30;
      setGlowPos({ x: currentGlowX, y: currentGlowY });
      rafId = requestAnimationFrame(loop);
    };

    // Click sparks FX
    const handleClick = (e: MouseEvent) => {
      for (let i = 0; i < 7; i++) {
        const spark = document.createElement('div');
        spark.style.position = 'fixed';
        spark.style.left = `${e.clientX}px`;
        spark.style.top = `${e.clientY}px`;
        spark.style.width = '4px';
        spark.style.height = '4px';
        spark.style.borderRadius = '50%';
        spark.style.backgroundColor = Math.random() > 0.5 ? '#ef4444' : '#ffd700';
        spark.style.boxShadow = '0 0 6px rgba(255, 215, 0, 0.8)';
        spark.style.pointerEvents = 'none';
        spark.style.zIndex = '99999';
        document.body.appendChild(spark);

        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 30;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;

        spark.animate(
          [
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: 0 }
          ],
          { duration: 400, easing: 'ease-out' }
        ).onfinish = () => spark.remove();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);
    rafId = requestAnimationFrame(loop);

    return () => {
      document.documentElement.classList.remove('cursor-none');
      document.body.classList.remove('cursor-none');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Outer Glow Follower */}
      <div
        className="custom-cursor fixed pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,height,background-color,border-color,box-shadow] duration-200 ease-out"
        style={{
          left: `${glowPos.x}px`,
          top: `${glowPos.y}px`,
          width: isHoveringClickable ? '48px' : '34px',
          height: isHoveringClickable ? '48px' : '34px',
          background: isHoveringClickable
            ? 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, rgba(255,215,0,0.18) 60%, transparent 100%)'
            : 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)',
          border: isHoveringClickable
            ? '1.5px solid rgba(245, 158, 11, 0.6)'
            : '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: isHoveringClickable
            ? '0 0 20px rgba(245, 158, 11, 0.35), inset 0 0 10px rgba(239, 68, 68, 0.2)'
            : '0 0 12px rgba(239, 68, 68, 0.25)'
        }}
      />

      {/* Center Precise Dot */}
      <div
        className="custom-cursor fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-100 ease-out"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: isHoveringClickable ? '6px' : '5px',
          height: isHoveringClickable ? '6px' : '5px',
          backgroundColor: isHoveringClickable ? '#f59e0b' : '#ffd700',
          boxShadow: isHoveringClickable
            ? '0 0 10px #f59e0b, 0 0 4px #fff'
            : '0 0 8px #ef4444'
        }}
      />
    </>
  );
};
