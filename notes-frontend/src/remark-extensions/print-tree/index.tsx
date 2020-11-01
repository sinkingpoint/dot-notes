var visit = require('unist-util-visit');

export default function attacher() {
  return transformer

  function transformer(tree: any, file: any) {
    visit(tree, 'root', visitor)

    function visitor(node: any) {
      console.log(node)
    }
  }
}
