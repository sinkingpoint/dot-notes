import React from 'react';
import ReactDOM from 'react-dom';
import NotePage from './pages/note_entry';

import 'antd/dist/antd.less';
import './styles/dark.less';

const url_parts = window.location.pathname.split("/");
const note_id = url_parts[url_parts.length-1];

ReactDOM.render(<NotePage note_id={note_id} />, document.getElementById("body"));
