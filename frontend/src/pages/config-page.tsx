import { Col, Divider, Input, Menu, Row } from 'antd';
import Sider from 'antd/lib/layout/Sider';
import Content from 'antd/lib/layout';
import { SelectInfo } from 'rc-menu/lib/interface';
import React, { Component, ReactNode } from 'react';
import AppLayout from './main_layout';
import { ScheduledNoteGrid } from '../components/scheduled_grid';

interface ConfigPageState {
  page: "looks" | "scheduled"
}

class ConfigPage extends Component<unknown, ConfigPageState> {
  constructor(props: unknown) {
    super(props);
    this.onMenuSelect = this.onMenuSelect.bind(this);
    this.state = {
      page: "looks",
    };
  }

  onMenuSelect({key}: SelectInfo): void {
    if(key == "looks" || key == "scheduled") {
      this.setState({
        page: key
      });
    }
  }

  render(): ReactNode {
    let form;
    if(this.state.page == "looks"){
      form = <div>
        <h2>Look and Feel</h2>
      </div>;
    }
    else if(this.state.page == "scheduled"){
      form = <div className="schedule-form">
        <h2>Scheduled Notes</h2>
        <Row>
          <Col xs={{ span: 5 }} lg={{ span: 6 }}>
            <Input placeholder="Cron" />
            <span>How often to create the page</span>
          </Col>

          <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }}>
            <Input placeholder="Name" />
            <span>The name of the page to create</span>
          </Col>
        </Row>

        <Divider />

        <ScheduledNoteGrid />
        {}
      </div>;
    }
    return <AppLayout menu={
      <Menu
          className="page-menu"
          defaultSelectedKeys={['looks']}
          mode="inline"
          onSelect={this.onMenuSelect}
        >
          <Menu.Item key="looks">Looks</Menu.Item>
          <Menu.Item key="scheduled">Scheduled</Menu.Item>
        </Menu>
    }>
      {form}
    </AppLayout>;
  }
}

export default ConfigPage;