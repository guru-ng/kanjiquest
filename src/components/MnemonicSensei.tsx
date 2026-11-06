import React, { useState } from 'react';
import { Sparkles, Send, Volume2, Lightbulb, HelpCircle, BookOpen } from 'lucide-react';
import { soundFx, speakJapanese } from '../utils/audio';

interface PreloadedTip {
  title: string;
  topic: string;
  question: string;
  japanese: string;
  furigana: string;
  answer: string;
  mnemonic: string;
  cultureTip?: string;
}

const PRELOADED_TIPS: PreloadedTip[] = [
  {
    title: 'Bridge vs Chopsticks (Hashi)',
    topic: 'Homophones & Pitch Accent',
    question: 'How do I distinguish "Hashi" (Chopsticks) vs "Hashi" (Bridge)?',
    japanese: '箸 (Chopsticks) vs 橋 (Bridge)',
    furigana: 'はし vs はし',
    answer:
      'In Japanese, both are spelled "はし" (hashi), but their pitch accent and kanji differ! 箸 (chopsticks) starts HIGH and drops LOW (HA-shi). 橋 (bridge) starts LOW and rises HIGH (ha-SHI).',
    mnemonic:
      'Memory Trick: Imagine holding Chopsticks up HIGH to eat your noodles (HA-shi). A Bridge arches from the low ground up across the river (ha-SHI)!',
    cultureTip: 'Never stick chopsticks vertically into a bowl of rice (tsukitate-bashi) as it resembles funeral incense.',
  },
  {
    title: 'Particle Master: は (wa) vs が (ga)',
    topic: 'Grammar Demystified',
    question: 'What is the real difference between topic marker "は" and subject marker "が"?',
    japanese: '私は... vs 私が...',
    furigana: 'わたしは... vs わたしが...',
    answer:
      '"は" sets the broad TOPIC ("As for me...", "Speaking of X..."). Everything following "は" is the spotlight information. "が" puts the spotlight on the SUBJECT itself ("IT IS ME who... / None other than...").',
    mnemonic:
      'Memory Trick: Think of "は" as an open Stage Curtain setting the theme. Think of "が" as a laser pointer spotlighting the exact actor!',
    cultureTip: 'When introducing yourself, saying "Watashi wa [Name] desu" is natural.',
  },
  {
    title: 'Izakaya Superpower Phrases',
    topic: 'Dining & Practical Life',
    question: 'What are the top phrases I need at an authentic Japanese Izakaya?',
    japanese: 'とりあえずビールで！ / お会計お願いします',
    furigana: 'とりあえずびーるで！ / おかいけいおねがいします',
    answer:
      '1. "Sumimasen!" (Excuse me!) - Shout politely to call staff.\n2. "Toriaezu biiru de!" (Draft beer to start off, please!).\n3. "Osusume wa nan desu ka?" (What is your recommendation?)\n4. "Okaikei onegaishimasu" (Check please!).',
    mnemonic:
      'Memory Trick: "Toriaezu" sounds like "Try a beer right now" — say it the moment you sit down!',
    cultureTip: 'Most izakayas serve "Otoushi" (a small appetizer table charge) automatically.',
  },
  {
    title: 'Excuse Me & Super-Polite "Sumimasen"',
    topic: 'Cultural Politeness',
    question: 'Why is "Sumimasen" used for both "Sorry", "Excuse me", and "Thank you"?',
    japanese: 'すみません',
    furigana: 'すみません',
    answer:
      '"Sumimasen" literally means "my feeling has not yet settled" (I feel indebted to you for your trouble). That is why Japanese speakers use it to politely apologize, grab attention, or thank someone who picked up a dropped item.',
    mnemonic:
      'Memory Trick: Think of it as "I am so grateful/mindful for your trouble!"',
    cultureTip: 'A slight 15-degree nod/bow when saying "sumimasen" makes it twice as polite.',
  },
];

