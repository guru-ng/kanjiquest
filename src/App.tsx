/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { WordleGame } from './components/WordleGame';
import { TypingDojo } from './components/TypingDojo';
import { FlashcardsDeck } from './components/FlashcardsDeck';
import { KanjiLab } from './components/KanjiLab';
import { MnemonicSensei } from './components/MnemonicSensei';
import { soundFx } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('wordle');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showFurigana, setShowFurigana] = useState<boolean>(true);
  const [streakCount, setStreakCount] = useState<number>(3);
  const [masteredWords, setMasteredWords] = useState<string[]>([]);

  // Check URL query parameters (e.g. ?tab=typing or ?autostart=1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as TabType;
      if (['wordle', 'typing', 'kanji', 'flashcards', 'sensei'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      const autostart = params.get('autostart');
      if (autostart === '1') {
        setActiveTab('wordle');
      }

      // Load saved streak & words
      try {
        const savedStreak = localStorage.getItem('kotoba_streak');
        if (savedStreak) setStreakCount(parseInt(savedStreak, 10));

        const savedWords = localStorage.getItem('kotoba_mastered');
        if (savedWords) setMasteredWords(JSON.parse(savedWords));
      } catch {}
    }
  }, []);

  // Sync sound controller
  useEffect(() => {
    soundFx.soundEnabled = soundEnabled;
  }, [soundEnabled]);

  const handleWordMastered = (word: string) => {
    setMasteredWords((prev) => {
      if (prev.includes(word)) return prev;
      const updated = [...prev, word];
      try {
        localStorage.setItem('kotoba_mastered', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col selection:bg-amber-200 selection:text-stone-900">
      {/* 3-Zone Sticky Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        showFurigana={showFurigana}
        setShowFurigana={setShowFurigana}
        streakCount={streakCount}
      />

      {/* Main Content Stage */}
      <main className="flex-1 pt-6 sm:pt-8 pb-16">
        {activeTab === 'wordle' && (
          <WordleGame onWordMastered={handleWordMastered} showFurigana={showFurigana} />
        )}
        {activeTab === 'typing' && (
          <TypingDojo showFurigana={showFurigana} onWordMastered={handleWordMastered} />
        )}
        {activeTab === 'kanji' && <KanjiLab />}
        {activeTab === 'flashcards' && (
          <FlashcardsDeck showFurigana={showFurigana} onWordMastered={handleWordMastered} />
        )}
        {activeTab === 'sensei' && <MnemonicSensei />}
      </main>

      {/* Quiet Non-Intrusive Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-6 text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900 dark:text-stone-100 font-japanese">Kotoba Quest</span>
            <span>· Gamified Japanese Learning for Foreigners</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-numbers">
            <span>JLPT N5–N3 Ready</span>
            <span>·</span>
            <span>{masteredWords.length} Words Mastered</span>
            <span>·</span>
            <span>Web Speech TTS Enabled</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
