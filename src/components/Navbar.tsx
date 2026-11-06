import React from 'react';
import { Volume2, VolumeX, Eye, EyeOff, Flame } from 'lucide-react';

export type TabType = 'wordle' | 'typing' | 'kanji' | 'flashcards' | 'sensei';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  showFurigana: boolean;
  setShowFurigana: (show: boolean) => void;
  streakCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  soundEnabled,
  setSoundEnabled,
  showFurigana,
  setShowFurigana,
  streakCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element wordmark in display face) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('wordle')}
            className="flex items-baseline gap-2 text-left focus:outline-none group"
            aria-label="Kotoba Quest Home"
          >
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 font-japanese">
              Kotoba<span className="text-red-600 dark:text-red-500">Quest</span>
            </span>
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 font-japanese hidden sm:inline">
              言葉クエスト
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (4-5 single-line clean links) */}
        <nav
          className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600 dark:text-stone-300"
          aria-label="Main Navigation"
        >
          <button
            onClick={() => setActiveTab('wordle')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'wordle'
                ? 'border-red-600 text-stone-900 dark:text-stone-50 font-semibold'
                : 'border-transparent hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Kotoba Wordle
          </button>

          <button
            onClick={() => setActiveTab('typing')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'typing'
                ? 'border-red-600 text-stone-900 dark:text-stone-50 font-semibold'
                : 'border-transparent hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Typing Dojo
          </button>

          <button
            onClick={() => setActiveTab('kanji')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'kanji'
                ? 'border-red-600 text-stone-900 dark:text-stone-50 font-semibold'
                : 'border-transparent hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Kanji Lab & Radicals
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'flashcards'
                ? 'border-red-600 text-stone-900 dark:text-stone-50 font-semibold'
                : 'border-transparent hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            SRS Flashcards
          </button>

          <button
            onClick={() => setActiveTab('sensei')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'sensei'
                ? 'border-red-600 text-stone-900 dark:text-stone-50 font-semibold'
                : 'border-transparent hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Mnemonic Sensei
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Area & Quick Utilities */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Daily streak count */}
          <div
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200/60 dark:border-amber-800/40"
            title="Daily Practice Streak"
          >
            <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span className="font-mono-numbers">{streakCount}d Streak</span>
          </div>

          {/* Furigana toggle button */}
          <button
            onClick={() => setShowFurigana(!showFurigana)}
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title={showFurigana ? 'Furigana is Visible (Click to Hide)' : 'Furigana is Hidden (Click to Show)'}
            aria-label={showFurigana ? 'Hide Furigana' : 'Show Furigana'}
          >
            {showFurigana ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Sound toggle button */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
            aria-label={soundEnabled ? 'Sound is on' : 'Sound is muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="md:hidden flex items-center justify-around border-t border-stone-200 dark:border-stone-800 px-2 py-2 bg-stone-50 dark:bg-stone-900 text-xs font-medium">
        <button
          onClick={() => setActiveTab('wordle')}
          className={`px-2 py-1.5 rounded-md ${
            activeTab === 'wordle'
              ? 'bg-red-600 text-white font-semibold'
              : 'text-stone-600 dark:text-stone-300'
          }`}
        >
          Wordle
        </button>
        <button
          onClick={() => setActiveTab('typing')}
          className={`px-2 py-1.5 rounded-md ${
            activeTab === 'typing'
              ? 'bg-red-600 text-white font-semibold'
              : 'text-stone-600 dark:text-stone-300'
          }`}
        >
          Typing
        </button>
        <button
          onClick={() => setActiveTab('kanji')}
          className={`px-2 py-1.5 rounded-md ${
            activeTab === 'kanji'
              ? 'bg-red-600 text-white font-semibold'
              : 'text-stone-600 dark:text-stone-300'
          }`}
        >
          Kanji
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`px-2 py-1.5 rounded-md ${
            activeTab === 'flashcards'
              ? 'bg-red-600 text-white font-semibold'
              : 'text-stone-600 dark:text-stone-300'
          }`}
        >
          Cards
        </button>
        <button
          onClick={() => setActiveTab('sensei')}
          className={`px-2 py-1.5 rounded-md ${
            activeTab === 'sensei'
              ? 'bg-red-600 text-white font-semibold'
              : 'text-stone-600 dark:text-stone-300'
          }`}
        >
          Sensei
        </button>
      </div>
    </header>
  );
};
