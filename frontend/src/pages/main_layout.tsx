import { Layout } from "antd";
import React, { Component, ReactElement } from "react";
import { APIClient } from "../api/client";
import SearchField from "../components/search_field";
const { Sider, Content, Header } = Layout;

interface AppLayoutProps {
  children: ReactElement | ReactElement[];
  onScroll?: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void;
}

export default class AppLayout extends Component<AppLayoutProps> {
  constructor(props: AppLayoutProps) {
    super(props);
    this.onNoteSearch = this.onNoteSearch.bind(this);
  }

  onNoteSearch(contents: string, val: string): void {
    if(val == "Create") {
      const api = new APIClient();
      api.create_note(contents).then(id => {
        window.location.pathname = `/note/${id}`;
      }).catch(e => {
        console.log("Got an error creating a new page")
        console.log(e);
      });
    }
    else {
      window.location.pathname = `/note/${val}`;
    }
  }
  
  render(): ReactElement {
    return <Layout className="note-entry-page">
      <Sider breakpoint="lg" collapsedWidth="0" className="side-bar">
        <a href="/"><div className="logo" /></a>
      </Sider>
      <Layout>
        <Header className="side-bar">
          <SearchField className='search-field search-field-main' searchPrompt="Go To: " onSelect={this.onNoteSearch} extraOptions={(contents) => {
            return contents ? [{
              key: "Create",
              prompt: "Create Page: ",
              text: contents
            }] : [];
          }}/>
        </Header>
        <Content className="content" onScroll={this.props.onScroll}>
          { this.props.children }
        </Content>
      </Layout>
    </Layout>
  }
}