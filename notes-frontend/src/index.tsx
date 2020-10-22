import * as React from 'react';
import * as ReactDOM from 'react-dom';
import NotePage from './components/note_entry';
import NestedList from './utils/nested_list';

import './styles/dark.css';
import 'antd/dist/antd.css';

const testData = new NestedList<string>([""]);

ReactDOM.render(<NotePage title="Test Page" contents={testData}/>, document.body);
