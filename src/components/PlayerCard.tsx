'use client';

import React from 'react';
import { Crown, UserX, Check, ShieldAlert } from 'lucide-react';
import { IPlayer } from '@/models/Room';

interface PlayerCardProps {
  player: IPlayer;
  isCurrentPlayer: boolean;
  isHostUser: boolean;
  isVotingPhase?: boolean;
  hasVoted?: boolean;
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
  hasVoted,
  isSelectedForVote,
  onSelectVote,
  onKickPlayer,
  gameStatus
}) => {
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-purple-500 to-indigo-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-violet-500 to-purple-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  const initials = player.name.substring(0, 2).toUpperCase();

  return (
    <div
      onClick={() => {
        if (isVotingPhase && !isCurrentPlayer && onSelectVote) {
          onSelectVote(player.playerId);
        }
      }}
      className={`relative glass-card rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
        isSelectedForVote
          ? 'border-2 border-red-500 bg-red-950/30 neon-border-red transform scale-[1.02]'
          : isVotingPhase && !isCurrentPlayer
          ? 'cursor-pointer hover:border-purple-500/70 hover:bg-purple-900/20 hover:scale-[1.01]'
          : 'border border-purple-900/30'
      }`}
    >
      {/* Top badges */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {player.isAdmin && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
              <Crown className="w-3 h-3 text-amber-400" /> Host
            </span>
          )}
          {isCurrentPlayer && (
            <span className="text-[10px] font-semibold bg-purple-600/30 text-purple-200 border border-purple-500/40 px-2 py-0.5 rounded-full">
              You
            </span>
          )}
        </div>

        {/* Kick Button (Host only during lobby) */}
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

      {/* Main Avatar + Info */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarColor(player.name)} flex items-center justify-center text-white font-bold text-base shadow-lg border border-white/10`}>
            {initials}
          </div>
          {/* Status Indicator */}
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
            <span>Score: <strong className="text-purple-300">{player.score}</strong></span>
          </div>
        </div>
      </div>

      {/* Voting Phase Actions / Badges */}
      {isVotingPhase && (
        <div className="mt-3 pt-2.5 border-t border-purple-900/40 flex items-center justify-between">
          {hasVoted ? (
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Voted
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Thinking...
            </span>
          )}

          {!isCurrentPlayer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectVote) onSelectVote(player.playerId);
              }}
              className={`text-xs px-3 py-1 rounded-xl font-medium transition-all ${
                isSelectedForVote
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-purple-900/40 text-purple-200 border border-purple-700/50 hover:bg-purple-600 hover:text-white'
              }`}
            >
              {isSelectedForVote ? 'Selected' : 'Vote Suspect'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
