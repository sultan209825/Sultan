import React, { useEffect, useState, useRef } from 'react';
import { Share2, Copy, MessageSquare, Check, Gamepad2 } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface CustomContextMenuProps {
  onShare: () => void;
  onOpenGame?: () => void;
  discordUrl?: string;
}

export const CustomContextMenu: React.FC<CustomContextMenuProps> = ({
  onShare,
  onOpenGame,
  discordUrl = 'https://discord.gg/TUU6EeC6pb'
}) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Don't override if inside input or textarea
      if ((e.target as HTMLElement).closest('input, textarea')) return;

      e.preventDefault();
      const menuWidth = 220;
      const menuHeight = 180;
      const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
      const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

      setPos({ x: Math.max(10, x), y: Math.max(10, y) });
      setVisible(true);
      audioEngine.playClickSound();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };

    const handleScroll = () => setVisible(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisible(false);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!visible) return null;

  const handleCopyLink = () => {
    audioEngine.playClickSound();
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setVisible(false);
    }, 1200);
  };

  return (
    <div
      ref={menuRef}
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-[9999] w-52 bg-[#0d0d1a]/95 border border-red-500/30 rounded-2xl p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(239,68,68,0.2)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-right select-none"
      dir="rtl"
    >
      <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 border-b border-white/5 flex items-center justify-between">
        <span>قائمة خيارات الموقع</span>
        <span className="text-red-400 font-mono">𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪</span>
      </div>

      <div className="py-1 space-y-0.5 text-xs text-zinc-300">
        <button
          onClick={() => {
            onShare();
            setVisible(false);
          }}
          className="w-full px-3 py-2 rounded-xl flex items-center justify-between hover:bg-white/10 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Share2 size={14} className="text-amber-400" />
            <span>مشاركة الصفحة</span>
          </div>
          <span className="text-[10px] text-zinc-400">Share</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="w-full px-3 py-2 rounded-xl flex items-center justify-between hover:bg-white/10 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-cyan-400" />}
            <span>{copied ? 'تم نسخ الرابط!' : 'نسخ رابط الموقع'}</span>
          </div>
          <span className="text-[10px] text-zinc-400">Copy</span>
        </button>

        <div className="h-[1px] bg-white/5 my-1" />

        <a
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setVisible(false)}
          className="w-full px-3 py-2 rounded-xl flex items-center justify-between hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-indigo-400" />
            <span>سيرفر الديسكورد</span>
          </div>
          <span className="text-[10px] text-indigo-400/80">Discord</span>
        </a>

        {onOpenGame && (
          <button
            onClick={() => {
              onOpenGame();
              setVisible(false);
            }}
            className="w-full px-3 py-2 rounded-xl flex items-center justify-between hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors text-indigo-300 font-medium"
          >
            <div className="flex items-center gap-2">
              <Gamepad2 size={14} className="text-indigo-400" />
              <span>لعبة الركض (Sultan Runner)</span>
            </div>
            <span className="text-[10px] text-indigo-400/80">Play 🎮</span>
          </button>
        )}
      </div>
    </div>
  );
};
