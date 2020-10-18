import React, { ReactNode, Component, ChangeEvent } from 'react';
import EditableListItem from './editable_list_item';

interface NoteLine {
  key: string,
  line: string,
}

interface NotesEntryFormProps {
  initialLines?: string[];
}

interface NotesEntryFormState {
  lines: NoteLine[];
  toFocus?: number;
}

class NotesEntryForm extends Component<NotesEntryFormProps, NotesEntryFormState> {
  constructor(props: NotesEntryFormProps) {
    super(props);
    this.state = {
      lines: (props.initialLines || [""]).map((str, index) => {
        return {
          key: index.toString(),
          line: str
        };
      })
    };
    this.onNewLine = this.onNewLine.bind(this);
  }

  onNewLine(index: number): void {
    const { lines } = this.state;
    const newLine = {line: "", key: lines.length.toString()};
    const newLines = (index == lines.length-1) ? lines.slice().concat([newLine]) : lines.slice(0, index+1).concat([newLine], lines.slice(index+1, lines.length));
    this.setState({
      lines: newLines,
      toFocus: index + 1,
    });
  }

  onChange(index: number, e: ChangeEvent<HTMLTextAreaElement>): void {
    const lines = this.state.lines.slice();
    lines[index].line = e.target.value;
    this.setState({
      lines: lines,
      toFocus: null
    });
  }

  render(): ReactNode {
    console.log(this.state.lines);
    const list_items = this.state.lines.map(({key, line}, index) => {
      return <EditableListItem autoFocus={index == this.state.toFocus} key={key} indent={0} placeHolder="Click to add content" content={line} onEnter={() => this.onNewLine(index)} onChange={(e) => this.onChange(index, e)}/>;
    });

    return (
      list_items
    );
  }
}

export default NotesEntryForm;