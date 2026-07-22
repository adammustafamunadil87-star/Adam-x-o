import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Users, Zap, Swords, ShieldCheck, HelpCircle, Globe, PlayCircle, KeyRound, Radio, Sparkles } from 'lucide-react';
import { GameSettingsState, PlayerType, DifficultyType, SymbolType, UserProfile } from '../types';
import { playClickSound } from '../utils/audio';
import GoogleLogin from './GoogleLogin';

interface GameSettingsProps {
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
  onStartGame: (settings: GameSettingsState) => void;
  onCreateOnlineRoom: (symbol: SymbolType, customCode?: string) => void;
  onJoinOnlineRoom: (roomCode: string) => void;
  onQuickMatch: () => void;
}

export default function GameSettings({
  profile,
  onProfileChange,
  onStartGame,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  onQuickMatch,
}: GameSettingsProps) {
  const [mode, setMode] = useState<PlayerType>('ai');
  const [difficulty, setDifficulty] = useState<DifficultyType>('easy');
  const [userSymbol, setUserSymbol] = useState<SymbolType>('X');
  const [firstPlayer, setFirstPlayer] = useState<'user' | 'opponent' | 'random'>('user');
  
  const [player1Name, setPlayer1Name] = useState('اللاعب 1');
  const [player2Name, setPlayer2Name] = useState('الكمبيوتر');
  
  // Online room code states
  const [joinCode, setJoinCode] = useState('');
  const [customInviteCode, setCustomInviteCode] = useState('');

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomInviteCode(result);
  };

  useEffect(() => {
    if (mode === 'online' && !customInviteCode) {
      generateInviteCode();
    }
  }, [mode]);

  // Update Player 1 name when google profile changes
  useEffect(() => {
    if (profile.isLoggedIn) {
      setPlayer1Name(profile.name);
    } else {
      setPlayer1Name('اللاعب 1');
    }
  }, [profile]);

  const handleModeChange = (newMode: PlayerType) => {
    playClickSound();
    setMode(newMode);
    if (newMode === 'ai') {
      setPlayer2Name('الكمبيوتر');
    } else if (newMode === 'friend') {
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
    if (mode === 'online') return; // Handled by specific button clicks
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
      className="w-full max-w-xl mx-auto px-4 py-6 space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Title */}
      <motion.div variants={itemVariants} className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-400 rounded-2xl border border-violet-500/20 mb-2 shadow-inner">
          <Swords className="w-8 h-8 text-indigo-400 animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">لعبة آدم إكس أو</h1>
        <p className="text-sm text-gray-400">لعبة ذكية مع ميزات أونلاين فريدة ودخول جوجل سهل وسريع</p>
      </motion.div>

      {/* Google Login Component */}
      <motion.div variants={itemVariants}>
        <GoogleLogin profile={profile} onProfileChange={onProfileChange} />
      </motion.div>

      {/* Mode Selector */}
      <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl">
        <label className="block text-sm font-semibold text-gray-300 mb-3">اختر نمط اللعب</label>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            id="mode-ai-btn"
            onClick={() => handleModeChange('ai')}
            className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-xl font-bold border transition-all duration-300 ${
              mode === 'ai'
                ? 'bg-violet-600/20 border-violet-500 text-violet-300 shadow-lg shadow-violet-500/10 scale-[1.02]'
                : 'bg-slate-950/40 border-slate-800 text-gray-400 hover:border-slate-700 hover:text-gray-300'
            }`}
          >
            <Cpu className="w-5 h-5" />
            <span className="text-xs">ضد الكمبيوتر</span>
          </button>

          <button
            type="button"
            id="mode-friend-btn"
            onClick={() => handleModeChange('friend')}
            className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-xl font-bold border transition-all duration-300 ${
              mode === 'friend'
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10 scale-[1.02]'
                : 'bg-slate-950/40 border-slate-800 text-gray-400 hover:border-slate-700 hover:text-gray-300'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">ضد صديق (محلي)</span>
          </button>

          <button
            type="button"
            id="mode-online-btn"
            onClick={() => handleModeChange('online')}
            className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-xl font-bold border transition-all duration-300 ${
              mode === 'online'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/10 scale-[1.02]'
                : 'bg-slate-950/40 border-slate-800 text-gray-400 hover:border-slate-700 hover:text-gray-300'
            }`}
          >
            <Globe className="w-5 h-5" />
            <span className="text-xs">أونلاين (عن بعد)</span>
          </button>
        </div>
      </motion.div>

      {/* Conditional Forms */}
      <AnimatePresence mode="wait">
        {mode !== 'online' ? (
          <motion.form
            key="local-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Name Fields */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
              <label className="block text-sm font-semibold text-gray-300">أسماء اللاعبين</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs text-violet-400 font-medium">اللاعب الأول (X)</span>
                  <input
                    type="text"
                    id="player1-name-input"
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    maxLength={15}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-all"
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
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                      placeholder="الاسم"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* AI Difficulty Selector */}
            {mode === 'ai' && (
              <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl">
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
                    <span className="text-xs font-bold">صعب (لا يقهر)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Symbol Choice */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl">
              <label className="block text-sm font-semibold text-gray-300 mb-3">رمز اللعب الخاص بك</label>
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
                </button>
              </div>
            </div>

            {/* Who Plays First */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl">
              <label className="block text-sm font-semibold text-gray-300 mb-3">من يبدأ باللعب؟</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
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
            </div>

            {/* Start Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="start-game-submit-btn"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-500/20 transition-all duration-300 transform active:scale-95 text-center flex items-center justify-center gap-2 text-lg cursor-pointer"
              >
                <span>ابدأ اللعب الآن</span>
                <Swords className="w-5 h-5" />
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="online-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Quick Match / Create / Join Card */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl space-y-6">
              
              {/* Profile Greeting */}
              <div className="text-center p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1">
                <span className="text-[11px] text-indigo-400 font-semibold uppercase tracking-wider flex items-center justify-center gap-1">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  وضع اللعب أونلاين
                </span>
                <h4 className="text-sm font-bold text-white">الاسم المستخدم: {player1Name}</h4>
              </div>

              {/* Symbol choice for creating room */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-400 block">اختر رمزك في الغرفة المنشأة:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSymbolChange('X')}
                    className={`py-2 px-4 rounded-xl border text-sm font-bold transition-all ${
                      userSymbol === 'X' 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                        : 'bg-slate-950/40 border-slate-800 text-gray-400'
                    }`}
                  >
                    إنشاء بـ X
                  </button>
                  <button
                    onClick={() => handleSymbolChange('O')}
                    className={`py-2 px-4 rounded-xl border text-sm font-bold transition-all ${
                      userSymbol === 'O' 
                        ? 'bg-pink-600/20 border-pink-500 text-pink-300' 
                        : 'bg-slate-950/40 border-slate-800 text-gray-400'
                    }`}
                  >
                    إنشاء بـ O
                  </button>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-1 gap-4 pt-2">
                {/* 1. Quick Match */}
                <button
                  onClick={() => {
                    playClickSound();
                    onQuickMatch();
                  }}
                  className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/15 flex items-center justify-center gap-2 transition transform active:scale-98"
                >
                  <PlayCircle className="w-4.5 h-4.5" />
                  <span>بحث سريع ومطابقة عشوائية</span>
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-xs font-semibold text-gray-500">أو تحدّى صديق معيّن</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                {/* 2. Create Custom Invite Code Room */}
                <div className="bg-slate-950/60 border border-indigo-500/20 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-indigo-400" />
                      إنشاء رمز الدعوة الخاص بك:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        generateInviteCode();
                        playClickSound();
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/20 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>توليد تلقائي</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={10}
                      value={customInviteCode}
                      onChange={(e) => setCustomInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="اكتب رمزك المخصص"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 uppercase font-mono tracking-widest text-center"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        onCreateOnlineRoom(userSymbol, customInviteCode.trim() || undefined);
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                    >
                      <span>إنشاء الغرفة</span>
                      <KeyRound className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    يمكنك كتابة أي رمز دعوة تحبه وتمريره لصديقك للانضمام فوراً!
                  </p>
                </div>

                {/* 3. Join Room with code */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-gray-300 block">لديك رمز دعوة من صديق؟ أدخله هنا:</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={10}
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="أدخل الرمز (مثال: ABCD)"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 uppercase font-mono tracking-widest text-center"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (joinCode.trim().length >= 3) {
                          playClickSound();
                          onJoinOnlineRoom(joinCode.trim());
                        }
                      }}
                      disabled={joinCode.trim().length < 3}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex-shrink-0"
                    >
                      انضمام
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
