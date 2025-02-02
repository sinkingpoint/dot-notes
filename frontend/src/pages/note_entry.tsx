import { Input } from 'antd';

const TextArea = Input;

import React, { Component, ReactNode } from 'react';
import { APIClient, Note, NoteContents } from '../api/client';
import NestedList from '../utils/nested_list';
import NotesEntryForm from '../components/notes_entry_list';
import AppLayout from './main_layout';

interface NotePageProps {
  note_id: string;
}

interface NotePageState {
  note?: Note;
  links?: {note: Note, index: number[]}[]; 
  changeTimerID?: ReturnType<typeof setTimeout>;
}

class NotePage extends Component<NotePageProps, NotePageState> {
  constructor(props: NotePageProps) {
    super(props);
    this.state = {
      note: undefined
    };

    this.onTitleChange = this.onTitleChange.bind(this);
    this.onNoteChange = this.onNoteChange.bind(this);
    this.updateAPINote = this.updateAPINote.bind(this);
  }

  componentDidMount(): void {
    const api = new APIClient();
    const get_note = api.get_note(this.props.note_id).catch(() => {
      window.location.pathname = "/"
    });
    
    const get_links = api.get_links(this.props.note_id).then(links => {
      // TODO: Move this into the Backend to eliminate the multiple round trips
      const promises = links.links.map(link => api.get_note(link.to_id).then(note => {
        return {
          note,
          index: link.from_note_index
        }
      }));

      return Promise.all(promises);
    });

    Promise.all([get_note, get_links]).then(val => {
      const note = val[0];
      const links = val[1];

      if(note) {
        this.setState({note, links});
      }
    });
  }

  onTitleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    this.updateAPINote({
      title: e.target.value, 
      contents: this.state.note.contents
    });
  }

  onNoteChange(newContents: NoteContents[]): void {
    this.updateAPINote({
      title: this.state.note.title, 
      contents: newContents
    });
  }

  updateAPINote(note: Note): void {
    if(this.state.changeTimerID) {
      clearTimeout(this.state.changeTimerID);
    }

    const timerID = setTimeout(() => {
      const client = new APIClient();
      client.update_note(this.props.note_id, note);
      this.setState({
        note,
        changeTimerID: null
      });
    }, 1000);

    this.setState({
      changeTimerID: timerID
    })
  }

  render(): ReactNode {
    const { note, links } = this.state;
    const children = [];
    if(note) {
      children.push(<TextArea key="title" className="note-title" tabIndex={-1} defaultValue={note.title} bordered={false} onChange={this.onTitleChange} />);
      children.push(<NotesEntryForm key="entry" initialData={new NestedList<string>(note.contents)} onChange={this.onNoteChange} />);
    }

    if(links && links.length > 0) {
      children.push(<div key="links" className='link-box'>
        <h3>Links to this page:</h3>
        <ul>
          {links.map((link, i) => {
            const { note, index } = link;
            return <li key={i}><a href={`/note/${note.id}#${JSON.stringify(index)}`}>{note.title}</a></li>
          })}
        </ul>
      </div>);
    }
    return <AppLayout>
      <div className='note-entry-form'>
      {children}
      </div>
    </AppLayout>;
  }
}

export default NotePage;