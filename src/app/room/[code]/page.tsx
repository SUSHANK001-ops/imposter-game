'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { 
  Ghost, Copy, Check, Play, Settings, BookOpen, Clock, 
  Eye, EyeOff, ShieldAlert, Award, RotateCcw, LogOut, Flame, Send, MessageSquare
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { getPlayerId, getSavedName } from '@/lib/playerIdentity';
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
  const [clueInput, setClueInput] = useState('');
  const [submittingClue, setSubmittingClue] = useState(false);

  const [imposterGuessInput, setImposterGuessInput] = useState('');
  const [submittingGuess, setSubmittingGuess] = useState(false);

  const [isWordBankOpen, setIsWordBankOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'info' | 'success' | 'warning' | 'error'; message: string }>>([]);

  const addToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev.slice(-3), { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const socket = getSocket();
  const playerId = getPlayerId();
  const playerName = getSavedName();

  useEffect(() => {
    if (!roomCode) return;

    if (!playerName) {
      router.push('/');
      return;
    }

    socket.emit('player:reconnect', { roomCode, playerId, name: playerName }, (res: any) => {
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        if (res.room) setRoom(res.room);
        if (res.secretData) setSecretData(res.secretData);
      }
    });

    socket.on('room:updated', (updatedRoom: any) => {
      setRoom(updatedRoom);

      if (updatedRoom.currentGame?.votes) {
        const myVote = updatedRoom.currentGame.votes.find((v: any) => v.voterPlayerId === playerId);
        if (myVote) {
          setSelectedVotePlayerId(myVote.targetPlayerId);
        }
      }

      if (updatedRoom.status === 'waiting') {
        setSecretData(null);
        setSelectedVotePlayerId(null);
        setClueInput('');
      }
    });

    socket.on('game:started', (secretPayload: any) => {
      setSecretData(secretPayload);
      setSelectedVotePlayerId(null);
      setClueInput('');
      addToast('🎮 Game Started! Check your secret role & word.', 'success');
    });

    socket.on('game:toast', ({ type, message }: { type: 'info' | 'success' | 'warning' | 'error'; message: string }) => {
      addToast(message, type);
    });

    socket.on('game:timerTick', ({ phase, turnTimeLeft, currentTurnPlayerId }: any) => {
      setRoom((prev: any) => {
        if (!prev || !prev.currentGame) return prev;
        return {
          ...prev,
          currentGame: { 
            ...prev.currentGame, 
            phase, 
            turnTimeLeft, 
            currentTurnPlayerId: currentTurnPlayerId !== undefined ? currentTurnPlayerId : prev.currentGame.currentTurnPlayerId 
          }
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
      if (phase === 'voting') {
        addToast('🗳️ Voting Phase Started! Select a suspect card to vote.', 'warning');
      } else if (phase === 'discussing') {
        addToast('🗣️ Turn Clue Round Started! Give your clue when ready.', 'info');
      }
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
      addToast(`🏆 Game Over! ${results.winnerText}`, 'success');

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
      socket.off('game:toast');
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
    setErrorMsg('');
    socket.emit('game:start', { roomCode }, (res: any) => {
      if (res?.error) setErrorMsg(res.error);
    });
  };

  const handleSubmitClue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueInput.trim()) return;
    setSubmittingClue(true);
    setErrorMsg('');

    socket.emit('clue:submit', { roomCode, playerId, text: clueInput.trim() }, (res: any) => {
      setSubmittingClue(false);
      if (res?.error) {
        setErrorMsg(res.error);
        addToast(`⚠️ ${res.error}`, 'error');
      } else {
        addToast(`✅ Clue submitted: "${clueInput.trim()}"`, 'success');
        setClueInput('');
      }
    });
  };

  const handleInstantVote = (targetPlayerId: string) => {
    setSelectedVotePlayerId(targetPlayerId);
    const targetPlayer = room?.players?.find((p: any) => p.playerId === targetPlayerId);
    const targetName = targetPlayer ? targetPlayer.name : 'Player';

    socket.emit('game:vote', { roomCode, targetPlayerId, voterPlayerId: playerId }, (res: any) => {
      if (res?.error) {
        setErrorMsg(res.error);
        addToast(`⚠️ ${res.error}`, 'error');
      } else {
        if (res?.allVoted) {
          addToast(`⚡ All players voted! Ending voting round immediately...`, 'warning');
        } else {
          addToast(`🗳️ Vote recorded for ${targetName}!`, 'info');
        }
      }
    });
  };

  const handleImposterGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imposterGuessInput.trim()) return;
    setSubmittingGuess(true);

    socket.emit('imposter:guessWord', { roomCode, playerId, guess: imposterGuessInput.trim() }, (res: any) => {
      setSubmittingGuess(false);
      if (res?.error) {
        addToast(`❌ ${res.error}`, 'error');
      } else if (res?.correct) {
        addToast('🎉 CORRECT GUESS! Imposter Wins!', 'success');
        setImposterGuessInput('');
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
  const isMyTurn = room?.currentGame?.phase === 'discussing' && room?.currentGame?.currentTurnPlayerId === playerId;
  const currentTurnPlayer = room?.players?.find((p: any) => p.playerId === room?.currentGame?.currentTurnPlayerId);

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950">
        <Ghost className="w-12 h-12 text-blue-500 animate-bounce mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Connecting to Room {roomCode}...</h2>
        <p className="text-slate-400 text-sm">{errorMsg || 'Synchronizing multiplayer state...'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-4 bg-slate-950 relative">
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border text-xs font-semibold shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
              toast.type === 'success'
                ? 'bg-emerald-950 border-emerald-700 text-emerald-200'
                : toast.type === 'warning'
                ? 'bg-amber-950 border-amber-700 text-amber-200'
                : toast.type === 'error'
                ? 'bg-red-950 border-red-700 text-red-200'
                : 'bg-blue-950 border-blue-700 text-blue-200'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

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

      {/* Header Bar */}
      <header className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-blue-900">
        <div className="flex items-center gap-3">
          <div
            onClick={() => router.push('/')}
            className="w-10 h-10 rounded-xl bg-blue-600 border border-blue-500 flex items-center justify-center text-white cursor-pointer hover:bg-blue-500 transition-colors"
          >
            <Ghost className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ROOM CODE</span>
              <button
                onClick={copyRoomCode}
                className="flex items-center gap-1 bg-slate-900 border border-blue-800 hover:border-blue-500 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold text-blue-200 transition-colors"
              >
                <span>{roomCode}</span>
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Connected as <strong className="text-blue-300">{playerName}</strong></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {room.currentGame && (
            <div className="flex items-center gap-2 bg-slate-900 border border-blue-900 px-4 py-2 rounded-xl">
              <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-300 uppercase">{room.currentGame.phase}:</span>
              <span className="text-sm font-mono font-bold text-amber-400">
                {room.currentGame.turnTimeLeft || 0}s
              </span>
            </div>
          )}

          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>
      </header>

      {errorMsg && (
        <div className="p-3 bg-red-950 border border-red-800 rounded-xl text-red-300 text-xs font-medium text-center">
          {errorMsg}
        </div>
      )}

      {/* Main Content Area */}
      <div className="space-y-4">
        
        {/* LOBBY PHASE VIEW */}
        {room.status === 'waiting' && (
          <div className="glass-panel rounded-2xl p-6 border border-blue-900 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Lobby Waiting Area
                  <span className="text-xs font-normal bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-0.5 rounded-full">
                    {connectedPlayers.length} / {room.settings.maxPlayers || 20} Players (Min 3 to start)
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Share room code <strong className="text-blue-300">{roomCode}</strong> with friends to join.</p>
              </div>

              {isHost && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-blue-900 text-blue-200 px-3 py-2 rounded-xl transition-all"
                  >
                    <Settings className="w-4 h-4 text-blue-400" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => setIsWordBankOpen(true)}
                    className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-blue-900 text-blue-200 px-3 py-2 rounded-xl transition-all"
                  >
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>Word Bank</span>
                  </button>
                </div>
              )}
            </div>

            {/* Player Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {/* Lobby Footer Action */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                {connectedPlayers.length < 3 ? (
                  <span className="text-amber-400 font-medium">Need at least 3 players to start the game ({connectedPlayers.length}/3).</span>
                ) : isHost ? (
                  <span className="text-blue-300 font-medium">As Host, click Start Game when everyone is ready.</span>
                ) : (
                  <span>Waiting for Host to start the round...</span>
                )}
              </div>

              {isHost && (
                <button
                  onClick={handleStartGame}
                  disabled={connectedPlayers.length < 3}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold px-8 py-3.5 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-95 shrink-0"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Start Game Round</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* PLAYING PHASE VIEW (TURN CLUES & VOTING) */}
        {room.status === 'playing' && secretData && (
          <div className="glass-panel rounded-2xl p-6 border border-blue-900 space-y-6">
            
            {/* Secret Word & Role Card (Solid Navy/Red) */}
            <div className={`p-6 rounded-2xl border transition-all relative overflow-hidden ${
              isWordHidden 
                ? 'bg-slate-900 border-slate-800'
                : secretData.role === 'IMPOSTER'
                ? 'bg-red-950 border-red-800'
                : 'bg-blue-950 border-blue-800'
            }`}>
              <button
                onClick={() => setIsWordHidden(!isWordHidden)}
                className="absolute top-4 right-4 text-xs text-slate-300 hover:text-white bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors z-10 shadow-md"
              >
                {isWordHidden ? <Eye className="w-4 h-4 text-blue-400" /> : <EyeOff className="w-4 h-4 text-blue-400" />}
                <span>{isWordHidden ? 'Peek Role & Secret' : 'Hide Screen'}</span>
              </button>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {isWordHidden ? (
                  <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    YOUR ROLE: ••••••••
                  </span>
                ) : (
                  <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                    secretData.role === 'IMPOSTER'
                      ? 'bg-red-600 text-white border-red-500'
                      : 'bg-blue-600 text-white border-blue-500'
                  }`}>
                    YOUR ROLE: {secretData.role}
                  </span>
                )}

                <span className="text-xs bg-slate-900 text-blue-300 border border-blue-800 px-3 py-1 rounded-full">
                  Category: <strong>{isWordHidden ? '••••••••' : secretData.category}</strong>
                </span>
              </div>

              <div className="my-3 text-center py-2">
                {isWordHidden ? (
                  <div className="text-2xl font-mono font-bold text-slate-500 tracking-widest py-2">
                    ••••••••••••••
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide">
                      {secretData.word}
                    </div>
                    {secretData.imposterHint && (
                      <p className="text-xs text-amber-300 mt-2 italic bg-amber-950 border border-amber-800 p-2 rounded-lg inline-block">
                        {secretData.imposterHint}
                      </p>
                    )}

                    {/* Imposter Word Guess UI */}
                    {secretData.role === 'IMPOSTER' && (
                      <div className="mt-4 pt-4 border-t border-red-800/60 text-left max-w-md mx-auto">
                        <label className="text-xs font-bold text-red-200 block mb-1.5 flex items-center gap-1.5">
                          <span>🎯 Know the Secret Word? Guess to Win Instantly!</span>
                        </label>
                        <form onSubmit={handleImposterGuessSubmit} className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={imposterGuessInput}
                            onChange={(e) => setImposterGuessInput(e.target.value)}
                            placeholder="Type exact secret word..."
                            className="w-full sm:flex-1 bg-slate-900 border border-red-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                          />
                          <button
                            type="submit"
                            disabled={submittingGuess || !imposterGuessInput.trim()}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shrink-0"
                          >
                            {submittingGuess ? 'Guessing...' : 'Guess & Win'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* TURN CLUE SUBMISSION BANNER & FORM */}
            {room.currentGame?.phase === 'discussing' && (
              <div className="bg-slate-950 border border-blue-900 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-red-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-white">
                      Turn Clue Round: <span className="text-red-400">{currentTurnPlayer ? currentTurnPlayer.name : 'Player'}&apos;s Turn</span>
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-300 bg-blue-950 border border-blue-800 px-3 py-1 rounded-full">
                    {room.currentGame?.turnTimeLeft || 20}s Remaining
                  </span>
                </div>

                {isMyTurn ? (
                  <form onSubmit={handleSubmitClue} className="flex flex-col sm:flex-row gap-2 w-full">
                    <input
                      type="text"
                      value={clueInput}
                      onChange={(e) => setClueInput(e.target.value)}
                      placeholder="Type a 1-word clue (must be unique)..."
                      className="w-full sm:flex-1 bg-slate-900 border border-blue-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={submittingClue || !clueInput.trim()}
                      className="w-full sm:w-auto bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Word</span>
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Waiting for {currentTurnPlayer ? currentTurnPlayer.name : 'current player'} to submit their clue ({room.currentGame?.turnTimeLeft || 20}s)...
                  </p>
                )}
              </div>
            )}

            {/* VOTING PHASE BANNER */}
            {room.currentGame?.phase === 'voting' && (
              <div className="bg-red-950 border border-red-800 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Live Voting Phase</h3>
                    <p className="text-xs text-slate-400">Tap any player card below to cast or change your vote instantly!</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-red-300 bg-slate-950 border border-red-800 px-3 py-1 rounded-full">
                  {room.currentGame?.turnTimeLeft || 60}s
                </span>
              </div>
            )}

            {/* PLAYER CARDS GRID WITH SUBMITTED CLUES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {room.players.map((p: any) => {
                const playerClue = room.currentGame?.clues?.find((c: any) => c.playerId === p.playerId);
                const voteCount = room.currentGame?.votes?.filter((v: any) => v.targetPlayerId === p.playerId).length || 0;
                const isTurnPlayer = room.currentGame?.phase === 'discussing' && room.currentGame?.currentTurnPlayerId === p.playerId;

                return (
                  <PlayerCard
                    key={p.playerId}
                    player={p}
                    isCurrentPlayer={p.playerId === playerId}
                    isHostUser={isHost}
                    isVotingPhase={room.currentGame?.phase === 'voting'}
                    isTurnPhase={room.currentGame?.phase === 'discussing'}
                    isTurnPlayer={isTurnPlayer}
                    turnTimeLeft={room.currentGame?.turnTimeLeft}
                    clue={playerClue}
                    voteCount={voteCount}
                    isSelectedForVote={selectedVotePlayerId === p.playerId}
                    onSelectVote={handleInstantVote}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* RESULTS PHASE VIEW */}
        {room.status === 'ended' && room.currentGame && (
          <div className="glass-panel rounded-2xl p-6 border border-blue-900 space-y-6">
            <div className={`p-6 rounded-2xl text-center border shadow-2xl ${
              room.currentGame.winner === 'crew'
                ? 'bg-blue-950 border-blue-600'
                : room.currentGame.winner === 'imposter'
                ? 'bg-red-950 border-red-600'
                : 'bg-slate-900 border-slate-700'
            }`}>
              <Award className="w-12 h-12 mx-auto mb-2 text-amber-400 animate-bounce" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {room.currentGame.winnerText}
              </h2>
              
              {/* Prominent Secret Word Banner */}
              <div className="mt-5 p-4 bg-slate-900/90 border-2 border-blue-500/70 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-inner">
                <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">The Secret Word Was:</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-amber-300 tracking-wide drop-shadow-md">
                  {room.currentGame.realWord || secretData?.word || 'Unknown'}
                </span>
                {room.currentGame.category && (
                  <span className="text-xs text-blue-300 font-medium">Category: {room.currentGame.category}</span>
                )}
              </div>
            </div>

            {/* Scoreboard */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" /> Room Scoreboard
              </h3>
              <div className="space-y-2">
                {room.players
                  .sort((a: any, b: any) => b.score - a.score)
                  .map((p: any, idx: number) => {
                    const isImposter = room.currentGame?.imposterPlayerIds?.includes(p.playerId);
                    const playerClue = room.currentGame?.clues?.find((c: any) => c.playerId === p.playerId);

                    return (
                      <div key={p.playerId} className="flex flex-wrap items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-blue-400 w-5">#{idx + 1}</span>
                          <span className="text-sm font-semibold text-white">{p.name}</span>
                          {isImposter && (
                            <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded-full font-bold">
                              IMPOSTER
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          {playerClue && (
                            <span className="text-xs text-blue-300 bg-blue-950 border border-blue-800 px-2.5 py-1 rounded-lg">
                              Clue: &ldquo;{playerClue.text}&rdquo;
                            </span>
                          )}
                          <span className="text-sm font-bold text-amber-300">{p.score} pts</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Results Action Footer */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => router.push('/')}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs px-5 py-3 rounded-xl border border-slate-700 transition-colors"
              >
                Leave Room
              </button>

              {isHost && (
                <button
                  onClick={handlePlayAgain}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again (Same Room)</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
