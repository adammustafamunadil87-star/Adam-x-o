import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, Users, Zap, Swords, ShieldCheck, HelpCircle } from 'lucide-react';
import { GameSettingsState, PlayerType, DifficultyType, SymbolType } from '../types';
import { playClickSound } from '../utils/audio';

interface GameSettingsProps {
  onStartGame: (settings: GameSettingsState) => void;
}

export default function GameSettings({ onStartGame }: GameSettingsProps) {
  const [mode, setMode] = useState<PlayerType>('ai');
  const [difficulty, setDifficulty] = useState<DifficultyType>('easy');
  const [userSymbol, setUserSymbol] = useState<SymbolType>('X');
  const [firstPlayer, setFirstPlayer] = useState<'user' | 'opponent' | 'random'>('user');
  
  const [player1Name, setPlayer1Name] = useState('اللاعب 1');
  const [player2Name, setPlayer2Name] = useState('الكمبيوتر');

  const handleModeChange = (newMode: PlayerType) => {
    playClickSound();
    setMode(newMode);
    if (newMode === 'ai') {
      setPlayer2Name('الكمبيوتر');
    } else {
      setPlayer2Name('اللاعب 2');
    }
  };

  const handleDifficultyChange = (diff: DifficultyType) => {
    playClickSound();
    setDifficulty(diff);
  };

  const handleSymbolChange = (sym: SymbolType) => {
    playClickSound();
    setUserSymbol(sym);
  };

  const handleFirstPlayerChange = (first: 'user' | 'opponent' | 'random') => {
    playClickSound();
    setFirstPlayer(first);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    onStartGame({
      mode,
      difficulty,
      userSymbol,
      firstPlayer,
      player1Name: player1Name.trim() || 'اللاعب 1',
      player2Name: mode === 'ai' ? 'الكمبيوتر' : (player2Name.trim() || 'اللاعب 2'),
    });
  };

  // Card list container and children transitions
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      dir="rtl"
      className="w-full max-w-xl mx-auto px-4 py-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Title */}
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-violet-600/10 text-violet-400 rounded-2xl border border-violet-500/20 mb-2">
            <Swords className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">لعبة آدم إكس أو</h1>
          <p className="text-sm text-gray-400">تحدَّ الذكاء الاصطناعي أو صديقك في تجربة لعب متكاملة</p>
        </motion.div>

        {/* Mode Selector */}
        <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl">
          <label className="block text-sm font-semibold text-gray-300 mb-3">اختر نمط اللعب</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              id="mode-ai-btn"
              onClick={() => handleModeChange('ai')}
              className={`flex items-center justify-center gap-3 py-4 px-4 rounded-xl font-bold border transition-all duration-300 ${
                mode === 'ai'
                  ? 'bg-violet-600/20 border-violet-500 text-violet-300 shadow-lg shadow-violet-500/10 scale-[1.02]'
                  : 'bg-slate-950/40 border-slate-800 text-gray-400 hover:border-slate-700 hover:text-gray-300'
              }`}
            >
              <Cpu className={`w-5 h-5 ${mode === 'ai' ? 'animate-pulse' : ''}`} />
              <span>ضد الذكاء الاصطناعي</span>
            </button>

            <button
              type="button"
              id="mode-friend-btn"
              onClick={() => handleModeChange('friend')}
              className={`flex items-center justify-center gap-3 py-4 px-4 rounded-xl font-bold border transition-all duration-300 ${
                mode === 'friend'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10 scale-[1.02]'
                  : 'bg-slate-950/40 border-slate-800 text-gray-400 hover:border-slate-700 hover:text-gray-300'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>ضد صديق (محلي)</span>
            </button>
          </div>
        </motion.div>

        {/* Name Fields */}
        <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <label className="block text-sm font-semibold text-gray-300">أدخل الأسماء</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-xs text-violet-400 font-medium">اللاعب الأول (X)</span>
              <input
                type="text"
                id="player1-name-input"
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value)}
                maxLength={15}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-all"
                placeholder="الاسم"
              />
            </div>
            
            {mode === 'friend' && (
              <div className="space-y-1.5">
                <span className="text-xs text-emerald-400 font-medium">اللاعب الثاني (O)</span>
                <input
                  type="text"
                  id="player2-name-input"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  maxLength={15}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                  placeholder="الاسم"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Difficulty Selector (Conditional) */}
        {mode === 'ai' && (
          <motion.div
            variants={itemVariants}
            className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl"
          >
            <label className="block text-sm font-semibold text-gray-300 mb-3">مستوى ذكاء الكمبيوتر</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="diff-very-easy-btn"
                onClick={() => handleDifficultyChange('very_easy')}
                className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all duration-300 ${
                  difficulty === 'very_easy'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 scale-[1.02]'
                    : 'bg-slate-950/40 border-slate-800 text-gray-400 hover:border-slate-700'
                }`}
              >
                <HelpCircle className="w-4 h-4 mb-1 text-blue-400" />
                <span className="text-xs font-bold">سهل جداً</span>
              </button>

              <button
                type="button"
                id="diff-easy-btn"
                onClick={() => handleDifficultyChange('easy')}
                className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all duration-300 ${
                  difficulty === 'easy'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300 scale-[1.02]'
                    : 'bg-slate-950/40 border-slate-800 text-gray-400 hover:border-slate-700'
                }`}
              >
                <Zap className="w-4 h-4 mb-1 text-amber-400" />
                <span className="text-xs font-bold">سهل / متوسط</span>
              </button>

              <button
                type="button"
                id="diff-hard-btn"
                onClick={() => handleDifficultyChange('hard')}
                className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all duration-300 ${
                  difficulty === 'hard'
                    ? 'bg-rose-600/20 border-rose-500 text-rose-300 scale-[1.02]'
                    : 'bg-slate-950/40 border-slate-800 text-gray-400 hover:border-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mb-1 text-rose-400" />
                <span className="text-xs font-bold">صعب جداً (لا يقهر)</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Symbol Choice */}
        <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl">
          <label className="block text-sm font-semibold text-gray-300 mb-3">اختر رمز اللعب الخاص بك</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              id="symbol-x-btn"
              onClick={() => handleSymbolChange('X')}
              className={`relative py-4 rounded-xl border font-black text-2xl transition-all duration-300 ${
                userSymbol === 'X'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10 scale-[1.02]'
                  : 'bg-slate-950/40 border-slate-800 text-gray-500 hover:border-slate-700 hover:text-gray-400'
              }`}
            >
              X
              {userSymbol === 'X' && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
              )}
            </button>

            <button
              type="button"
              id="symbol-o-btn"
              onClick={() => handleSymbolChange('O')}
              className={`relative py-4 rounded-xl border font-black text-2xl transition-all duration-300 ${
                userSymbol === 'O'
                  ? 'bg-pink-600/20 border-pink-500 text-pink-400 shadow-lg shadow-pink-500/10 scale-[1.02]'
                  : 'bg-slate-950/40 border-slate-800 text-gray-500 hover:border-slate-700 hover:text-gray-400'
              }`}
            >
              O
              {userSymbol === 'O' && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-pink-500 rounded-full animate-ping" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Who Plays First */}
        <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl">
          <label className="block text-sm font-semibold text-gray-300 mb-3">من يبدأ باللعب؟</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              id="first-user-btn"
              onClick={() => handleFirstPlayerChange('user')}
              className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all duration-300 ${
                firstPlayer === 'user'
                  ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                  : 'bg-slate-950/40 border-slate-800 text-gray-400 hover:border-slate-700'
              }`}
            >
              أنا أولاً
            </button>

            <button
              type="button"
              id="first-opponent-btn"
              onClick={() => handleFirstPlayerChange('opponent')}
              className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all duration-300 ${
                firstPlayer === 'opponent'
                  ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                  : 'bg-slate-950/40 border-slate-800 text-gray-400 hover:border-slate-700'
              }`}
            >
              {mode === 'ai' ? 'الكمبيوتر أولاً' : 'اللاعب الثاني أولاً'}
            </button>

            <button
              type="button"
              id="first-random-btn"
              onClick={() => handleFirstPlayerChange('random')}
              className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all duration-300 ${
                firstPlayer === 'random'
                  ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                  : 'bg-slate-950/40 border-slate-800 text-gray-400 hover:border-slate-700'
              }`}
            >
              عشوائي
            </button>
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.div variants={itemVariants} className="pt-2">
          <button
            type="submit"
            id="start-game-submit-btn"
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-500/20 transition-all duration-300 transform active:scale-95 text-center flex items-center justify-center gap-2 text-lg"
          >
            <span>ابدأ اللعب الآن</span>
            <Swords className="w-5 h-5" />
          </button>
        </motion.div>

      </form>
    </motion.div>
  );
}
