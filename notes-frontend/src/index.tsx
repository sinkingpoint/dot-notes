import * as React from 'react';
import * as ReactDOM from 'react-dom';
import NotesEntryForm from './components/notes_entry_form';
import './styles/dark.css';
import NestedList from './utils/nested_list';

const testData = new NestedList<string>([
  "cats",
  "dogs",
  [
    "more cats",
    [
      "more dogs"
    ],
    "pigs"
  ],
  "more pigs"
]);

console.log(testData);

ReactDOM.render(<NotesEntryForm initialData={testData}/>, document.body);
