import React, { Component, ReactNode, KeyboardEvent, RefObject, ChangeEvent } from 'react';

export interface EditableListItemProps {
    className?: string,
    content?: string,
    placeHolder?: string,
    autoFocus?: boolean,
    indices?: number[],
    onChange?: (indices: number[], newValue: string) => void,
    onEnter?: (indices: number[]) => void;
    onDelete?: (indices: number[]) => void;
    onTab?: (indices: number[]) => void;
}

export class EditableListItem extends Component<EditableListItemProps, unknown> {
  textInput: RefObject<HTMLTextAreaElement>;

  constructor(props: EditableListItemProps) {
    super(props);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onChange = this.onChange.bind(this);
    this.textInput = React.createRef<HTMLTextAreaElement>();
  }

  onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if(e.key == "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.props.onEnter && this.props.onEnter(this.props.indices);
    }
    else if(e.key == "Backspace" && this.textInput.current.value == "") {
      e.preventDefault();
      this.props.onDelete && this.props.onDelete(this.props.indices);
    }
    else if(e.key == "Tab") {
      e.preventDefault();
      this.props.onTab && this.props.onTab(this.props.indices);
    }
  }

  onChange(e: ChangeEvent<HTMLTextAreaElement>): void {
    this.props.onChange && this.props.onChange(this.props.indices, e.target.value);
  }

  render(): ReactNode {
    const { className, placeHolder, content, autoFocus } = this.props;
    const rows = (content || "").split('\n').length;
    return (
      <div>
        <span className="note_input_bullet">&#8226;</span>
        <textarea ref={ele => {
          this.textInput = {current: ele};
          if(autoFocus && ele) {
            ele.focus();
          }
        }} className={`note_input ${className}`} defaultValue={content} placeholder={placeHolder} onKeyDown={this.onKeyDown} rows={rows} onChange={this.onChange} />
      </div>
    );
  }
}

export default EditableListItem;