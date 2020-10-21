import React, { Component, ReactNode, KeyboardEvent, RefObject, ChangeEvent } from 'react';
import { Input } from 'antd';

const TextArea = Input;

export interface EditableListItemProps {
    className?: string,
    content?: string,
    placeHolder?: string,
    autoFocus?: {start: number, end: number},
    indices?: number[],
    onChange?: (indices: number[], newValue: string) => void,
    onEnter?: (indices: number[]) => void;
    onDelete?: (indices: number[]) => void;
    onTab?: (indices: number[], shift: boolean, cursorStart: number, cursorEnd: number) => void;
}

export class EditableListItem extends Component<EditableListItemProps, unknown> {
  textInput: RefObject<Input>;

  constructor(props: EditableListItemProps) {
    super(props);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    const target = (e.target as HTMLInputElement);
    if(e.key == "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.props.onEnter && this.props.onEnter(this.props.indices);
    }
    else if(e.key == "Backspace" && target.value == "") {
      e.preventDefault();
      this.props.onDelete && this.props.onDelete(this.props.indices);
    }
    else if(e.key == "Tab") {
      this.props.onTab && this.props.onTab(this.props.indices, e.shiftKey, target.selectionStart, target.selectionEnd);
      e.preventDefault();
    }
  }

  onChange(e: React.ChangeEvent<HTMLInputElement>): void {
    this.props.onChange && this.props.onChange(this.props.indices, e.target.value);
  }

  render(): ReactNode {
    const { className, placeHolder, content, autoFocus } = this.props;
    const rows = (content || "").split('\n').length;
    return (
      <li>
        <TextArea
          ref={ele => {
            if(autoFocus !== undefined && ele) {
              ele.focus();
              ele.input.selectionStart = autoFocus.start;
              ele.input.selectionEnd = autoFocus.end;
            }
          }}
          className={`note_input ${className}`}
          tabIndex={-1}
          value={content}
          placeholder={placeHolder}
          onKeyDown={this.onKeyDown}
          onChange={this.onChange}
          bordered={false}
        />
      </li>
    );
  }
}

export default EditableListItem;