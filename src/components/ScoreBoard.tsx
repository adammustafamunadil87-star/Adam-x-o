import { motion } from 'motion/react';
import { Trophy, HelpCircle, User } from 'lucide-react';
import { GameStats, GameSettingsState } from '../types';

interface ScoreBoardProps {
  stats: GameStats;
  settings: GameSettingsState;
}

export default function ScoreBoard({ stats, settings }: ScoreBoardProps) {
  const p1Leading = stats.player1Wins > stats.player2Wins;
  const p2Leading = stats.player2Wins > stats.player1Wins;

  return (
    <div dir="rtl" className="grid grid-cols-3 gap-3 w-full max-w-md mx-auto">
      {/* Player 1 Card */}
      <motion.div
        className={`relative bg-slate-900/40 backdrop-blur-md border rounded-2xl p-3.5 text-center transition-all ${
          p1Leading 
            ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/5 bg-indigo-950/10' 
            : 'border-slate-800/80'
        }`}
        whileHover={{ y: -2 }}
      >
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <User className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-gray-300 truncate max-w-[80px]">
            {settings.player1Name}
          </span>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 rounded font-bold">
            X
          </span>
        </div>
        <div className="text-2xl font-black text-indigo-400 font-mono">
          {stats.player1Wins}
        </div>
        <span className="text-[10px] text-gray-500">انتصار</span>

        {p1Leading && (
          <div className="absolute -top-1.5 -left-1.5 bg-yellow-500 text-slate-950 p-0.5 rounded-full shadow-lg">
            <Trophy className="w-3 h-3" />
          </div>
        )}
      </motion.div>

      {/* Ties Card */}
      <motion.div
        className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3.5 text-center"
        whileHover={{ y: -2 }}
      >
        <div className="flex items-center justify-center gap-1 mb-1">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-gray-300">التعادلات</span>
        </div>
        <div className="text-2xl font-black text-amber-400 font-mono">
          {stats.draws}
        </div>
        <span className="text-[10px] text-gray-500">مباراة</span>
      </motion.div>

      {/* Player 2 / AI Card */}
      <motion.div
        className={`relative bg-slate-900/40 backdrop-blur-md border rounded-2xl p-3.5 text-center transition-all ${
          p2Leading 
            ? 'border-pink-500/50 shadow-lg shadow-pink-500/5 bg-pink-950/10' 
            : 'border-slate-800/80'
        }`}
        whileHover={{ y: -2 }}
      >
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <User className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-bold text-gray-300 truncate max-w-[80px]">
            {settings.player2Name}
          </span>
          <span className="text-[10px] bg-pink-500/10 text-pink-400 border border-pink-500/20 px-1 rounded font-bold">
            O
          </span>
        </div>
        <div className="text-2xl font-black text-pink-400 font-mono">
          {stats.player2Wins}
        </div>
        <span className="text-[10px] text-gray-500">انتصار</span>

        {p2Leading && (
          <div className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-slate-950 p-0.5 rounded-full shadow-lg">
            <Trophy className="w-3 h-3" />
          </div>
        )}
      </motion.div>
    </div>
  );
}
