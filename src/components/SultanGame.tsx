import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  RotateCcw,
  X,
  Sparkles,
  Crown,
  Medal,
  Flame,
  Gamepad2,
  Send,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../utils/audioEngine';
import { recordSiteLog } from '../utils/siteLogger';
import {
  getLeaderboard,
  saveLeaderboardScore,
  LeaderboardEntry
} from '../utils/leaderboard';
import { sendSiteEventToDiscord } from '../utils/discordWebhook';

interface SultanGameProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SultanGame: React.FC<SultanGameProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard'>('game');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'gameover'>('idle');
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('sultan_player_name') || '';
  });
  const [isScoreSaved, setIsScoreSaved] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<string>('');
  const [recentSavedId, setRecentSavedId] = useState<string | null>(null);

  const gameStateRef = useRef<'idle' | 'running' | 'gameover'>('idle');
  const scoreRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Game physics state
  const playerRef = useRef({
    x: 40,
    y: 110,
    w: 24,
    h: 24,
    vy: 0,
    isGrounded: true
  });
  const obstaclesRef = useRef<Array<{ x: number; w: number; h: number; color: string }>>([]);
  const frameCountRef = useRef<number>(0);
  const speedRef = useRef<number>(3.6);

  useEffect(() => {
    // Load initial high score and leaderboard
    const savedHigh = localStorage.getItem('sultan_game_highscore');
    if (savedHigh) {
      setHighScore(parseInt(savedHigh, 10) || 0);
    }
    setLeaderboard(getLeaderboard());
  }, []);

  const resetGame = () => {
    playerRef.current = {
      x: 40,
      y: 110,
      w: 24,
      h: 24,
      vy: 0,
      isGrounded: true
    };
    obstaclesRef.current = [];
    frameCountRef.current = 0;
    speedRef.current = 3.6;
    scoreRef.current = 0;
    setScore(0);
    setIsNewRecord(false);
    setIsScoreSaved(false);
    gameStateRef.current = 'running';
    setGameState('running');
    recordSiteLog('بدء اللعبة 🎮', 'بدء جولة جديدة في لعبة ركض السلطان وتخطي الحواجز');
  };

  const jump = () => {
    if (gameStateRef.current === 'idle' || gameStateRef.current === 'gameover') {
      resetGame();
      startGameLoop();
      audioEngine.playJumpSound();
      return;
    }

    if (playerRef.current.isGrounded) {
      playerRef.current.vy = -7.6;
      playerRef.current.isGrounded = false;
      audioEngine.playJumpSound();
    }
  };

  const gameOver = () => {
    gameStateRef.current = 'gameover';
    setGameState('gameover');
    audioEngine.playCrashSound();

    const finalScore = scoreRef.current;
    const currentHigh = parseInt(localStorage.getItem('sultan_game_highscore') || '0', 10);
    if (finalScore > currentHigh) {
      localStorage.setItem('sultan_game_highscore', finalScore.toString());
      setHighScore(finalScore);
      setIsNewRecord(true);
      audioEngine.playRoyalFanfare();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      recordSiteLog('رقم قياسي جديد 🏆', `تحقيق رقم قياسي جديد في لعبة الركض: ${finalScore} نقطة!`);
    } else {
      recordSiteLog('انتهاء الجولة 🏁', `خسارة في لعبة الركض - النقاط المحققة: ${finalScore}`);
    }
  };

  const handleSaveToLeaderboard = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isScoreSaved) return;

    const trimmed = playerName.trim() || 'لاعب مجهول';
    const finalScore = scoreRef.current;

    localStorage.setItem('sultan_player_name', trimmed);

    const result = saveLeaderboardScore(trimmed, finalScore);
    setLeaderboard(result.updatedLeaderboard);
    setIsScoreSaved(true);
    setRecentSavedId(result.entry.id);

    if (result.isNewPersonalBest) {
      setSavedFeedback(`تم تحديث رقمك القياسي إلى ${finalScore} نقطة! (المركز #${result.rank}) 👑`);
    } else {
      setSavedFeedback(`لديك رقم قياسي سابق أعلى (${result.entry.score} نقطة) محفوظ في المركز #${result.rank} 👑`);
    }

    audioEngine.playRoyalFanfare();
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.5 }
    });

    recordSiteLog(
      'تسجيل في لوحة الصدارة 🏆',
      `سجل اللاعب ${trimmed} سكور ${finalScore} نقطة في لوحة الصدارة (المركز #${result.rank})`
    );

    // Send Discord Webhook notification
    sendSiteEventToDiscord('game_score', {
      score: finalScore,
      playerName: trimmed,
      rank: result.rank
    });

    // Automatically transition to the leaderboard tab after a brief moment
    setTimeout(() => {
      setActiveTab('leaderboard');
    }, 800);
  };

  const startGameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const groundY = H - 24;

    const loop = () => {
      if (gameStateRef.current !== 'running') return;

      ctx.clearRect(0, 0, W, H);

      // Draw Ground Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(W, groundY);
      ctx.stroke();

      // Ground cyber grid lines
      ctx.strokeStyle = 'rgba(124, 92, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < W; i += 25) {
        ctx.beginPath();
        ctx.moveTo(i, groundY);
        ctx.lineTo(i - 10, H);
        ctx.stroke();
      }

      // Player Physics
      const p = playerRef.current;
      p.vy += 0.42; // gravity
      p.y += p.vy;

      if (p.y >= groundY - p.h) {
        p.y = groundY - p.h;
        p.vy = 0;
        p.isGrounded = true;
      }

      // Draw Player (Crown Character)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      // Draw Crown Shape
      ctx.moveTo(p.x, p.y + p.h);
      ctx.lineTo(p.x, p.y + 6);
      ctx.lineTo(p.x + 6, p.y + 12);
      ctx.lineTo(p.x + 12, p.y + 2);
      ctx.lineTo(p.x + 18, p.y + 12);
      ctx.lineTo(p.x + p.w, p.y + 6);
      ctx.lineTo(p.x + p.w, p.y + p.h);
      ctx.closePath();
      ctx.fill();

      // Crown jewel glow
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(p.x + 12, p.y + 5, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Obstacle Spawning
      frameCountRef.current++;
      const spawnRate = Math.max(38, Math.floor(75 - speedRef.current * 3.5));
      if (frameCountRef.current % spawnRate === 0) {
        const height = 16 + Math.random() * 20;
        obstaclesRef.current.push({
          x: W,
          w: 14,
          h: height,
          color: Math.random() > 0.5 ? '#26d9ff' : '#7c5cff'
        });
      }

      // Move & Draw Obstacles
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= speedRef.current;

        const obsY = groundY - obs.h;
        ctx.fillStyle = obs.color;
        ctx.shadowColor = obs.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(obs.x, obsY, obs.w, obs.h);
        ctx.shadowBlur = 0;

        // Collision Check
        if (
          p.x + 4 < obs.x + obs.w &&
          p.x + p.w - 4 > obs.x &&
          p.y + 4 < obsY + obs.h &&
          p.y + p.h > obsY
        ) {
          gameOver();
          return;
        }

        // Clean offscreen
        if (obs.x + obs.w < 0) {
          obstaclesRef.current.splice(i, 1);
        }
      }

      // Score increment & speedup
      if (frameCountRef.current % 4 === 0) {
        scoreRef.current++;
        setScore(scoreRef.current);
      }
      speedRef.current += 0.0018;

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab('game');
      setLeaderboard(getLeaderboard());
      resetGame();
      startGameLoop();
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      gameStateRef.current = 'idle';
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen]);

  // Keyboard jump handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || activeTab !== 'game') return;
      // Do not trigger jump if typing in the player name input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0e0e1a]/95 border border-red-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(239,68,68,0.2)] text-center max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            audioEngine.playClickSound();
            onClose();
          }}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          data-tooltip="إغلاق اللعبة"
        >
          <X size={18} />
        </button>

        {/* Header Tabs: Game vs Leaderboard */}
        <div className="flex items-center justify-center gap-2 mb-4 mt-1">
          <button
            onClick={() => {
              audioEngine.playClickSound();
              setActiveTab('game');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              activeTab === 'game'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30 ring-1 ring-red-400/50'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Gamepad2 size={15} />
            <span>قفزة السلطان</span>
          </button>

          <button
            onClick={() => {
              audioEngine.playClickSound();
              setLeaderboard(getLeaderboard());
              setActiveTab('leaderboard');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/30 ring-1 ring-amber-400/50'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy size={15} className="text-amber-300" />
            <span>لوحة الصدارة</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </button>
        </div>

        {/* TAB 1: RUNNER GAME */}
        {activeTab === 'game' && (
          <div className="space-y-4">
            {/* Score Board */}
            <div className="flex items-center justify-center gap-6 text-xs font-mono-custom bg-white/5 py-2 px-4 rounded-2xl border border-white/10">
              <div className="text-zinc-300">
                النقاط الحالية: <span className="text-red-400 font-bold text-base">{score}</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-1.5 text-amber-300">
                <Trophy size={14} />
                أعلى رقم قياسي: <span className="font-bold text-base">{highScore}</span>
              </div>
            </div>

            {/* Game Canvas Container */}
            <div
              onClick={jump}
              onTouchStart={(e) => {
                e.preventDefault();
                jump();
              }}
              className="relative cursor-pointer select-none rounded-2xl overflow-hidden border border-red-500/30 bg-[#080811] shadow-inner"
            >
              <canvas
                ref={canvasRef}
                width={380}
                height={160}
                className="w-full h-auto block"
              />

              {/* Game Over Screen with Leaderboard Save Option */}
              {gameState === 'gameover' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150"
                >
                  <p className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                    {isNewRecord ? (
                      <>
                        <Sparkles className="text-amber-400" size={16} />
                        <span>🎉 رقم قياسي شخصي جديد!</span>
                      </>
                    ) : (
                      <span>انتهت المحاولة 😅</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-300 font-mono-custom mb-3">
                    مجموع نقاطك:{' '}
                    <span className="text-amber-400 font-bold text-base">{score}</span> نقطة
                  </p>

                  {/* Register to Leaderboard Form */}
                  {score > 0 && !isScoreSaved ? (
                    <form
                      onSubmit={handleSaveToLeaderboard}
                      className="w-full max-w-xs mb-3 flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="اكتب اسمك أو يوزرك..."
                        maxLength={18}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-right"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-bold text-xs flex items-center gap-1 transition-transform active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
                        data-tooltip="حفظ نتيجتك في لوحة الصدارة"
                      >
                        <Send size={12} />
                        <span>سجّل</span>
                      </button>
                    </form>
                  ) : isScoreSaved ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-3 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-center">
                      <CheckCircle2 size={14} className="shrink-0" />
                      <span>{savedFeedback || 'تم حفظ نتيجتك في لوحة الصدارة بنجاح! 👑'}</span>
                    </div>
                  ) : null}

                  {/* Play Again & View Leaderboard Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        jump();
                      }}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-transform active:scale-95 cursor-pointer"
                    >
                      <RotateCcw size={14} />
                      <span>العب مجدداً</span>
                    </button>

                    <button
                      onClick={() => {
                        audioEngine.playClickSound();
                        setLeaderboard(getLeaderboard());
                        setActiveTab('leaderboard');
                      }}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trophy size={14} />
                      <span>لوحة الصدارة</span>
                    </button>
                  </div>
                </div>
              )}

              {gameState === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-zinc-400 animate-pulse">
                    اضغط على الشاشة أو اضغط مسافة للقفز
                  </span>
                </div>
              )}
            </div>

            {/* Controls Info */}
            <p className="text-[11px] text-zinc-400 font-sans">
              💡 اضغط على الشاشة، أو اضغط زر المسافة{' '}
              <span className="font-mono-custom bg-white/10 px-1 py-0.5 rounded text-white text-[10px]">
                SPACE
              </span>{' '}
              للقفز وتخطي العقبات!
            </p>
          </div>
        )}

        {/* TAB 2: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4 text-right animate-in fade-in duration-200">
            {/* Leaderboard Header */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <Crown size={14} />
                <span>أساطير قفزة السلطان</span>
              </div>
              <p className="text-xs text-zinc-400">
                أعلى الأرقام القياسية المسجلة في سيرفر وموقع السلطان
              </p>
            </div>

            {/* Leaderboard List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const isFirst = rank === 1;
                const isSecond = rank === 2;
                const isThird = rank === 3;
                const isJustSaved = entry.id === recentSavedId;

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${
                      isFirst
                        ? 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/30'
                        : isSecond
                        ? 'bg-white/5 border-zinc-400/30'
                        : isThird
                        ? 'bg-amber-700/10 border-amber-700/30'
                        : 'bg-white/5 border-white/5'
                    } ${isJustSaved ? 'ring-2 ring-emerald-400 animate-pulse' : ''}`}
                  >
                    {/* Left side: Score and Date */}
                    <div className="text-left font-mono-custom">
                      <div
                        className={`text-sm font-bold ${
                          isFirst
                            ? 'text-amber-400'
                            : isSecond
                            ? 'text-zinc-200'
                            : isThird
                            ? 'text-amber-500'
                            : 'text-zinc-400'
                        }`}
                      >
                        {entry.score}{' '}
                        <span className="text-[10px] text-zinc-500 font-sans">نقطة</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-sans">{entry.date}</div>
                    </div>

                    {/* Right side: Rank & Player Name */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-xs font-bold text-white tracking-wide">
                            {entry.name}
                          </span>
                          {entry.verified && (
                            <span
                              className="text-amber-400"
                              data-tooltip="موثق رسمياً كـ سلطان"
                            >
                              <Crown size={12} />
                            </span>
                          )}
                        </div>
                        {isFirst && (
                          <span className="text-[10px] text-amber-400/90 font-medium">
                            👑 بطل الصدارة
                          </span>
                        )}
                      </div>

                      {/* Rank Badge */}
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isFirst
                            ? 'bg-amber-400 text-black shadow-md shadow-amber-400/40'
                            : isSecond
                            ? 'bg-zinc-300 text-black'
                            : isThird
                            ? 'bg-amber-700 text-white'
                            : 'bg-white/10 text-zinc-400'
                        }`}
                      >
                        {isFirst ? (
                          <Crown size={15} />
                        ) : isSecond ? (
                          '2'
                        ) : isThird ? (
                          '3'
                        ) : (
                          rank
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Button: Play to Beat Highscore */}
            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  audioEngine.playClickSound();
                  setActiveTab('game');
                  resetGame();
                  startGameLoop();
                }}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-transform active:scale-98 cursor-pointer"
              >
                <Flame size={15} />
                <span>العب الآن وتحدَّ الصدارة! 🔥</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
