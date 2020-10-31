import React, { ReactNode, Component } from 'react';
import { NoteContents } from '../api/client';
import NestedList, { NestedListData } from '../utils/nested_list';
import {EditableListItemProps, EditableListItem} from './editable_list_item';

interface Note {
  value: string,
  key?: string
}

interface NotesEntryFormProps {
  initialData?: NestedList<string>;
  className?: string;
  onChange?(newData: NoteContents[]): void;
}

interface AutoFocusProps{
  index: number[],
  cursor: {start?: number, end?: number}
}

interface NotesEntryFormState {
  lines: NestedList<Note>;
  toFocus?: AutoFocusProps;
  nextKey: number;
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

function renderNoteData(data: NestedListData<Note>, indices: number[], autoFocusIndices?: AutoFocusProps, props?: EditableListItemProps) {
  if(typeof data === "string"){
    throw "Strings should be keyified, bailing";
  }
  else if(data instanceof NestedList) {
    let key = "";
    const children = data.data.map((val, i) => {
      const newIndices = indices.slice().concat([i]);
      const newNode = renderNoteData(val, newIndices, autoFocusIndices, props);
      key += newNode.key;

      return newNode;
    });

    return <ul className="note-list" key={key}>
      {children}
    </ul>;
  }
  else {
    return <EditableListItem 
      indices={indices} 
      placeHolder={"Click to add content"} 
      content={data.value} key={data.key} 
      autoFocus={autoFocusIndices && arrayEquals(indices, autoFocusIndices.index) ? autoFocusIndices.cursor : undefined} 
      {...props}
    />;
  }
}

interface KeyifyReturn {
  data: NestedList<Note> | Note,
  nextKey: number
}

function unkeyify(data: NestedList<Note>): NoteContents[] {
  const newData: NoteContents[] = [];
  data.data.forEach(element => {
    if(element instanceof NestedList) {
      newData.push(unkeyify(element));
    }
    else {
      newData.push(element.value);
    }
  });

  return newData;
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
  else if(data instanceof NestedList) {
    return {
      data: new NestedList<Note>(data.data.map((val) => {
        const ret = keyify(val, nextKey);
        nextKey = ret.nextKey;
        return ret.data;
      })),
      nextKey: nextKey
    }
  }
}

class NotesEntryForm extends Component<NotesEntryFormProps, NotesEntryFormState> {
  constructor(props: NotesEntryFormProps) {
    super(props);
    const { data, nextKey } = keyify(props.initialData || new NestedList<string>(), 0);
    this.state = {
      lines: data as NestedList<Note>,
      nextKey: nextKey,
      toFocus: {
        index: [0],
        cursor: {
          start: props.initialData.data.length > 0 ? (props.initialData.data[0] as string).length : 0,
          end: props.initialData.data.length > 0 ? (props.initialData.data[0] as string).length : 0,
        }
      }
    };

    this.onNewLine = this.onNewLine.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onBackspace = this.onBackspace.bind(this);
    this.onTab = this.onTab.bind(this);
    this.onChangeFocus = this.onChangeFocus.bind(this);
  }

  onChangeFocus(newIndex: number[]) {
    const toFocus = this.state.toFocus ? { index: newIndex, cursor: {}} : undefined;

    this.setState({
      toFocus: toFocus
    });
  }

  onChange(indices: number[], newValue: string): void {
    const newLines = this.state.lines.clone();
    const oldValue = newLines.get(indices) as Note;
    newLines.set(indices, {
      key: oldValue.key,
      value: newValue
    });

    this.props.onChange && this.props.onChange(unkeyify(newLines));

    const toFocus = this.state.toFocus ? { index: this.state.toFocus.index, cursor: {}} : undefined;

    this.setState({
      lines: newLines,
      toFocus: toFocus
    });
  }

  onBackspace(indices: number[]): void {
    const oldValue = this.state.lines.get(indices) as Note;
    if(oldValue.value == "") {
      const newLines = this.state.lines.clone();
      newLines.delete(indices);

      let newFocusIndex = indices.slice();
      while(newFocusIndex[newFocusIndex.length-1] == 0) {
        newFocusIndex.pop();
      }

      newFocusIndex[newFocusIndex.length-1] -= 1;

      let newFocus = newLines.get(newFocusIndex);
      while(newFocus instanceof NestedList) {
        newFocusIndex.push(newFocus.data.length-1);
        newFocus = (newFocus as NestedList<Note>).get([newFocus.data.length-1]);
      }

      const newLength = (newLines.get(newFocusIndex) as Note).value.length;

      this.props.onChange && this.props.onChange(unkeyify(newLines));

      this.setState({
        lines: newLines,
        toFocus: {
          index: newFocusIndex,
          cursor: {
            start: newLength,
            end: newLength
          }
        }
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

    this.props.onChange && this.props.onChange(unkeyify(newLines));

    this.setState({
      nextKey: newNextKey,
      lines: newLines,
      toFocus: {
        index: indices,
        cursor: {start: 0, end: 0}
      }
    });
  }

  onTab(indices: number[], shift: boolean, cursorStart: number, cursorEnd: number): void {
    const newLines = this.state.lines.clone();
    let newIndex;
    if(shift) {
      if(indices.length == 1) return;
      newIndex = newLines.unnest(indices);
    }
    else {
      // Don't allow indenting twice without an intermediate
      if(indices[indices.length-1] != 0) {
        newIndex = newLines.nest(indices);
      }
    }

    this.props.onChange && this.props.onChange(unkeyify(newLines));

    this.setState({
      lines: newLines,
      toFocus: {
        index: newIndex,
        cursor: {start: cursorStart, end: cursorEnd}
      }
    });
  }

  render(): ReactNode {
    const children = renderNoteData(this.state.lines, [], this.state.toFocus, {onEnter: this.onNewLine, onChange: this.onChange, onDelete: this.onBackspace, onTab: this.onTab, onClick: this.onChangeFocus});
    return <div className={this.props.className}>{children}</div>;
  }
}

export default NotesEntryForm;