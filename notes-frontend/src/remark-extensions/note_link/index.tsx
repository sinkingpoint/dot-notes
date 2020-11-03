import { Effects, Okay, NotOkay, State } from "micromark/dist/shared-types";
import fromMarkdown from "./fromMarkdown";
import renderer from './renderer';

export const render = renderer;

export const plugin = function checkbox(): void {
  const data = this.data();

  add('micromarkExtensions', {
    text: {91: [{tokenize: tokenizeNoteLink}]}
  });

  add('fromMarkdownExtensions', fromMarkdown);

  function add(field: string, value: unknown) {
    /* istanbul ignore if - other extensions. */
    if (data[field]) data[field].push(value);
    else data[field] = [value];
  }
}

const maxIDSize = 50;
function tokenizeNoteLink(effects: Effects, ok: Okay, nok: NotOkay): State {
  let size: number;
  const repeatedChars = (expectedCode: number, leftover: number, next: (code: number) => void | State): State =>  {
    return (code: number) => {
      if(code !== expectedCode) {
        return nok(code);
      }

      effects.consume(code);

      if(leftover == 1) {
        return next;
      }
      
      return repeatedChars(expectedCode, leftover-1, next);
    }
  }

  const body = function(code: number): void | State {
    if(code !== 93 && size ++ < maxIDSize) {
      effects.consume(code);
      return body;
    }
    else if(code === 93) {
      effects.exit('noteLink');
      return repeatedChars(93, 2, (code) => {
        effects.exit('noteLinkMarker');
        return ok(code);
      })(code);
    }

    return nok(code);
  }

  return (code: number) => {
    if(code !== 91) {
      return nok(code);
    }

    effects.enter('noteLinkMarker');
    return repeatedChars(91, 2, () => {
      effects.enter('noteLink');
      size = 0;
      return body;
    })(code);
  }
}