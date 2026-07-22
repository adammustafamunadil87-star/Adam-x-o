import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const PORT = 3000;

  // Real-time remote matches storage
  // key: roomId, value: game details
  const rooms = new Map<string, {
    id: string;
    players: {
      id: string;
      name: string;
      picture?: string;
      symbol: 'X' | 'O';
    }[];
    board: (string | null)[];
    turn: 'X' | 'O';
    gameOver: boolean;
    winner: string | 'draw' | null;
  }>();

  // Socket.io logic
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Create a room
    socket.on('create_room', (data: { playerName: string; playerPicture?: string; userSymbol: 'X' | 'O' }) => {
      const roomId = Math.random().toString(36).substring(2, 6).toUpperCase(); // e.g. ABCD
      const symbol = data.userSymbol || 'X';
      
      rooms.set(roomId, {
        id: roomId,
        players: [{
          id: socket.id,
          name: data.playerName,
          picture: data.playerPicture,
          symbol: symbol
        }],
        board: Array(9).fill(null),
        turn: 'X',
        gameOver: false,
        winner: null
      });

      socket.join(roomId);
      socket.emit('room_created', { roomId, symbol });
      console.log(`Room created: ${roomId} by ${data.playerName}`);
    });

    // Join a room
    socket.on('join_room', (data: { roomId: string; playerName: string; playerPicture?: string }) => {
      const roomId = data.roomId.toUpperCase();
      const room = rooms.get(roomId);

      if (!room) {
        socket.emit('join_error', { message: 'لم يتم العثور على الغرفة. يرجى التحقق من الرمز.' });
        return;
      }

      if (room.players.length >= 2) {
        socket.emit('join_error', { message: 'الغرفة ممتلئة بالفعل!' });
        return;
      }

      // Automatically assign the opposite symbol to the joining player
      const hostSymbol = room.players[0].symbol;
      const clientSymbol = hostSymbol === 'X' ? 'O' : 'X';

      room.players.push({
        id: socket.id,
        name: data.playerName,
        picture: data.playerPicture,
        symbol: clientSymbol
      });

      socket.join(roomId);
      io.to(roomId).emit('room_update', room);
      socket.emit('room_joined', { roomId, symbol: clientSymbol });
      console.log(`Player ${data.playerName} joined room ${roomId}`);
    });

    // Quick match (join first open room or create one)
    socket.on('quick_match', (data: { playerName: string; playerPicture?: string }) => {
      let foundRoomId: string | null = null;
      for (const [id, r] of rooms.entries()) {
        if (r.players.length === 1) {
          foundRoomId = id;
          break;
        }
      }

      if (foundRoomId) {
        const room = rooms.get(foundRoomId)!;
        const hostSymbol = room.players[0].symbol;
        const clientSymbol = hostSymbol === 'X' ? 'O' : 'X';
        
        room.players.push({
          id: socket.id,
          name: data.playerName,
          picture: data.playerPicture,
          symbol: clientSymbol
        });
        
        socket.join(foundRoomId);
        io.to(foundRoomId).emit('room_update', room);
        socket.emit('room_joined', { roomId: foundRoomId, symbol: clientSymbol });
      } else {
        // Create new room with random symbol
        const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        const symbol = Math.random() < 0.5 ? 'X' : 'O';
        
        rooms.set(roomId, {
          id: roomId,
          players: [{
            id: socket.id,
            name: data.playerName,
            picture: data.playerPicture,
            symbol: symbol
          }],
          board: Array(9).fill(null),
          turn: 'X',
          gameOver: false,
          winner: null
        });

        socket.join(roomId);
        socket.emit('room_created', { roomId, symbol });
      }
    });

    // Make a move
    socket.on('make_move', (data: { roomId: string; index: number; symbol: 'X' | 'O' }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;

      if (room.gameOver || room.turn !== data.symbol || room.board[data.index] !== null) {
        return;
      }

      // Apply move
      room.board[data.index] = data.symbol;

      // Check win or draw
      const winCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];

      let won = false;
      let winningLine: number[] | null = null;
      for (const combo of winCombos) {
        const [a, b, c] = combo;
        if (room.board[a] && room.board[a] === room.board[b] && room.board[a] === room.board[c]) {
          won = true;
          winningLine = combo;
          break;
        }
      }

      if (won) {
        room.gameOver = true;
        room.winner = data.symbol;
        io.to(data.roomId).emit('game_over', { winner: data.symbol, board: room.board, winningLine });
      } else if (room.board.every(cell => cell !== null)) {
        room.gameOver = true;
        room.winner = 'draw';
        io.to(data.roomId).emit('game_over', { winner: 'draw', board: room.board });
      } else {
        // Next Turn
        room.turn = data.symbol === 'X' ? 'O' : 'X';
        io.to(data.roomId).emit('room_update', room);
      }
    });

    // Reset/Rematch
    socket.on('request_rematch', (data: { roomId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;

      // Reset the room board for a new round
      room.board = Array(9).fill(null);
      room.gameOver = false;
      room.winner = null;
      // X starts first
      room.turn = 'X';

      io.to(data.roomId).emit('rematch_started', room);
    });

    // Chat / Emojis / Buzz
    socket.on('send_chat', (data: { roomId: string; senderName: string; message: string }) => {
      io.to(data.roomId).emit('receive_chat', data);
    });

    // Leave or disconnect
    socket.on('disconnecting', () => {
      for (const roomId of socket.rooms) {
        const room = rooms.get(roomId);
        if (room) {
          room.players = room.players.filter(p => p.id !== socket.id);
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit('player_left', { message: 'غادر منافسك اللعبة.' });
            io.to(roomId).emit('room_update', room);
          }
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', online_rooms: rooms.size });
  });

  // Integrate Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
