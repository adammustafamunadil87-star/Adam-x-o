import { motion, AnimatePresence } from 'motion/react';
import { BoardState, SymbolType } from '../types';

interface GameBoardProps {
  board: BoardState;
  onCellClick: (idx: number) => void;
  winningLine?: number[];
  gameOver: boolean;
  isComputerTurn: boolean;
}

export default function GameBoard({
  board,
  onCellClick,
  winningLine,
  gameOver,
  isComputerTurn,
}: GameBoardProps) {
  
  // Decide cell color/glows based on winning status
  const getCellClassName = (idx: number, value: SymbolType | null) => {
    const isWinner = winningLine?.includes(idx);
    const base = "aspect-square rounded-2xl flex items-center justify-center border text-5xl font-black select-none relative transition-all duration-300 ";
    
    if (value === null) {
      if (gameOver || isComputerTurn) {
        return base + "bg-slate-950/20 border-slate-900/50 cursor-not-allowed";
      }
      return base + "bg-slate-900/40 border-slate-800 hover:bg-slate-800/40 hover:border-violet-500/30 cursor-pointer active:scale-95";
    }

    if (value === 'X') {
      if (isWinner) {
        return base + "bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/30";
      }
      if (gameOver) {
        return base + "bg-slate-900/20 border-slate-900 text-indigo-400/40"; // Dim when game is over and did not win
      }
      return base + "bg-slate-900/60 border-slate-800 text-indigo-400 shadow-inner shadow-indigo-500/5";
    }

    // value === 'O'
    if (isWinner) {
      return base + "bg-pink-600/20 border-pink-500 text-pink-400 shadow-lg shadow-pink-500/30";
    }
    if (gameOver) {
      return base + "bg-slate-900/20 border-slate-900 text-pink-400/40"; // Dim
    }
    return base + "bg-slate-900/60 border-slate-800 text-pink-400 shadow-inner shadow-pink-500/5";
  };

  return (
    <div className="relative w-full max-w-sm mx-auto aspect-square p-2 bg-slate-950/40 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl">
      <div className="grid grid-cols-3 gap-3 h-full">
        {board.map((cellValue, idx) => {
          const isWinner = winningLine?.includes(idx);
          
          return (
            <motion.button
              key={idx}
              id={`board-cell-${idx}`}
              type="button"
              className={getCellClassName(idx, cellValue)}
              onClick={() => cellValue === null && !gameOver && !isComputerTurn && onCellClick(idx)}
              disabled={cellValue !== null || gameOver || isComputerTurn}
              whileHover={cellValue === null && !gameOver && !isComputerTurn ? { scale: 1.03 } : {}}
              animate={isWinner ? {
                scale: [1, 1.05, 1],
                transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
              } : {}}
            >
              <AnimatePresence mode="wait">
                {cellValue && (
                  <motion.div
                    key={cellValue}
                    initial={{ opacity: 0, scale: 0.3, rotate: cellValue === 'X' ? -45 : 45 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="flex items-center justify-center"
                  >
                    {cellValue === 'X' ? (
                      <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    ) : (
                      <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
