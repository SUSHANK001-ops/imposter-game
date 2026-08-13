import { SEED_DATA } from '../data/seedData';
import { connectToDatabase } from './mongodb';
import { Room, IRoom, IPlayer, IVote } from '../models/Room';
import { Word } from '../models/Word';
import { Category } from '../models/Category';

export interface RoomState {
  code: string;
  adminSocketId: string;
  adminPlayerId: string;
  status: 'waiting' | 'playing' | 'ended';
  players: IPlayer[];
  settings: {
    maxPlayers: number;
    discussionTime: number;
    imposterCount: number;
    showImposterHint: boolean;
  };
  currentGame: {
    category: string;
    realWord: string;
    imposterWord: string;
    imposterSocketIds: string[];
    imposterPlayerIds: string[];
    phase: 'discussing' | 'voting' | 'results';
    votes: IVote[];
    startedAt: Date;
    endedAt?: Date;
    winner?: 'crew' | 'imposter' | 'tie';
    winnerText?: string;
    imposterHint?: string;
    timeLeft: number;
  } | null;
  customWords: Array<{ word: string; category: string }>;
  lastActivity: Date;
}

class GameManager {
  private rooms: Map<string, RoomState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Initialized in memory
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like I, O, 0, 1
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  public createRoom(hostName: string, socketId: string, hostPlayerId: string): RoomState {
    const code = this.generateRoomCode();
    const hostPlayer: IPlayer = {
      socketId,
      playerId: hostPlayerId,
      name: hostName,
      isAdmin: true,
      isConnected: true,
      score: 0,
      joinedAt: new Date()
    };

    const roomState: RoomState = {
      code,
      adminSocketId: socketId,
      adminPlayerId: hostPlayerId,
      status: 'waiting',
      players: [hostPlayer],
      settings: {
        maxPlayers: 8,
        discussionTime: 180,
        imposterCount: 1,
        showImposterHint: false
      },
      currentGame: null,
      customWords: [],
      lastActivity: new Date()
    };

    this.rooms.set(code, roomState);
    this.saveRoomToDb(roomState);
    return roomState;
  }

  public getRoom(code: string): RoomState | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  public joinRoom(code: string, name: string, socketId: string, playerId: string): { room?: RoomState; error?: string } {
    const uppercaseCode = code.toUpperCase();
    const room = this.rooms.get(uppercaseCode);

    if (!room) {
      return { error: 'Room not found. Please check the code and try again.' };
    }

    // Check if player already exists (reconnection)
    const existingPlayerIndex = room.players.findIndex(p => p.playerId === playerId);

    if (existingPlayerIndex !== -1) {
      // Reconnect existing player
      room.players[existingPlayerIndex].socketId = socketId;
      room.players[existingPlayerIndex].isConnected = true;
      room.players[existingPlayerIndex].name = name || room.players[existingPlayerIndex].name;

      if (room.adminPlayerId === playerId) {
        room.adminSocketId = socketId;
        room.players[existingPlayerIndex].isAdmin = true;
      }
    } else {
      // New player joining
      if (room.players.length >= room.settings.maxPlayers) {
        return { error: 'Room is full!' };
      }

      const newPlayer: IPlayer = {
        socketId,
        playerId,
        name,
        isAdmin: room.players.length === 0,
        isConnected: true,
        score: 0,
        joinedAt: new Date()
      };

      room.players.push(newPlayer);

      if (room.players.length === 1) {
        room.adminSocketId = socketId;
        room.adminPlayerId = playerId;
        newPlayer.isAdmin = true;
      }
    }

    room.lastActivity = new Date();
    this.saveRoomToDb(room);
    return { room };
  }

