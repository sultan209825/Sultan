import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface SectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: string;
  children: React.ReactNode;
}

export const SectionModal: React.FC<SectionModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  accentColor = '#ef4444',
  children
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('sultan-clear-hover-state'));
        window.dispatchEvent(new CustomEvent('hide-custom-tooltip'));
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        audioEngine.playClickSound();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.dispatchEvent(new CustomEvent('sultan-clear-hover-state'));
      window.dispatchEvent(new CustomEvent('hide-custom-tooltip'));
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    window.dispatchEvent(new CustomEvent('sultan-clear-hover-state'));
    window.dispatchEvent(new CustomEvent('hide-custom-tooltip'));
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    audioEngine.playClickSound();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleCloseModal}
      dir="rtl"
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-[#0a0a14] border border-white/15 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-modal-slide-up"
        style={{
          boxShadow: `0 0 50px ${accentColor}30, 0 20px 40px rgba(0,0,0,0.85)`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Slide-in Indicator Handle */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-2.5 -mb-1 sm:hidden shrink-0" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-md"
              style={{
                backgroundColor: `${accentColor}20`,
                borderColor: `${accentColor}40`,
                color: accentColor
              }}
            >
              {icon}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">{title}</h2>
              {subtitle && <p className="text-[11px] sm:text-xs text-zinc-400">{subtitle}</p>}
            </div>
          </div>

          <button
            onClick={handleCloseModal}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-90 cursor-pointer"
            aria-label="إغلاق (ESC)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};
