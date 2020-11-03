import { Token } from "micromark/lib/shared-types";

export default {
  enter: {
    noteLinkMarker: enterChecked
  },
  exit: {
    noteLinkMarker: exitCheck,
    noteLink: exitNoteLinkContents
  }
};

function exitNoteLinkContents(token: Token): void {
  this.stack[this.stack.length-1].contents = this.sliceSerialize(token);
}

function enterChecked(token: Token): void {
  this.enter({type: 'noteLink'}, token);
}

function exitCheck(token: Token): void {
  this.exit(token);
}