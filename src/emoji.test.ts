import { expect, it } from 'vitest';
import emoji from './emoji';

it('should return `true` for valid emojis', () => {
  expect(emoji.isEmoji('👍')).toBe(true);
  expect(emoji.isEmoji('🇺🇸')).toBe(true);
  expect(emoji.isEmoji('🤔')).toBe(true);
  expect(emoji.isEmoji('😂')).toBe(true);
  expect(emoji.isEmoji('👍🏼')).toBe(true);
});

it('should return `false` for invalid emojis', () => {
  expect(emoji.isEmoji('hello')).toBe(false);
  expect(emoji.isEmoji('123')).toBe(false);
  expect(emoji.isEmoji('😂😂')).toBe(true);
});
