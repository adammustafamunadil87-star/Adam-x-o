import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, RotateCcw, Home, Trash2, Cpu, Users, PlayCircle, HelpCircle } from 'lucide-react';
import { GameSettingsState, BoardState, GameStats, SymbolType } from './types';
import GameSettings from './components/GameSettings';
import GameBoard from './components/GameBoard';
import ScoreBoard from './components/ScoreBoard';
import Confetti from './components/Confetti';
import { checkWinner, getComputerMove } from './utils/ai';
import { playMoveSound, playWinSound, playDrawSound, playClickSound, setMuted as setAudioMuted } from './utils/audio';

export default function App() {
  const [settings, setSettings] = useState<GameSettingsState | null>(null);
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  
  // Who is currently active ('X' or 'O')
  const [activeSymbol, setActiveSymbol] = useState<SymbolType>('X');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<SymbolType | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | undefined>(undefined);
  const [isComputerTurn, setIsComputerTurn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Scores stats
  const [stats, setStats] = useState<GameStats>({
    player1Wins: 0,
    player2Wins: 0,
    draws: 0,
  });

  // Load sound preference
  useEffect(() => {
    const savedMute = localStorage.getItem('xo_game_muted');
    if (savedMute === 'true') {
      setIsMuted(true);
      setAudioMuted(true);
    }
  }, []);

  const handleMuteToggle = () => {
    const newVal = !isMuted;
    setIsMuted(newVal);
    setAudioMuted(newVal);
    localStorage.setItem('xo_game_muted', String(newVal));
    playClickSound();
  };

  const initGameSession = (newSettings: GameSettingsState) => {
    setSettings(newSettings);
    setStats({ player1Wins: 0, player2Wins: 0, draws: 0 });
    startNewRound(newSettings);
  };

  const startNewRound = (currentSettings = settings) => {
    if (!currentSettings) return;

    // Reset board & game over state
    setBoard(Array(9).fill(null));
    setGameOver(false);
    setWinner(null);
    setWinningLine(undefined);
    setIsComputerTurn(false);

    // Determine starter symbol
    let starter: SymbolType = 'X';
    
    if (currentSettings.mode === 'ai') {
      const aiSymbol = currentSettings.userSymbol === 'X' ? 'O' : 'X';
      if (currentSettings.firstPlayer === 'user') {
        starter = currentSettings.userSymbol;
      } else if (currentSettings.firstPlayer === 'opponent') {
        starter = aiSymbol;
      } else {
        starter = Math.random() < 0.5 ? currentSettings.userSymbol : aiSymbol;
      }
    } else {
      // Friend Mode: Player 1 is X, Player 2 is O
      if (currentSettings.firstPlayer === 'user') {
        starter = 'X';
      } else if (currentSettings.firstPlayer === 'opponent') {
        starter = 'O';
      } else {
        starter = Math.random() < 0.5 ? 'X' : 'O';
      }
    }

    setActiveSymbol(starter);

    // If starter is AI, trigger first move
    if (currentSettings.mode === 'ai' && starter !== currentSettings.userSymbol) {
      setIsComputerTurn(true);
    }
  };

  // Human click handler
  const handleCellClick = (idx: number) => {
    if (board[idx] !== null || gameOver || isComputerTurn || !settings) return;

    const newBoard = [...board];
    newBoard[idx] = activeSymbol;
    setBoard(newBoard);
    playMoveSound(activeSymbol === 'X');

    const result = checkWinner(newBoard);
    if (result.winner) {
      handleGameEnd(result.winner, result.combination);
    } else {
      // Toggle Turn
      const nextSymbol: SymbolType = activeSymbol === 'X' ? 'O' : 'X';
      setActiveSymbol(nextSymbol);

      // Trigger AI turn if next is AI
      if (settings.mode === 'ai' && nextSymbol !== settings.userSymbol) {
        setIsComputerTurn(true);
      }
    }
  };

  // AI Turn handler
  useEffect(() => {
    if (!isComputerTurn || gameOver || !settings || settings.mode !== 'ai') return;

    const aiSymbol = settings.userSymbol === 'X' ? 'O' : 'X';
    
    // Smooth cognitive delay for AI move
    const timer = setTimeout(() => {
      const move = getComputerMove(board, aiSymbol, settings.difficulty);
      
      if (move !== -1) {
        const newBoard = [...board];
        newBoard[move] = aiSymbol;
        setBoard(newBoard);
        playMoveSound(aiSymbol === 'X');

        const result = checkWinner(newBoard);
        if (result.winner) {
          handleGameEnd(result.winner, result.combination);
        } else {
          setActiveSymbol(settings.userSymbol);
        }
      }
      setIsComputerTurn(false);
    }, 750);

    return () => clearTimeout(timer);
  }, [isComputerTurn, board, gameOver, settings]);

  const handleGameEnd = (gameWinner: SymbolType | 'draw', combination?: number[]) => {
    setGameOver(true);
    
    if (gameWinner === 'draw') {
      setWinner('draw');
      setStats(prev => ({ ...prev, draws: prev.draws + 1 }));
      playDrawSound();
    } else {
      setWinner(gameWinner);
      setWinningLine(combination);
      playWinSound();

      // Update statistics
      if (settings?.mode === 'ai') {
        if (gameWinner === settings.userSymbol) {
          setStats(prev => ({ ...prev, player1Wins: prev.player1Wins + 1 }));
        } else {
          setStats(prev => ({ ...prev, player2Wins: prev.player2Wins + 1 }));
        }
      } else {
        // Friend mode
        if (gameWinner === 'X') {
          setStats(prev => ({ ...prev, player1Wins: prev.player1Wins + 1 }));
        } else {
          setStats(prev => ({ ...prev, player2Wins: prev.player2Wins + 1 }));
        }
      }
    }
  };

  const handleResetScores = () => {
    playClickSound();
    setStats({ player1Wins: 0, player2Wins: 0, draws: 0 });
  };

  const handleGoHome = () => {
    playClickSound();
    setSettings(null);
  };

  // Helper strings
  const getStatusText = () => {
    if (!settings) return '';

    if (gameOver) {
      if (winner === 'draw') {
        return 'انتهت المباراة بالتعادل! 🤝';
      }
      
      const winningPlayerName = settings.mode === 'ai'
        ? (winner === settings.userSymbol ? settings.player1Name : settings.player2Name)
        : (winner === 'X' ? settings.player1Name : settings.player2Name);

      return `الفائز هو ${winningPlayerName}! 🎉🏆`;
    }

    if (isComputerTurn) {
      return 'الكمبيوتر يفكّر بالخطوة الذكية... 🤖';
    }

    // Active player string
    if (settings.mode === 'ai') {
      return activeSymbol === settings.userSymbol ? 'دورك الآن للعب! ⚡' : 'دور الكمبيوتر...';
    } else {
      const activeName = activeSymbol === 'X' ? settings.player1Name : settings.player2Name;
      return `دور اللاعب: ${activeName} (${activeSymbol})`;
    }
  };

  // Celebrates if human wins or in friend mode some wins
  const showConfetti = gameOver && winner !== 'draw' && (
    settings?.mode === 'friend' || (settings?.mode === 'ai' && winner === settings?.userSymbol)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-start overflow-x-hidden selection:bg-violet-500/30 relative font-sans">
      
      {/* Visual background gradient effects */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl mx-auto flex flex-col min-h-screen z-10 px-4">
        
        {/* App Bar / Header */}
        <header className="flex items-center justify-between py-6 border-b border-slate-900/60 w-full">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
              لعبة آدم إكس أو
            </span>
            <span className="text-xs bg-slate-900 border border-slate-800 text-gray-400 px-2 py-0.5 rounded-full font-bold">
              v1.0
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={handleMuteToggle}
              id="sound-toggle-btn"
              className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-gray-300 hover:text-white hover:bg-slate-800 transition"
              title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
            </button>

            {/* Back to Home Button */}
            {settings && (
              <button
                onClick={handleGoHome}
                id="back-home-btn"
                className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-gray-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1 text-sm font-semibold"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">القائمة الرئيسية</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Section */}
        <main className="flex-grow flex flex-col justify-center py-6">
          <AnimatePresence mode="wait">
            {!settings ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <GameSettings onStartGame={initGameSession} />
              </motion.div>
            ) : (
              <motion.div
                key="gameplay"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Scoreboard */}
                <ScoreBoard stats={stats} settings={settings} />

                {/* Turn Status Message */}
                <motion.div
                  key={getStatusText()}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-center py-3 px-5 rounded-2xl border text-sm font-bold w-fit mx-auto shadow-sm ${
                    gameOver
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : isComputerTurn
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 animate-pulse'
                      : 'bg-slate-900/40 border-slate-800 text-gray-200'
                  }`}
                >
                  {getStatusText()}
                </motion.div>

                {/* Tic Tac Toe Grid */}
                <GameBoard
                  board={board}
                  onCellClick={handleCellClick}
                  winningLine={winningLine}
                  gameOver={gameOver}
                  isComputerTurn={isComputerTurn}
                />

                {/* Match Control Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm mx-auto">
                  <button
                    onClick={() => {
                      playClickSound();
                      startNewRound();
                    }}
                    id="play-again-btn"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-lg shadow-violet-500/15 transition transform active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>إعادة اللعب</span>
                  </button>

                  <button
                    onClick={handleResetScores}
                    id="reset-scores-btn"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-gray-300 hover:text-white rounded-xl font-bold transition transform active:scale-95"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>تصفير النقاط</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Confetti celebration */}
        {showConfetti && <Confetti />}

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-gray-600 border-t border-slate-900/30 mt-auto">
          تم التطوير بكل حب باللغة العربية • لعبة ذكية بلا توقف
        </footer>

      </div>
    </div>
  );
}
