'use client';

import React, { useState } from 'react';
import { X, Settings, Clock, Users, Lightbulb, Save } from 'lucide-react';
import { getSocket } from '@/lib/socket';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  currentSettings: {
    maxPlayers: number;
    discussionTime: number;
    imposterCount: number;
    showImposterHint: boolean;
  };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  currentSettings
}) => {
  const [discussionTime, setDiscussionTime] = useState(currentSettings.discussionTime || 180);
  const [maxPlayers, setMaxPlayers] = useState(currentSettings.maxPlayers || 8);
  const [showImposterHint, setShowImposterHint] = useState(currentSettings.showImposterHint || false);

  if (!isOpen) return null;

  const socket = getSocket();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    socket.emit('room:settingsUpdate', {
      roomCode,
      settings: {
        discussionTime: Number(discussionTime),
        maxPlayers: Number(maxPlayers),
        showImposterHint
      }
    }, (res: any) => {
      if (res?.success) {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-purple-800/50 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Room Settings</h2>
            <p className="text-xs text-slate-400">Customize discussion timer & gameplay rules.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Discussion Time */}
          <div>
            <label className="text-xs font-medium text-purple-300 mb-1.5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Discussion Phase Timer</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[60, 120, 180, 300].map((seconds) => (
                <button
                  type="button"
                  key={seconds}
                  onClick={() => setDiscussionTime(seconds)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    discussionTime === seconds
                      ? 'bg-purple-600 border-purple-400 text-white shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-purple-800'
                  }`}
                >
                  {seconds / 60}m ({seconds}s)
                </button>
              ))}
            </div>
          </div>

          {/* Max Players */}
          <div>
            <label className="text-xs font-medium text-purple-300 mb-1.5 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Max Players Limit</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[4, 6, 8, 10, 12].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setMaxPlayers(num)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    maxPlayers === num
                      ? 'bg-purple-600 border-purple-400 text-white shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-purple-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Imposter Hint Toggle */}
          <div className="bg-purple-950/40 p-3.5 rounded-xl border border-purple-900/40 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Give Imposter a Hint / Decoy Word</h4>
                <p className="text-[11px] text-slate-400">
                  Instead of seeing <span className="text-purple-300 font-mono">???</span>, the Imposter receives a related decoy word from the same category to help blend in!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowImposterHint(!showImposterHint)}
              className={`w-12 h-6 rounded-full transition-colors relative border ${
                showImposterHint ? 'bg-purple-600 border-purple-400' : 'bg-slate-800 border-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-0.5 ${
                  showImposterHint ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </form>
      </div>
    </div>
  );
};
