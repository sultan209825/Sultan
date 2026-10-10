import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Trophy,
  Swords,
  Zap,
  Crown,
  CheckCircle,
  RefreshCw,
  Search,
  Flame,
  Gamepad2,
  Users
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import {
  LeaderboardEntry,
  getLeaderboard,
  subscribeLeaderboard
} from '../utils/leaderboard';

interface SecretsMinigamesViewProps {
  onOpenGame: () => void;
  onOpenTicTacToe?: () => void;
  accentColor?: string;
}

type TabType = 'runner' | 'leaderboard' | 'tictactoe';

export const SecretsMinigamesView: React.FC<SecretsMinigamesViewProps> = ({
  onOpenGame,
  onOpenTicTacToe,
  accentColor = '#ef4444'
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('runner');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => getLeaderboard());
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Subscribe to real-time Cloud Firestore leaderboard
  useEffect(() => {
    const unsub = subscribeLeaderboard((entries) => {
      if (Array.isArray(entries) && entries.length > 0) {
        setLeaderboard(entries);
      }
    });
    return () => unsub();
  }, []);

  const filteredLeaderboard = leaderboard.filter((entry) =>
    (entry.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div
      className="w-full relative rounded-3xl bg-[#090912]/90 border border-white/10 p-4 sm:p-6 shadow-2xl backdrop-blur-xl space-y-4 text-right animate-in fade-in duration-300"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg"
            style={{
              backgroundColor: `${accentColor}20`,
              borderColor: `${accentColor}40`
            }}
          >
            <Sparkles size={18} style={{ color: accentColor }} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              ألعاب وتحديات السلطان الملكية 👑
            </h3>
            <p className="text-xs text-zinc-300">
              ألعاب حصرية، متصدرو السيرفر السحابي، وصندوق الغموض اليومي!
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => {
              audioEngine.playClickSound();
              setActiveTab('runner');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'runner'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Play size={13} fill={activeTab === 'runner' ? 'white' : 'none'} />
            <span>لعبة الركض 🏃‍♂️</span>
          </button>

          <button
            onClick={() => {
              audioEngine.playClickSound();
              setActiveTab('leaderboard');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy size={13} />
            <span>المتصدرين 🏆</span>
          </button>

          <button
            onClick={() => {
              audioEngine.playClickSound();
              setActiveTab('tictactoe');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tictactoe'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Swords size={13} />
            <span>تيك-تاك-تو ❌⭕</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Sultan Runner Game Showcase */}
      {activeTab === 'runner' && (
        <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-red-950/40 via-[#100d1c] to-black/90 border border-red-500/30 hover:border-red-400/60 shadow-xl transition-all space-y-4 group">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-2xl shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
                🏃‍♂️
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base sm:text-lg font-black text-white group-hover:text-red-300 transition-colors">
                    لعبة ركض السلطان (Sultan Runner)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
                    حصرية ⚡
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  تحدي الركض الملكي والقفز فوق الحواجز وجمع التيجان لتحقيق رقم قياسي عالمي 👑
                </p>
              </div>
            </div>
          </div>

          {/* Instructions & Features */}
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 py-1 text-xs">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
              <span className="text-base">⌨️</span>
              <div>
                <p className="font-bold text-white">التحكم</p>
                <p className="text-[10px] text-zinc-400">المسافة أو النقر للقفز</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
              <span className="text-base">👑</span>
              <div>
                <p className="font-bold text-white">الهدف</p>
                <p className="text-[10px] text-zinc-400">اجمع التيجان الملكية</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
              <span className="text-base">🔥</span>
              <div>
                <p className="font-bold text-white">السرعة</p>
                <p className="text-[10px] text-zinc-400">تزيد تدريجياً مع الوقت</p>
              </div>
            </div>
          </div>

          {/* Start Game CTA */}
          <button
            onClick={() => {
              audioEngine.playPowerUpSound();
              onOpenGame();
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-xl shadow-red-600/40 hover:scale-[1.01] active:scale-95 cursor-pointer min-h-[48px]"
          >
            <Play size={18} fill="white" />
            <span>بدء لعبة السلطان الآن (Play Game) 🎮</span>
          </button>
        </div>
      )}

      {/* Tab 2: Feature 1 - Global Cloud Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          {/* Subheader & Search */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <Trophy size={16} className="text-amber-400" />
              <span className="font-bold">أعلى النتائج الحية بالسيرفر العالمي</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="relative w-44 sm:w-56">
              <input
                type="text"
                placeholder="بحث عن لاعب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
              <Search size={13} className="text-zinc-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Leaderboard Table / Cards */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {filteredLeaderboard.slice(0, 15).map((entry, index) => {
              const rank = index + 1;
              const isFirst = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;

              return (
                <div
                  key={entry.id || `${entry.name}-${index}`}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isFirst
                      ? 'bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-black/80 border-amber-500/50 shadow-md shadow-amber-500/10'
                      : isSecond
                      ? 'bg-gradient-to-r from-zinc-800/40 via-zinc-900/20 to-black/80 border-zinc-400/40'
                      : isThird
                      ? 'bg-gradient-to-r from-amber-900/20 via-orange-950/20 to-black/80 border-amber-700/40'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isFirst
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/40'
                          : isSecond
                          ? 'bg-zinc-300 text-black'
                          : isThird
                          ? 'bg-amber-700 text-white'
                          : 'bg-white/10 text-zinc-300'
                      }`}
                    >
                      {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : rank}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs sm:text-sm text-white truncate">
                          {entry.name}
                        </span>
                        {entry.verified && (
                          <span
                            title="موثق رسمياً"
                            className="text-[10px] w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0"
                          >
                            ✓
                          </span>
                        )}
                        {entry.name.includes('سلطان') && (
                          <Crown size={13} className="text-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {entry.date || 'اليوم 🔥'}
                      </p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1.5 shrink-0 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                    <Flame size={14} className={isFirst ? 'text-amber-400' : 'text-red-400'} />
                    <span className="font-black font-mono text-sm text-white">
                      {entry.score.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-zinc-400">نقطة</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-zinc-400 text-center font-mono pt-1">
            يتم تحديث لوحة المتصدرين سحابياً في الوقت الفعلي عبر قاعدة بيانات السيرفر 🌐
          </p>
        </div>
      )}

      {/* Tab 3: Feature 6 - Royal Tic-Tac-Toe */}
      {activeTab === 'tictactoe' && (
        <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-950/40 via-[#100d1c] to-black/90 border border-purple-500/30 hover:border-purple-400/60 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-purple-600/30">
              ❌⭕
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base sm:text-lg font-black text-white">
                  لعبة تيك-تاك-تو الملكية (Royal Tic-Tac-Toe)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  ذكاء اصطناعي + لاعبين 👥
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                تحدى ذكاء السلطان الاصطناعي أو نافس صديقك محلياً في لوحة تيك-تاك-تو ملكية مع مؤثرات واحتفالات!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span>🤖 نمط الذكاء الاصطناعي</span>
              </span>
              <p className="text-[10px] text-zinc-400">
                يلعب السلطان بذكاء خوارزمي سريع التفكير ليتحداك في كل حركة.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span>👥 نمط لاعب ضد لاعب</span>
              </span>
              <p className="text-[10px] text-zinc-400">
                العب مع صاحبك على نفس الجهاز بنظام تبادل الأدوار الملكي.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.playPowerUpSound();
              if (onOpenTicTacToe) onOpenTicTacToe();
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-xl shadow-purple-600/40 hover:scale-[1.01] active:scale-95 cursor-pointer min-h-[48px]"
          >
            <Swords size={18} />
            <span>فتح لوحة تيك-تاك-تو والبدء الآن 👑</span>
          </button>
        </div>
      )}
    </div>
  );
};
