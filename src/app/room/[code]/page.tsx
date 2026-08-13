'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { 
  Ghost, Copy, Check, Play, Settings, BookOpen, Clock, 
  Eye, EyeOff, Shield, ShieldAlert, Award, RotateCcw, LogOut, Flame
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { getPlayerId, getSavedName } from '@/lib/playerIdentity';
import { Chat } from '@/components/Chat';
import { PlayerCard } from '@/components/PlayerCard';
import { WordBankModal } from '@/components/WordBankModal';
import { SettingsModal } from '@/components/SettingsModal';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.code as string)?.toUpperCase();

  const [room, setRoom] = useState<any>(null);
  const [secretData, setSecretData] = useState<{
    role: 'CREW' | 'IMPOSTER';
    category: string;
    word: string;
    imposterHint?: string;
  } | null>(null);

  const [isWordHidden, setIsWordHidden] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedVotePlayerId, setSelectedVotePlayerId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const [isWordBankOpen, setIsWordBankOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const socket = getSocket();
  const playerId = getPlayerId();
  const playerName = getSavedName();

  useEffect(() => {
    if (!roomCode) return;

    if (!playerName) {
      // If name missing, redirect to home to enter display name
      router.push('/');
      return;
    }

    // Connect / Reconnect socket
    socket.emit('player:reconnect', { roomCode, playerId, name: playerName }, (res: any) => {
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        if (res.room) setRoom(res.room);
        if (res.secretData) setSecretData(res.secretData);
      }
    });

    // Listeners
    socket.on('room:updated', (updatedRoom: any) => {
      setRoom(updatedRoom);
      if (updatedRoom.status === 'waiting') {
        setSecretData(null);
        setHasVoted(false);
        setSelectedVotePlayerId(null);
      }
    });

    socket.on('game:started', (secretPayload: any) => {
      setSecretData(secretPayload);
      setHasVoted(false);
      setSelectedVotePlayerId(null);
    });

    socket.on('game:timerTick', ({ timeLeft }: { timeLeft: number }) => {
      setRoom((prev: any) => {
        if (!prev || !prev.currentGame) return prev;
        return {
          ...prev,
          currentGame: { ...prev.currentGame, timeLeft }
        };
      });
    });

    socket.on('game:phaseChanged', ({ phase }: { phase: string }) => {
      setRoom((prev: any) => {
        if (!prev || !prev.currentGame) return prev;
        return {
          ...prev,
          currentGame: { ...prev.currentGame, phase }
        };
      });
    });

    socket.on('game:results', (results: any) => {
      setRoom((prev: any) => ({
        ...prev,
        status: 'ended',
        currentGame: {
          ...prev.currentGame,
          phase: 'results',
          winner: results.winner,
          winnerText: results.winnerText,
          realWord: results.realWord,
          imposterPlayerIds: results.imposterPlayerIds,
          votes: results.votes
        },
        players: results.players || prev.players
      }));

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Fallback
      }
    });

    return () => {
      socket.off('room:updated');
      socket.off('game:started');
      socket.off('game:timerTick');
      socket.off('game:phaseChanged');
      socket.off('game:results');
    };
  }, [roomCode, playerId, playerName, router, socket]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleStartGame = () => {
    socket.emit('game:start', { roomCode }, (res: any) => {
      if (res?.error) setErrorMsg(res.error);
    });
  };

  const handleCastVote = () => {
    if (!selectedVotePlayerId) return;
    socket.emit('game:vote', { roomCode, targetPlayerId: selectedVotePlayerId, voterPlayerId: playerId }, (res: any) => {
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setHasVoted(true);
      }
    });
  };

  const handlePlayAgain = () => {
    socket.emit('game:playAgain', { roomCode }, (res: any) => {
      if (res?.error) setErrorMsg(res.error);
    });
  };

  const handleKickPlayer = (targetPlayerId: string) => {
    socket.emit('room:kick', { roomCode, targetPlayerId });
  };

  const isHost = room?.adminPlayerId === playerId;
  const connectedPlayers = room?.players?.filter((p: any) => p.isConnected) || [];

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Ghost className="w-12 h-12 text-purple-500 animate-bounce mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Connecting to Room {roomCode}...</h2>
        <p className="text-slate-400 text-sm">{errorMsg || 'Synchronizing multiplayer state...'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-4">
      {/* Modals */}
      <WordBankModal
        isOpen={isWordBankOpen}
        onClose={() => setIsWordBankOpen(false)}
        roomCode={roomCode}
        customWordsCount={room.customWordsCount || 0}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        roomCode={roomCode}
        currentSettings={room.settings}
      />

      {/* Top Header Navigation Bar */}
      <header className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-purple-900/40">
        <div className="flex items-center gap-3">
          <div
            onClick={() => router.push('/')}
            className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 cursor-pointer hover:bg-purple-600/50 transition-colors"
          >
            <Ghost className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ROOM CODE</span>
              <button
                onClick={copyRoomCode}
                className="flex items-center gap-1 bg-purple-950/80 border border-purple-800/50 hover:border-purple-500 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold text-purple-200 transition-colors"
              >
                <span>{roomCode}</span>
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Connected as <strong className="text-purple-300">{playerName}</strong></p>
          </div>
        </div>

        {/* Phase / Timer Info */}
        <div className="flex items-center gap-3">
          {room.currentGame && (
            <div className="flex items-center gap-2 bg-slate-900/80 border border-purple-900/60 px-4 py-2 rounded-xl">
              <Clock className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-300 uppercase">{room.currentGame.phase}:</span>
              <span className="text-sm font-mono font-bold text-amber-400">
                {Math.floor((room.currentGame.timeLeft || 0) / 60)}:
                {((room.currentGame.timeLeft || 0) % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}

          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 px-3 py-2 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>
      </header>

      {errorMsg && (
        <div className="p-3 bg-red-950/80 border border-red-800/60 rounded-xl text-red-300 text-xs font-medium text-center">
          {errorMsg}
        </div>
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        
        {/* Left 2 Columns: Main Game / Lobby View */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          
          {/* LOBBY PHASE VIEW */}
          {room.status === 'waiting' && (
            <div className="glass-panel rounded-2xl p-6 border border-purple-900/40 space-y-6 flex-1 flex flex-col justify-between">
              
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-purple-950">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      Lobby Waiting Area
                      <span className="text-xs font-normal bg-purple-900/50 text-purple-300 border border-purple-700/40 px-2.5 py-0.5 rounded-full">
                        {connectedPlayers.length} / {room.settings.maxPlayers} Players
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Share room code <strong className="text-purple-300">{roomCode}</strong> with friends to join.</p>
                  </div>

                  {isHost && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-purple-900/60 text-purple-200 px-3 py-2 rounded-xl transition-all"
                      >
                        <Settings className="w-4 h-4 text-purple-400" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => setIsWordBankOpen(true)}
                        className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-purple-900/60 text-purple-200 px-3 py-2 rounded-xl transition-all"
                      >
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        <span>Word Bank</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Player Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {room.players.map((p: any) => (
                    <PlayerCard
                      key={p.playerId}
                      player={p}
                      isCurrentPlayer={p.playerId === playerId}
                      isHostUser={isHost}
                      onKickPlayer={handleKickPlayer}
                      gameStatus="waiting"
                    />
                  ))}
                </div>
              </div>

              {/* Lobby Footer Action */}
              <div className="pt-4 border-t border-purple-950 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  {isHost ? (
                    <span className="text-purple-300 font-medium">As Host, click Start Game when everyone is ready.</span>
                  ) : (
                    <span>Waiting for Host to start the round...</span>
                  )}
                </div>

                {isHost && (
                  <button
                    onClick={handleStartGame}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>Start Game Round</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* PLAYING PHASE VIEW (DISCUSSION & VOTING) */}
          {room.status === 'playing' && secretData && (
            <div className="glass-panel rounded-2xl p-6 border border-purple-900/40 space-y-6 flex-1 flex flex-col">
              
              {/* Secret Word & Role Card */}
              <div className={`p-6 rounded-2xl border transition-all relative overflow-hidden ${
                secretData.role === 'IMPOSTER'
                  ? 'bg-gradient-to-br from-red-950/60 via-slate-950 to-slate-950 border-red-900/60 neon-border-red'
                  : 'bg-gradient-to-br from-blue-950/60 via-slate-950 to-slate-950 border-blue-900/60 neon-border-blue'
              }`}>
                {/* Privacy Peek Button */}
                <button
                  onClick={() => setIsWordHidden(!isWordHidden)}
                  className="absolute top-4 right-4 text-xs text-slate-400 hover:text-white bg-slate-900/80 border border-slate-700/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors z-10"
                >
                  {isWordHidden ? <Eye className="w-4 h-4 text-purple-400" /> : <EyeOff className="w-4 h-4 text-purple-400" />}
                  <span>{isWordHidden ? 'Peek Secret' : 'Hide Screen'}</span>
                </button>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                    secretData.role === 'IMPOSTER'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}>
                    YOUR ROLE: {secretData.role}
                  </span>
                  <span className="text-xs bg-slate-900/80 text-purple-300 border border-purple-800/40 px-3 py-1 rounded-full">
                    Category: <strong>{secretData.category}</strong>
                  </span>
                </div>

                {/* Main Word Display */}
                <div className="my-4 text-center py-4">
                  {isWordHidden ? (
                    <div className="text-2xl font-mono font-bold text-slate-500 tracking-widest">
                      ••••••••••••••
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide">
                        {secretData.word}
                      </div>
                      {secretData.imposterHint && (
                        <p className="text-xs text-amber-300 mt-2 italic bg-amber-950/40 border border-amber-800/40 p-2 rounded-lg inline-block">
                          {secretData.imposterHint}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 text-center">
                  {secretData.role === 'CREW'
                    ? 'Ask subtle questions to identify who does NOT know the real word!'
                    : 'Blend in! Figure out the secret word from their questions without getting caught!'}
                </p>
              </div>

              {/* Voting Phase Section */}
              {room.currentGame?.phase === 'voting' && (
                <div className="space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-400" />
                        Voting Phase
                      </h3>
                      <p className="text-xs text-slate-400">Select the player you suspect is the Imposter.</p>
                    </div>

                    {hasVoted && (
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full">
                        ✓ Vote Registered
                      </span>
                    )}
                  </div>

                  {/* Player Voting Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {room.players.map((p: any) => (
                      <PlayerCard
                        key={p.playerId}
                        player={p}
                        isCurrentPlayer={p.playerId === playerId}
                        isHostUser={isHost}
                        isVotingPhase={true}
                        hasVoted={room.currentGame?.votes?.some((v: any) => v.voterPlayerId === p.playerId)}
                        isSelectedForVote={selectedVotePlayerId === p.playerId}
                        onSelectVote={(targetId) => setSelectedVotePlayerId(targetId)}
                      />
                    ))}
                  </div>

                  {!hasVoted && (
                    <button
                      onClick={handleCastVote}
                      disabled={!selectedVotePlayerId}
                      className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Confirm Suspect Vote</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* RESULTS PHASE VIEW */}
          {room.status === 'ended' && room.currentGame && (
            <div className="glass-panel rounded-2xl p-6 border border-purple-900/40 space-y-6 flex-1 flex flex-col justify-between">
              
              {/* Winner Banner */}
              <div className={`p-6 rounded-2xl text-center border shadow-2xl ${
                room.currentGame.winner === 'crew'
                  ? 'bg-gradient-to-br from-blue-950 via-slate-950 to-slate-950 border-blue-500/60 neon-border-blue'
                  : room.currentGame.winner === 'imposter'
                  ? 'bg-gradient-to-br from-red-950 via-slate-950 to-slate-950 border-red-500/60 neon-border-red'
                  : 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 border-purple-800'
              }`}>
                <Award className="w-12 h-12 mx-auto mb-2 text-amber-400 animate-bounce" />
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {room.currentGame.winnerText}
                </h2>
                <div className="mt-4 inline-flex items-center gap-3 bg-slate-900/80 border border-purple-800/50 px-4 py-2 rounded-xl text-xs">
                  <span className="text-slate-400">Secret Word was:</span>
                  <strong className="text-purple-300 font-bold text-sm">{room.currentGame.realWord}</strong>
                </div>
              </div>

              {/* Scoreboard List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" /> Room Scoreboard
                </h3>
                <div className="space-y-2">
                  {room.players
                    .sort((a: any, b: any) => b.score - a.score)
                    .map((p: any, idx: number) => {
                      const isImposter = room.currentGame?.imposterPlayerIds?.includes(p.playerId);
                      return (
                        <div key={p.playerId} className="flex items-center justify-between bg-slate-950/60 border border-purple-950 p-3 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-purple-400 w-5">#{idx + 1}</span>
                            <span className="text-sm font-semibold text-white">{p.name}</span>
                            {isImposter && (
                              <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded-full font-bold">
                                IMPOSTER
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-amber-300">{p.score} pts</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Results Action Footer */}
              <div className="pt-4 border-t border-purple-950 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={() => router.push('/')}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs px-5 py-3 rounded-xl border border-slate-700 transition-colors"
                >
                  Leave Room
                </button>

                {isHost && (
                  <button
                    onClick={handlePlayAgain}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Play Again (Same Room)</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Column: Real-Time Chat Drawer */}
        <div className="lg:col-span-1 h-[500px] lg:h-auto">
          <Chat roomCode={roomCode} playerName={playerName} />
        </div>

      </div>
    </div>
  );
}