export const MnemonicSensei: React.FC = () => {
  const [selectedTip, setSelectedTip] = useState<PreloadedTip>(PRELOADED_TIPS[0]);
  const [userQuery, setUserQuery] = useState<string>('');
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);

  const handleAskQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;
    soundFx.playCorrect();

    // Smart contextual explanation generator
    const query = userQuery.toLowerCase();
    if (query.includes('arigatou') || query.includes('thank')) {
      setCustomAnswer(
        '有難う (Arigatou) comes from "ari-gatai" (hard for this to exist / a rare blessing). When someone does you a favor, you acknowledge how wonderfully rare and blessed their kindness is!'
      );
    } else if (query.includes('kanji') || query.includes('remember')) {
      setCustomAnswer(
        'To remember Kanji efficiently: never memorize single isolated strokes. Group kanji by shared Radicals (e.g., 木 tree, 林 grove, 森 forest) and weave an emotional or humorous visual story.'
      );
    } else if (query.includes('sushi') || query.includes('food')) {
      setCustomAnswer(
        'When eating Nigiri sushi at high-end counters, it is polite to dip only the fish topping (neta) into the soy sauce, not the rice. The rice is already seasoned with vinegar!'
      );
    } else {
      setCustomAnswer(
        `Great question about "${userQuery}"! In Japanese, context and politeness are key. For vocabulary like this, attach it to a real sensory situation (visualize a sign in Tokyo or a server in Kyoto) and speak the mora aloud 3 times to lock in pronunciation.`
      );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-10 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <span>Mnemonic Sensei</span>
          <span className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/60">
            記憶の知恵
          </span>
        </h1>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
          Master tricky nuances, pitch accents, memory hooks, and cultural secrets tailored for foreigners.
        </p>
      </div>

      {/* Preset Topics Carousel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {PRELOADED_TIPS.map((tip, idx) => (
          <button
            key={idx}
            onClick={() => {
              soundFx.playKeypress();
              setSelectedTip(tip);
              setCustomAnswer(null);
            }}
            className={`p-3 text-left rounded-2xl border transition-all ${
              selectedTip.title === tip.title
                ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 shadow-xs'
                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:bg-stone-50'
            }`}
          >
            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block mb-1">
              {tip.topic}
            </span>
            <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 block">
              {tip.title}
            </span>
          </button>
        ))}
      </div>

      {/* Main Feature Display Card */}
      <div className="p-6 sm:p-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm mb-6">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
              {selectedTip.topic}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1">
              {selectedTip.question}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => speakJapanese(selectedTip.japanese)}
              className="p-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 rounded-xl transition-colors"
              title="Hear Pronunciation"
            >
              <Volume2 className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>

        {/* Japanese Key phrase */}
        <div className="mt-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700/60">
          <div className="text-xs text-stone-500 font-japanese mb-0.5">{selectedTip.furigana}</div>
          <div className="text-2xl font-japanese font-bold text-stone-900 dark:text-stone-100">
            {selectedTip.japanese}
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-5 text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
          {selectedTip.answer}
        </div>

        {/* Mnemonic Hook */}
        <div className="mt-5 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-xs">
          <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-1 text-sm">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Mnemonic Memory Hook</span>
          </div>
          <p className="text-amber-900/90 dark:text-amber-200 font-medium leading-relaxed">
            {selectedTip.mnemonic}
          </p>
        </div>

        {/* Cultural etiquette nuance */}
        {selectedTip.cultureTip && (
          <div className="mt-4 p-3.5 bg-stone-100/70 dark:bg-stone-800/40 rounded-xl text-xs text-stone-600 dark:text-stone-400 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-stone-800 dark:text-stone-200">Cultural Etiquette Tip: </span>
              <span>{selectedTip.cultureTip}</span>
            </div>
          </div>
        )}
      </div>

      {/* Ask Sensei Interactive Prompt Box */}
      <div className="p-6 bg-stone-100/80 dark:bg-stone-800/50 rounded-3xl border border-stone-200 dark:border-stone-700/70">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-red-600" />
          <span>Ask Sensei a Specific Word, Mnemonic, or Etiquette Question</span>
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-4">
          Type any word (e.g. "arigatou", "kanji memorization tips", "chopsticks rule") for an instant memory breakdown.
        </p>

        <form onSubmit={handleAskQuery} className="flex gap-2">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="e.g. How to remember 休, or difference between は and が..."
            className="flex-1 px-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask Sensei</span>
          </button>
        </form>

        {customAnswer && (
          <div className="mt-4 p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 animate-fade-in">
            <span className="font-bold text-red-600 dark:text-red-400 block mb-1">Sensei's Advice:</span>
            <p className="leading-relaxed">{customAnswer}</p>
          </div>
        )}
      </div>
    </div>
  );
};
