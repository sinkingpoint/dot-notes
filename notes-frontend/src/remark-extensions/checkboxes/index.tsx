// Taken from:
// - https://github.com/micromark/micromark-extension-gfm-task-list-item/blob/main/syntax.js
// - https://github.com/remarkjs/remark-gfm/blob/main/index.js
// And typescript-ified, with modifications to allow checkmarks outside of lists.
// License: MIT
// - https://github.com/micromark/micromark-extension-gfm-task-list-item/blob/main/license
// - https://github.com/remarkjs/remark-gfm/blob/main/license
import { State } from 'micromark/dist/shared-types';
import { Effects, Okay, NotOkay } from 'micromark/lib/shared-types';
import fromMarkdown from "./fromMarkdown";
import renderer from './renderer';

export const render = renderer;
export const plugin = function checkbox(): void {
  const data = this.data();

  add('micromarkExtensions', {
    text: {91: [{tokenize: tokenizeTasklistCheck}]}
  });

  add('fromMarkdownExtensions', fromMarkdown);

  function add(field: string, value: unknown) {
    /* istanbul ignore if - other extensions. */
    if (data[field]) data[field].push(value);
    else data[field] = [value];
  }
}

function tokenizeTasklistCheck(effects: Effects, ok: Okay, nok: NotOkay): State {
  const inside = (code: number) => {
    // Tab or space.
    if (code === -2 || code === 32) {
      effects.enter('taskListCheckValueUnchecked');
      effects.consume(code);
      effects.exit('taskListCheckValueUnchecked');
      return close;
    }

    // Upper- and lower `x`.
    if (code === 88 || code === 120) {
      effects.enter('taskListCheckValueChecked');
      effects.consume(code);
      effects.exit('taskListCheckValueChecked');
      return close;
    }

    return nok(code);
  }

  const close = (code: number) => {
    // `]`
    if (code === 93) {
      effects.enter('taskListCheckMarker');
      effects.consume(code);
      effects.exit('taskListCheckMarker');
      effects.exit('taskListCheck');
      return after;
    }

    return nok(code);
  }

  const after = (code: number) => {
    // Tab or space.
    if (code === -2 || code === 32) {
      return ok(code);
    }

    return nok(code);
  }

  return (code: number) => {
    if (
      // Exit if not `[`.
      code !== 91
    ) {
      return nok(code);
    }

    effects.enter('taskListCheck');
    effects.enter('taskListCheckMarker');
    effects.consume(code);
    effects.exit('taskListCheckMarker');
    return inside;
  }
}