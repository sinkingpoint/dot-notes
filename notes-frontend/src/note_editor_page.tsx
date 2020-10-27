import * as React from 'react';
import * as ReactDOM from 'react-dom';
import NotePage from './components/note_entry';
import NestedList from './utils/nested_list';

import './styles/dark.css';
import 'antd/dist/antd.css';
import { APIClient } from './api/client';

const testData = new NestedList<string>([""]);

const api = new APIClient("http://localhost:3030");
const url_parts = window.location.pathname.split("/");

const note_id = url_parts[url_parts.length-1];

api.get_note(note_id).then(note => {
    ReactDOM.render(<NotePage title={note.title} contents={new NestedList<string>(note.contents)} />, document.body);
});
