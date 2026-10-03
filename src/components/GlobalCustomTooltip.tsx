import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  Lock,
  Heart,
  Share2,
  Crown,
  Music,
  Copy,
  Gamepad2,
  AlertTriangle
} from 'lucide-react';

type TooltipCategory =
  | 'crown'
  | 'share'
  | 'alert'
  | 'admin'
  | 'rating'
  | 'music'
  | 'copy'
  | 'game'
  | 'default';

interface TooltipState {
  visible: boolean;
  text: string;
  category: TooltipCategory;
}

export const GlobalCustomTooltip: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: '',
    category: 'default'
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);

  // Smooth lerp coordinates for buttery floating tracking
  const targetX = useRef<number>(-999);
  const targetY = useRef<number>(-999);
  const currentX = useRef<number>(-999);
  const currentY = useRef<number>(-999);
  const isTracking = useRef<boolean>(false);
  const rafId = useRef<number | null>(null);

  // Helper to detect category based on text, target attributes, and tags
  const detectCategory = (text: string, target: HTMLElement | null): TooltipCategory => {
    const lower = (text || '').toLowerCase();
    const targetId = (target?.id || '').toLowerCase();
    const targetClass = (target?.className || '').toString().toLowerCase();

    // 1. Alerts, Warnings, Destructive / Reset Actions (Vivid Crimson / Alert)
    if (
      lower.includes('حذف') ||
      lower.includes('مسح') ||
      lower.includes('تصفير') ||
      lower.includes('تحذير') ||
      lower.includes('تنبيه') ||
      lower.includes('خطر') ||
      lower.includes('إلغاء التصفية')
    ) {
      return 'alert';
    }

    // 2. Royal, VIP, Official Sultan Elements (Golden Glow)
    if (
      lower.includes('سلطان') ||
      lower.includes('ملكي') ||
      lower.includes('رتبة') ||
      lower.includes('vip') ||
      lower.includes('موثّق') ||
      lower.includes('تاج')
    ) {
      return 'crown';
    }

    // 3. Links, Sharing, Discord, External URL (Vivid Blue / Cyan)
    if (
      lower.includes('مشاركة') ||
      lower.includes('رابط') ||
      lower.includes('انضم') ||
      lower.includes('سيرفر') ||
      lower.includes('ديسكورد') ||
      lower.includes('تيك توك') ||
      lower.includes('tiktok') ||
      lower.includes('أكونت') ||
      target?.tagName === 'A'
    ) {
      return 'share';
    }

    // 4. Rating, Feedback, Likes (Rose / Ruby)
    if (
      lower.includes('عجبني') ||
      lower.includes('تقييم') ||
      lower.includes('لايك') ||
      lower.includes('تطوير') ||
      lower.includes('قلب') ||
      targetId.includes('rate')
    ) {
      return 'rating';
    }

    // 5. Music, Lyrics, Player (Purple / Fuchsia)
    if (
      lower.includes('أغنية') ||
      lower.includes('اغنية') ||
      lower.includes('تراك') ||
      lower.includes('تشغيل') ||
      lower.includes('إيقاف') ||
      lower.includes('صوت') ||
      lower.includes('تكرار') ||
      lower.includes('عشوائي') ||
      lower.includes('كلمات') ||
      lower.includes('السابقة') ||
      lower.includes('التالية')
    ) {
      return 'music';
    }

    // 6. Admin Panel, Management & Security (Amethyst / Violet)
    if (
      lower.includes('قفل') ||
      lower.includes('أدمن') ||
      lower.includes('ادمن') ||
      lower.includes('لوحة') ||
      lower.includes('تسجيل خروج') ||
      lower.includes('سجل') ||
      targetId.includes('admin') ||
      targetClass.includes('admin')
    ) {
      return 'admin';
    }

    // 7. Copy Action (Emerald Green)
    if (lower.includes('نسخ') || lower.includes('كوبي')) {
      return 'copy';
    }

    // 8. Games (Teal)
    if (lower.includes('لعبة') || lower.includes('ركض')) {
      return 'game';
    }

    return 'default';
  };

  // Calculate clamped target position relative to cursor
  const calcTargetPos = (clientX: number, clientY: number, text: string) => {
    const offsetX = 16;
    const offsetY = 16;
    let x = clientX + offsetX;
    let y = clientY + offsetY;

    const estimatedWidth = Math.min(text.length * 9 + 50, 320);
    if (x + estimatedWidth > window.innerWidth - 14) {
      x = clientX - estimatedWidth - 12;
    }
    if (y + 48 > window.innerHeight - 12) {
      y = clientY - 44;
    }

    return {
      x: Math.max(10, x),
      y: Math.max(10, y)
    };
  };

  useEffect(() => {
    // Only enable on desktop pointer fine devices
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    // High performance RAF loop for smooth floating easing
    const animateLoop = () => {
      if (isTracking.current && containerRef.current) {
        // Easing interpolation factor (gentle damping trailing the cursor)
        const easing = 0.16;
        currentX.current += (targetX.current - currentX.current) * easing;
        currentY.current += (targetY.current - currentY.current) * easing;

        containerRef.current.style.transform = `translate3d(${currentX.current}px, ${currentY.current}px, 0)`;
      }
      rafId.current = requestAnimationFrame(animateLoop);
    };

    rafId.current = requestAnimationFrame(animateLoop);

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest(
        '[title], [data-tooltip], [data-custom-tooltip]'
      ) as HTMLElement | null;

      if (!target) return;

      currentTargetRef.current = target;

      let text = target.getAttribute('data-custom-tooltip') || target.getAttribute('data-tooltip') || '';
      if (!text && target.hasAttribute('title')) {
        text = target.getAttribute('title') || '';
        if (text) {
          target.setAttribute('data-custom-tooltip', text);
          target.removeAttribute('title'); // Prevent browser's native white rectangle
        }
      }

      if (text.trim()) {
        const cat = detectCategory(text, target);
        const { x, y } = calcTargetPos(e.clientX, e.clientY, text);

        // Snap starting coordinates on first display so it doesn't swoop across screen
        if (!isTracking.current || currentX.current < 0) {
          currentX.current = x;
          currentY.current = y;
          if (containerRef.current) {
            containerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          }
        }

        targetX.current = x;
        targetY.current = y;
        isTracking.current = true;

        setTooltip({
          visible: true,
          text,
          category: cat
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (currentTargetRef.current && isTracking.current) {
        const text =
          currentTargetRef.current.getAttribute('data-custom-tooltip') ||
          currentTargetRef.current.getAttribute('data-tooltip') ||
          '';

        if (text) {
          const { x, y } = calcTargetPos(e.clientX, e.clientY, text);
          targetX.current = x;
          targetY.current = y;
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (currentTargetRef.current && (!related || !currentTargetRef.current.contains(related))) {
        setTooltip((prev) => ({ ...prev, visible: false }));
        currentTargetRef.current = null;
        isTracking.current = false;
      }
    };

    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseout', handleMouseOut, { passive: true });

    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  if (!tooltip.visible || !tooltip.text) return null;

  // Category Configuration: Colors, Shape, Borders & Glow
  const getCategoryTheme = () => {
    switch (tooltip.category) {
      case 'crown':
        return {
          bg: 'bg-gradient-to-br from-[#221807]/95 via-[#130e03]/95 to-[#2f2008]/98',
          border: 'border-amber-400/50',
          ring: 'ring-1 ring-amber-300/25',
          shadow: 'shadow-[0_16px_40px_-8px_rgba(0,0,0,0.95),0_0_24px_rgba(245,158,11,0.35),inset_0_1px_1px_rgba(255,223,128,0.3)]',
          textColor: 'text-amber-100 font-bold',
          rounded: 'rounded-full px-4 py-2',
          icon: <Crown size={14} className="text-amber-300 shrink-0 drop-shadow-[0_0_8px_rgba(252,211,77,0.9)] animate-pulse" />
        };

      case 'share':
        return {
          bg: 'bg-gradient-to-br from-[#081830]/95 via-[#050f20]/95 to-[#0c2448]/98',
          border: 'border-sky-400/55',
          ring: 'ring-1 ring-sky-300/30',
          shadow: 'shadow-[0_16px_40px_-8px_rgba(0,0,0,0.95),0_0_24px_rgba(56,189,248,0.35),inset_0_1px_1px_rgba(186,230,253,0.3)]',
          textColor: 'text-sky-100 font-semibold',
          rounded: 'rounded-2xl px-3.5 py-2',
          icon: <Share2 size={13} className="text-sky-400 shrink-0 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
        };

      case 'alert':
        return {
          bg: 'bg-gradient-to-br from-[#2a0e0e]/95 via-[#180505]/95 to-[#380e0e]/98',
          border: 'border-red-500/60',
          ring: 'ring-1 ring-rose-400/30',
          shadow: 'shadow-[0_16px_40px_-8px_rgba(0,0,0,0.95),0_0_24px_rgba(239,68,68,0.4),inset_0_1px_1px_rgba(254,202,202,0.25)]',
          textColor: 'text-rose-100 font-bold',
          rounded: 'rounded-2xl px-3.5 py-2',
          icon: <AlertTriangle size={13} className="text-red-400 shrink-0 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-bounce" />
        };

      case 'rating':
        return {
          bg: 'bg-gradient-to-br from-[#280d19]/95 via-[#16060e]/95 to-[#360d21]/98',
          border: 'border-rose-400/50',
          ring: 'ring-1 ring-rose-300/25',
          shadow: 'shadow-[0_16px_40px_-8px_rgba(0,0,0,0.95),0_0_22px_rgba(244,63,94,0.35),inset_0_1px_1px_rgba(254,205,211,0.25)]',
          textColor: 'text-rose-100 font-semibold',
          rounded: 'rounded-2xl px-3.5 py-2',
          icon: <Heart size={13} className="text-rose-400 fill-rose-500/30 shrink-0 drop-shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse" />
        };

      case 'music':
        return {
          bg: 'bg-gradient-to-br from-[#1a0e2d]/95 via-[#0e071a]/95 to-[#240e3f]/98',
          border: 'border-fuchsia-400/50',
          ring: 'ring-1 ring-fuchsia-300/25',
          shadow: 'shadow-[0_16px_40px_-8px_rgba(0,0,0,0.95),0_0_22px_rgba(217,70,239,0.35),inset_0_1px_1px_rgba(240,171,252,0.25)]',
          textColor: 'text-fuchsia-100 font-semibold',
          rounded: 'rounded-2xl px-3.5 py-2',
          icon: <Music size={13} className="text-fuchsia-400 shrink-0 drop-shadow-[0_0_8px_rgba(217,70,239,0.9)]" />
        };

      case 'admin':
        return {
          bg: 'bg-gradient-to-br from-[#1d162a]/95 via-[#100c19]/95 to-[#26153b]/98',
          border: 'border-purple-400/50',
          ring: 'ring-1 ring-purple-300/25',
          shadow: 'shadow-[0_16px_40px_-8px_rgba(0,0,0,0.95),0_0_22px_rgba(168,85,247,0.3),inset_0_1px_1px_rgba(216,180,254,0.25)]',
          textColor: 'text-purple-100 font-semibold',
          rounded: 'rounded-2xl px-3.5 py-2',
          icon: <Lock size={13} className="text-purple-300 shrink-0 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
        };

      case 'copy':
        return {
          bg: 'bg-gradient-to-br from-[#092217]/95 via-[#04120b]/95 to-[#0d2e1f]/98',
          border: 'border-emerald-400/50',
          ring: 'ring-1 ring-emerald-300/25',
          shadow: 'shadow-[0_16px_40px_-8px_rgba(0,0,0,0.95),0_0_22px_rgba(16,185,129,0.35),inset_0_1px_1px_rgba(167,243,208,0.25)]',
          textColor: 'text-emerald-100 font-semibold',
          rounded: 'rounded-2xl px-3.5 py-2',
          icon: <Copy size={13} className="text-emerald-400 shrink-0 drop-shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
        };

      case 'game':
        return {
          bg: 'bg-gradient-to-br from-[#0b2126]/95 via-[#051215]/95 to-[#0f2c33]/98',
          border: 'border-teal-400/50',
          ring: 'ring-1 ring-teal-300/25',
          shadow: 'shadow-[0_16px_40px_-8px_rgba(0,0,0,0.95),0_0_22px_rgba(20,184,166,0.3)]',
          textColor: 'text-teal-100 font-semibold',
          rounded: 'rounded-2xl px-3.5 py-2',
          icon: <Gamepad2 size={13} className="text-teal-400 shrink-0 drop-shadow-[0_0_8px_rgba(20,184,166,0.9)]" />
        };

      default:
        return {
          bg: 'bg-gradient-to-br from-[#141124]/92 via-[#0c0a16]/95 to-[#1a142c]/96',
          border: 'border-amber-500/35',
          ring: 'ring-1 ring-white/10',
          shadow: 'shadow-[0_16px_40px_-8px_rgba(0,0,0,0.9),0_0_20px_rgba(245,158,11,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]',
          textColor: 'text-zinc-100 font-semibold',
          rounded: 'rounded-2xl px-3.5 py-2',
          icon: <Sparkles size={13} className="text-amber-400 shrink-0 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
        };
    }
  };

  const theme = getCategoryTheme();

  return (
    <div
      ref={containerRef}
      id="global-tooltip"
      className="fixed top-0 left-0 pointer-events-none z-[100000] select-none will-change-transform"
      style={{
        transform: `translate3d(${currentX.current}px, ${currentY.current}px, 0)`
      }}
    >
      <div
        className={`flex items-center gap-2 border ${theme.bg} ${theme.border} ${theme.ring} ${theme.shadow} ${theme.rounded} backdrop-blur-xl max-w-[320px] break-words text-right`}
        style={{
          animation: 'tooltipDynamicFade 0.16s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        <div className="shrink-0 flex items-center justify-center">
          {theme.icon}
        </div>
        <span className={`text-xs font-sans tracking-wide leading-relaxed ${theme.textColor}`}>
          {tooltip.text}
        </span>
      </div>

      <style>{`
        @keyframes tooltipDynamicFade {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(4px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
