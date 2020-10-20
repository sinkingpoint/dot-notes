import React, { ReactNode, Component, ChangeEvent } from 'react';
import NestedList, { NestedListData, NestedListType } from '../utils/nested_list';
import {EditableListItemProps, EditableListItem} from './editable_list_item';

// {
//   "cats",
//   "dogs",
//   [
//     "more cats",
//     [
//       "more dogs"
//     ],
//     "pigs"
//   ],
//   "more pigs"
// }

interface Note {
  value: string,
  key?: string
}

interface NotesEntryFormProps {
  initialData?: NestedListData<string>;
}

interface NotesEntryFormState {
  lines: NestedList<Note>;
  toFocus?: number[];
  nextKey: number;
}

interface KeyifyReturn {
  data: NestedListData<Note>,
  nextKey: number
}

function arrayEquals(a1: number[], a2: number[]) {
  if(a1 == undefined || a2 == undefined || a1.length != a2.length) {
    return false;
  }

  for(let i=0;i<a1.length;i++) {
    if(a2[i] != a1[i]) {
      return false;
    }
  }

  return true;
}

function renderNoteData(data: NestedListData<Note>, indices: number[], autoFocusIndices?: number[], props?: EditableListItemProps) {
  if(typeof data === "string"){
    throw "Strings should be keyified, bailing";
  }
  else if(data instanceof Array) {
    let key = "";
    const children = data.map((val, i) => {
      const newIndices = indices.slice().concat([i]);
      const newNode = renderNoteData(val, newIndices, autoFocusIndices, props);
      key += newNode.key;

      return newNode;
    });

    return <div className="test" key={key}>
      {children}
    </div>;
  }
  else {
    return <EditableListItem indices={indices} placeHolder={"Click to add content"} content={data.value} key={data.key} {...props} autoFocus={arrayEquals(indices, autoFocusIndices)} />;
  }
}

function keyify(data: NestedListData<string>, nextKey: number) : KeyifyReturn {
  if(typeof data === "string"){
    return {
      data: {
        value: data as string,
        key: (nextKey ++).toString()
      },
      nextKey: nextKey
    }
  }
  else if(data instanceof Array) {
    return {
      data: data.map((val) => {
        const ret = keyify(val, nextKey);
        nextKey = ret.nextKey;
        return ret.data;
      }),
      nextKey: nextKey
    }
  }
  else {
    const noteData = data as Note;
    noteData.key = (nextKey ++).toString();
    return {
      data: noteData,
      nextKey: nextKey
    }
  }
}

class NotesEntryForm extends Component<NotesEntryFormProps, NotesEntryFormState> {
  constructor(props: NotesEntryFormProps) {
    super(props);
    const { data, nextKey } = keyify(props.initialData || [], 0);
    this.state = {
      lines: new NestedList(data as NestedListType<Note>),
      nextKey: nextKey
    };

    this.onNewLine = this.onNewLine.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onBackspace = this.onBackspace.bind(this);
  }

  onChange(indices: number[], newValue: string): void {
    const newLines = this.state.lines.clone();
    const oldValue = newLines.get(indices) as Note;
    newLines.set(indices, {
      key: oldValue.key,
      value: newValue
    });

    this.setState({
      lines: newLines,
      toFocus: undefined
    });
  }

  onBackspace(indices: number[]): void {
    const oldValue = this.state.lines.get(indices) as Note;
    if(oldValue.value == "") {
      const newLines = this.state.lines.clone();
      newLines.delete(indices);

      this.setState({
        lines: newLines,
        toFocus: undefined
      });
    }
  }

  onNewLine(indices: number[]): void {
    const newNextKey = this.state.nextKey + 1;
    const newLines = this.state.lines.clone();
    newLines.push(indices, {
      key: this.state.nextKey.toString(),
      value: ""
    });

    indices[indices.length-1] ++;

    this.setState({
      nextKey: newNextKey,
      lines: newLines,
      toFocus: indices
    });
  }

  render(): ReactNode {
    const children = renderNoteData(this.state.lines.data, [], this.state.toFocus, {onEnter: this.onNewLine, onChange: this.onChange, onDelete: this.onBackspace});
    return children;
  }
}

export default NotesEntryForm;