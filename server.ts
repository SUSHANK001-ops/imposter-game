import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import next from 'next';
import { gameManager, RoomState } from './src/lib/gameManager';
import { connectToDatabase } from './src/lib/mongodb';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev });
const handle = app.getRequestHandler();

// Timer ticker map per room
const activeTimers: Map<string, NodeJS.Timeout> = new Map();

app.prepare().then(async () => {
  // Try connecting to DB if configured
  await connectToDatabase().catch(() => {
    console.log('Running server with in-memory state engine.');
  });

  const expressApp = express();
  const httpServer = createServer(expressApp);

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  function broadcastRoomUpdate(roomCode: string, systemMessage?: string) {
    const room = gameManager.getRoom(roomCode);
    if (!room) return;

    io.to(roomCode).emit('room:updated', {
      code: room.code,
      adminSocketId: room.adminSocketId,
      adminPlayerId: room.adminPlayerId,
      status: room.status,
      players: room.players,
      settings: room.settings,
      currentGame: room.currentGame ? {
        category: room.currentGame.category,
        phase: room.currentGame.phase,
        votes: room.currentGame.votes,
        startedAt: room.currentGame.startedAt,
        timeLeft: room.currentGame.timeLeft,
        winner: room.currentGame.winner,
        winnerText: room.currentGame.winnerText
      } : null,
      customWordsCount: room.customWords.length
    });

    if (systemMessage) {
      io.to(roomCode).emit('chat:message', {
        sender: 'SYSTEM',
        message: systemMessage,
        isSystem: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  }

  function startRoomTimer(roomCode: string) {
    if (activeTimers.has(roomCode)) {
      clearInterval(activeTimers.get(roomCode)!);
      activeTimers.delete(roomCode);
    }

    const timer = setInterval(() => {
      const room = gameManager.getRoom(roomCode);
      if (!room || !room.currentGame || room.status !== 'playing') {
        clearInterval(timer);
        activeTimers.delete(roomCode);
        return;
      }

      const game = room.currentGame;
      if (game.phase === 'discussing') {
        game.timeLeft -= 1;
        io.to(roomCode).emit('game:timerTick', { phase: 'discussing', timeLeft: game.timeLeft });

        if (game.timeLeft <= 0) {
          // Transition automatically to voting phase
          game.phase = 'voting';
          game.timeLeft = 60; // 60 seconds voting window
          io.to(roomCode).emit('game:phaseChanged', { phase: 'voting', timer: 60 });
          broadcastRoomUpdate(roomCode, '⏰ Discussion time is up! Transitioning to Voting phase. Cast your votes!');
        }
      } else if (game.phase === 'voting') {
        game.timeLeft -= 1;
        io.to(roomCode).emit('game:timerTick', { phase: 'voting', timeLeft: game.timeLeft });

        if (game.timeLeft <= 0) {
          // Time expired for voting -> evaluate results
          clearInterval(timer);
          activeTimers.delete(roomCode);

          const { room: updatedRoom } = gameManager.evaluateResults(roomCode);
          if (updatedRoom && updatedRoom.currentGame) {
            io.to(roomCode).emit('game:results', {
              winner: updatedRoom.currentGame.winner,
              winnerText: updatedRoom.currentGame.winnerText,
              realWord: updatedRoom.currentGame.realWord,
              imposterPlayerIds: updatedRoom.currentGame.imposterPlayerIds,
              votes: updatedRoom.currentGame.votes,
              players: updatedRoom.players
            });
            broadcastRoomUpdate(roomCode, `🏆 Game Ended! ${updatedRoom.currentGame.winnerText}`);
          }
        }
      }
    }, 1000);

    activeTimers.set(roomCode, timer);
  }

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Create Room
    socket.on('room:create', ({ name, playerId }: { name: string; playerId: string }, callback) => {
      try {
        if (!name || !name.trim()) {
          if (typeof callback === 'function') callback({ error: 'Display name is required' });
          return;
        }
        const room = gameManager.createRoom(name.trim(), socket.id, playerId);
        socket.join(room.code);

        if (typeof callback === 'function') {
          callback({ roomCode: room.code, room });
        }
        broadcastRoomUpdate(room.code, `Room created! ${name} is the Host.`);
      } catch (err: any) {
        if (typeof callback === 'function') callback({ error: err.message });
      }
    });

    // Join Room
    socket.on('room:join', ({ roomCode, name, playerId }: { roomCode: string; name: string; playerId: string }, callback) => {
      try {
        if (!roomCode || !name) {
          if (typeof callback === 'function') callback({ error: 'Room code and name are required' });
          return;
        }
        const { room, error } = gameManager.joinRoom(roomCode, name.trim(), socket.id, playerId);
        if (error || !room) {
          if (typeof callback === 'function') callback({ error });
          return;
        }

        socket.join(room.code);

        if (typeof callback === 'function') {
          callback({ roomCode: room.code, room });
        }

        broadcastRoomUpdate(room.code, `${name} joined the room!`);
      } catch (err: any) {
        if (typeof callback === 'function') callback({ error: err.message });
      }
    });

    // Player Reconnect
    socket.on('player:reconnect', ({ roomCode, playerId, name }: { roomCode: string; playerId: string; name: string }, callback) => {
      try {
        const room = gameManager.getRoom(roomCode);
        if (!room) {
          if (typeof callback === 'function') callback({ error: 'Room not found' });
          return;
        }

        const { room: updatedRoom, error } = gameManager.joinRoom(roomCode, name, socket.id, playerId);
        if (error || !updatedRoom) {
          if (typeof callback === 'function') callback({ error });
          return;
        }

        socket.join(updatedRoom.code);

        // If game is in progress, re-send secret role payload
        let secretData = null;
        if (updatedRoom.currentGame && updatedRoom.status === 'playing') {
          const isImposter = updatedRoom.currentGame.imposterPlayerIds.includes(playerId);
          secretData = {
            role: isImposter ? 'IMPOSTER' : 'CREW',
            category: updatedRoom.currentGame.category,
            word: isImposter ? updatedRoom.currentGame.imposterWord : updatedRoom.currentGame.realWord,
            imposterHint: isImposter ? updatedRoom.currentGame.imposterHint : undefined
          };
        }

        if (typeof callback === 'function') {
          callback({ room: updatedRoom, secretData });
        }

        broadcastRoomUpdate(updatedRoom.code, `${name} reconnected.`);
      } catch (err: any) {
        if (typeof callback === 'function') callback({ error: err.message });
      }
    });

    // Start Game
    socket.on('game:start', ({ roomCode }: { roomCode: string }, callback) => {
      try {
        const { room, error } = gameManager.startGame(roomCode, socket.id);
        if (error || !room || !room.currentGame) {
          if (typeof callback === 'function') callback({ error });
          return;
        }

        // Send individual secret role payloads to each connected player socket
        room.players.forEach(p => {
          if (!p.isConnected) return;
          const isImposter = room.currentGame!.imposterPlayerIds.includes(p.playerId);
          io.to(p.socketId).emit('game:started', {
            role: isImposter ? 'IMPOSTER' : 'CREW',
            category: room.currentGame!.category,
            word: isImposter ? room.currentGame!.imposterWord : room.currentGame!.realWord,
            imposterHint: isImposter ? room.currentGame!.imposterHint : undefined
          });
        });

        startRoomTimer(room.code);
        broadcastRoomUpdate(room.code, `🚀 Game started! Category: ${room.currentGame.category}. Check your secret role!`);

        if (typeof callback === 'function') callback({ success: true });
      } catch (err: any) {
        if (typeof callback === 'function') callback({ error: err.message });
      }
    });

    // Vote
    socket.on('game:vote', ({ roomCode, targetPlayerId, voterPlayerId }: { roomCode: string; targetPlayerId: string; voterPlayerId: string }, callback) => {
      try {
        const { room, error, allVoted } = gameManager.castVote(roomCode, socket.id, voterPlayerId, targetPlayerId);
        if (error || !room) {
          if (typeof callback === 'function') callback({ error });
          return;
        }

        const voter = room.players.find(p => p.playerId === voterPlayerId);
        broadcastRoomUpdate(room.code, `${voter ? voter.name : 'A player'} cast a vote.`);

        if (allVoted) {
          // All players voted -> finish immediately
          if (activeTimers.has(room.code)) {
            clearInterval(activeTimers.get(room.code)!);
            activeTimers.delete(room.code);
          }

          const { room: updatedRoom } = gameManager.evaluateResults(room.code);
          if (updatedRoom && updatedRoom.currentGame) {
            io.to(room.code).emit('game:results', {
              winner: updatedRoom.currentGame.winner,
              winnerText: updatedRoom.currentGame.winnerText,
              realWord: updatedRoom.currentGame.realWord,
              imposterPlayerIds: updatedRoom.currentGame.imposterPlayerIds,
              votes: updatedRoom.currentGame.votes,
              players: updatedRoom.players
            });
            broadcastRoomUpdate(room.code, `🏆 All votes cast! ${updatedRoom.currentGame.winnerText}`);
          }
        }

        if (typeof callback === 'function') callback({ success: true });
      } catch (err: any) {
        if (typeof callback === 'function') callback({ error: err.message });
      }
    });

    // Add Custom Word
    socket.on('word:add', ({ roomCode, word, category }: { roomCode: string; word: string; category: string }, callback) => {
      try {
        const { room, error } = gameManager.addCustomWord(roomCode, socket.id, word, category);
        if (error || !room) {
          if (typeof callback === 'function') callback({ error });
          return;
        }
        broadcastRoomUpdate(room.code, `Admin added a custom word "${word}" to category "${category}".`);
        if (typeof callback === 'function') callback({ success: true, customWordsCount: room.customWords.length });
      } catch (err: any) {
        if (typeof callback === 'function') callback({ error: err.message });
      }
    });

    // Update Settings
    socket.on('room:settingsUpdate', ({ roomCode, settings }: { roomCode: string; settings: any }, callback) => {
      try {
        const { room, error } = gameManager.updateSettings(roomCode, socket.id, settings);
        if (error || !room) {
          if (typeof callback === 'function') callback({ error });
          return;
        }
        broadcastRoomUpdate(room.code, `Host updated room settings.`);
        if (typeof callback === 'function') callback({ success: true });
      } catch (err: any) {
        if (typeof callback === 'function') callback({ error: err.message });
      }
    });

    // Kick Player
    socket.on('room:kick', ({ roomCode, targetPlayerId }: { roomCode: string; targetPlayerId: string }, callback) => {
      try {
        const { room, error } = gameManager.kickPlayer(roomCode, targetPlayerId, socket.id);
        if (error || !room) {
          if (typeof callback === 'function') callback({ error });
          return;
        }
        broadcastRoomUpdate(room.code, `Host kicked a player from the room.`);
        if (typeof callback === 'function') callback({ success: true });
      } catch (err: any) {
        if (typeof callback === 'function') callback({ error: err.message });
      }
    });

    // Play Again
    socket.on('game:playAgain', ({ roomCode }: { roomCode: string }, callback) => {
      try {
        const { room, error } = gameManager.playAgain(roomCode, socket.id);
        if (error || !room) {
          if (typeof callback === 'function') callback({ error });
          return;
        }
        if (activeTimers.has(room.code)) {
          clearInterval(activeTimers.get(room.code)!);
          activeTimers.delete(room.code);
        }
        broadcastRoomUpdate(room.code, `🔄 Room reset! Welcome back to the lobby.`);
        if (typeof callback === 'function') callback({ success: true });
      } catch (err: any) {
        if (typeof callback === 'function') callback({ error: err.message });
      }
    });

    // Chat Message
    socket.on('chat:message', ({ roomCode, sender, message }: { roomCode: string; sender: string; message: string }) => {
      if (!roomCode || !message || !message.trim()) return;
      io.to(roomCode).emit('chat:message', {
        sender: sender || 'Player',
        message: message.trim(),
        isSystem: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const { roomCode, player, room } = gameManager.handleDisconnect(socket.id);
      if (roomCode && player && room) {
        broadcastRoomUpdate(roomCode, `${player.name} went offline.`);
      }
    });
  });

  expressApp.all('*', (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, () => {
    console.log(`> Server ready on http://localhost:${port}`);
  });
});
