import { Layout } from 'antd';
import { Input } from 'antd';

const TextArea = Input;
const { Sider, Content } = Layout;

import React, { Component, ReactNode } from 'react';
import NestedList from '../utils/nested_list';
import NotesEntryForm from './notes_entry_list';

interface NotePageProps {
    title: string,
    contents: NestedList<string>
}

class NotePage extends Component<NotePageProps> {
    render(): ReactNode {
        return <Layout className="note-entry-page">
            <Sider
      breakpoint="lg"
      collapsedWidth="0">Sider</Sider>
            <Layout className="note-entry-form">
                <Content>
                    <TextArea className="note-title" tabIndex={-1} defaultValue={this.props.title} bordered={false} />
                    <NotesEntryForm initialData={this.props.contents}  />
                </Content>
            </Layout>
        </Layout>;
    }
}

export default NotePage;