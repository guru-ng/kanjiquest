/**
 * Core game rules and pure logic for Japanese learning games.
 * Decoupled from React UI for deterministic testing and fast verification.
 */

export type TileStatus = 'correct' | 'present' | 'absent' | 'empty';

/**
 * Evaluates a Japanese Wordle guess against a target word (both represented as arrays of mora/kana).
 * Correctly accounts for character frequency so duplicate letters aren't over-marked as 'present'.
 */
export function evaluateWordleGuess(guess: string[], target: string[]): TileStatus[] {
  const length = target.length;
  const result: TileStatus[] = new Array(length).fill('absent');
  const targetCounts: Record<string, number> = {};

  // Count target frequencies
  for (let i = 0; i < length; i++) {
    const char = target[i];
    targetCounts[char] = (targetCounts[char] || 0) + 1;
  }

  // First pass: mark correct positions
  for (let i = 0; i < length; i++) {
    if (guess[i] === target[i]) {
      result[i] = 'correct';
      targetCounts[guess[i]]--;
    }
  }

  // Second pass: mark present characters in wrong positions
  for (let i = 0; i < length; i++) {
    if (result[i] !== 'correct') {
      const char = guess[i];
      if (char && targetCounts[char] && targetCounts[char] > 0) {
        result[i] = 'present';
        targetCounts[char]--;
      } else {
        result[i] = 'absent';
      }
    }
  }

  return result;
}

/**
 * Standard Romaji to Hiragana conversion mapping.
 * Supports standard Hepburn, kunrei-shiki variants, and common IME typing patterns.
 */
export const ROMAJI_TO_HIRAGANA: Record<string, string> = {
  // Vowels
  a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お',

  // K-row
  ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ',
  kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ',

  // S-row
  sa: 'さ', shi: 'し', si: 'し', su: 'す', se: 'せ', so: 'そ',
  sha: 'しゃ', shu: 'しゅ', sho: 'しょ',
  sya: 'しゃ', syu: 'しゅ', syo: 'しょ',

  // T-row
  ta: 'た', chi: 'ち', ti: 'ち', tsu: 'つ', tu: 'つ', te: 'て', to: 'と',
  cha: 'ちゃ', chu: 'ちゅ', cho: 'ちょ',
  tya: 'ちゃ', tyu: 'ちゅ', tyo: 'ちょ',

  // N-row
  na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の',
  nya: 'にゃ', nyu: 'にゅ', nyo: 'にょ',

  // H-row
  ha: 'は', hi: 'ひ', fu: 'ふ', hu: 'ふ', he: 'へ', ho: 'ほ',
  hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ',

  // M-row
  ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も',
  mya: 'みゃ', myu: 'みゅ', myo: 'みょ',

  // Y-row
  ya: 'や', yu: 'ゆ', yo: 'よ',

  // R-row
  ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ',
  rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ',

  // W-row & N
  wa: 'わ', wo: 'を', n: 'ん', nn: 'ん', "n'": 'ん',

  // G-row (Dakuten)
  ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご',
  gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ',

  // Z-row (Dakuten)
  za: 'ざ', ji: 'じ', zi: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ',
  ja: 'じゃ', ju: 'じゅ', jo: 'じょ',
  jya: 'じゃ', jyu: 'じゅ', jyo: 'じょ',

  // D-row (Dakuten)
  da: 'だ', di: 'ぢ', du: 'づ', de: 'で', do: 'ど',

  // B-row (Dakuten)
  ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ',
  bya: 'びゃ', byu: 'びゅ', byo: 'びょ',

  // P-row (Handakuten)
  pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ',
  pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ',
};

/**
 * Converts a romaji string into an array of mora / hiragana tokens.
 * Handles sokuon (small tsu っ for double consonants like "kk", "tt", "pp"),
 * double n before vowels (e.g. 'nni' -> 'んに', 'nna' -> 'んな'),
 * and special 'nn'.
 */