  public handleDisconnect(socketId: string): { roomCode?: string; player?: IPlayer; room?: RoomState } {
    for (const [code, room] of this.rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.socketId === socketId);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        player.isConnected = false;
        room.lastActivity = new Date();

        // If admin disconnects, pass admin role to next connected player if room waiting
        if (player.isAdmin && room.status === 'waiting') {
          const nextConnected = room.players.find(p => p.isConnected && p.socketId !== socketId);
          if (nextConnected) {
            player.isAdmin = false;
            nextConnected.isAdmin = true;
            room.adminSocketId = nextConnected.socketId;
            room.adminPlayerId = nextConnected.playerId;
          }
        }

        this.saveRoomToDb(room);
        return { roomCode: code, player, room };
      }
    }
    return {};
  }

  public kickPlayer(roomCode: string, targetPlayerId: string, adminSocketId: string): { room?: RoomState; error?: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found' };
    if (room.adminSocketId !== adminSocketId) return { error: 'Only admin can kick players' };

    const targetIndex = room.players.findIndex(p => p.playerId === targetPlayerId);
    if (targetIndex === -1) return { error: 'Player not found' };

    if (room.players[targetIndex].isAdmin) {
      return { error: 'Cannot kick room admin' };
    }

    room.players.splice(targetIndex, 1);
    room.lastActivity = new Date();
    this.saveRoomToDb(room);
    return { room };
  }

  public updateSettings(roomCode: string, adminSocketId: string, settings: Partial<RoomState['settings']>): { room?: RoomState; error?: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found' };
    if (room.adminSocketId !== adminSocketId) return { error: 'Only admin can update settings' };
    if (room.status !== 'waiting') return { error: 'Cannot update settings while game is in progress' };

    room.settings = { ...room.settings, ...settings };
    room.lastActivity = new Date();
    this.saveRoomToDb(room);
    return { room };
  }

  public addCustomWord(roomCode: string, adminSocketId: string, word: string, category: string): { room?: RoomState; error?: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found' };
    if (room.adminSocketId !== adminSocketId) return { error: 'Only admin can add words' };

    const cleanWord = word.trim();
    const cleanCategory = category.trim();

    if (!cleanWord || !cleanCategory) return { error: 'Word and Category are required' };

    room.customWords.push({ word: cleanWord, category: cleanCategory });
    this.saveWordToDb(cleanWord, cleanCategory, roomCode);
    return { room };
  }

  public getRandomWordAndCategory(room: RoomState): { category: string; realWord: string; decoyWord: string } {
    // Combine seed data categories + room custom words
    const allCategoriesMap: Map<string, string[]> = new Map();

    // Load from seed data
    SEED_DATA.forEach(cat => {
      allCategoriesMap.set(cat.category, [...cat.words]);
    });

    // Add room custom words
    room.customWords.forEach(cw => {
      const existing = allCategoriesMap.get(cw.category) || [];
      existing.push(cw.word);
      allCategoriesMap.set(cw.category, existing);
    });

    const categoryNames = Array.from(allCategoriesMap.keys());
    const selectedCategory = categoryNames[Math.floor(Math.random() * categoryNames.length)];
    const wordList = allCategoriesMap.get(selectedCategory) || ["Elephant"];

    const realWordIndex = Math.floor(Math.random() * wordList.length);
    const realWord = wordList[realWordIndex];

    // Pick a decoy word from the same category
    let decoyWord = "???";
    if (wordList.length > 1) {
      let decoyIndex = Math.floor(Math.random() * wordList.length);
      while (decoyIndex === realWordIndex) {
        decoyIndex = Math.floor(Math.random() * wordList.length);
      }
      decoyWord = wordList[decoyIndex];
    } else {
      decoyWord = `Related to ${selectedCategory}`;
    }

    return { category: selectedCategory, realWord, decoyWord };
  }

  public startGame(roomCode: string, adminSocketId: string): { room?: RoomState; error?: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found' };
    if (room.adminSocketId !== adminSocketId) return { error: 'Only admin can start the game' };
    
    // Note: Prompt mentions "Admin can force-start even with <4 players (for testing)", but ideally requires >= 2
    if (room.players.length < 2) {
      return { error: 'Need at least 2 connected players to start!' };
    }

    const { category, realWord, decoyWord } = this.getRandomWordAndCategory(room);

    // Pick random imposters
    const connectedPlayers = room.players.filter(p => p.isConnected);
    const imposterCount = Math.min(room.settings.imposterCount, Math.floor(connectedPlayers.length / 2) || 1);
    
    const shuffled = [...connectedPlayers].sort(() => 0.5 - Math.random());
    const imposters = shuffled.slice(0, imposterCount);

    const imposterSocketIds = imposters.map(i => i.socketId);
    const imposterPlayerIds = imposters.map(i => i.playerId);

    const imposterWord = room.settings.showImposterHint ? decoyWord : "???";
    const imposterHint = room.settings.showImposterHint ? `Hint: Decoy word is "${decoyWord}"` : undefined;

    room.status = 'playing';
    room.currentGame = {
      category,
      realWord,
      imposterWord,
      imposterSocketIds,
      imposterPlayerIds,
      phase: 'discussing',
      votes: [],
      startedAt: new Date(),
      timeLeft: room.settings.discussionTime,
      imposterHint
    };

    room.lastActivity = new Date();
    this.saveRoomToDb(room);
    return { room };
  }

  public castVote(roomCode: string, voterSocketId: string, voterPlayerId: string, targetPlayerId: string): { room?: RoomState; error?: string; allVoted?: boolean } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.currentGame) return { error: 'Game session not active' };
    if (room.currentGame.phase !== 'voting') return { error: 'Voting is not open' };

    const targetPlayer = room.players.find(p => p.playerId === targetPlayerId);
    if (!targetPlayer) return { error: 'Target player not found' };

    // Record or update vote
    const existingVoteIndex = room.currentGame.votes.findIndex(v => v.voterPlayerId === voterPlayerId);
    const voteData: IVote = {
      voterSocketId,
      voterPlayerId,
      targetSocketId: targetPlayer.socketId,
      targetPlayerId
    };

    if (existingVoteIndex !== -1) {
      room.currentGame.votes[existingVoteIndex] = voteData;
    } else {
      room.currentGame.votes.push(voteData);
    }

    const connectedPlayers = room.players.filter(p => p.isConnected);
    const allVoted = room.currentGame.votes.length >= connectedPlayers.length;

    this.saveRoomToDb(room);
    return { room, allVoted };
  }

  public evaluateResults(roomCode: string): { room?: RoomState; error?: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.currentGame) return { error: 'No active game session' };

    const game = room.currentGame;
    game.phase = 'results';
    game.endedAt = new Date();

    // Count votes for each target
    const voteTally: Map<string, number> = new Map();
    game.votes.forEach(v => {
      const count = voteTally.get(v.targetPlayerId) || 0;
      voteTally.set(v.targetPlayerId, count + 1);
    });

    let maxVotes = 0;
    let topTargets: string[] = [];

    voteTally.forEach((count, targetPlayerId) => {
      if (count > maxVotes) {
        maxVotes = count;
        topTargets = [targetPlayerId];
      } else if (count === maxVotes) {
        topTargets.push(targetPlayerId);
      }
    });

    let winner: 'crew' | 'imposter' | 'tie' = 'imposter';
    let winnerText = '';

    if (maxVotes === 0 || topTargets.length > 1) {
      // Tie vote or no votes cast
      winner = 'tie';
      winnerText = 'Tie Vote! The Imposter escaped undetected.';
    } else {
      const votedOutPlayerId = topTargets[0];
      const isImposter = game.imposterPlayerIds.includes(votedOutPlayerId);
      const votedOutPlayer = room.players.find(p => p.playerId === votedOutPlayerId);
      const votedOutName = votedOutPlayer ? votedOutPlayer.name : 'Unknown';

      if (isImposter) {
        winner = 'crew';
        winnerText = `Crew Wins! ${votedOutName} was identified as the Imposter!`;
        // Award score points to Crew
        room.players.forEach(p => {
          if (!game.imposterPlayerIds.includes(p.playerId)) {
            p.score += 10;
          }
        });
      } else {
        winner = 'imposter';
        winnerText = `Imposter Wins! ${votedOutName} was innocent, the Imposter fooled everyone!`;
        // Award score points to Imposter
        room.players.forEach(p => {
          if (game.imposterPlayerIds.includes(p.playerId)) {
            p.score += 15;
          }
        });
      }
    }

    game.winner = winner;
    game.winnerText = winnerText;
    room.status = 'ended';

    this.saveRoomToDb(room);
    return { room };
  }

  public playAgain(roomCode: string, adminSocketId: string): { room?: RoomState; error?: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found' };
    if (room.adminSocketId !== adminSocketId) return { error: 'Only admin can reset room for Play Again' };

    room.status = 'waiting';
    room.currentGame = null;
    room.lastActivity = new Date();

    this.saveRoomToDb(room);
    return { room };
  }

  private async saveRoomToDb(room: RoomState) {
    try {
      const db = await connectToDatabase();
      if (!db) return;

      await Room.findOneAndUpdate(
        { code: room.code },
        {
          adminSocketId: room.adminSocketId,
          adminPlayerId: room.adminPlayerId,
          status: room.status,
          players: room.players,
          currentGame: room.currentGame ? {
            category: room.currentGame.category,
            realWord: room.currentGame.realWord,
            imposterWord: room.currentGame.imposterWord,
            imposterSocketIds: room.currentGame.imposterSocketIds,
            imposterPlayerIds: room.currentGame.imposterPlayerIds,
            phase: room.currentGame.phase,
            votes: room.currentGame.votes,
            startedAt: room.currentGame.startedAt,
            endedAt: room.currentGame.endedAt,
            winner: room.currentGame.winner,
            winnerText: room.currentGame.winnerText,
            imposterHint: room.currentGame.imposterHint
          } : null,
          settings: room.settings,
          lastActivity: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (e) {
      // Gracefully ignore DB errors if offline
    }
  }

  private async saveWordToDb(word: string, category: string, roomCode: string) {
    try {
      const db = await connectToDatabase();
      if (!db) return;

      await Word.create({
        word,
        category,
        addedBy: 'admin',
        roomCode,
        usageCount: 0
      });
      await Category.findOneAndUpdate(
        { name: category },
        { $inc: { wordCount: 1 } },
        { upsert: true }
      );
    } catch (e) {
      // Graceful error handle
    }
  }
}

export const gameManager = new GameManager();
