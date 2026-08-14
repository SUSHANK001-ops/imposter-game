import { SEED_DATA } from '../data/seedData';
import { connectToDatabase } from './mongodb';
import { Room, IPlayer, IVote, IClue } from '../models/Room';
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
    turnTime: number;
    imposterCount: number;
    showImposterHint: boolean;
    selectedCategories: string[];
  };
  currentGame: {
    category: string;
    realWord: string;
    imposterWord: string;
    imposterSocketIds: string[];
    imposterPlayerIds: string[];
    eliminatedPlayerIds: string[];
    phase: 'discussing' | 'voting' | 'results';
    votes: IVote[];
    clues: IClue[];
    currentTurnPlayerId: string;
    turnTimeLeft: number;
    turnOrderPlayerIds: string[];
    startedAt: Date;
    endedAt?: Date;
    winner?: 'crew' | 'imposter' | 'tie';
    winnerText?: string;
    imposterHint?: string;
  } | null;
  customWords: Array<{ word: string; category: string }>;
  lastActivity: Date;
}

class GameManager {
  private rooms: Map<string, RoomState> = new Map();

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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

    const allSeedCategoryNames = SEED_DATA.map(c => c.category);

    const roomState: RoomState = {
      code,
      adminSocketId: socketId,
      adminPlayerId: hostPlayerId,
      status: 'waiting',
      players: [hostPlayer],
      settings: {
        maxPlayers: 10,
        turnTime: 20,
        imposterCount: 1,
        showImposterHint: false,
        selectedCategories: allSeedCategoryNames
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

    const existingPlayerIndex = room.players.findIndex(p => p.playerId === playerId);

    if (existingPlayerIndex !== -1) {
      room.players[existingPlayerIndex].socketId = socketId;
      room.players[existingPlayerIndex].isConnected = true;
      room.players[existingPlayerIndex].name = name || room.players[existingPlayerIndex].name;

      if (room.adminPlayerId === playerId) {
        room.adminSocketId = socketId;
        room.players[existingPlayerIndex].isAdmin = true;
      }
    } else {
      if (room.players.length >= (room.settings.maxPlayers || 20)) {
        return { error: `Room is full! (Max ${room.settings.maxPlayers || 20} players)` };
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

    if (!room.settings.selectedCategories.includes(cleanCategory)) {
      room.settings.selectedCategories.push(cleanCategory);
    }

    this.saveWordToDb(cleanWord, cleanCategory, roomCode);
    return { room };
  }

  public getRandomWordAndCategory(room: RoomState): { category: string; realWord: string; decoyWord: string } {
    const allCategoriesMap: Map<string, string[]> = new Map();

    SEED_DATA.forEach(cat => {
      allCategoriesMap.set(cat.category, [...cat.words]);
    });

    room.customWords.forEach(cw => {
      const existing = allCategoriesMap.get(cw.category) || [];
      existing.push(cw.word);
      allCategoriesMap.set(cw.category, existing);
    });

    let availableCategoryNames = Array.from(allCategoriesMap.keys());

    if (room.settings.selectedCategories && room.settings.selectedCategories.length > 0) {
      const filtered = availableCategoryNames.filter(catName => room.settings.selectedCategories.includes(catName));
      if (filtered.length > 0) {
        availableCategoryNames = filtered;
      }
    }

    const selectedCategory = availableCategoryNames[Math.floor(Math.random() * availableCategoryNames.length)];
    const wordList = allCategoriesMap.get(selectedCategory) || ["Elephant"];

    const realWordIndex = Math.floor(Math.random() * wordList.length);
    const realWord = wordList[realWordIndex];

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
    
    const connectedPlayers = room.players.filter(p => p.isConnected);
    if (connectedPlayers.length < 3) {
      return { error: 'Need at least 3 players to start the game!' };
    }

    const { category, realWord, decoyWord } = this.getRandomWordAndCategory(room);

    const maxImpostersAllowed = Math.max(1, Math.floor((connectedPlayers.length - 1) / 2));
    const imposterCount = Math.min(room.settings.imposterCount || 1, maxImpostersAllowed);
    const shuffled = [...connectedPlayers].sort(() => 0.5 - Math.random());
    const imposters = shuffled.slice(0, imposterCount);

    const imposterSocketIds = imposters.map(i => i.socketId);
    const imposterPlayerIds = imposters.map(i => i.playerId);

    const imposterWord = room.settings.showImposterHint ? decoyWord : "???";
    const imposterHint = room.settings.showImposterHint ? `Hint: Decoy word is "${decoyWord}"` : undefined;

    const turnOrderPlayerIds = connectedPlayers.map(p => p.playerId);
    const currentTurnPlayerId = turnOrderPlayerIds[0] || "";

    room.status = 'playing';
    room.currentGame = {
      category,
      realWord,
      imposterWord,
      imposterSocketIds,
      imposterPlayerIds,
      eliminatedPlayerIds: [],
      phase: 'discussing',
      votes: [],
      clues: [],
      turnOrderPlayerIds,
      currentTurnPlayerId,
      turnTimeLeft: room.settings.turnTime || 20,
      startedAt: new Date(),
      imposterHint
    };

    room.lastActivity = new Date();
    this.saveRoomToDb(room);
    return { room };
  }

  public submitClue(roomCode: string, playerId: string, text: string): { room?: RoomState; error?: string; phaseChanged?: boolean } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.currentGame) return { error: 'Game session not active' };
    if (room.currentGame.phase !== 'discussing') return { error: 'Not in turn clue phase' };

    const game = room.currentGame;
    if (game.currentTurnPlayerId !== playerId) {
      return { error: 'It is not your turn to submit a word!' };
    }

    const cleanText = text.trim();
    if (!cleanText) return { error: 'Clue word cannot be empty' };

    const player = room.players.find(p => p.playerId === playerId);
    const playerName = player ? player.name : 'Player';

    // If the Imposter types the exact secret word in the normal clue box -> Imposter Wins!
    const isImposter = game.imposterPlayerIds.includes(playerId);
    if (isImposter && cleanText.toLowerCase() === game.realWord.trim().toLowerCase()) {
      game.phase = 'results';
      game.endedAt = new Date();
      game.winner = 'imposter';
      game.winnerText = `Imposter Wins! ${playerName} guessed the secret word "${game.realWord}" in the clue box!`;
      room.status = 'ended';

      room.players.forEach(p => {
        if (game.imposterPlayerIds.includes(p.playerId)) {
          p.score += 20;
        }
      });

      this.saveRoomToDb(room);
      return { room, phaseChanged: true };
    }

    // Prevent duplicate clue words (case-insensitive check against non-expired clues)
    const normalizedNew = cleanText.toLowerCase();
    const isDuplicate = game.clues.some(c => {
      const existingNormalized = c.text.trim().toLowerCase();
      return existingNormalized === normalizedNew && existingNormalized !== '(time expired)' && existingNormalized !== '(pass)';
    });

    if (isDuplicate) {
      return { error: `The clue word "${cleanText}" has already been used! Please choose a unique word.` };
    }

    game.clues.push({
      playerId,
      playerName,
      text: cleanText,
      submittedAt: new Date()
    });

    const currentIndex = game.turnOrderPlayerIds.indexOf(playerId);
    const nextIndex = currentIndex + 1;

    let phaseChanged = false;

    if (nextIndex < game.turnOrderPlayerIds.length) {
      game.currentTurnPlayerId = game.turnOrderPlayerIds[nextIndex];
      game.turnTimeLeft = room.settings.turnTime || 20;
    } else {
      game.phase = 'voting';
      game.votes = []; // Always reset votes when transitioning to voting phase
      game.currentTurnPlayerId = "";
      game.turnTimeLeft = 60;
      phaseChanged = true;
    }

    this.saveRoomToDb(room);
    return { room, phaseChanged };
  }

  public nextTurnTimeout(roomCode: string): { room?: RoomState; phaseChanged?: boolean } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.currentGame || room.currentGame.phase !== 'discussing') return {};

