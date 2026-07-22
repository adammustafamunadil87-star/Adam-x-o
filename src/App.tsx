import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Home, 
  Trash2, 
  Cpu, 
  Users, 
  PlayCircle, 
  HelpCircle, 
  Globe, 
  Send, 
  Copy, 
  Check, 
  MessageSquare, 
  UserPlus, 
  ArrowLeft,
  X,
  Sparkles,
  Loader2,
  Tv
} from 'lucide-react';
import { GameSettingsState, BoardState, GameStats, SymbolType, UserProfile, OnlineRoomState } from './types';
import GameSettings from './components/GameSettings';
import GameBoard from './components/GameBoard';
import ScoreBoard from './components/ScoreBoard';
import Confetti from './components/Confetti';
import { checkWinner, getComputerMove } from './utils/ai';
import { playMoveSound, playWinSound, playDrawSound, playClickSound, setMuted as setAudioMuted } from './utils/audio';

// Import Firebase / Firestore
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit, 
  getDocs,
  addDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './utils/firebase';

// Helper function to generate safe short room IDs
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function App() {
  // Game Setup
  const [profile, setProfile] = useState<UserProfile>({ name: 'اللاعب 1', isLoggedIn: false });
  const [settings, setSettings] = useState<GameSettingsState | null>(null);
  
  // Local mode states
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [activeSymbol, setActiveSymbol] = useState<SymbolType>('X');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<SymbolType | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | undefined>(undefined);
  const [isComputerTurn, setIsComputerTurn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Stats
  const [stats, setStats] = useState<GameStats>({
    player1Wins: 0,
    player2Wins: 0,
    draws: 0,
  });

  // --- ONLINE MULTIPLAYER STATES ---
  const [onlineRoom, setOnlineRoom] = useState<OnlineRoomState | null>(null);
  const [onlineSymbol, setOnlineSymbol] = useState<SymbolType | null>(null); // 'X' or 'O' in remote room
  const [isSearching, setIsSearching] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Online Chat/Emojis States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Firestore listeners unsubscribe refs
  const roomUnsubscribeRef = useRef<(() => void) | null>(null);
  const chatUnsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize Sound Settings
  useEffect(() => {
    const savedMute = localStorage.getItem('xo_game_muted');
    if (savedMute === 'true') {
      setIsMuted(true);
      setAudioMuted(true);
    }

    return () => {
      // Cleanup listeners on unmount
      if (roomUnsubscribeRef.current) roomUnsubscribeRef.current();
      if (chatUnsubscribeRef.current) chatUnsubscribeRef.current();
    };
  }, []);

  // Scroll to bottom of chat automatically
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChat]);

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

  const startNewRound = async (currentSettings = settings) => {
    if (!currentSettings) return;

    if (currentSettings.mode === 'online') {
      if (onlineRoom) {
        // Reset the room's board to initial state in Firestore
        const updates = {
          board: Array(9).fill(null),
          turn: 'X',
          gameOver: false,
          winner: null,
          updatedAt: new Date().toISOString(),
          lastActionTime: Date.now()
        };
        try {
          await updateDoc(doc(db, 'rooms', onlineRoom.id), updates);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `rooms/${onlineRoom.id}`);
        }
      }
      return;
    }

    // Reset local states
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

  // Local turn click handler
  const handleLocalCellClick = (idx: number) => {
    if (board[idx] !== null || gameOver || isComputerTurn || !settings) return;

    const newBoard = [...board];
    newBoard[idx] = activeSymbol;
    setBoard(newBoard);
    playMoveSound(activeSymbol === 'X');

    const result = checkWinner(newBoard);
    if (result.winner) {
      handleLocalGameEnd(result.winner, result.combination);
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

  // Local AI engine
  useEffect(() => {
    if (!isComputerTurn || gameOver || !settings || settings.mode !== 'ai') return;

    const aiSymbol = settings.userSymbol === 'X' ? 'O' : 'X';
    
    const timer = setTimeout(() => {
      const move = getComputerMove(board, aiSymbol, settings.difficulty);
      
      if (move !== -1) {
        const newBoard = [...board];
        newBoard[move] = aiSymbol;
        setBoard(newBoard);
        playMoveSound(aiSymbol === 'X');

        const result = checkWinner(newBoard);
        if (result.winner) {
          handleLocalGameEnd(result.winner, result.combination);
        } else {
          setActiveSymbol(settings.userSymbol);
        }
      }
      setIsComputerTurn(false);
    }, 750);

    return () => clearTimeout(timer);
  }, [isComputerTurn, board, gameOver, settings]);

  const handleLocalGameEnd = (gameWinner: SymbolType | 'draw', combination?: number[]) => {
    setGameOver(true);
    
    if (gameWinner === 'draw') {
      setWinner('draw');
      setStats(prev => ({ ...prev, draws: prev.draws + 1 }));
      playDrawSound();
    } else {
      setWinner(gameWinner);
      setWinningLine(combination);
      playWinSound();

      if (settings?.mode === 'ai') {
        if (gameWinner === settings.userSymbol) {
          setStats(prev => ({ ...prev, player1Wins: prev.player1Wins + 1 }));
        } else {
          setStats(prev => ({ ...prev, player2Wins: prev.player2Wins + 1 }));
        }
      } else {
        if (gameWinner === 'X') {
          setStats(prev => ({ ...prev, player1Wins: prev.player1Wins + 1 }));
        } else {
          setStats(prev => ({ ...prev, player2Wins: prev.player2Wins + 1 }));
        }
      }
    }
  };

  // Ensure Firebase authentication state is ready before remote gameplay
  const ensureUserSignedIn = async () => {
    if (auth.currentUser) return auth.currentUser;
    
    const { signInAnonymously, updateProfile } = await import('firebase/auth');
    try {
      const cred = await signInAnonymously(auth);
      await updateProfile(cred.user, {
        displayName: profile.name || 'لاعب زائر'
      });
      return cred.user;
    } catch (err) {
      console.error("Anonymous sign in failed:", err);
      throw err;
    }
  };

  // Real-time Firestore Room synchronizer
  const setupRoomListener = (roomId: string, mySymbol: SymbolType) => {
    // Unsubscribe from any active listeners first
    if (roomUnsubscribeRef.current) roomUnsubscribeRef.current();
    if (chatUnsubscribeRef.current) chatUnsubscribeRef.current();

    // Listen to parent room document
    const roomRef = doc(db, 'rooms', roomId);
    const unsubRoom = onSnapshot(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        alert('تم إلغاء أو حذف هذه الغرفة من السيرفر.');
        handleGoHome();
        return;
      }

      const data = snapshot.data() as any;
      setOnlineRoom({
        id: data.id,
        players: data.players,
        board: data.board,
        turn: data.turn,
        gameOver: data.gameOver,
        winner: data.winner
      });
      setIsSearching(false);

      // Match second player dynamically
      if (data.players.length === 2) {
        const opponent = data.players.find((p: any) => p.id !== auth.currentUser?.uid);
        if (opponent) {
          setSettings(prev => {
            if (!prev) return null;
            return {
              ...prev,
              player2Name: opponent.name
            };
          });
        }
      }

      // Handle terminal game state
      if (data.gameOver) {
        setWinner(data.winner);
        setGameOver(true);

        const result = checkWinner(data.board);
        if (result.winner && result.combination) {
          setWinningLine(result.combination);
        } else {
          setWinningLine(undefined);
        }

        // Play sounds and score updates locally
        if (data.winner === 'draw') {
          setStats(prev => ({ ...prev, draws: prev.draws + 1 }));
          playDrawSound();
        } else {
          if (data.winner === mySymbol) {
            setStats(prev => ({ ...prev, player1Wins: prev.player1Wins + 1 }));
            playWinSound();
          } else {
            setStats(prev => ({ ...prev, player2Wins: prev.player2Wins + 1 }));
            playDrawSound();
          }
        }
      } else {
        setGameOver(false);
        setWinner(null);
        setWinningLine(undefined);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `rooms/${roomId}`);
    });

    roomUnsubscribeRef.current = unsubRoom;

    // Listen to messages subcollection (ordered chronologically)
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubChat = onSnapshot(q, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach((docSnap) => {
        const msgData = docSnap.data();
        const seconds = msgData.createdAt?.seconds || (Date.now() / 1000);
        const timeStr = new Date(seconds * 1000).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        msgs.push({
          sender: msgData.senderName,
          text: msgData.text,
          time: timeStr
        });
      });

      setChatMessages(msgs);

      // Play soft sounds on new incoming messages
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg.sender !== profile.name) {
          if (lastMsg.text.includes('🔔')) {
            playWinSound(); // Trigger chime for buzz
          } else {
            playMoveSound(true);
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `rooms/${roomId}/messages`);
    });

    chatUnsubscribeRef.current = unsubChat;
  };

  // --- ONLINE GAMEPLAY TRIGGERS ---
  const handleCreateOnlineRoom = async (symbol: SymbolType, customCode?: string) => {
    setIsSearching(true);
    setJoinError(null);
    setChatMessages([]);

    try {
      const user = await ensureUserSignedIn();
      const cleanCode = customCode ? customCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
      const roomId = cleanCode.length >= 3 ? cleanCode : generateRoomId();

      // Check if room with this ID already exists and is currently full
      const roomRef = doc(db, 'rooms', roomId);
      const existingSnap = await getDoc(roomRef);
      if (existingSnap.exists()) {
        const data = existingSnap.data();
        if (data && data.playerCount >= 2 && !data.gameOver) {
          setJoinError(`رمز الدعوة (${roomId}) مستخدم حالياً لغرفة قائمة. يرجى اختيار رمز آخر.`);
          setIsSearching(false);
          return;
        }
      }

      setSettings({
        mode: 'online',
        difficulty: 'easy',
        userSymbol: symbol,
        firstPlayer: 'user',
        player1Name: profile.name,
        player2Name: 'لاعب آخر'
      });
      setStats({ player1Wins: 0, player2Wins: 0, draws: 0 });
      setOnlineSymbol(symbol);

      const roomData = {
        id: roomId,
        players: [{
          id: user.uid,
          name: profile.name,
          picture: profile.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
          symbol: symbol
        }],
        playerIds: [user.uid],
        board: Array(9).fill(null),
        turn: 'X',
        gameOver: false,
        winner: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActionTime: Date.now(),
        playerCount: 1
      };

      await setDoc(roomRef, roomData);
      setupRoomListener(roomId, symbol);
    } catch (error) {
      console.error(error);
      setJoinError('فشل إنشاء غرفة اللعب أونلاين. يرجى إعادة المحاولة.');
      setIsSearching(false);
    }
  };

  const handleJoinOnlineRoom = async (code: string) => {
    const formattedCode = code.trim().toUpperCase();
    if (!formattedCode) {
      setJoinError('يرجى كتابة رمز الغرفة أولاً!');
      return;
    }

    setIsSearching(true);
    setJoinError(null);
    setChatMessages([]);

    try {
      const user = await ensureUserSignedIn();
      const roomRef = doc(db, 'rooms', formattedCode);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setJoinError('الغرفة غير موجودة، يرجى التحقق من الرمز الصحيح.');
        setIsSearching(false);
        return;
      }

      const roomData = roomSnap.data();
      if (roomData.gameOver) {
        setJoinError('هذه اللعبة انتهت بالفعل.');
        setIsSearching(false);
        return;
      }

      if (roomData.players.length >= 2) {
        // Reconnect check
        const isParticipant = roomData.players.some((p: any) => p.id === user.uid);
        if (!isParticipant) {
          setJoinError('هذه الغرفة ممتلئة باللاعبين.');
          setIsSearching(false);
          return;
        }
      }

      let mySymbol: SymbolType = 'O';
      const players = [...roomData.players];
      const meInRoom = players.find((p: any) => p.id === user.uid);

      if (meInRoom) {
        mySymbol = meInRoom.symbol;
      } else {
        const hostSymbol = players[0].symbol;
        mySymbol = hostSymbol === 'X' ? 'O' : 'X';
        players.push({
          id: user.uid,
          name: profile.name,
          picture: profile.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
          symbol: mySymbol
        });

        await updateDoc(roomRef, {
          players: players,
          playerIds: [players[0].id, user.uid],
          playerCount: 2,
          updatedAt: new Date().toISOString(),
          lastActionTime: Date.now()
        });
      }

      setSettings({
        mode: 'online',
        difficulty: 'easy',
        userSymbol: mySymbol,
        firstPlayer: 'user',
        player1Name: profile.name,
        player2Name: players.find(p => p.id !== user.uid)?.name || 'مضيف الغرفة'
      });
      setStats({ player1Wins: 0, player2Wins: 0, draws: 0 });
      setOnlineSymbol(mySymbol);

      setupRoomListener(formattedCode, mySymbol);
    } catch (error) {
      console.error(error);
      setJoinError('تعذر الدخول للغرفة. تأكد من جودة الاتصال.');
      setIsSearching(false);
    }
  };

  const handleQuickMatch = async () => {
    setIsSearching(true);
    setJoinError(null);
    setChatMessages([]);

    try {
      const user = await ensureUserSignedIn();
      const roomsRef = collection(db, 'rooms');
      const q = query(
        roomsRef,
        where('playerCount', '==', 1),
        where('gameOver', '==', false),
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      let targetRoomId: string | null = null;
      let targetRoomData: any = null;

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.players[0].id !== user.uid) {
          targetRoomId = docSnap.id;
          targetRoomData = data;
        }
      });

      if (targetRoomId && targetRoomData) {
        // Join found open room
        const hostSymbol = targetRoomData.players[0].symbol;
        const mySymbol: SymbolType = hostSymbol === 'X' ? 'O' : 'X';
        const players = [
          ...targetRoomData.players,
          {
            id: user.uid,
            name: profile.name,
            picture: profile.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
            symbol: mySymbol
          }
        ];

        await updateDoc(doc(db, 'rooms', targetRoomId), {
          players: players,
          playerIds: [players[0].id, user.uid],
          playerCount: 2,
          updatedAt: new Date().toISOString(),
          lastActionTime: Date.now()
        });

        setSettings({
          mode: 'online',
          difficulty: 'easy',
          userSymbol: mySymbol,
          firstPlayer: 'user',
          player1Name: profile.name,
          player2Name: targetRoomData.players[0].name
        });
        setStats({ player1Wins: 0, player2Wins: 0, draws: 0 });
        setOnlineSymbol(mySymbol);

        setupRoomListener(targetRoomId, mySymbol);
      } else {
        // Create new match room
        const startSymbol: SymbolType = Math.random() < 0.5 ? 'X' : 'O';
        await handleCreateOnlineRoom(startSymbol);
      }
    } catch (error) {
      console.error(error);
      setJoinError('فشل إجراء البحث السريع. حاول مرة أخرى.');
      setIsSearching(false);
    }
  };

  const handleOnlineCellClick = async (idx: number) => {
    if (!onlineRoom || onlineRoom.gameOver || onlineRoom.turn !== onlineSymbol || onlineRoom.board[idx] !== null) {
      return;
    }

    const newBoard = [...onlineRoom.board];
    newBoard[idx] = onlineSymbol;

    const result = checkWinner(newBoard);
    const updates: any = {
      board: newBoard,
      updatedAt: new Date().toISOString(),
      lastActionTime: Date.now()
    };

    if (result.winner) {
      updates.gameOver = true;
      updates.winner = result.winner;
    } else {
      updates.turn = onlineSymbol === 'X' ? 'O' : 'X';
    }

    try {
      await updateDoc(doc(db, 'rooms', onlineRoom.id), updates);
      playMoveSound(onlineSymbol === 'X');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `rooms/${onlineRoom.id}`);
    }
  };

  const handleSendChat = async (messageText: string = chatInput) => {
    const textToSend = messageText.trim();
    if (!textToSend || !onlineRoom || !auth.currentUser) return;

    const playerIds = onlineRoom.players.map(p => p.id);

    try {
      const messagesRef = collection(db, 'rooms', onlineRoom.id, 'messages');
      await addDoc(messagesRef, {
        senderName: profile.name,
        senderId: auth.currentUser.uid,
        text: textToSend,
        roomPlayers: playerIds,
        createdAt: new Date()
      });
      setChatInput('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `rooms/${onlineRoom.id}/messages`);
    }
  };

  const handleSendBuzz = () => {
    playClickSound();
    handleSendChat('🔔 تنبيه! خصمك بانتظار خطوتك ⚡');
  };

  const handleResetScores = () => {
    playClickSound();
    setStats({ player1Wins: 0, player2Wins: 0, draws: 0 });
  };

  const handleGoHome = () => {
    playClickSound();
    
    // Stop listening to Firestore
    if (roomUnsubscribeRef.current) {
      roomUnsubscribeRef.current();
      roomUnsubscribeRef.current = null;
    }
    if (chatUnsubscribeRef.current) {
      chatUnsubscribeRef.current();
      chatUnsubscribeRef.current = null;
    }

    setSettings(null);
    setOnlineRoom(null);
    setOnlineSymbol(null);
    setGameOver(false);
    setWinner(null);
    setWinningLine(undefined);
  };

  const copyRoomCode = () => {
    if (!onlineRoom) return;
    navigator.clipboard.writeText(onlineRoom.id);
    setCopiedCode(true);
    playClickSound();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getStatusText = () => {
    if (!settings) return '';

    if (settings.mode === 'online') {
      if (!onlineRoom) return 'جاري الاتصال بالسيرفر الفايربيس... 🌐';
      if (onlineRoom.players.length < 2) return 'بانتظار انضمام لاعب آخر... ⌛';

      if (onlineRoom.gameOver) {
        if (onlineRoom.winner === 'draw') return 'مباراة ملحمية! تعادل 🤝';
        
        const winningPlayer = onlineRoom.players.find(p => p.symbol === onlineRoom.winner);
        return `فوز ساحق للاعب ${winningPlayer?.name}! 🏆🎉`;
      }

      return onlineRoom.turn === onlineSymbol ? 'دورك الآن للعب! سدّد ضربتك ⚡' : 'دور المنافس... يرجى الانتظار ⏳';
    }

    // Local Status
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

    if (settings.mode === 'ai') {
      return activeSymbol === settings.userSymbol ? 'دورك الآن للعب! ⚡' : 'دور الكمبيوتر...';
    } else {
      const activeName = activeSymbol === 'X' ? settings.player1Name : settings.player2Name;
      return `دور اللاعب: ${activeName} (${activeSymbol})`;
    }
  };

  const showConfetti = gameOver && winner !== 'draw' && (
    settings?.mode === 'friend' || 
    (settings?.mode === 'ai' && winner === settings?.userSymbol) ||
    (settings?.mode === 'online' && winner === onlineSymbol)
  );

  const quickEmojis = ['😂', '😮', '🔥', '👑', '🤝', '🤫', '👏', '☠️'];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-start overflow-x-hidden selection:bg-violet-500/30 relative font-sans">
      
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-pink-600/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Main Responsive Wrapper */}
      <div className="w-full max-w-xl mx-auto flex flex-col min-h-screen z-10 px-4">
        
        {/* App Bar */}
        <header className="flex items-center justify-between py-5 border-b border-slate-900/60 w-full">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
              لعبة آدم إكس أو
            </span>
            <span className="text-xs bg-slate-900 border border-slate-800 text-gray-400 px-2.5 py-0.5 rounded-full font-bold">
              أونلاين
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={handleMuteToggle}
              id="sound-toggle-btn"
              className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-gray-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
            </button>

            {/* Back to Home Button */}
            {settings && (
              <button
                onClick={handleGoHome}
                id="back-home-btn"
                className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-gray-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1 text-sm font-semibold cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">الرئيسية</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Section */}
        <main className="flex-grow flex flex-col justify-center py-4">
          <AnimatePresence mode="wait">
            {!settings ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <GameSettings 
                  profile={profile} 
                  onProfileChange={setProfile}
                  onStartGame={initGameSession}
                  onCreateOnlineRoom={handleCreateOnlineRoom}
                  onJoinOnlineRoom={handleJoinOnlineRoom}
                  onQuickMatch={handleQuickMatch}
                />
              </motion.div>
            ) : isSearching && !onlineRoom ? (
              /* Loading Match Screen */
              <motion.div
                key="searching"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-12 space-y-6"
              >
                <div className="inline-flex items-center justify-center p-6 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 animate-pulse">
                  <Loader2 className="w-12 h-12 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">جاري الاتصال بقنوات اللعب...</h2>
                  <p className="text-sm text-gray-400">نقوم بتجهيز غرفة لعب آمنة ومخصصة لك عبر الفايربيس</p>
                </div>

                {joinError && (
                  <div className="p-4 bg-rose-500/15 border border-rose-500/20 text-rose-400 rounded-xl text-sm max-w-sm mx-auto">
                    {joinError}
                  </div>
                )}

                <button
                  onClick={handleGoHome}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-bold rounded-xl text-gray-400 transition cursor-pointer"
                >
                  إلغاء البحث والعودة
                </button>
              </motion.div>
            ) : settings.mode === 'online' && onlineRoom && onlineRoom.players.length < 2 ? (
              /* Waiting Room for Host */
              <motion.div
                key="waiting-room"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-md mx-auto w-full bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-3xl text-center space-y-6 shadow-2xl"
              >
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                    بانتظار المنافس
                  </span>
                  <h2 className="text-2xl font-black text-white pt-2">تم إنشاء الغرفة بنجاح!</h2>
                  <p className="text-sm text-gray-400">شارك هذا الرمز مع صديقك للدخول واللعب معك فورا</p>
                </div>

                {/* Big Copyable Code */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                  <span className="text-xs text-gray-500 font-bold">رمز الغرفة الخاص بك:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-black font-mono tracking-widest text-indigo-400 select-all">{onlineRoom.id}</span>
                    <button
                      onClick={copyRoomCode}
                      className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-gray-300 hover:text-white transition cursor-pointer"
                      title="نسخ الرمز"
                    >
                      {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  {copiedCode && (
                    <span className="text-xs text-emerald-400 font-semibold animate-bounce">تم نسخ الرمز بنجاح! 📋</span>
                  )}
                </div>

                {/* Animated loader */}
                <div className="flex items-center justify-center gap-3 py-2 text-sm text-indigo-300 font-bold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>بانتظار دخول اللاعب الثاني...</span>
                </div>

                <div className="border-t border-slate-800/80 pt-4">
                  <button
                    onClick={handleGoHome}
                    className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition cursor-pointer"
                  >
                    إلغاء الغرفة والعودة
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Active Gameplay Screen */
              <motion.div
                key="active-gameplay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5"
              >
                {/* Scoreboard */}
                {settings.mode === 'online' && onlineRoom ? (
                  /* Online custom scoreboard */
                  <div dir="rtl" className="grid grid-cols-3 gap-3 w-full max-w-md mx-auto">
                    {/* Me */}
                    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <img 
                          src={profile.picture || 'https://api.dicebear.com/7.x/bottts/svg?seed=me'} 
                          className="w-5 h-5 rounded-full border border-indigo-500/20"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-xs font-bold text-gray-300 truncate max-w-[70px]">أنا ({onlineSymbol})</span>
                      </div>
                      <div className="text-2xl font-black text-indigo-400 font-mono">{stats.player1Wins}</div>
                    </div>

                    {/* Tie */}
                    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3 text-center">
                      <div className="text-xs font-bold text-gray-300">التعادل</div>
                      <div className="text-2xl font-black text-amber-400 font-mono mt-1">{stats.draws}</div>
                    </div>

                    {/* Opponent */}
                    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <img 
                          src={
                            onlineRoom.players.find(p => p.id !== auth.currentUser?.uid)?.picture || 
                            'https://api.dicebear.com/7.x/bottts/svg?seed=opponent'
                          } 
                          className="w-5 h-5 rounded-full border border-pink-500/20"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-xs font-bold text-gray-300 truncate max-w-[70px]">
                          {onlineRoom.players.find(p => p.id !== auth.currentUser?.uid)?.name || 'المنافس'}
                        </span>
                      </div>
                      <div className="text-2xl font-black text-pink-400 font-mono">
                        {stats.player2Wins}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Local scoreboard */
                  <ScoreBoard stats={stats} settings={settings} />
                )}

                {/* Active status bar */}
                <motion.div
                  key={getStatusText()}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-center py-2.5 px-5 rounded-2xl border text-sm font-bold w-fit mx-auto shadow-sm ${
                    gameOver
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : (settings.mode === 'online' && onlineRoom?.turn === onlineSymbol)
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 animate-pulse'
                      : 'bg-slate-900/40 border-slate-800 text-gray-200'
                  }`}
                >
                  {getStatusText()}
                </motion.div>

                {/* Tic Tac Toe Board */}
                <GameBoard
                  board={settings.mode === 'online' && onlineRoom ? onlineRoom.board : board}
                  onCellClick={settings.mode === 'online' ? handleOnlineCellClick : handleLocalCellClick}
                  winningLine={winningLine}
                  gameOver={gameOver}
                  isComputerTurn={settings.mode === 'online' ? false : isComputerTurn}
                />

                {/* --- ONLINE INTERACTIVE CONTROLS (CHAT & EMOJIS) --- */}
                {settings.mode === 'online' && onlineRoom && (
                  <div className="w-full max-w-sm mx-auto space-y-3">
                    
                    {/* Quick Emojis sender */}
                    <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-2xl gap-2 overflow-x-auto">
                      <span className="text-xs text-gray-400 font-bold flex-shrink-0 ml-1">تفاعل سريع:</span>
                      <div className="flex items-center gap-1.5 flex-grow justify-end">
                        {quickEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleSendChat(emoji)}
                            className="text-lg hover:scale-125 transition transform active:scale-95 p-1 bg-slate-950/40 rounded-lg border border-slate-900 cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          onClick={handleSendBuzz}
                          className="text-xs font-bold text-yellow-400 hover:text-yellow-300 px-2 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-lg hover:scale-105 active:scale-95 transition cursor-pointer"
                          title="أرسل تنبيهًا صوتيًا لخصمك"
                        >
                          تنبيه! 🔔
                        </button>
                      </div>
                    </div>

                    {/* Chat messaging panel */}
                    <div className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-2xl space-y-3">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setShowChat(!showChat)}
                      >
                        <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-indigo-400" />
                          محادثة المباراة المباشرة ({chatMessages.length})
                        </span>
                        <span className="text-[11px] text-gray-500 font-bold">
                          {showChat ? 'إغلاق' : 'عرض'}
                        </span>
                      </div>

                      {showChat && (
                        <div className="space-y-3 pt-2 border-t border-slate-800">
                          {/* Messages list */}
                          <div className="h-28 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                            {chatMessages.length === 0 ? (
                              <div className="text-center text-[11px] text-gray-500 py-6">
                                لا توجد رسائل بعد. أرسل إيموجي للبدء! 🤝
                              </div>
                            ) : (
                              chatMessages.map((msg, idx) => {
                                const isMe = msg.sender === profile.name;
                                return (
                                  <div 
                                    key={idx} 
                                    className={`flex flex-col max-w-[80%] ${isMe ? 'mr-auto items-end' : 'ml-auto items-start'}`}
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-gray-400 font-bold">{msg.sender}</span>
                                      <span className="text-[9px] text-gray-500">{msg.time}</span>
                                    </div>
                                    <div className={`p-2 rounded-xl text-xs mt-1 ${
                                      isMe 
                                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                                        : 'bg-slate-950 text-gray-200 rounded-tl-none border border-slate-800'
                                    }`}>
                                      {msg.text}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                            <div ref={messagesEndRef} />
                          </div>

                          {/* Message input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                              placeholder="اكتب رسالة سريعة..."
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              onClick={() => handleSendChat()}
                              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* Match Control Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm mx-auto">
                  <button
                    onClick={() => {
                      playClickSound();
                      startNewRound();
                    }}
                    id="play-again-btn"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-lg shadow-violet-500/15 transition transform active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>إعادة اللعب</span>
                  </button>

                  {settings.mode !== 'online' && (
                    <button
                      onClick={handleResetScores}
                      id="reset-scores-btn"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-gray-300 hover:text-white rounded-xl font-bold transition transform active:scale-95 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>تصفير النقاط</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Confetti Celebration */}
        {showConfetti && <Confetti />}

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-gray-600 border-t border-slate-900/30 mt-auto">
          تم التطوير بكل حب باللغة العربية • لعبة آدم إكس أو الذكية أونلاين
        </footer>

      </div>
    </div>
  );
}
