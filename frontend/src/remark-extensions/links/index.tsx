import {gfmAutolinkLiteralFromMarkdown} from 'mdast-util-gfm-autolink-literal'
import {gfmAutolinkLiteral} from 'micromark-extension-gfm-autolink-literal'

export const plugin = function links(): void {
  const data = this.data();

  add('micromarkExtensions', gfmAutolinkLiteral);
  add('fromMarkdownExtensions', gfmAutolinkLiteralFromMarkdown);

  function add(field: string, value: unknown) {
    /* istanbul ignore if - other extensions. */
    if (data[field]) data[field].push(value);
    else data[field] = [value];
  }
}