import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateWordleGuess,
  convertRomajiToKana,
  tokenizeKana,
  calculateTypingScore,
  calculateNextSRSInterval,
} from './gameRules';

test('Wordle evaluation - exact match marks all correct', () => {
  const guess = ['さ', 'く', 'ら'];
  const target = ['さ', 'く', 'ら'];
  const result = evaluateWordleGuess(guess, target);
  assert.deepEqual(result, ['correct', 'correct', 'correct']);
});

test('Wordle evaluation - misplaced and absent characters', () => {
  const guess = ['ら', 'く', 'ね'];
  const target = ['さ', 'く', 'ら'];
  const result = evaluateWordleGuess(guess, target);
  assert.deepEqual(result, ['present', 'correct', 'absent']);
});

test('Wordle evaluation - duplicate handling does not over-mark present', () => {
  // Target has one 'さ'. Guess has two 'さ'.
  const guess = ['さ', 'さ', 'ね'];
  const target = ['さ', 'く', 'ら'];
  const result = evaluateWordleGuess(guess, target);
  // First 'さ' is correct, second should be absent (no extra 'さ')
  assert.deepEqual(result, ['correct', 'absent', 'absent']);
});

test('Romaji to Kana conversion - basic words', () => {
  assert.equal(convertRomajiToKana('sakura'), 'さくら');
  assert.equal(convertRomajiToKana('sushi'), 'すし');
  assert.equal(convertRomajiToKana('arigatou'), 'ありがとう');
  assert.equal(convertRomajiToKana('konnichiwa'), 'こんにちは');
});

test('Romaji to Kana conversion - sokuon (double consonants) and compound kya', () => {
  assert.equal(convertRomajiToKana('gakkou'), 'がっこう');
  assert.equal(convertRomajiToKana('tokyo'), 'とうきょう');
  assert.equal(convertRomajiToKana('kyoto'), 'きょうと');
  assert.equal(convertRomajiToKana('chotto'), 'ちょっと');
});

test('Kana tokenization - groups compound mora together', () => {
  const tokens = tokenizeKana('きょうと');
  assert.deepEqual(tokens, ['きょ', 'う', 'と']);
});

test('Typing score calculation', () => {
  const score = calculateTypingScore(120, 1.0, 10, 60);
  assert.equal(score.cpm, 120);
  assert.equal(score.wpm, 24);
  assert.ok(score.totalScore > 1000);
});

test('SRS interval progression', () => {
  const again = calculateNextSRSInterval(2, 1);
  assert.equal(again.nextStage, 0);
  assert.equal(again.nextReviewDays, 1);

  const good = calculateNextSRSInterval(1, 3);
  assert.equal(good.nextStage, 2);
  assert.equal(good.nextReviewDays, 4);

  const easy = calculateNextSRSInterval(2, 4);
  assert.equal(easy.nextStage, 4);
  assert.equal(easy.nextReviewDays, 14);
});
