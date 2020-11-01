import React, { Component, ReactNode, RefObject } from 'react';
import { Input } from 'antd';
import ReactMarkdown from 'react-markdown';
import { plugin as checkboxes, render as checkboxes_render } from '../remark-extensions/checkboxes';
import { Position } from "../remark-extensions/utils";

const { TextArea } = Input;

export interface EditableListItemProps {
    className?: string,
    content?: string,
    placeHolder?: string,
    autoFocus?: {start?: number, end?: number},
    indices?: number[],
    onClick?: (indices: number[]) => void;
    onChange?: (indices: number[], newValue: string) => void,
    onEnter?: (indices: number[]) => void;
    onDelete?: (indices: number[]) => void;
    onTab?: (indices: number[], shift: boolean, cursorStart: number, cursorEnd: number) => void;
    onCheckbox?: (indices: number[], checkboxMDPos: Position) => void;
}

export class EditableListItem extends Component<EditableListItemProps, unknown> {
  textInput: RefObject<Input>;

  constructor(props: EditableListItemProps) {
    super(props);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onCheckboxClick = this.onCheckboxClick.bind(this);
  }

  onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
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

  onChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    this.props.onChange && this.props.onChange(this.props.indices, e.target.value);
  }

  onClick() {
    this.props.onClick && this.props.onClick(this.props.indices);
  }

  // Called when a rendered checkbox in this item gets changed
  onCheckboxClick(e: React.ChangeEvent<HTMLInputElement>, sourcePosition: Position): void {
    // Stop propagation up to the containg item, to stop the focus shift + turning this into a textbox
    e.stopPropagation();

    const { onCheckbox, indices } = this.props;

    onCheckbox && onCheckbox(indices, sourcePosition);
  }

  render(): ReactNode {
    const { className, placeHolder, content, autoFocus } = this.props;
    const rows = (content || "").split('\n').length;
    return (
      <li>
        {autoFocus &&
          <TextArea
            autoSize
            ref={ele => {
              if(autoFocus !== undefined && ele) {
                ele.focus();
                if(autoFocus.start && autoFocus.end){
                  ele.resizableTextArea.textArea.selectionStart = autoFocus.start;
                  ele.resizableTextArea.textArea.selectionEnd = autoFocus.end;
                }
              }
            }}
            className={`note_input ${className}`}
            value={content}
            onKeyDown={this.onKeyDown}
            onChange={this.onChange}
            onClick={this.onClick}
            bordered={false}
          />
          ||
          <div onClick={this.onClick} className={`note_input ant-input ant-input-borderless`}>
            {content && <ReactMarkdown renderers={checkboxes_render(this.onCheckboxClick)} plugins={[checkboxes]} rawSourcePos={true}>
                {content}
            </ReactMarkdown>
            || <p className="note-input-placeholder">{placeHolder}</p>}
          </div>
        }
      </li>
    );
  }
}

export default EditableListItem;