    const game = room.currentGame;
    const currentId = game.currentTurnPlayerId;
    const player = room.players.find(p => p.playerId === currentId);

    game.clues.push({
      playerId: currentId,
      playerName: player ? player.name : 'Player',
      text: '(Time Expired)',
      submittedAt: new Date()
    });

    const currentIndex = game.turnOrderPlayerIds.indexOf(currentId);
    const nextIndex = currentIndex + 1;

    let phaseChanged = false;

    if (nextIndex < game.turnOrderPlayerIds.length) {
      game.currentTurnPlayerId = game.turnOrderPlayerIds[nextIndex];
      game.turnTimeLeft = room.settings.turnTime || 20;
    } else {
      game.phase = 'voting';
      game.votes = []; // Always reset votes when transitioning to voting phase
      game.currentTurnPlayerId = "";
      game.turnTimeLeft = 60;
      phaseChanged = true;
    }

    this.saveRoomToDb(room);
    return { room, phaseChanged };
  }

  public castVote(roomCode: string, voterSocketId: string, voterPlayerId: string, targetPlayerId: string): { room?: RoomState; error?: string; allVoted?: boolean } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.currentGame) return { error: 'Game session not active' };
    if (room.currentGame.phase !== 'voting') return { error: 'Voting is not open' };

    const game = room.currentGame;
    if (game.eliminatedPlayerIds?.includes(voterPlayerId)) {
      return { error: 'Eliminated players cannot vote' };
    }
    if (game.eliminatedPlayerIds?.includes(targetPlayerId)) {
      return { error: 'Cannot vote for an eliminated player' };
    }

    const targetPlayer = room.players.find(p => p.playerId === targetPlayerId);
    if (!targetPlayer) return { error: 'Target player not found' };

    const existingVoteIndex = game.votes.findIndex(v => v.voterPlayerId === voterPlayerId);
    const voteData: IVote = {
      voterSocketId,
      voterPlayerId,
      targetSocketId: targetPlayer.socketId,
      targetPlayerId
    };

    if (existingVoteIndex !== -1) {
      game.votes[existingVoteIndex] = voteData;
    } else {
      game.votes.push(voteData);
    }

    // Check if all active non-eliminated connected players have voted
    const activeConnectedPlayers = room.players.filter(p => p.isConnected && !game.eliminatedPlayerIds?.includes(p.playerId));
    const allVoted = game.votes.length >= activeConnectedPlayers.length;

    this.saveRoomToDb(room);
    return { room, allVoted };
  }

  public evaluateResults(roomCode: string): { room?: RoomState; error?: string; gameContinued?: boolean; announcementText?: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.currentGame) return { error: 'No active game session' };

    const game = room.currentGame;
    if (!game.eliminatedPlayerIds) game.eliminatedPlayerIds = [];

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

    const activePlayerIds = room.players
      .filter(p => p.isConnected && !game.eliminatedPlayerIds.includes(p.playerId))
      .map(p => p.playerId);

    // Check voting outcome
    if (maxVotes === 0 || topTargets.length > 1) {
      // Tie vote or no votes -> Imposter is NOT voted out! Continue to next clue round!
      game.phase = 'discussing';
      game.votes = []; // Reset votes for next round
      game.turnTimeLeft = room.settings.turnTime || 20;
      game.turnOrderPlayerIds = activePlayerIds;
      game.currentTurnPlayerId = activePlayerIds[0] || "";
      this.saveRoomToDb(room);
      return { 
        room, 
        gameContinued: true, 
        announcementText: "Tie Vote! No player was eliminated. Imposter is still among us — starting Next Round!" 
      };
    }

    const votedOutPlayerId = topTargets[0];
    const isImposter = game.imposterPlayerIds.includes(votedOutPlayerId);
    const votedOutPlayer = room.players.find(p => p.playerId === votedOutPlayerId);
    const votedOutName = votedOutPlayer ? votedOutPlayer.name : 'Unknown';

    if (isImposter) {
      // Imposter IS voted out! Crew Wins! Game Ends!
      game.phase = 'results';
      game.endedAt = new Date();
      game.winner = 'crew';
      game.winnerText = `Crew Wins! ${votedOutName} was identified as the Imposter!`;
      room.status = 'ended';

      room.players.forEach(p => {
        if (!game.imposterPlayerIds.includes(p.playerId)) {
          p.score += 10;
        }
      });

      this.saveRoomToDb(room);
      return { room, gameContinued: false };
    } else {
      // Civilian voted out! Eliminate civilian
      game.eliminatedPlayerIds.push(votedOutPlayerId);

      const remainingActive = room.players.filter(p => p.isConnected && !game.eliminatedPlayerIds.includes(p.playerId));
      const remainingCrew = remainingActive.filter(p => !game.imposterPlayerIds.includes(p.playerId));
      const remainingImposters = remainingActive.filter(p => game.imposterPlayerIds.includes(p.playerId));

      if (remainingCrew.length <= remainingImposters.length) {
        // Imposters equal or outnumber remaining crew -> Imposters Win!
        game.phase = 'results';
        game.endedAt = new Date();
        game.winner = 'imposter';
        game.winnerText = `Imposter Wins! Civilian ${votedOutName} was eliminated. Imposters equal or outnumber crew!`;
        room.status = 'ended';

        room.players.forEach(p => {
          if (game.imposterPlayerIds.includes(p.playerId)) {
            p.score += 15;
          }
        });

        this.saveRoomToDb(room);
        return { room, gameContinued: false };
      } else {
        // Game continues to next round with remaining active players!
        const remainingPlayerIds = remainingActive.map(p => p.playerId);
        game.phase = 'discussing';
        game.votes = []; // Reset votes for next round
        game.turnTimeLeft = room.settings.turnTime || 20;
        game.turnOrderPlayerIds = remainingPlayerIds;
        game.currentTurnPlayerId = remainingPlayerIds[0] || "";

        this.saveRoomToDb(room);
        return {
          room,
          gameContinued: true,
          announcementText: `Civilian Voted Out! ${votedOutName} was innocent and eliminated. ${remainingCrew.length} crew remaining — starting Next Clue Round!`
        };
      }
    }
  }

  public guessWord(roomCode: string, playerId: string, wordGuess: string): { room?: RoomState; error?: string; correct?: boolean } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || !room.currentGame || room.status !== 'playing') {
      return { error: 'No active game session' };
    }

    const game = room.currentGame;
    if (!game.imposterPlayerIds.includes(playerId)) {
      return { error: 'Only the Imposter can guess the secret word!' };
    }

    const cleanGuess = wordGuess.trim().toLowerCase();
    const cleanRealWord = game.realWord.trim().toLowerCase();

    if (!cleanGuess) return { error: 'Guess cannot be empty' };

    if (cleanGuess === cleanRealWord) {
      const player = room.players.find(p => p.playerId === playerId);
      const imposterName = player ? player.name : 'The Imposter';

      game.phase = 'results';
      game.endedAt = new Date();
      game.winner = 'imposter';
      game.winnerText = `Imposter Wins! ${imposterName} correctly guessed the secret word "${game.realWord}"!`;
      room.status = 'ended';

      room.players.forEach(p => {
        if (game.imposterPlayerIds.includes(p.playerId)) {
          p.score += 20;
        }
      });

      this.saveRoomToDb(room);
      return { room, correct: true };
    } else {
      return { room, correct: false, error: `Incorrect guess! "${wordGuess.trim()}" is not the secret word.` };
    }
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
            eliminatedPlayerIds: room.currentGame.eliminatedPlayerIds,
            phase: room.currentGame.phase,
            votes: room.currentGame.votes,
            clues: room.currentGame.clues,
            currentTurnPlayerId: room.currentGame.currentTurnPlayerId,
            turnTimeLeft: room.currentGame.turnTimeLeft,
            turnOrderPlayerIds: room.currentGame.turnOrderPlayerIds,
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
      // Ignore DB errors
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
      // Graceful handle
    }
  }
}

export const gameManager = new GameManager();
