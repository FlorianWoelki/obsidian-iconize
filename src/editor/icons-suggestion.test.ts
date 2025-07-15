import {
  Mock,
  MockInstance,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import icon from '@lib/icon';
import * as iconPackManager from '@app/icon-pack-manager';
import * as util from '@app/util';
import SuggestionIcon from './icons-suggestion';

vi.mock('obsidian', () => ({
  App: class {},
  Editor: class {},
  EditorPosition: class {},
  EditorSuggest: class {},
  EditorSuggestContext: class {},
  EditorSuggestTriggerInfo: class {},
}));

let app: any;
let plugin: any;
let suggestionIcon: SuggestionIcon;
let replaceRangeMock: Mock;

beforeEach(() => {
  vi.restoreAllMocks();
  app = {};
  plugin = {
    getSettings: () => ({
      iconIdentifier: ':',
    }),
  };
  suggestionIcon = new SuggestionIcon(app, plugin);
  replaceRangeMock = vi.fn();
  suggestionIcon.context = {
    start: {
      line: 0,
      ch: 0,
    },
    end: {
      line: 0,
      ch: 0,
    },
    editor: {
      replaceRange: replaceRangeMock,
    },
  } as any;
  vi.spyOn(util, 'saveIconToIconPack').mockImplementation(() => {});
});

describe('selectSuggestion', () => {
  it('should replace the range with the emoji when the value is an emoji', () => {
    const emojiValue = 'smiley_face';
    suggestionIcon.selectSuggestion(emojiValue);
    expect(replaceRangeMock).toHaveBeenCalledTimes(1);
    expect(replaceRangeMock).toHaveBeenCalledWith(
      `:${emojiValue}:`,
      {
        line: 0,
        ch: 0,
      },
      {
        line: 0,
        ch: 0,
      },
    );
  });

  it('should replace the range with the icon when the value is an icon', () => {
    const iconValue = 'heart_fill';
    suggestionIcon.selectSuggestion(iconValue);
    expect(replaceRangeMock).toHaveBeenCalledTimes(1);
    expect(replaceRangeMock).toHaveBeenCalledWith(
      `:${iconValue}:`,
      {
        line: 0,
        ch: 0,
      },
      {
        line: 0,
        ch: 0,
      },
    );
  });
});

describe('renderSuggestion', () => {
  it('should render a icon suggestion when the value is an icon', () => {
    const getIconByName = vi.spyOn(icon, 'getIconByName');
    getIconByName.mockImplementationOnce(
      () =>
        ({
          svgElement: '<svg></svg>',
        }) as any,
    );

    const el = document.createElement('div');
    suggestionIcon.renderSuggestion('heart_fill', el);

    expect(el.innerHTML).toBe('<svg></svg> <span>heart_fill</span>');

    getIconByName.mockRestore();
  });

  it('should render a emoji suggestion when the value is an icon', () => {
    const getIconByName = vi.spyOn(icon, 'getIconByName');
    getIconByName.mockImplementationOnce(() => null as any);

    const el = document.createElement('div');
    suggestionIcon.renderSuggestion('😁', el);

    expect(el.innerHTML).toBe(
      '<span>😁</span> <span>beaming_face_with_smiling_eyes</span>',
    );

    getIconByName.mockRestore();
  });

  it('should not render emoji shortcode if the emoji has no shortcode', () => {
    const getIconByName = vi.spyOn(icon, 'getIconByName');
    getIconByName.mockImplementationOnce(() => null as any);

    const el = document.createElement('div');
    suggestionIcon.renderSuggestion('hehe', el);

    expect(el.innerHTML).toBe('');

    getIconByName.mockRestore();
  });
});

describe.skip('getSuggestions', () => {
  let getAllLoadedIconNamesSpy: MockInstance;
  beforeEach(() => {
    vi.restoreAllMocks();
    getAllLoadedIconNamesSpy = vi.spyOn(iconPackManager.IconPackManager.prototype, 'allLoadedIconNames', 'get');
    getAllLoadedIconNamesSpy.mockImplementationOnce(() => [
      {
        name: 'winking_face',
        prefix: 'Ib',
      },
      {
        name: 'heart',
        prefix: 'Ib',
      },
    ]);
  });

  it('should return an array of icon names and emoji shortcodes', () => {
    suggestionIcon.context = {
      ...suggestionIcon.context,
      query: 'winking_face',
    };
    const suggestions = suggestionIcon.getSuggestions(suggestionIcon.context);
    expect(suggestions).toEqual(['Ibwinking_face', '😉', '😜', '🤔']);
  });
});

describe('onTrigger', () => {
  let editor: any;
  let cursor: any;
  beforeEach(() => {
    vi.restoreAllMocks();
    cursor = {
      line: 0,
      ch: 0,
    };
    editor = {
      getLine: () => '',
    };
  });

  it('should return `null` when the cursor is not on a shortcode', () => {
    const result = suggestionIcon.onTrigger(cursor, editor);
    expect(result).toBeNull();
  });

  it('should return `null` when the shortcode is done', () => {
    cursor.ch = 6;
    editor.getLine = () => ':wink:';
    const result = suggestionIcon.onTrigger(cursor, editor);
    expect(result).toBeNull();
  });

  it('should return the shortcode when the shortcode is not done yet', () => {
    cursor.ch = 5;
    editor.getLine = () => ':wink';
    const result = suggestionIcon.onTrigger(cursor, editor);
    expect(result).toEqual({
      start: {
        line: 0,
        ch: 0,
      },
      end: {
        line: 0,
        ch: 5,
      },
      query: ':wink',
    });
  });
});
