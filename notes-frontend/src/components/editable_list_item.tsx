import React, { Component, ReactNode, RefObject } from 'react';
import { Input } from 'antd';
import ReactMarkdown from 'react-markdown';
import { plugin as checkboxes, render as checkboxes_render } from '../remark-extensions/checkboxes';
import { plugin as note_link, render as note_link_render } from '../remark-extensions/note_link';
import { Position } from "../remark-extensions/utils";
import { position } from 'caret-pos';
import SearchField from './search_field';

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

interface EditableListItemState {
  linkSearchMenu?: {pos: {top: number, left: number}}
}

export class EditableListItem extends Component<EditableListItemProps, EditableListItemState> {
  textInput: RefObject<HTMLTextAreaElement>;

  constructor(props: EditableListItemProps) {
    super(props);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onCheckboxClick = this.onCheckboxClick.bind(this);
    this.onLinkAdd = this.onLinkAdd.bind(this);
    this.textInput = null;
    this.state = {};
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

  onChange(e: React.FormEvent<HTMLTextAreaElement>): void {
    if(this.textInput.current) {
      const value = this.textInput.current.value;
      const event = e.nativeEvent as InputEvent;
      const cursorPos = this.textInput.current.selectionStart;
      if(cursorPos >= 2 && value[cursorPos-1] == '[' && value[cursorPos-2] == "[" && event.data == "[") {
        this.setState({
          linkSearchMenu: {
            pos: position(this.textInput.current)
          }
        })
      }
      
      this.props.onChange && this.props.onChange(this.props.indices, value);
    }
  }

  onClick(): void {
    this.props.onClick && this.props.onClick(this.props.indices);
    this.setState({
      linkSearchMenu: null
    });
  }

  // Called when a rendered checkbox in this item gets changed
  onCheckboxClick(e: React.ChangeEvent<HTMLInputElement>, sourcePosition: Position): void {
    // Stop propagation up to the containg item, to stop the focus shift + turning this into a textbox
    e.stopPropagation();

    const { onCheckbox, indices } = this.props;

    onCheckbox && onCheckbox(indices, sourcePosition);
  }

  onLinkAdd(contents: string, val: string): void {
    const textArea = this.textInput.current;
    const oldValue = textArea.value;
    const newValue = oldValue.substring(0, textArea.selectionStart) + `${val}]]` + oldValue.substring(textArea.selectionStart);
    this.props.onChange && this.props.onChange(this.props.indices, newValue);

    textArea.focus();

    this.setState({
      linkSearchMenu: null
    });
  }

  render(): ReactNode {
    const { className, placeHolder, content, autoFocus } = this.props;
    const { linkSearchMenu } = this.state;
    return (
      <li>
        {(autoFocus || linkSearchMenu) &&
          <TextArea
            autoSize
            id={JSON.stringify(this.props.indices)}
            ref={ele => {
              if(autoFocus !== undefined && ele && !linkSearchMenu) {
                this.textInput = {current: ele.resizableTextArea.textArea};
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
            onInput={this.onChange}
            onClick={this.onClick}
            bordered={false}
          />
          ||
          // Note the replace here: We automatically add two spaces to the end of every line before rendering
          // This is to fool the markdown parser into now joining lines
          <div onClick={this.onClick} className={`note_input ant-input ant-input-borderless`} id={JSON.stringify(this.props.indices)}>
            {content && <ReactMarkdown renderers={Object.assign({}, checkboxes_render(this.onCheckboxClick), note_link_render)} plugins={[checkboxes, note_link]} rawSourcePos={true}>
              {content.replace(/\n/g, "  \n")}
            </ReactMarkdown>
            || <p className="note-input-placeholder">{placeHolder}</p>}
          </div>
        }

      {linkSearchMenu && 
        <SearchField className='search-field-link'
          ref={
            (ele) => {
              if(ele) {
                ele.focus();
              }
            }
          }
          searchPrompt="Link"
          style={{
            position: "relative",
            top: linkSearchMenu.pos.top-10,
            left: linkSearchMenu.pos.left
          }}
          onSelect={this.onLinkAdd}
          placeholder={"Search"}
        />
      }
      </li>
    );
  }
}

export default EditableListItem;