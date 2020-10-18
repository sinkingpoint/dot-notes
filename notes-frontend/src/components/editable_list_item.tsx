import React, { Component, ReactNode, KeyboardEvent, RefObject, ChangeEvent } from 'react';

interface EditableListItemProps {
    className?: string,
    content?: string,
    placeHolder?: string,
    indent: number,
    autoFocus?: boolean,
    onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void,
    onEnter?: (e: KeyboardEvent) => void;
}

class EditableListItem extends Component<EditableListItemProps, unknown> {
  textInput: RefObject<HTMLTextAreaElement>;

  constructor(props: EditableListItemProps) {
    super(props);
    this.onKeyPress = this.onKeyPress.bind(this);
    this.textInput = React.createRef<HTMLTextAreaElement>()
  }

  componentDidMount(): void {
    if(this.props.autoFocus) {
      this.textInput.current.focus();
    }
  }

  onKeyPress(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if(e.key == "Enter" && !e.shiftKey) {
      e.preventDefault();
      if(this.props.onEnter) {
        this.props.onEnter(e);
      }
    }
  }

  render(): ReactNode {
    const { className, placeHolder, content, onChange } = this.props;
    const rows = (content || "").split('\n').length;
    return (
      <div>
        <span className="note_input_bullet">&#8226;</span>
        <textarea ref={this.textInput} className={`note_input ${className}`} defaultValue={content} placeholder={placeHolder} onKeyPress={this.onKeyPress} rows={rows} onChange={onChange} />
      </div>
    );
  }
}

export default EditableListItem;