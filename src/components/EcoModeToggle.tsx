import React, { useState } from 'react';
import { Leaf, Zap, Battery, BatteryCharging, Check } from 'lucide-react';
import { BatteryInfo } from '../hooks/useEcoMode';

interface EcoModeToggleProps {
  isEcoMode: boolean;
  onToggle: () => void;
  battery: BatteryInfo | null;
  className?: string;
  showToastOnChange?: boolean;
}

export const EcoModeToggle: React.FC<EcoModeToggleProps> = ({
  isEcoMode,
  onToggle,
  battery,
  className = '',
  showToastOnChange = true
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleClick = () => {
    onToggle();
    if (showToastOnChange) {
      const msg = !isEcoMode
        ? '🍃 تم تفعيل وضع توفير الطاقة — تم إيقاف الجسيمات والتأثيرات الثقيلة لتسريع الهاتف وحفظ البطارية'
        : '⚡ تم تفعيل وضع الأداء الفائق — جميع التأثيرات البصرية والحركات ثلاثية الأبعاد نشطة';
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
          isEcoMode
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
            : 'bg-zinc-900/60 border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-white'
        } ${className}`}
        title={
          isEcoMode
            ? 'وضع توفير الطاقة نشط (اضغط للتبديل للأداء الفائق)'
            : 'وضع الأداء الفائق نشط (اضغط لتفعيل توفير الطاقة)'
        }
      >
        {isEcoMode ? (
          <>
            <Leaf className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden xs:inline">توفير الطاقة</span>
            <span className="xs:hidden">توفير</span>
          </>
        ) : (
          <>
            <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden xs:inline">أداء فائق</span>
            <span className="xs:hidden">أداء</span>
          </>
        )}

        {/* Battery Indicator if available */}
        {battery !== null && (
          <span className="flex items-center gap-0.5 text-[10px] font-mono opacity-80 border-r border-white/10 pr-1.5 mr-0.5">
            {battery.charging ? (
              <BatteryCharging className="w-3 h-3 text-emerald-400" />
            ) : (
              <Battery className="w-3 h-3 text-zinc-400" />
            )}
            <span>{battery.level}%</span>
          </span>
        )}
      </button>

      {/* Floating notification on mode toggle */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-black/90 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] backdrop-blur-xl text-white text-xs font-medium flex items-center gap-2 max-w-md animate-slideDown text-right">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};
