import React, { useState, useEffect, useRef } from 'react';
import { Trophy, RotateCcw, X, Volume2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../utils/audioEngine';

interface SultanGameProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SultanGame: React.FC<SultanGameProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'gameover'>('idle');
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

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
    const saved = localStorage.getItem('sultan_game_highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10) || 0);
    }
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
    gameStateRef.current = 'running';
    setGameState('running');
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
    }
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

      // Draw Ground
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
      if (!isOpen) return;
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
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0e0e1a] border border-red-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl text-center"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            audioEngine.playClickSound();
            onClose();
          }}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          title="إغلاق اللعبة"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="text-amber-400" size={20} />
          <h3 className="text-lg font-bold text-white font-display-custom">
            قفزة السلطان • Sultan Runner
          </h3>
        </div>

        {/* Score Board */}
        <div className="flex items-center justify-center gap-6 mb-4 text-xs font-mono-custom">
          <div className="text-zinc-300">
            النقاط الحالية: <span className="text-red-400 font-bold text-base">{score}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-300">
            <Trophy size={14} />
            أعلى رقم قياسي: <span className="font-bold text-base">{highScore}</span>
          </div>
        </div>

        {/* Game Canvas */}
        <div
          onClick={jump}
          onTouchStart={(e) => {
            e.preventDefault();
            jump();
          }}
          className="relative cursor-pointer select-none rounded-2xl overflow-hidden border border-white/10 bg-[#080811] shadow-inner"
        >
          <canvas
            ref={canvasRef}
            width={380}
            height={160}
            className="w-full h-auto block"
          />

          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <p className="text-sm font-bold text-white mb-1">
                {isNewRecord ? '🎉 رقم قياسي جديد يا بطل!' : 'انتهت المحاولة 😅'}
              </p>
              <p className="text-xs text-zinc-300 font-mono-custom mb-3">
                نقاطك: <span className="text-amber-400 font-bold">{score}</span>
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  jump();
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-transform active:scale-95"
              >
                <RotateCcw size={14} />
                العب مجدداً
              </button>
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
        <p className="text-[11px] text-zinc-400 mt-3 font-sans">
          💡 اضغط على الشاشة، أو اضغط زر المسافة <span className="font-mono-custom bg-white/10 px-1 py-0.5 rounded text-white text-[10px]">SPACE</span> للقفز فوق العقبات!
        </p>
      </div>
    </div>
  );
};
