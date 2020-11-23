import { Divider } from 'antd';
import React, { Component, ReactElement, ReactNode } from 'react';
import { APIClient, Note } from '../api/client';
import AppLayout from './main_layout';

interface MainPageState {
  offset: number;
  notes?: Note[];
  fetching: boolean;
}

class MainPage extends Component<unknown, MainPageState> {
  constructor(props: unknown) {
    super(props);
    this.state = {
      notes: [],
      offset: 0,
      fetching: false
    };

    this.onScroll = this.onScroll.bind(this);
  }

  fetchMoreRecent() {
    const api = new APIClient();
    if(!this.state.fetching) {
      this.setState({fetching: true});
      api.get_recent_notes(this.state.offset, 10).then(notes => {
        this.setState({
          offset: this.state.offset + notes.length,
          notes: [...this.state.notes, ...notes],
          fetching: false
        });
      });
    }
  }

  onScroll() {
    const windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
    const body = document.body;
    const html = document.documentElement;
    const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    const windowBottom = windowHeight + window.pageYOffset;
    if (windowBottom >= docHeight) {
      this.fetchMoreRecent();
    }
  }

  componentDidMount(): void {
    this.fetchMoreRecent();

    window.addEventListener('scroll', this.onScroll);
  }

  componentWillUnmount(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  render(): ReactNode {
    const children: ReactElement[] = [];
    children.push(<h1 className="note-title">
      Recent Notes
    </h1>)
    this.state.notes.forEach((note, i) => {
      children.push(<div key={i}>
        <h2><a href={`/note/${note.id}`}>{note.title}</a></h2>
      </div>);

      if(i < this.state.notes.length - 1) {
        children.push(<Divider></Divider>);
      }
    });

    return <AppLayout>
      {children}
    </AppLayout>;
  }
}

export default MainPage;