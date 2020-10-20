import * as React from 'react';
import * as ReactDOM from 'react-dom';
import NotesEntryForm from './components/notes_entry_form';
import './styles/dark.css';

const testData = [
  "cats",
  "dogs",
  [
    "more cats",
    [
      "more dogs",
      "pigs"
    ],
  ],
  "more pigs"
];

ReactDOM.render(<NotesEntryForm initialData={testData}/>, document.body);
