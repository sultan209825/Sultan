import React, { useState } from 'react';
import { X, RotateCcw, Crown, Sparkles, Trophy, Users, Bot } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../utils/audioEngine';
import { recordSiteLog } from '../utils/siteLogger';

interface RoyalTicTacToeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CellValue = 'X' | 'O' | null;

export const RoyalTicTacToeModal: React.FC<RoyalTicTacToeModalProps> = ({
  isOpen,
  onClose
}) => {
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true); // X is Player, O is Sultan / Player 2
  const [gameMode, setGameMode] = useState<'ai' | 'pvp'>('ai');
  const [scores, setScores] = useState({ player: 0, sultan: 0, ties: 0 });
  const [winnerLine, setWinnerLine] = useState<number[] | null>(null);
  const [winner, setWinner] = useState<'X' | 'O' | 'tie' | null>(null);

  if (!isOpen) return null;

  const calculateWinner = (squares: CellValue[]): { winner: 'X' | 'O' | null; line: number[] | null } => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a] as 'X' | 'O', line: [a, b, c] };
      }
    }
    return { winner: null, line: null };
  };

  const getBestAIMove = (currentBoard: CellValue[]): number => {
    // 1. Can AI win right now?
    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        const copy = [...currentBoard];
        copy[i] = 'O';
        if (calculateWinner(copy).winner === 'O') return i;
      }
    }
    // 2. Can Player win right now? Block!
    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        const copy = [...currentBoard];
        copy[i] = 'X';
        if (calculateWinner(copy).winner === 'X') return i;
      }
    }
    // 3. Take center if available
    if (!currentBoard[4]) return 4;
    // 4. Take corners
    const corners = [0, 2, 6, 8].filter((i) => !currentBoard[i]);
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
    // 5. Take any available
    const available = currentBoard.map((val, idx) => (val === null ? idx : null)).filter((v) => v !== null) as number[];
    return available[Math.floor(Math.random() * available.length)];
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    audioEngine.playClickSound();
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';

    const winCheck = calculateWinner(newBoard);
    if (winCheck.winner) {
      setBoard(newBoard);
      setWinner(winCheck.winner);
      setWinnerLine(winCheck.line);
      audioEngine.playRoyalFanfare();
      confetti({ particleCount: 70, spread: 70 });
      setScores((prev) => ({
        ...prev,
        [winCheck.winner === 'X' ? 'player' : 'sultan']: prev[winCheck.winner === 'X' ? 'player' : 'sultan'] + 1
      }));
      recordSiteLog('تحدي إكس أو ⚔️', `فوز ${winCheck.winner === 'X' ? 'اللاعب' : 'السلطان'} في اللعبة`);
      return;
    }

    // Check tie
    if (newBoard.every((cell) => cell !== null)) {
      setBoard(newBoard);
      setWinner('tie');
      setScores((prev) => ({ ...prev, ties: prev.ties + 1 }));
      return;
    }

    // Next turn
    if (gameMode === 'ai' && isXNext) {
      setBoard(newBoard);
      setIsXNext(false);

      // AI response with slight human delay
      setTimeout(() => {
        const aiMove = getBestAIMove(newBoard);
        if (aiMove !== undefined && newBoard[aiMove] === null) {
          const afterAiBoard = [...newBoard];
          afterAiBoard[aiMove] = 'O';
          const aiWinCheck = calculateWinner(afterAiBoard);

          if (aiWinCheck.winner) {
            setBoard(afterAiBoard);
            setWinner(aiWinCheck.winner);
            setWinnerLine(aiWinCheck.line);
            audioEngine.playPowerUpSound();
            setScores((prev) => ({ ...prev, sultan: prev.sultan + 1 }));
          } else if (afterAiBoard.every((cell) => cell !== null)) {
            setBoard(afterAiBoard);
            setWinner('tie');
            setScores((prev) => ({ ...prev, ties: prev.ties + 1 }));
          } else {
            setBoard(afterAiBoard);
            setIsXNext(true);
          }
        }
      }, 320);
    } else {
      setBoard(newBoard);
      setIsXNext(!isXNext);
    }
  };

  const handleResetBoard = () => {
    audioEngine.playClickSound();
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinnerLine(null);
    setIsXNext(true);
  };

  const handleClose = () => {
    audioEngine.playClickSound();
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[9995] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0d0e18] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-amber-500/20 text-white space-y-4 animate-modal-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md">
              <Crown size={20} className="text-amber-200 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white font-display-custom">
                تحدي إكس أو الملكي ⚔️
              </h3>
              <p className="text-[11px] text-zinc-400">
                العب ضد ذكاء السلطان أو تحدى صديقك محلياً
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center justify-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
          <button
            onClick={() => {
              setGameMode('ai');
              handleResetBoard();
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              gameMode === 'ai'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bot size={14} />
            <span>ضد ذكاء السلطان 🤖</span>
          </button>

          <button
            onClick={() => {
              setGameMode('pvp');
              handleResetBoard();
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              gameMode === 'pvp'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>لاعبان (2 Players) 👥</span>
          </button>
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-[10px] text-zinc-400 block font-mono">اللاعب (X)</span>
            <span className="text-base font-black text-amber-400 font-mono">{scores.player}</span>
          </div>
          <div className="p-2 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-zinc-400 block font-mono">تعادل</span>
            <span className="text-base font-black text-zinc-300 font-mono">{scores.ties}</span>
          </div>
          <div className="p-2 rounded-2xl bg-rose-500/10 border border-rose-500/30">
            <span className="text-[10px] text-zinc-400 block font-mono">
              {gameMode === 'ai' ? 'السلطان 👑 (O)' : 'اللاعب 2 (O)'}
            </span>
            <span className="text-base font-black text-rose-400 font-mono">{scores.sultan}</span>
          </div>
        </div>

        {/* Board */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto py-2">
          {board.map((cell, idx) => {
            const isHighlight = winnerLine?.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                className={`w-20 h-20 rounded-2xl border text-3xl font-black font-display-custom flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shadow-lg ${
                  isHighlight
                    ? 'bg-amber-500/30 border-amber-400 text-amber-300 ring-2 ring-amber-400 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                    : cell
                    ? 'bg-white/10 border-white/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/15 hover:border-amber-500/40'
                } ${cell === 'X' ? 'text-amber-400' : cell === 'O' ? 'text-rose-400' : ''}`}
              >
                {cell === 'X' ? '⚔️' : cell === 'O' ? '👑' : ''}
              </button>
            );
          })}
        </div>

        {/* Status & Restart */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs font-bold">
            {winner === 'X' && (
              <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                <Trophy size={14} /> فوز ساحق للاعب (X)! 🎉
              </span>
            )}
            {winner === 'O' && (
              <span className="text-rose-400 flex items-center gap-1 animate-pulse">
                <Crown size={14} /> فاز السلطان (O) بالعرش! 👑
              </span>
            )}
            {winner === 'tie' && <span className="text-zinc-300">تعادل شريف بين الجانبين! 🤝</span>}
            {!winner && (
              <span className="text-zinc-400">
                دور:{' '}
                <strong className={isXNext ? 'text-amber-400' : 'text-rose-400'}>
                  {isXNext ? 'اللاعب ⚔️' : gameMode === 'ai' ? 'السلطان 👑' : 'اللاعب الثاني 👑'}
                </strong>
              </span>
            )}
          </div>

          <button
            onClick={handleResetBoard}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw size={13} />
            <span>إعادة الجولة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
