import { Node } from 'unist';
import visit from 'unist-util-visit';

export default function attacher() {
  return function transformer(tree: Node): void {
    visit(tree, 'root', visitor)

    function visitor(node: unknown) {
      console.log(node)
    }
  }
}
