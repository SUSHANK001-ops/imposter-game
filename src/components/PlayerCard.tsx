'use client';

import React from 'react';
import { Crown, UserX, Check, ShieldAlert, MessageSquare, Clock } from 'lucide-react';
import { IPlayer, IClue } from '@/models/Room';

interface PlayerCardProps {
  player: IPlayer;
  isCurrentPlayer: boolean;
  isHostUser: boolean;
  isVotingPhase?: boolean;
  isTurnPhase?: boolean;
  isTurnPlayer?: boolean;
  isEliminated?: boolean;
  turnTimeLeft?: number;
  clue?: IClue;
  voteCount?: number;
  isSelectedForVote?: boolean;
  onSelectVote?: (targetPlayerId: string) => void;
  onKickPlayer?: (targetPlayerId: string) => void;
  gameStatus?: 'waiting' | 'playing' | 'ended';
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentPlayer,
  isHostUser,
  isVotingPhase,
  isTurnPhase,
  isTurnPlayer,
  isEliminated,
  turnTimeLeft,
  clue,
  voteCount = 0,
  isSelectedForVote,
  onSelectVote,
  onKickPlayer,
  gameStatus
}) => {
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-600 to-indigo-800',
      'from-red-600 to-rose-800',
      'from-slate-700 to-slate-900',
      'from-sky-500 to-blue-700',
      'from-crimson-600 to-red-800',
      'from-blue-700 to-slate-900'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  const initials = player.name.substring(0, 2).toUpperCase();

  return (
    <div
      onClick={() => {
        if (isVotingPhase && !isCurrentPlayer && !isEliminated && onSelectVote) {
          onSelectVote(player.playerId);
        }
      }}
      className={`relative glass-card rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
        isEliminated
          ? 'border border-slate-800 bg-slate-950/80 opacity-60 grayscale-[30%]'
          : isTurnPlayer
          ? 'border-2 border-red-500 bg-red-950/20 shadow-xl neon-border-red transform scale-[1.01]'
          : isSelectedForVote
          ? 'border-2 border-red-500 bg-red-950/40 neon-border-red transform scale-[1.02]'
          : isVotingPhase && !isCurrentPlayer
          ? 'cursor-pointer hover:border-blue-500/70 hover:bg-blue-900/20 hover:scale-[1.01]'
          : 'border border-blue-900/30'
      }`}
    >
      {/* Top Badges */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isEliminated && (
            <span className="text-[10px] font-extrabold uppercase bg-red-950 text-red-400 border border-red-800 px-2.5 py-0.5 rounded-full">
              ☠️ ELIMINATED
            </span>
          )}
          {player.isAdmin && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-600/30 text-blue-200 border border-blue-400/40 px-2 py-0.5 rounded-full">
              <Crown className="w-3 h-3 text-amber-400" /> Host
            </span>
          )}
          {isCurrentPlayer && (
            <span className="text-[10px] font-semibold bg-slate-800 text-white border border-slate-600 px-2 py-0.5 rounded-full">
              You
            </span>
          )}
          {isTurnPlayer && !isEliminated && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-red-600 text-white px-2.5 py-0.5 rounded-full animate-pulse">
              <Clock className="w-3 h-3" /> Giving Clue ({turnTimeLeft}s)
            </span>
          )}
        </div>

        {/* Kick Button */}
        {isHostUser && !isCurrentPlayer && gameStatus === 'waiting' && onKickPlayer && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onKickPlayer(player.playerId);
            }}
            title="Kick Player"
            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-950/50 p-1 rounded-lg transition-all"
          >
            <UserX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Avatar & Name */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarColor(player.name)} flex items-center justify-center text-white font-bold text-base shadow-lg border border-white/20`}>
            {initials}
          </div>
          <div
            className={`w-3.5 h-3.5 rounded-full border-2 border-slate-950 absolute -bottom-0.5 -right-0.5 ${
              player.isConnected ? 'bg-emerald-500' : 'bg-slate-600'
            }`}
            title={player.isConnected ? 'Online' : 'Disconnected'}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{player.name}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span>Score: <strong className="text-blue-300">{player.score}</strong></span>
          </div>
        </div>
      </div>

      {/* Submitted Clue Box Display */}
      <div className="mt-3 bg-slate-950/70 border border-blue-900/50 rounded-xl p-2.5 min-h-[44px] flex items-center gap-2">
        <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Submitted Word/Clue:</span>
          <p className="text-xs font-bold text-white truncate">
            {clue ? `"${clue.text}"` : isEliminated ? 'Eliminated' : isTurnPlayer ? 'Typing word...' : 'Waiting for turn...'}
          </p>
        </div>
      </div>

      {/* Voting Phase Actions & Indicators */}
      {isVotingPhase && (
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Votes: <strong className="text-white font-bold">{voteCount}</strong></span>
          </div>

          {!isCurrentPlayer && !isEliminated ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectVote) onSelectVote(player.playerId);
              }}
              className={`text-xs px-3 py-1 rounded-xl font-medium transition-all ${
                isSelectedForVote
                  ? 'bg-red-600 text-white shadow-lg font-bold'
                  : 'bg-blue-900/40 text-blue-200 border border-blue-700/50 hover:bg-blue-600 hover:text-white'
              }`}
            >
              {isSelectedForVote ? '✓ Your Vote' : 'Vote Suspect'}
            </button>
          ) : isEliminated ? (
            <span className="text-[10px] text-red-400 italic">Eliminated</span>
          ) : (
            <span className="text-[10px] text-slate-500 italic">Cannot vote for yourself</span>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
};
