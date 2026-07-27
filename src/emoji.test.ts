import { Mock, describe, expect, it, vi } from 'vitest';
import twemoji from '@twemoji/api';
import emoji from './emoji';

vi.mock('@twemoji/api');

describe('isEmoji', () => {
  it('should return `true` for valid emojis', () => {
    expect(emoji.isEmoji('👍')).toBe(true);
    expect(emoji.isEmoji('🇺🇸')).toBe(true);
    expect(emoji.isEmoji('🤔')).toBe(true);
    expect(emoji.isEmoji('😂')).toBe(true);
    expect(emoji.isEmoji('👍🏼')).toBe(true);
    expect(emoji.isEmoji('😂😂')).toBe(true);
  });

  it('should return `false` for invalid emojis', () => {
    expect(emoji.isEmoji('hello')).toBe(false);
    expect(emoji.isEmoji('123')).toBe(false);
    expect(emoji.isEmoji('*')).toBe(false);
    expect(emoji.isEmoji('-')).toBe(false);
    expect(emoji.isEmoji('#')).toBe(false);
    expect(emoji.isEmoji('+')).toBe(false);
  });

  it('should return `false` for text-presentation characters without variation selector', () => {
    // These characters are text by default; without U+FE0F they must not be
    // treated as emoji (avoids spurious twemoji CDN requests / hover freeze).
    expect(emoji.isEmoji('\u2122')).toBe(false);  // ™ trade mark sign
    expect(emoji.isEmoji('\u00A9')).toBe(false);  // © copyright sign
    expect(emoji.isEmoji('\u00AE')).toBe(false);  // ® registered sign
    expect(emoji.isEmoji('\u2139')).toBe(false);  // ℹ information source
  });

  it('should return `true` for text-presentation characters WITH variation selector', () => {
    expect(emoji.isEmoji('\u2122\uFE0F')).toBe(true);  // ™️
    expect(emoji.isEmoji('\u00A9\uFE0F')).toBe(true);  // ©️
    expect(emoji.isEmoji('\u00AE\uFE0F')).toBe(true);  // ®️
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

  it('should return `undefined` for invalid emojis', () => {
    expect(emoji.getShortcode('hello')).toBe(undefined);
    expect(emoji.getShortcode('123')).toBe(undefined);
    expect(emoji.getShortcode('🤗 hello')).toBe(undefined);
    expect(emoji.getShortcode('hello 🤗')).toBe(undefined);
  });
});

describe('parseEmoji', () => {
  it('should return emoji when emojiStyle is `native`', () => {
    expect(emoji.parseEmoji('native', '👍')).toBe('👍');
    expect(emoji.parseEmoji('native', '🤔')).toBe('🤔');
    expect(emoji.parseEmoji('native', '😂')).toBe('😂');
  });

  it('should call twemoji.parse when emojiStyle is `twemoji`', () => {
    (twemoji.parse as Mock).mockImplementation(() => '👍');
    emoji.parseEmoji('twemoji', '👍');
    expect(twemoji.parse).toHaveBeenCalledTimes(1);
  });
});
