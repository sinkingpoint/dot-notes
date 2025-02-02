import { Token } from "micromark/lib/shared-types";

export default {
  enter: {
    taskListCheckValueChecked: enterChecked,
    taskListCheckValueUnchecked: enterChecked
  },
  exit: {
    taskListCheckValueChecked: exitCheck,
    taskListCheckValueUnchecked: exitCheck
  }
};

function enterChecked(token: Token): void {
  this.enter({type: 'checkbox', children: [], checked: token.type === "taskListCheckValueChecked"}, token)
}

function exitCheck(token: Token): void {
  this.exit(token);
}