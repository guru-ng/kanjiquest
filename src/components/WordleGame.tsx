import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, HelpCircle, RotateCcw, Share2, Check, Sparkles, AlertCircle } from 'lucide-react';
import { WORDLE_WORDS, WordleWord } from '../data/japaneseData';
import { evaluateWordleGuess, convertRomajiToKana, TileStatus } from '../utils/gameRules';
import { soundFx, speakJapanese } from '../utils/audio';

const MAX_GUESSES = 6;

// Common Japanese Hiragana mora keyboard layout
const KEYBOARD_ROWS = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', 'ゆ', 'よ', 'ら', 'り'],
  ['る', 'れ', 'ろ', 'わ', 'ん'],
  ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
  ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
  ['だ', 'ぢ', 'づ', 'で', 'ど'],
  ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
  ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
  ['っ', 'ゃ', 'ゅ', 'ょ'],
];

interface WordleGameProps {
  onWordMastered?: (word: string) => void;
  showFurigana: boolean;
}

export const WordleGame: React.FC<WordleGameProps> = ({ onWordMastered, showFurigana }) => {
  const [moraLength, setMoraLength] = useState<number>(3); // 3, 4, or 5
  const [wordIndex, setWordIndex] = useState<number>(0);
  const [guesses, setGuesses] = useState<string[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [romajiBuffer, setRomajiBuffer] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<'IN_PROGRESS' | 'WON' | 'LOST'>('IN_PROGRESS');
  const [revealedHints, setRevealedHints] = useState<{ meaning: boolean; kanji: boolean; audio: boolean }>({
    meaning: false,
    kanji: false,
    audio: false,
  });
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [inputFeedback, setInputFeedback] = useState<string | null>(null);

  // Filter word bank by chosen mora length
  const eligibleWords = useMemo(() => {
    const filtered = WORDLE_WORDS.filter((w) => w.tokens.length === moraLength);
    return filtered.length > 0 ? filtered : WORDLE_WORDS;
  }, [moraLength]);

  const targetWord: WordleWord = useMemo(() => {
    return eligibleWords[wordIndex % eligibleWords.length];
  }, [eligibleWords, wordIndex]);

  // Reset game state for a new word
  const resetGame = useCallback(() => {
    setGuesses([]);
    setCurrentGuess([]);
    setRomajiBuffer('');
    setGameStatus('IN_PROGRESS');
    setRevealedHints({ meaning: false, kanji: false, audio: false });
    setInputFeedback(null);
  }, []);

  const selectNextWord = useCallback(() => {
    setWordIndex((prev) => (prev + 1) % eligibleWords.length);
    resetGame();
  }, [eligibleWords.length, resetGame]);

  // Compute key statuses for on-screen keyboard
  const keyStatuses = useMemo(() => {
    const statuses: Record<string, TileStatus> = {};
    guesses.forEach((guess) => {
      const evaluation = evaluateWordleGuess(guess, targetWord.tokens);
      guess.forEach((char, idx) => {
        const evalStatus = evaluation[idx];
        const current = statuses[char];
        if (evalStatus === 'correct') {
          statuses[char] = 'correct';
        } else if (evalStatus === 'present' && current !== 'correct') {
          statuses[char] = 'present';
        } else if (evalStatus === 'absent' && !current) {
          statuses[char] = 'absent';
        }
      });
    });
    return statuses;
  }, [guesses, targetWord.tokens]);

  // Submit current guess
  const handleEnter = useCallback(() => {
    if (gameStatus !== 'IN_PROGRESS') return;

    if (currentGuess.length !== targetWord.tokens.length) {
      soundFx.playError();
      setInputFeedback(`Word must be exactly ${targetWord.tokens.length} mora long!`);
      setTimeout(() => setInputFeedback(null), 2500);
      return;
    }

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess([]);
    setRomajiBuffer('');

    const evaluation = evaluateWordleGuess(currentGuess, targetWord.tokens);
    const isWin = evaluation.every((s) => s === 'correct');

    if (isWin) {
      soundFx.playVictory();
      setGameStatus('WON');
      speakJapanese(targetWord.kana);
      if (onWordMastered) {
        onWordMastered(targetWord.kana);
      }
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'],
        });
      } catch {}
    } else if (newGuesses.length >= MAX_GUESSES) {
      soundFx.playError();
      setGameStatus('LOST');
      speakJapanese(targetWord.kana);
    } else {
      soundFx.playCorrect();
    }
  }, [currentGuess, gameStatus, guesses, onWordMastered, targetWord]);

  // Handle character addition (direct Kana or Romaji typing)
  const handleCharInput = useCallback(
    (char: string) => {
      if (gameStatus !== 'IN_PROGRESS') return;
      if (currentGuess.length >= targetWord.tokens.length) return;

      soundFx.playKeypress();
      setCurrentGuess((prev) => [...prev, char]);
    },
    [currentGuess.length, gameStatus, targetWord.tokens.length]
  );

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (gameStatus !== 'IN_PROGRESS') return;
    soundFx.playKeypress();
    if (romajiBuffer.length > 0) {
      setRomajiBuffer((prev) => prev.slice(0, -1));
    } else if (currentGuess.length > 0) {
      setCurrentGuess((prev) => prev.slice(0, -1));
    }
  }, [currentGuess.length, gameStatus, romajiBuffer.length]);

  // Physical keyboard listener with real-time Romaji to Hiragana conversion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handleEnter();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        const nextBuffer = romajiBuffer + e.key.toLowerCase();
        const converted = convertRomajiToKana(nextBuffer);

        // If converted has kana, add to current guess
        if (converted && /[\u3040-\u309F]/.test(converted)) {
          // If length fits
          if (currentGuess.length < targetWord.tokens.length) {
            handleCharInput(converted);
            setRomajiBuffer('');
          }
        } else {
          setRomajiBuffer(nextBuffer);
          // If buffer gets too long without match, clear
          if (nextBuffer.length > 3) {
            setRomajiBuffer('');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess.length, handleBackspace, handleCharInput, handleEnter, romajiBuffer, targetWord.tokens.length]);

  // Share grid copy function
  const handleShare = () => {
    const tileEmojis: Record<TileStatus, string> = {
      correct: '🟩',
      present: '🟨',
      absent: '⬛',
      empty: '⬜',
    };

    const header = `Kotoba Quest #${wordIndex + 1} (${guesses.length}/${MAX_GUESSES})\n`;
    const grid = guesses
      .map((guess) => {
        const evalRow = evaluateWordleGuess(guess, targetWord.tokens);
        return evalRow.map((status) => tileEmojis[status]).join('');
      })
      .join('\n');

    const textToCopy = `${header}\n${grid}\n\nLearn Japanese with Kotoba Quest!`;
    navigator.clipboard?.writeText(textToCopy).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-10 px-4 sm:px-6">
      {/* Game Header Controls & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>Kotoba Wordle</span>
            <span className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/60">
              言葉パズル
            </span>
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Guess the hidden Japanese word in 6 tries. Type using Romaji on your keyboard or tap kana below!
          </p>
        </div>

        {/* Word Length Selector & Reset */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-lg">
            {[3, 4, 5].map((len) => (
              <button
                key={len}
                onClick={() => {
                  setMoraLength(len);
                  setWordIndex(0);
                  resetGame();
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  moraLength === len
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                {len} Mora
              </button>
            ))}
          </div>

          <button
            onClick={selectNextWord}
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors border border-stone-200 dark:border-stone-700"
            title="Next Word"
            aria-label="Next Word"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hints Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-stone-100/70 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700/60 text-xs">
        <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 font-medium">
          <HelpCircle className="w-4 h-4 text-stone-500" />
          <span>Foreigner Learning Aids:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Meaning Clue */}
          <button
            onClick={() => {
              soundFx.playKeypress();
              setRevealedHints((prev) => ({ ...prev, meaning: true }));
            }}
            className={`px-2.5 py-1 rounded border transition-colors ${
              revealedHints.meaning
                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-medium'
                : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
            }`}
          >
            {revealedHints.meaning ? `Category: ${targetWord.category} (${targetWord.meaning})` : 'Reveal Meaning Clue'}
          </button>

          {/* Kanji Clue */}
          <button
            onClick={() => {
              soundFx.playKeypress();
              setRevealedHints((prev) => ({ ...prev, kanji: true }));
            }}
            className={`px-2.5 py-1 rounded border transition-colors ${
              revealedHints.kanji
                ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-medium'
                : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
            }`}
          >
            {revealedHints.kanji ? `Kanji: ${targetWord.kanji}` : 'Reveal Kanji Clue'}
          </button>

          {/* Audio Pronunciation Hint */}
          <button
            onClick={() => {
              soundFx.playKeypress();
              setRevealedHints((prev) => ({ ...prev, audio: true }));
              speakJapanese(targetWord.kana);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded hover:bg-stone-50 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5 text-red-600" />
            <span>Hear Native Sound</span>
          </button>
        </div>
      </div>

      {/* Input feedback message toast */}
      {inputFeedback && (
        <div className="mb-4 p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{inputFeedback}</span>
        </div>
      )}

      {/* Main Wordle Grid */}
      <div className="flex flex-col items-center justify-center gap-2.5 mb-6">
        {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
          const isCurrentRow = rowIndex === guesses.length;
          const isSubmitted = rowIndex < guesses.length;
          const guess = isSubmitted ? guesses[rowIndex] : isCurrentRow ? currentGuess : [];
          const evaluation = isSubmitted ? evaluateWordleGuess(guess, targetWord.tokens) : [];

          return (
            <div key={rowIndex} className="flex gap-2.5" role="row">
              {Array.from({ length: targetWord.tokens.length }).map((_, colIndex) => {
                const char = guess[colIndex] || '';
                const status = evaluation[colIndex];

                // Tile visual colors and semantic borders
                let tileClass = 'border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100';
                let indicatorSymbol = null;

                if (isSubmitted) {
                  if (status === 'correct') {
                    tileClass = 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-sm';
                    indicatorSymbol = <span className="absolute bottom-1 right-1 text-[9px] opacity-80">✓</span>;
                  } else if (status === 'present') {
                    tileClass = 'bg-amber-500 border-amber-500 text-white font-bold shadow-sm';
                    indicatorSymbol = <span className="absolute bottom-1 right-1 text-[9px] opacity-80">●</span>;
                  } else {
                    tileClass = 'bg-stone-400 dark:bg-stone-700 border-stone-400 dark:border-stone-700 text-white font-semibold';
                    indicatorSymbol = <span className="absolute bottom-1 right-1 text-[9px] opacity-60">✕</span>;
                  }
                } else if (isCurrentRow && char) {
                  tileClass = 'border-2 border-red-500 dark:border-red-400 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 scale-105';
                }

                return (
                  <div
                    key={colIndex}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl font-japanese rounded-xl transition-all duration-200 select-none ${tileClass}`}
                  >
                    {char}
                    {indicatorSymbol}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Typing Romaji buffer helper indicator */}
      {romajiBuffer && (
        <div className="text-center mb-3 text-xs text-stone-500 dark:text-stone-400">
          Typing buffer:{' '}
          <span className="font-mono bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-800 dark:text-stone-200">
            {romajiBuffer}
          </span>
          <span className="ml-1 text-[11px] opacity-75">(complete mora to insert)</span>
        </div>
      )}

      {/* Victory / Defeat Modal Card */}
      {gameStatus !== 'IN_PROGRESS' && (
        <div className="mb-6 p-5 bg-white dark:bg-stone-900 border-2 border-red-500/40 dark:border-red-500/30 rounded-2xl shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                {gameStatus === 'WON' ? (
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Correct! 正解 (Seikai)
                  </span>
                ) : (
                  <span className="text-base font-bold text-stone-700 dark:text-stone-300">
                    Good Effort! 次は頑張ろう (Ganbarou)
                  </span>
                )}
                <span className="text-xs font-semibold text-stone-500">· {targetWord.jlpt} Level</span>
              </div>
              <div className="flex items-baseline gap-3 mt-1.5">
                <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-50 font-japanese">
                  {targetWord.kanji}
                </span>
                <span className="text-xl font-medium text-red-600 dark:text-red-400 font-japanese">
                  {targetWord.kana}
                </span>
                <span className="text-sm text-stone-500 font-mono">({targetWord.romaji})</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => speakJapanese(targetWord.kana)}
                className="p-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl transition-colors"
                title="Play Audio Pronunciation"
                aria-label="Play Japanese Pronunciation"
              >
                <Volume2 className="w-5 h-5" />
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-xl transition-colors"
              >
                {copiedShare ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedShare ? 'Copied Grid!' : 'Share Grid'}</span>
              </button>

              <button
                onClick={selectNextWord}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Next Word
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-stone-500 uppercase tracking-wider block mb-1">Meaning</span>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{targetWord.meaning}</p>
              <p className="text-stone-500 dark:text-stone-400 mt-1 italic">{targetWord.hint}</p>
            </div>
            <div>
              <span className="font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                Contextual Example
              </span>
              <p className="text-sm font-japanese font-medium text-stone-900 dark:text-stone-100">
                {targetWord.exampleSentenceJa}
              </p>
              <p className="text-stone-500 dark:text-stone-400 mt-0.5">{targetWord.exampleSentenceEn}</p>
            </div>
          </div>
        </div>
      )}

      {/* On-Screen Hiragana Keyboard for quick clicking or mobile */}
      <div className="mt-6 p-3 bg-stone-100 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700/80">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
            Kana Keyboard / タッチ入力
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackspace}
              className="px-3 py-1.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg transition-colors"
            >
              ⌫ Del
            </button>
            <button
              onClick={handleEnter}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Enter / 決定
            </button>
          </div>
        </div>

        {/* Scrollable / Responsive Kana Matrix */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-h-48 overflow-y-auto p-1">
          {KEYBOARD_ROWS.flat().map((char) => {
            const status = keyStatuses[char];
            let keyColor =
              'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-700';

            if (status === 'correct') {
              keyColor = 'bg-emerald-600 text-white border-emerald-600 font-bold';
            } else if (status === 'present') {
              keyColor = 'bg-amber-500 text-white border-amber-500 font-bold';
            } else if (status === 'absent') {
              keyColor = 'bg-stone-300 dark:bg-stone-700 text-stone-500 dark:text-stone-400 border-transparent opacity-60';
            }

            return (
              <button
                key={char}
                onClick={() => handleCharInput(char)}
                className={`h-10 text-sm font-japanese font-semibold rounded-lg border transition-all active:scale-95 flex items-center justify-center select-none shadow-xs ${keyColor}`}
                aria-label={`Enter kana ${char}`}
              >
                {char}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
