import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, RotateCcw, Shuffle, Sparkles, CheckCircle, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { FLASHCARDS_DECK, FlashcardItem } from '../data/japaneseData';
import { calculateNextSRSInterval } from '../utils/gameRules';
import { soundFx, speakJapanese } from '../utils/audio';

type CategoryFilter = 'All' | 'Greetings & Essentials' | 'Dining & Food' | 'Travel & Navigation' | 'Daily Life';

interface FlashcardsDeckProps {
  showFurigana: boolean;
  onWordMastered?: (word: string) => void;
}

export const FlashcardsDeck: React.FC<FlashcardsDeckProps> = ({ showFurigana, onWordMastered }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [srsStages, setSrsStages] = useState<Record<string, number>>({});
  const [peekFurigana, setPeekFurigana] = useState<boolean>(false);

  // Load saved SRS progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kotoba_srs_stages');
      if (saved) {
        setSrsStages(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveSrsStages = (updated: Record<string, number>) => {
    setSrsStages(updated);
    try {
      localStorage.setItem('kotoba_srs_stages', JSON.stringify(updated));
    } catch {}
  };

  // Filter deck by category
  const activeDeck = useMemo(() => {
    if (selectedCategory === 'All') return FLASHCARDS_DECK;
    return FLASHCARDS_DECK.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const currentCard: FlashcardItem | undefined = activeDeck[cardIndex % activeDeck.length];

  // Flip card
  const handleFlip = useCallback(() => {
    soundFx.playCardFlip();
    setIsFlipped((prev) => !prev);
  }, []);

  // Keyboard navigation: Space to flip, Arrow keys to switch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCardIndex((prev) => (prev + 1) % activeDeck.length);
        setIsFlipped(false);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCardIndex((prev) => (prev - 1 + activeDeck.length) % activeDeck.length);
        setIsFlipped(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDeck.length, handleFlip]);

  // SRS Rating action: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    if (!currentCard) return;

    soundFx.playCorrect();
    const currentStage = srsStages[currentCard.id] || 0;
    const { nextStage } = calculateNextSRSInterval(currentStage, rating);

    const updated = { ...srsStages, [currentCard.id]: nextStage };
    saveSrsStages(updated);

    if (rating >= 3 && onWordMastered) {
      onWordMastered(currentCard.kanji);
    }

    if (rating === 4) {
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch {}
    }

    // Move to next card
    setIsFlipped(false);
    setCardIndex((prev) => (prev + 1) % activeDeck.length);
  };

  // Shuffle current deck
  const handleShuffle = () => {
    soundFx.playKeypress();
    setCardIndex(Math.floor(Math.random() * activeDeck.length));
    setIsFlipped(false);
  };

  const masteredCount = Object.values(srsStages).filter((stage) => stage >= 3).length;

  return (
    <div className="w-full max-w-4xl mx-auto pb-10 px-4 sm:px-6">
      {/* Deck Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>SRS Flashcards</span>
            <span className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/60">
              単語カード
            </span>
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Tap card or press Spacebar to flip. Rate your recall to optimize your spaced repetition schedule.
          </p>
        </div>

        {/* Mastered Progress Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-stone-600 dark:text-stone-400 font-mono-numbers">
            <span className="font-bold text-stone-900 dark:text-stone-100">{cardIndex + 1}</span>
            <span> / {activeDeck.length} Cards</span>
          </div>

          <button
            onClick={handleShuffle}
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors border border-stone-200 dark:border-stone-700"
            title="Shuffle Deck"
            aria-label="Shuffle Flashcards"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
        {(['All', 'Greetings & Essentials', 'Dining & Food', 'Travel & Navigation', 'Daily Life'] as CategoryFilter[]).map(
          (cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCardIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white font-semibold shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-50'
              }`}
            >
              {cat}
            </button>
          )
        )}
      </div>

      {/* Main Flashcard Card Container */}
      {currentCard && (
        <div className="flex flex-col items-center">
          <div
            onClick={handleFlip}
            className="w-full max-w-xl min-h-[340px] sm:min-h-[380px] p-8 sm:p-10 bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 rounded-3xl shadow-lg cursor-pointer flex flex-col justify-between transition-all duration-300 hover:border-red-400 dark:hover:border-red-600 select-none relative"
            role="button"
            tabIndex={0}
            aria-label="Flashcard. Click or press space to flip"
          >
            {/* Card Header metadata */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span className="font-medium bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                {currentCard.category} · {currentCard.jlpt}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakJapanese(currentCard.furigana);
                  }}
                  className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg text-stone-800 dark:text-stone-200 transition-colors"
                  title="Speak word"
                  aria-label="Play Japanese pronunciation"
                >
                  <Volume2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>

            {/* Front of Card: Japanese Word */}
            {!isFlipped ? (
              <div className="my-auto text-center py-6">
                {/* Furigana Display */}
                {(showFurigana || peekFurigana) && (
                  <div className="text-xl font-medium text-stone-500 dark:text-stone-400 font-japanese tracking-widest mb-2">
                    {currentCard.furigana}
                  </div>
                )}

                {/* Big Kanji */}
                <div className="text-5xl sm:text-6xl font-extrabold text-stone-900 dark:text-stone-50 font-japanese tracking-wide mb-3">
                  {currentCard.kanji}
                </div>

                {/* Romaji */}
                <div className="text-sm font-mono text-stone-400">
                  {currentCard.romaji}
                </div>

                {!showFurigana && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPeekFurigana(!peekFurigana);
                    }}
                    className="mt-4 text-[11px] text-stone-500 hover:text-stone-800 underline"
                  >
                    {peekFurigana ? 'Hide Furigana' : 'Peek Furigana'}
                  </button>
                )}
              </div>
            ) : (
              /* Back of Card: English Definition, Mnemonic & Example */
              <div className="my-auto py-2 text-left">
                <div className="text-center mb-5 pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 mb-1">
                    {currentCard.english}
                  </div>
                  <span className="text-xs font-mono text-red-600 dark:text-red-400">
                    {currentCard.furigana} ({currentCard.romaji})
                  </span>
                </div>

                {/* Memory Hook */}
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 rounded-xl text-xs">
                  <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Memory Mnemonic Hook:
                  </span>
                  <p className="text-amber-900 dark:text-amber-200 font-medium">
                    {currentCard.memoryHook}
                  </p>
                </div>

                {/* Example sentence */}
                <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl text-xs">
                  <div className="flex items-center justify-between text-stone-500 mb-1">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Example Sentence</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakJapanese(currentCard.exampleJa);
                      }}
                      className="text-stone-500 hover:text-stone-900"
                      title="Speak sentence"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm font-japanese font-medium text-stone-900 dark:text-stone-100 mb-0.5">
                    {currentCard.exampleJa}
                  </p>
                  <p className="text-stone-500 dark:text-stone-400">{currentCard.exampleEn}</p>
                </div>
              </div>
            )}

            {/* Card Footer prompt */}
            <div className="text-center text-[11px] text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
              {isFlipped ? 'Rate your recall below to schedule next review' : 'Click card or press Spacebar to flip'}
            </div>
          </div>

          {/* Spaced Repetition (SRS) Rating Buttons */}
          {isFlipped && (
            <div className="w-full max-w-xl mt-6 grid grid-cols-4 gap-2.5">
              <button
                onClick={() => handleRate(1)}
                className="py-2.5 px-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-colors"
              >
                <span>Again</span>
                <span className="text-[10px] font-normal opacity-75">1 day</span>
              </button>

              <button
                onClick={() => handleRate(2)}
                className="py-2.5 px-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-colors"
              >
                <span>Hard</span>
                <span className="text-[10px] font-normal opacity-75">2 days</span>
              </button>

              <button
                onClick={() => handleRate(3)}
                className="py-2.5 px-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-colors"
              >
                <span>Good</span>
                <span className="text-[10px] font-normal opacity-75">4 days</span>
              </button>

              <button
                onClick={() => handleRate(4)}
                className="py-2.5 px-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-colors"
              >
                <span>Easy</span>
                <span className="text-[10px] font-normal opacity-75">7 days</span>
              </button>
            </div>
          )}

          {/* Card Prev / Next arrows */}
          {!isFlipped && (
            <div className="w-full max-w-xl mt-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setCardIndex((prev) => (prev - 1 + activeDeck.length) % activeDeck.length);
                  setIsFlipped(false);
                }}
                className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 p-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => {
                  setCardIndex((prev) => (prev + 1) % activeDeck.length);
                  setIsFlipped(false);
                }}
                className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 p-2"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
