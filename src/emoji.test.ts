import { describe, expect, it } from 'vitest';
import emoji from './emoji';

describe('isEmoji', () => {
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
});

describe('getShortcode', () => {
  it('should replace whitespaces with underscores', () => {
    expect(emoji.getShortcode('👍')).toBe('thumbs_up');
    expect(emoji.getShortcode('🤔')).toBe('thinking_face');
    expect(emoji.getShortcode('😂')).toBe('face_with_tears_of_joy');
  });

  it('should replace colons with an empty string', () => {
    expect(emoji.getShortcode('🇺🇸')).toBe('flag_united_states');
    expect(emoji.getShortcode('🏴󠁧󠁢󠁥󠁮󠁧󠁿')).toBe('flag_england');
  });
});
