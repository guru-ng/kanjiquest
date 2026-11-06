import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Sparkles, BookOpen, Layers, CheckCircle2, RotateCcw } from 'lucide-react';
import { KANJI_COLLECTION, KanjiDetail } from '../data/japaneseData';
import { soundFx, speakJapanese } from '../utils/audio';

export const KanjiLab: React.FC = () => {
  const [selectedKanji, setSelectedKanji] = useState<KanjiDetail>(KANJI_COLLECTION[0]);
  const [quizActive, setQuizActive] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [selectedRadicals, setSelectedRadicals] = useState<string[]>([]);
  const [quizFeedback, setQuizFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);

  const currentQuizKanji = KANJI_COLLECTION[quizIndex % KANJI_COLLECTION.length];

  // Radical choices for the quiz: correct radicals + plausible distractors
  const quizRadicalChoices = React.useMemo(() => {
    const correct = currentQuizKanji.radicals.map((r) => r.symbol);
    const distractors = ['水', '火', '金', '土', '女', '心', '山', '手', '口', '門']
      .filter((s) => !correct.includes(s))
      .slice(0, 4);
    return [...correct, ...distractors].sort(() => 0.5 - Math.random());
  }, [currentQuizKanji]);

  // Quiz assembly attempt
  const handleSelectQuizRadical = (symbol: string) => {
    if (quizFeedback) return;
    soundFx.playKeypress();

    let updated: string[];
    if (selectedRadicals.includes(symbol)) {
      updated = selectedRadicals.filter((s) => s !== symbol);
    } else {
      updated = [...selectedRadicals, symbol];
    }
    setSelectedRadicals(updated);

    // Check if count matches required radicals
    const targetSymbols = currentQuizKanji.radicals.map((r) => r.symbol);
    if (updated.length === targetSymbols.length) {
      const isCorrect = targetSymbols.every((s) => updated.includes(s));
      if (isCorrect) {
        soundFx.playVictory();
        setQuizFeedback('CORRECT');
        setQuizScore((prev) => prev + 1);
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}
      } else {
        soundFx.playError();
        setQuizFeedback('WRONG');
      }
    }
  };

  const nextQuizQuestion = () => {
    setQuizIndex((prev) => prev + 1);
    setSelectedRadicals([]);
    setQuizFeedback(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-10 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>Kanji Radical Lab</span>
            <span className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/60">
              漢字の部首
            </span>
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Kanji are not random lines—they are building blocks! Deconstruct radicals and assemble kanji.
          </p>
        </div>

        {/* Tab switch between Inspector & Radical Fusion Quiz */}
        <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
          <button
            onClick={() => setQuizActive(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              !quizActive
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Radical Explorer
          </button>
          <button
            onClick={() => {
              setQuizActive(true);
              setSelectedRadicals([]);
              setQuizFeedback(null);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              quizActive
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Fusion Mini-Game
          </button>
        </div>
      </div>

      {!quizActive ? (
        /* Radical Explorer Mode */
        <div>
          {/* Kanji Selector Carousel */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {KANJI_COLLECTION.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  soundFx.playKeypress();
                  setSelectedKanji(item);
                }}
                className={`w-12 h-12 text-xl font-japanese font-bold rounded-xl border transition-all flex items-center justify-center shrink-0 ${
                  selectedKanji.id === item.id
                    ? 'bg-red-600 text-white border-red-600 shadow-sm scale-105'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-50'
                }`}
              >
                {item.kanji}
              </button>
            ))}
          </div>

          {/* Detailed Kanji Analysis Card */}
          <div className="p-6 sm:p-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Big Kanji & Pronunciation */}
              <div className="flex flex-col items-center justify-center p-6 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-200 dark:border-stone-700/60 text-center">
                <span className="text-7xl sm:text-8xl font-japanese font-extrabold text-stone-900 dark:text-stone-50 select-none">
                  {selectedKanji.kanji}
                </span>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {selectedKanji.meaning}
                  </span>
                  <button
                    onClick={() => speakJapanese(selectedKanji.kunyomi[0] || selectedKanji.onyomi[0])}
                    className="p-1 hover:text-red-600 transition-colors"
                    title="Pronounce Kanji"
                  >
                    <Volume2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                <div className="mt-3 text-xs text-stone-500 font-mono-numbers">
                  <span>{selectedKanji.strokes} Strokes · </span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{selectedKanji.jlpt}</span>
                </div>
              </div>

              {/* Middle & Right: Radical Explosion & Readings */}
              <div className="md:col-span-2 flex flex-col justify-between">
                <div>
                  {/* Radical Building Blocks */}
                  <div className="mb-4">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
                      Constituent Radicals (Components)
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedKanji.radicals.map((rad, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-2 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-xs"
                        >
                          <span className="text-lg font-japanese font-bold text-red-600 dark:text-red-400">
                            {rad.symbol}
                          </span>
                          <span className="text-stone-700 dark:text-stone-300 font-medium">{rad.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual Mnemonic Story */}
                  <div className="mb-5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-xs">
                    <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Visual Story Mnemonic
                    </span>
                    <p className="text-amber-900/90 dark:text-amber-200 leading-relaxed font-medium">
                      {selectedKanji.mnemonic}
                    </p>
                  </div>

                  {/* Onyomi & Kunyomi Readings */}
                  <div className="grid grid-cols-2 gap-4 text-xs mb-5">
                    <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                      <span className="text-stone-500 font-semibold block mb-1">音読み (Onyomi - Chinese)</span>
                      <p className="font-japanese font-bold text-stone-900 dark:text-stone-100">
                        {selectedKanji.onyomi.join(', ')}
                      </p>
                    </div>

                    <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                      <span className="text-stone-500 font-semibold block mb-1">訓読み (Kunyomi - Native)</span>
                      <p className="font-japanese font-bold text-stone-900 dark:text-stone-100">
                        {selectedKanji.kunyomi.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compound Words */}
                <div>
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
                    Common Compounds
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedKanji.compounds.map((comp, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800/70 rounded-xl text-xs flex items-center gap-2 border border-stone-200 dark:border-stone-700"
                      >
                        <span className="font-bold text-stone-900 dark:text-stone-100 font-japanese">
                          {comp.word}
                        </span>
                        <span className="text-stone-500 font-japanese">({comp.reading})</span>
                        <span className="text-stone-600 dark:text-stone-400">· {comp.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Radical Fusion Mini-Game */
        <div className="p-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-md text-center max-w-xl mx-auto">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-6">
            <span className="font-semibold">Puzzle #{quizIndex + 1}</span>
            <span className="font-mono-numbers font-bold text-emerald-600 dark:text-emerald-400">
              Score: {quizScore}
            </span>
          </div>

          <div className="mb-2 text-stone-500 text-xs uppercase tracking-wider">Assemble the Kanji for:</div>
          <div className="text-3xl font-extrabold text-stone-900 dark:text-stone-50 mb-2">
            "{currentQuizKanji.meaning}"
          </div>
          <div className="text-xs text-stone-500 mb-6">
            Select {currentQuizKanji.radicals.length} matching radicals from the tray below:
          </div>

          {/* Selected Radicals Slots */}
          <div className="flex items-center justify-center gap-3 mb-8 min-h-[60px]">
            {Array.from({ length: currentQuizKanji.radicals.length }).map((_, i) => {
              const symbol = selectedRadicals[i];
              return (
                <div
                  key={i}
                  className="w-16 h-16 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex items-center justify-center text-3xl font-japanese font-bold text-red-600 dark:text-red-400"
                >
                  {symbol || ''}
                </div>
              );
            })}
          </div>

          {/* Tray of Radical Choices */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {quizRadicalChoices.map((symbol) => {
              const isSelected = selectedRadicals.includes(symbol);
              return (
                <button
                  key={symbol}
                  onClick={() => handleSelectQuizRadical(symbol)}
                  className={`w-14 h-14 text-2xl font-japanese font-bold rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-600 scale-95 shadow-inner'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {symbol}
                </button>
              );
            })}
          </div>

          {/* Feedback Message */}
          {quizFeedback === 'CORRECT' && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 mb-6 text-xs animate-fade-in">
              <div className="flex items-center justify-center gap-2 text-sm font-bold mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Kanji Forged: {currentQuizKanji.kanji} ({currentQuizKanji.meaning})!</span>
              </div>
              <p className="mt-1">{currentQuizKanji.mnemonic}</p>
              <button
                onClick={nextQuizQuestion}
                className="mt-3 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
              >
                Next Fusion
              </button>
            </div>
          )}

          {quizFeedback === 'WRONG' && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl text-rose-900 dark:text-rose-200 mb-6 text-xs animate-fade-in">
              <span className="font-bold block mb-1">Not quite!</span>
              <p>Those radicals don't fuse into this kanji. Reset and try another combination.</p>
              <button
                onClick={() => {
                  setSelectedRadicals([]);
                  setQuizFeedback(null);
                }}
                className="mt-3 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={() => {
                setSelectedRadicals([]);
                setQuizFeedback(null);
              }}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Selections</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
