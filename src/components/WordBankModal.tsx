'use client';

import React, { useState } from 'react';
import { X, Plus, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { SEED_DATA } from '@/data/seedData';
import { getSocket } from '@/lib/socket';

interface WordBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  customWordsCount: number;
}

export const WordBankModal: React.FC<WordBankModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  customWordsCount
}) => {
  const [word, setWord] = useState('');
  const [category, setCategory] = useState(SEED_DATA[0].category);
  const [customCategory, setCustomCategory] = useState('');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const socket = getSocket();

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isAddingNewCat ? customCategory.trim() : category;
    if (!word.trim() || !finalCategory) {
      setFeedback({ type: 'error', message: 'Word and Category are required.' });
      return;
    }

    socket.emit('word:add', { roomCode, word: word.trim(), category: finalCategory }, (res: any) => {
      if (res?.error) {
        setFeedback({ type: 'error', message: res.error });
      } else {
        setFeedback({ type: 'success', message: `Added "${word.trim()}" to category "${finalCategory}"!` });
        setWord('');
        if (isAddingNewCat) {
          setCustomCategory('');
          setIsAddingNewCat(false);
        }
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  };

  const totalSeedWords = SEED_DATA.reduce((sum, item) => sum + item.words.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-blue-900/60 p-6 shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Admin Word Bank</h2>
            <p className="text-xs text-slate-400">Pre-seeded with {totalSeedWords.toLocaleString()}+ words across {SEED_DATA.length} categories.</p>
          </div>
        </div>

        {/* Categories List */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-blue-300 mb-2 block">Active System Categories ({SEED_DATA.length}):</label>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-950/70 rounded-xl border border-slate-800">
            {SEED_DATA.map((cat, i) => (
              <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-200">
                {cat.category} <span className="opacity-60">({cat.words.length})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Add Word Form */}
        <form onSubmit={handleAddWord} className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">Add Custom Secret Word</h3>

          {feedback && (
            <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50' : 'bg-red-950/80 text-red-300 border border-red-800/50'}`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Secret Word</label>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="e.g. Lightsaber"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-slate-300 block">Category</label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 underline"
                >
                  {isAddingNewCat ? 'Select Existing Category' : '+ Create New Category'}
                </button>
              </div>

              {isAddingNewCat ? (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="New Category Name (e.g. Anime)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {SEED_DATA.map((cat, i) => (
                    <option key={i} value={cat.category}>{cat.category}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Word to Room Bank</span>
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Done & Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};
