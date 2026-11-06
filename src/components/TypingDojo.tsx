import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Volume2, Zap, Trophy, Timer, Award, CheckCircle2 } from 'lucide-react';
import { TYPING_WORDS, TypingWord } from '../data/japaneseData';
import { calculateTypingScore } from '../utils/gameRules';
import { soundFx, speakJapanese } from '../utils/audio';

type GameMode = '60S_BLITZ' | '30_WORDS' | 'ZEN_PRACTICE';
type CategoryFilter = 'All' | 'Greetings' | 'Food' | 'Travel' | 'Anime & Culture' | 'JLPT N5';

interface TypingDojoProps {
  showFurigana: boolean;
  onWordMastered?: (word: string) => void;
}

export const TypingDojo: React.FC<TypingDojoProps> = ({ showFurigana, onWordMastered }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [gameMode, setGameMode] = useState<GameMode>('60S_BLITZ');
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'SUMMARY'>('IDLE');

  const [activeWordIndex, setActiveWordIndex] = useState<number>(0);
  const [typedInput, setTypedInput] = useState<string>(''); // Current romaji typed for current word
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [totalCharsTyped, setTotalCharsTyped] = useState<number>(0);
  const [errorsCount, setErrorsCount] = useState<number>(0);
  const [completedWords, setCompletedWords] = useState<TypingWord[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(60);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter word bank
  const wordPool = useMemo(() => {
    let pool = TYPING_WORDS;
    if (selectedCategory !== 'All') {
      pool = pool.filter((w) => w.category === selectedCategory);
    }
    // Shuffle words deterministically for replayability
    return [...pool].sort(() => Math.random() - 0.5);
  }, [selectedCategory]);

  const currentWord: TypingWord | undefined = wordPool[activeWordIndex % wordPool.length];

  // End Game
  const finishGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('SUMMARY');
    soundFx.playVictory();
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}
  }, []);

  // Timer loop for 60S_BLITZ
  useEffect(() => {
    if (gameState === 'PLAYING' && gameMode === '60S_BLITZ') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [finishGame, gameMode, gameState]);

  // Start new game
  const startGame = () => {
    setGameState('PLAYING');
    setActiveWordIndex(0);
    setTypedInput('');
    setCombo(0);
    setMaxCombo(0);
    setTotalCharsTyped(0);
    setErrorsCount(0);
    setCompletedWords([]);
    setTimeLeft(60);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Process word completion
  const handleWordCompleted = useCallback(
    (word: TypingWord) => {
      soundFx.playCorrect();
      speakJapanese(word.kana, 1.1);
      setCompletedWords((prev) => [...prev, word]);
      if (onWordMastered) {
        onWordMastered(word.kanji);
      }

      setCombo((prev) => {
        const next = prev + 1;
        setMaxCombo((m) => Math.max(m, next));
        if (next % 5 === 0) {
          soundFx.playComboChime(Math.floor(next / 5));
        }
        return next;
      });

      // Check sprint win condition
      if (gameMode === '30_WORDS' && completedWords.length + 1 >= 30) {
        finishGame();
        return;
      }

      setActiveWordIndex((prev) => prev + 1);
      setTypedInput('');
    },
    [completedWords.length, finishGame, gameMode, onWordMastered]
  );

  // Keystroke handler for romaji input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'PLAYING' || !currentWord) return;

    const val = e.target.value.toLowerCase();
    const targetRomaji = currentWord.romaji.toLowerCase();

    // Check if what is typed so far matches target prefix
    if (targetRomaji.startsWith(val)) {
      soundFx.playKeypress();
      setTypedInput(val);
      setTotalCharsTyped((prev) => prev + 1);

      // Complete word match!
      if (val === targetRomaji) {
        handleWordCompleted(currentWord);
      }
    } else {
      // Mistake typed
      soundFx.playError();
      setErrorsCount((prev) => prev + 1);
      setCombo(0); // Reset combo streak
    }
  };

  // Calculate live stats
  const totalAttempts = totalCharsTyped + errorsCount;
  const accuracy = totalAttempts > 0 ? (totalCharsTyped / totalAttempts) * 100 : 100;
  const timeElapsed = gameMode === '60S_BLITZ' ? 60 - timeLeft : 30;
  const scoreStats = calculateTypingScore(
    totalCharsTyped,
    accuracy / 100,
    maxCombo,
    Math.max(timeElapsed, 1)
  );

  return (
    <div className="w-full max-w-4xl mx-auto pb-10 px-4 sm:px-6">
      {/* Dojo Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>Typing Dojo</span>
            <span className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/60">
              タイピング道場
            </span>
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Build muscle memory! Type the romaji to strike down vocabulary cards and chain combos.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg overflow-x-auto max-w-full">
          {(['All', 'Greetings', 'Food', 'Travel', 'Anime & Culture', 'JLPT N5'] as CategoryFilter[]).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                if (gameState === 'PLAYING') startGame();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          {(
            [
              { id: '60S_BLITZ', label: '60s Blitz' },
              { id: '30_WORDS', label: '30-Word Sprint' },
              { id: 'ZEN_PRACTICE', label: 'Zen Endless' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setGameMode(m.id);
                if (gameState === 'PLAYING') startGame();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                gameMode === m.id
                  ? 'bg-red-600 border-red-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Live HUD Stats */}
        <div className="flex items-center gap-4 text-xs font-mono-numbers">
          {gameMode === '60S_BLITZ' && (
            <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
              <Timer className="w-4 h-4 text-red-600" />
              <span className="font-bold text-sm">{timeLeft}s</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Zap className="w-4 h-4 fill-amber-500" />
            <span className="font-bold">{combo}x Combo</span>
          </div>

          <div className="text-stone-500 dark:text-stone-400">
            <span>CPM: </span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">{scoreStats.cpm}</span>
          </div>

          <div className="text-stone-500 dark:text-stone-400">
            <span>Accuracy: </span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">{Math.round(accuracy)}%</span>
          </div>
        </div>
      </div>

      {/* Main Play Area */}
      {gameState === 'IDLE' ? (
        <div className="p-12 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-950/60 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400">
            <Play className="w-8 h-8 fill-current translate-x-0.5" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Ready to enter the Dojo?</h2>
          <p className="text-stone-600 dark:text-stone-400 text-sm max-w-md mx-auto mt-2">
            Practice typing Japanese romaji with immediate furigana matching. Challenge yourself to hit high speeds and flawless accuracy!
          </p>
          <div className="mt-6">
            <button
              onClick={startGame}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg active:scale-98"
            >
              Start Typing Dojo
            </button>
          </div>
        </div>
      ) : gameState === 'PLAYING' && currentWord ? (
        <div
          onClick={() => inputRef.current?.focus()}
          className="relative p-8 sm:p-12 bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 rounded-3xl shadow-lg cursor-text text-center transition-all select-none"
        >
          {/* Category & difficulty tag */}
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-6">
            <span className="font-medium">{currentWord.category}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-stone-400">Word #{activeWordIndex + 1}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakJapanese(currentWord.kana);
                }}
                className="p-1 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                title="Listen to Japanese pronunciation"
              >
                <Volume2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>

          {/* Furigana Display */}
          {showFurigana && (
            <div className="text-lg sm:text-xl font-medium text-stone-500 dark:text-stone-400 font-japanese tracking-widest mb-1 min-h-[1.75rem]">
              {currentWord.kana}
            </div>
          )}

          {/* Main Kanji / Target Word */}
          <div className="text-4xl sm:text-6xl font-extrabold text-stone-900 dark:text-stone-50 font-japanese tracking-wide mb-3">
            {currentWord.kanji}
          </div>

          {/* English Meaning */}
          <div className="text-base sm:text-lg font-medium text-stone-600 dark:text-stone-300 mb-8">
            {currentWord.meaning}
          </div>

          {/* Interactive Romaji Keystroke Visualizer */}
          <div className="inline-flex items-center justify-center gap-0.5 px-6 py-3 bg-stone-100 dark:bg-stone-800 rounded-2xl text-xl sm:text-2xl font-mono border border-stone-200 dark:border-stone-700">
            {currentWord.romaji.split('').map((char, index) => {
              const isTyped = index < typedInput.length;
              const isNext = index === typedInput.length;

              let charColor = 'text-stone-400 dark:text-stone-500';
              if (isTyped) {
                charColor = 'text-emerald-600 dark:text-emerald-400 font-bold';
              } else if (isNext) {
                charColor = 'text-red-600 dark:text-red-400 font-bold underline underline-offset-4 animate-pulse';
              }

              return (
                <span key={index} className={charColor}>
                  {char}
                </span>
              );
            })}
          </div>

          {/* Hidden input catching user keyboard strokes */}
          <input
            ref={inputRef}
            type="text"
            value={typedInput}
            onChange={handleInputChange}
            autoFocus
            className="absolute opacity-0 pointer-events-none"
            aria-label="Type romaji here"
          />

          <div className="mt-8 text-xs text-stone-500">
            Type on your keyboard to advance · <span className="font-semibold text-stone-700 dark:text-stone-300">Click anywhere to refocus</span>
          </div>
        </div>
      ) : (
        /* Summary Screen */
        <div className="p-8 sm:p-10 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-md">
          <div className="text-center mb-8 pb-6 border-b border-stone-200 dark:border-stone-800">
            <div className="w-16 h-16 mx-auto mb-3 bg-amber-100 dark:bg-amber-950/60 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Dojo Round Finished!</h2>
            <p className="text-stone-600 dark:text-stone-400 text-xs mt-1">
              Here is your Japanese typing speed and accuracy performance.
            </p>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 font-mono-numbers">
            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 text-center">
              <span className="text-xs text-stone-500 uppercase tracking-wider block mb-1">Total Score</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400">
                {scoreStats.totalScore}
              </span>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 text-center">
              <span className="text-xs text-stone-500 uppercase tracking-wider block mb-1">Speed (CPM)</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                {scoreStats.cpm}
              </span>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 text-center">
              <span className="text-xs text-stone-500 uppercase tracking-wider block mb-1">Accuracy</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {Math.round(accuracy)}%
              </span>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 text-center">
              <span className="text-xs text-stone-500 uppercase tracking-wider block mb-1">Max Combo</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-500">
                {maxCombo}x
              </span>
            </div>
          </div>

          {/* Mastered Words in this Session */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Words Cleared ({completedWords.length})</span>
            </h3>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
              {completedWords.map((word, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs border border-stone-200 dark:border-stone-700"
                >
                  <span className="font-bold text-stone-900 dark:text-stone-100 font-japanese">{word.kanji}</span>
                  <span className="text-stone-500 font-japanese">({word.kana})</span>
                  <span className="text-stone-600 dark:text-stone-400">· {word.meaning}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center gap-4">
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
