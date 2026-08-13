'use client';

import React, { useState } from 'react';
import { X, Settings, Clock, Users, Lightbulb, Save, CheckSquare, Square, Tags } from 'lucide-react';
import { SEED_DATA } from '@/data/seedData';
import { getSocket } from '@/lib/socket';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  currentSettings: {
    maxPlayers: number;
    turnTime: number;
    imposterCount: number;
    showImposterHint: boolean;
    selectedCategories?: string[];
  };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  currentSettings
}) => {
  const allCategoryNames = SEED_DATA.map(c => c.category);
  const initialSelected = currentSettings.selectedCategories && currentSettings.selectedCategories.length > 0
    ? currentSettings.selectedCategories
    : allCategoryNames;

  const [turnTime, setTurnTime] = useState(currentSettings.turnTime || 20);
  const [maxPlayers, setMaxPlayers] = useState(currentSettings.maxPlayers || 10);
  const [imposterCount, setImposterCount] = useState(currentSettings.imposterCount || 1);
  const [showImposterHint, setShowImposterHint] = useState(currentSettings.showImposterHint || false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialSelected);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const socket = getSocket();

  const toggleCategory = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      if (selectedCategories.length <= 1) {
        setErrorMsg('Must keep at least 1 category selected!');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
      }
      setSelectedCategories(selectedCategories.filter(c => c !== categoryName));
    } else {
      setSelectedCategories([...selectedCategories, categoryName]);
    }
  };

  const selectAll = () => setSelectedCategories(allCategoryNames);
  const deselectAll = () => {
    setSelectedCategories([allCategoryNames[0]]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategories.length === 0) {
      setErrorMsg('Please select at least one category!');
      return;
    }

    socket.emit('room:settingsUpdate', {
      roomCode,
      settings: {
        turnTime: Number(turnTime),
        maxPlayers: Number(maxPlayers),
        imposterCount: Number(imposterCount),
        showImposterHint,
        selectedCategories
      }
    }, (res: any) => {
      if (res?.success) {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-blue-900 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 border border-blue-500 flex items-center justify-center text-white">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Room Settings</h2>
            <p className="text-xs text-slate-400">Customize categories, turn timer & max players (up to 20).</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 bg-red-950 border border-red-800 rounded-xl text-red-300 text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Multi-Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                <Tags className="w-4 h-4 text-blue-400" />
                <span>Selected Word Categories ({selectedCategories.length}/{allCategoryNames.length})</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-300 underline"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
              {allCategoryNames.map((catName) => {
                const isSelected = selectedCategories.includes(catName);
                return (
                  <button
                    type="button"
                    key={catName}
                    onClick={() => toggleCategory(catName)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left truncate ${
                      isSelected
                        ? 'bg-blue-600 border border-blue-500 text-white font-medium'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-white shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                    <span className="truncate">{catName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Turn Duration */}
          <div>
            <label className="text-xs font-semibold text-blue-300 mb-1.5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Turn Duration (Seconds per player)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 20, 30].map((seconds) => (
                <button
                  type="button"
                  key={seconds}
                  onClick={() => setTurnTime(seconds)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    turnTime === seconds
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-800'
                  }`}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </div>

          {/* Max Players Limit (Up to 20) */}
          <div>
            <label className="text-xs font-semibold text-blue-300 mb-1.5 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Max Players Limit (Up to 20)</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[4, 8, 12, 16, 20].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setMaxPlayers(num)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    maxPlayers === num
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Imposters (Admin permission) */}
          <div>
            <label className="text-xs font-semibold text-blue-300 mb-1.5 flex items-center gap-2">
              <Users className="w-4 h-4 text-red-400" />
              <span>Number of Imposters ({imposterCount})</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setImposterCount(num)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    imposterCount === num
                      ? 'bg-red-600 border-red-500 text-white shadow-lg'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-red-800'
                  }`}
                >
                  {num} {num === 1 ? 'Imposter' : 'Imposters'}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              (Note: Requires enough connected players; max 1 imposter per 3 players).
            </p>
          </div>

          {/* Imposter Hint Toggle */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Give Imposter a Hint / Decoy Word</h4>
                <p className="text-[11px] text-slate-400">
                  Instead of seeing <span className="text-blue-300 font-mono">???</span>, the Imposter receives a related decoy word to help blend in.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowImposterHint(!showImposterHint)}
              className={`w-12 h-6 rounded-full transition-colors relative border ${
                showImposterHint ? 'bg-red-600 border-red-500' : 'bg-slate-800 border-slate-700'
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
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </form>
      </div>
    </div>
  );
};