export function convertRomajiToKana(input: string): string {
  let text = input.toLowerCase().trim();
  let result = '';
  let i = 0;

  // Handle common long vowel spelling variants and particle conventions
  if (text === 'tokyo') text = 'toukyou';
  if (text === 'kyoto') text = 'kyouto';
  if (text === 'osaka') text = 'oosaka';
  if (text === 'konnichiwa') return 'こんにちは';
  if (text === 'konbanwa') return 'こんばんは';

  while (i < text.length) {
    // Check if 'n' followed by 'n' and vowel (e.g., 'nni' in konnichiwa -> 'ん' + 'に')
    if (text[i] === 'n' && text[i + 1] === 'n' && text[i + 2] && /[aiueo]/.test(text[i + 2])) {
      result += 'ん';
      const mora = 'n' + text[i + 2];
      result += ROMAJI_TO_HIRAGANA[mora] || mora;
      i += 3;
      continue;
    }

    // Check double n (nn -> ん)
    if (text[i] === 'n' && text[i + 1] === 'n') {
      result += 'ん';
      i += 2;
      continue;
    }

    // Check sokuon (double consonants like 'kk', 'pp', 'ss', 'tt') except 'nn'
    if (
      i + 1 < text.length &&
      text[i] === text[i + 1] &&
      /[bcdfghjklmpqrstvwxyz]/.test(text[i]) &&
      text[i] !== 'n'
    ) {
      result += 'っ';
      i++;
      continue;
    }

    // Try 3-character combos (kya, chu, etc.)
    const three = text.slice(i, i + 3);
    if (ROMAJI_TO_HIRAGANA[three]) {
      result += ROMAJI_TO_HIRAGANA[three];
      i += 3;
      continue;
    }

    // Try 2-character combos (ka, ki, etc.)
    const two = text.slice(i, i + 2);
    if (ROMAJI_TO_HIRAGANA[two]) {
      result += ROMAJI_TO_HIRAGANA[two];
      i += 2;
      continue;
    }

    // Check single 'n' followed by consonant or end of string
    if (text[i] === 'n') {
      const next = text[i + 1];
      if (!next || !/[aiueoy]/.test(next)) {
        result += 'ん';
        i += 1;
        continue;
      }
    }

    // Try 1-character (vowels)
    const one = text.slice(i, i + 1);
    if (ROMAJI_TO_HIRAGANA[one]) {
      result += ROMAJI_TO_HIRAGANA[one];
      i += 1;
      continue;
    }

    // Fallback: keep original character
    result += text[i];
    i++;
  }

  return result;
}

/**
 * Tokenizes a hiragana word into mora chunks (e.g., "きょう" -> ["きょ", "う"], "がっこう" -> ["が", "っ", "こ", "う"])
 * Useful for Japanese Wordle character grids where compound kana (きゃ, ょ) belong together or separate according to rule.
 * Standard Japanese Wordle usually treats each displayed mora or character as a tile.
 */
export function tokenizeKana(kanaStr: string): string[] {
  const smallKana = new Set(['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ']);
  const tokens: string[] = [];

  for (let i = 0; i < kanaStr.length; i++) {
    const char = kanaStr[i];
    const nextChar = kanaStr[i + 1];

    if (nextChar && smallKana.has(nextChar)) {
      tokens.push(char + nextChar);
      i++; // skip small kana
    } else {
      tokens.push(char);
    }
  }

  return tokens;
}

/**
 * Calculates Typing game score based on CPM, accuracy %, and combo streak.
 */
export function calculateTypingScore(
  charsTyped: number,
  accuracyRatio: number,
  maxStreak: number,
  timeSeconds: number
): { cpm: number; wpm: number; totalScore: number } {
  const minutes = Math.max(timeSeconds / 60, 0.1);
  const cpm = Math.round(charsTyped / minutes);
  const wpm = Math.round(cpm / 5); // 5 characters ~ 1 word
  const accuracyMultiplier = Math.max(0.5, accuracyRatio);
  const streakBonus = Math.floor(maxStreak * 25);
  const totalScore = Math.round((charsTyped * 10 + streakBonus) * accuracyMultiplier);

  return { cpm, wpm, totalScore };
}

/**
 * Spaced Repetition (SRS) interval helper.
 * Ratings: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
 */
export function calculateNextSRSInterval(
  currentStage: number,
  rating: 1 | 2 | 3 | 4
): { nextStage: number; nextReviewDays: number } {
  let nextStage = currentStage;

  if (rating === 1) {
    // Reset to stage 0
    nextStage = 0;
  } else if (rating === 2) {
    // Stay or slight increase
    nextStage = Math.max(1, currentStage);
  } else if (rating === 3) {
    nextStage = currentStage + 1;
  } else if (rating === 4) {
    nextStage = currentStage + 2;
  }

  const intervalMap = [1, 2, 4, 7, 14, 30, 60, 120];
  const nextReviewDays = intervalMap[Math.min(nextStage, intervalMap.length - 1)];

  return { nextStage, nextReviewDays };
}
