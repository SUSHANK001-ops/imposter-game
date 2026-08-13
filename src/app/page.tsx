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
    <main className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-8 relative">
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Content Container */}
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center items-center py-8 z-10">
        {/* Title Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-slate-900 flex items-center justify-center border-2 border-purple-400/40 shadow-2xl neon-border-purple mb-4 transform hover:rotate-3 transition-transform">
            <Ghost className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white flex items-center gap-2">
            IMPOSTER <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">GAME</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-md">
            The ultimate social deduction game! Question your friends, blend in, and unmask the imposter.
          </p>
        </div>

        {/* Tab Cards */}
        <div className="w-full glass-panel rounded-3xl p-6 sm:p-8 border border-purple-800/40 shadow-2xl relative">
          {/* Tabs header */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/70 rounded-2xl border border-purple-950 mb-6">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'create'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Create New Room
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'join'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" /> Join Existing Room
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-800/60 rounded-xl text-red-300 text-xs font-medium text-center animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          {activeTab === 'create' ? (
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-purple-300 mb-1.5 block">Your Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Detective Holmes"
                  maxLength={20}
                  className="w-full bg-slate-900/90 border border-purple-900/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 group transform active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? 'Creating Room...' : 'Create Lobby & Get Code'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-purple-300 mb-1.5 block">Your Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Secret Agent"
                  maxLength={20}
                  className="w-full bg-slate-900/90 border border-purple-900/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-purple-300 mb-1.5 block">6-Character Room Code</label>
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. X7K2P9"
                  maxLength={6}
                  className="w-full bg-slate-900/90 border border-purple-900/60 rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-white uppercase placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 group transform active:scale-95 disabled:opacity-50"
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
            <BookOpen className="w-5 h-5 text-purple-400 mb-1" />
            <h4 className="text-xs font-bold text-white">1000+ Words</h4>
            <p className="text-[10px] text-slate-400">Across 15+ categories</p>
          </div>
          <div className="glass-card p-3 rounded-2xl flex flex-col items-center text-center">
            <Users className="w-5 h-5 text-indigo-400 mb-1" />
            <h4 className="text-xs font-bold text-white">4-10 Players</h4>
            <p className="text-[10px] text-slate-400">Real-time room chat</p>
          </div>
          <div className="glass-card p-3 rounded-2xl flex flex-col items-center text-center">
            <Shield className="w-5 h-5 text-pink-400 mb-1" />
            <h4 className="text-xs font-bold text-white">No Signup</h4>
            <p className="text-[10px] text-slate-400">Instant jump-in play</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-4 border-t border-purple-950/60 w-full max-w-4xl">
        Imposter Multiplayer Game MVP &bull; Real-time Socket.IO & MongoDB
      </footer>
    </main>
  );
}
