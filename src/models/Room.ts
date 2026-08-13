import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlayer {
  socketId: string;
  playerId: string; // Persistent UUID stored in client localStorage
  name: string;
  isAdmin: boolean;
  isConnected: boolean;
  score: number;
  joinedAt: Date;
}

export interface IVote {
  voterSocketId: string;
  voterPlayerId: string;
  targetSocketId: string;
  targetPlayerId: string;
}

export interface IClue {
  playerId: string;
  playerName: string;
  text: string;
  submittedAt: Date;
}

export interface IGameSession {
  category: string;
  realWord: string;
  imposterWord: string; // "???" or decoy word / hint
  imposterSocketIds: string[];
  imposterPlayerIds: string[];
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
}

export interface IRoomSettings {
  maxPlayers: number;
  turnTime: number; // Seconds per turn (default 20)
  imposterCount: number; // Default 1
  showImposterHint: boolean; // Imposter hint feature toggle
  selectedCategories: string[]; // Multi-category selection
}

export interface IRoom extends Document {
  code: string;
  adminSocketId: string;
  adminPlayerId: string;
  status: 'waiting' | 'playing' | 'ended';
  players: IPlayer[];
  currentGame: IGameSession | null;
  settings: IRoomSettings;
  createdAt: Date;
  lastActivity: Date;
}

const PlayerSchema = new Schema<IPlayer>({
  socketId: { type: String, required: true },
  playerId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  isAdmin: { type: Boolean, default: false },
  isConnected: { type: Boolean, default: true },
  score: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now }
});

const VoteSchema = new Schema<IVote>({
  voterSocketId: { type: String, required: true },
  voterPlayerId: { type: String, required: true },
  targetSocketId: { type: String, required: true },
  targetPlayerId: { type: String, required: true }
});

const ClueSchema = new Schema<IClue>({
  playerId: { type: String, required: true },
  playerName: { type: String, required: true },
  text: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now }
});

const GameSessionSchema = new Schema<IGameSession>({
  category: { type: String, required: true },
  realWord: { type: String, required: true },
  imposterWord: { type: String, required: true, default: "???" },
  imposterSocketIds: [{ type: String }],
  imposterPlayerIds: [{ type: String }],
  phase: { type: String, enum: ['discussing', 'voting', 'results'], default: 'discussing' },
  votes: [VoteSchema],
  clues: [ClueSchema],
  currentTurnPlayerId: { type: String, default: "" },
  turnTimeLeft: { type: Number, default: 20 },
  turnOrderPlayerIds: [{ type: String }],
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  winner: { type: String, enum: ['crew', 'imposter', 'tie'] },
  winnerText: { type: String },
  imposterHint: { type: String }
});

const RoomSettingsSchema = new Schema<IRoomSettings>({
  maxPlayers: { type: Number, default: 10, min: 3, max: 20 },
  turnTime: { type: Number, default: 20, min: 10, max: 60 },
  imposterCount: { type: Number, default: 1, min: 1, max: 3 },
  showImposterHint: { type: Boolean, default: false },
  selectedCategories: [{ type: String }]
});

const RoomSchema = new Schema<IRoom>({
  code: { type: String, required: true, unique: true, uppercase: true, index: true },
  adminSocketId: { type: String, required: true },
  adminPlayerId: { type: String, required: true },
  status: { type: String, enum: ['waiting', 'playing', 'ended'], default: 'waiting' },
  players: [PlayerSchema],
  currentGame: { type: GameSessionSchema, default: null },
  settings: { type: RoomSettingsSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now, expires: 86400 } // TTL 24 hours
});

export const Room: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
