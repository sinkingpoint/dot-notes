import React from 'react';
import ReactDOM from 'react-dom';
import NotePage from './pages/note_entry';

import './styles/dark.css';
import 'antd/dist/antd.css';

const url_parts = window.location.pathname.split("/");
const note_id = url_parts[url_parts.length-1];

ReactDOM.render(<NotePage note_id={note_id} />, document.getElementById("body"));
