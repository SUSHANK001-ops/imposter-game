'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ghost, Users, Sparkles, BookOpen, Shield, ArrowRight, Play } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { getPlayerId, getSavedName, saveName } from '@/lib/playerIdentity';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setName(getSavedName());
  }, []);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a display name!');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    saveName(name.trim());
    const playerId = getPlayerId();
    const socket = getSocket();

    socket.emit('room:create', { name: name.trim(), playerId }, (res: any) => {
      setLoading(false);
      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res?.roomCode) {
        router.push(`/room/${res.roomCode}`);
      }
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a display name!');
      return;
    }
    if (!roomCodeInput.trim() || roomCodeInput.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-character room code!');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    saveName(name.trim());
    const playerId = getPlayerId();
    const socket = getSocket();
    const code = roomCodeInput.trim().toUpperCase();

    socket.emit('room:join', { roomCode: code, name: name.trim(), playerId }, (res: any) => {
      setLoading(false);
      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res?.roomCode) {
        router.push(`/room/${res.roomCode}`);
      }
    });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-8 relative bg-radial-glow">
      {/* Decorative Red & Blue Glowing Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-red-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center items-center py-8 z-10">
        {/* Title Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-600 via-blue-600 to-slate-900 flex items-center justify-center border-2 border-white/20 shadow-2xl neon-border-blue mb-4 transform hover:rotate-3 transition-transform">
            <Ghost className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white flex items-center gap-2">
            IMPOSTER <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-white to-blue-500">GAME</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-md">
            The ultimate social deduction game! Question your friends, blend in, and unmask the imposter.
          </p>
        </div>

        {/* Card Form */}
        <div className="w-full glass-panel rounded-3xl p-6 sm:p-8 border border-blue-900/40 shadow-2xl relative">
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Create Room
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'join'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" /> Join Room
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-800/60 rounded-xl text-red-300 text-xs font-medium text-center animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {activeTab === 'create' ? (
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-blue-300 mb-1.5 block">Your Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Detective Holmes"
                  maxLength={20}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 group transform active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? 'Creating Room...' : 'Create Lobby & Get Code'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-blue-300 mb-1.5 block">Your Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Secret Agent"
                  maxLength={20}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-blue-300 mb-1.5 block">6-Character Room Code</label>
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. X7K2P9"
                  maxLength={6}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-white uppercase placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold py-3.5 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 group transform active:scale-95 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{loading ? 'Joining Room...' : 'Join Game Room'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-3 w-full mt-8">
          <div className="glass-card p-3 rounded-2xl flex flex-col items-center text-center">
            <BookOpen className="w-5 h-5 text-blue-400 mb-1" />
            <h4 className="text-xs font-bold text-white">1280+ Words</h4>
            <p className="text-[10px] text-slate-400">16 Categories</p>
          </div>
          <div className="glass-card p-3 rounded-2xl flex flex-col items-center text-center">
            <Users className="w-5 h-5 text-red-400 mb-1" />
            <h4 className="text-xs font-bold text-white">3-12 Players</h4>
            <p className="text-[10px] text-slate-400">Turn clue rounds</p>
          </div>
          <div className="glass-card p-3 rounded-2xl flex flex-col items-center text-center">
            <Shield className="w-5 h-5 text-sky-400 mb-1" />
            <h4 className="text-xs font-bold text-white">Instant Play</h4>
            <p className="text-[10px] text-slate-400">No Signup</p>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-500 py-4 border-t border-slate-900 w-full max-w-4xl">
        Imposter Multiplayer Game MVP &bull; Red, White & Blue Edition
      </footer>
    </main>
  );
}
