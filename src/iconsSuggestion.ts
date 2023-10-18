import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
} from 'obsidian';
import { getAllLoadedIconNames } from './iconPackManager';
import icon from './lib/icon';

export default class SuggestionIcon extends EditorSuggest<string> {
  constructor(app: App) {
    super(app);
  }

  onTrigger(cursor: EditorPosition, editor: Editor): EditorSuggestTriggerInfo {
    // Isolate shortcode starting position closest to the cursor.
    const shortcodeStart = editor
      .getLine(cursor.line)
      .substring(0, cursor.ch)
      .lastIndexOf(':');

    // onTrigger needs to return null as soon as possible to save processing performance.
    if (shortcodeStart == -1) return null;

    const regexOngoingShortcode = editor
      .getLine(cursor.line)
      .substring(shortcodeStart, cursor.ch)
      .match(/^(:)\w+$/g);

    if (regexOngoingShortcode == null) return null;

    const startingIndex = editor
      .getLine(cursor.line)
      .indexOf(regexOngoingShortcode[0]);

    return {
      start: {
        line: cursor.line,
        ch: startingIndex,
      },
      end: {
        line: cursor.line,
        ch: startingIndex + regexOngoingShortcode[0].length,
      },
      query: regexOngoingShortcode[0],
    };
  }

  getSuggestions(context: EditorSuggestContext): string[] | Promise<string[]> {
    const queryLowerCase = context.query.substring(1).toLowerCase();

    // Store all icons corresponding to the current query
    const iconsNameArray = getAllLoadedIconNames()
      .filter((iconObject) =>
        iconObject.name.toLowerCase().includes(queryLowerCase),
      )
      .map((iconObject) => iconObject.prefix + iconObject.name);

    return iconsNameArray;
  }

  renderSuggestion(value: string, el: HTMLElement): void {
    const iconObject = icon.getIconByName(value);
    el.innerHTML = `${iconObject.svgElement} ${value}`;
  }

  selectSuggestion(value: string): void {
    // Save current line to split it
    const cursor = this.context.editor.getCursor();
    const line = this.context.editor.getLine(cursor.line);
    // Replace query with iconNameWithPrefix
    const updatedLine = line.replace(this.context.query, `:${value}:`);
    this.context.editor.setLine(cursor.line, updatedLine);
  }
}
