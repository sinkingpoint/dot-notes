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
    note: Note;
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

    componentDidMount() {
        const api = new APIClient();
        api.get_note(this.props.note_id).then(note => this.setState({
            note
        }));
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

    updateAPINote(note: Note) {
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
        return <Layout className="note-entry-page">
            <Sider breakpoint="lg" collapsedWidth="0">Sider</Sider>
            <Layout>
                <Header>
                    <SearchField />
                </Header>
                <Content className="note-entry-form">
                    { 
                        this.state.note && 
                        <span>
                            <TextArea className="note-title" tabIndex={-1} defaultValue={this.state.note.title} bordered={false} onChange={this.onTitleChange} />
                            <NotesEntryForm initialData={new NestedList<string>(this.state.note.contents)} onChange={this.onNoteChange} />
                        </span>
                    }
                </Content>
            </Layout>
        </Layout>;
    }
}

export default NotePage;