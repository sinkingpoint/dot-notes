import { Layout, Input } from 'antd';

const TextArea = Input;
const { Sider, Content, Header } = Layout;

import React, { Component, ReactNode } from 'react';
import { APIClient, Note, NoteContents } from '../api/client';
import NestedList from '../utils/nested_list';
import NotesEntryForm from './notes_entry_list';
import SearchField from './search_field';

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
    this.onNoteSearch = this.onNoteSearch.bind(this);
  }

  componentDidMount(): void {
    const api = new APIClient();
    const get_note = api.get_note(this.props.note_id);
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

      this.setState({note, links});
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

  onNoteSearch(contents: string, val: string): void {
    if(val == "Create") {
      const api = new APIClient();
      api.create_note(contents).then(id => {
        window.location.pathname = `/note/${id}`;
      }).catch(e => {
        console.log("Got an error creating a new page")
        console.log(e);
      });
    }
    else {
      window.location.pathname = `/note/${val}`;
    }
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
    return <Layout className="note-entry-page">
      <Sider breakpoint="lg" collapsedWidth="0">Sider</Sider>
      <Layout>
        <Header>
          <SearchField className='search-field search-field-main' searchPrompt="Go To: " onSelect={this.onNoteSearch} extraOptions={(contents) => {
            return contents ? [{
              key: "Create",
              prompt: "Create Page: ",
              text: contents
            }] : [];
          }}/>
        </Header>
        <Content className="note-entry-form">
          { children }
        </Content>
      </Layout>
    </Layout>;
  }
}

export default NotePage;