import React, { ReactElement } from "react";
import { Component } from "react";
import { APIClient, Note } from "../api/client";

interface NoteLinkProps {
  note_id: string;
}

interface NoteLinkState {
  note?: Note;
}

export class NoteLink extends Component<NoteLinkProps, NoteLinkState> {
  constructor(props: NoteLinkProps) {
    super(props);
    this.state = {

    };
  }

  componentDidMount(): void {
    const api = new APIClient();
    api.get_note(this.props.note_id).then(note => {
      this.setState({note});
    });
  }

  render(): ReactElement {
    const note_id = this.props.note_id;
    const note = this.state.note;
    return <span>
      <span className="note-link-bracket">[[</span>
      {note 
            && <a href={`/note/${note_id}`} className='note-link-valid' onClick={(e) => {e.stopPropagation()}}>{note.title}</a>
            || <span className='note-link-invalid'>{note_id}</span>
      }
      <span className="note-link-bracket">]]</span>
    </span>
  }
}