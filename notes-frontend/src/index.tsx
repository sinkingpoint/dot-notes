import * as React from 'react';
import * as ReactDOM from 'react-dom';
import NotesEntryForm from './components/notes_entry_form';
import NestedList from './utils/nested_list';

import './styles/dark.css';
import 'antd/dist/antd.css';

const testData = new NestedList<string>("");

ReactDOM.render(<NotesEntryForm initialData={testData}/>, document.body);
