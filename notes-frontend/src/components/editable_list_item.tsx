import React, { Component, ReactNode, KeyboardEvent, RefObject, ChangeEvent } from 'react';

interface EditableListItemProps {
    className?: string,
    content?: string,
    placeHolder?: string,
    indent: number,
    autoFocus?: boolean,
    onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void,
    onEnter?: (e: KeyboardEvent) => void;
    onDelete?: (e: KeyboardEvent) => void;
}

class EditableListItem extends Component<EditableListItemProps, unknown> {
  textInput: RefObject<HTMLTextAreaElement>;

  constructor(props: EditableListItemProps) {
    super(props);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.textInput = React.createRef<HTMLTextAreaElement>();
  }

  onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if(e.key == "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.props.onEnter && this.props.onEnter(e);
    }
    else if(e.key == "Backspace" && this.textInput.current.value == "") {
      e.preventDefault();
      this.props.onDelete && this.props.onDelete(e);
    }
  }

  render(): ReactNode {
    const { className, placeHolder, content, onChange, autoFocus } = this.props;
    const rows = (content || "").split('\n').length;
    return (
      <div>
        <span className="note_input_bullet">&#8226;</span>
        <textarea ref={ele => {
          this.textInput = {current: ele};
          if(autoFocus && ele) {
            ele.focus();
          }
        }} className={`note_input ${className}`} defaultValue={content} placeholder={placeHolder} onKeyDown={this.onKeyDown} rows={rows} onChange={onChange} />
      </div>
    );
  }
}

export default EditableListItem;