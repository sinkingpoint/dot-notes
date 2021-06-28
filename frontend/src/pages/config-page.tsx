import { Menu } from 'antd';
import { SelectInfo } from 'rc-menu/lib/interface';
import React, { Component, ReactNode } from 'react';
import AppLayout from './main_layout';
import CreateSchedulePage from './create-schedule-page';

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
      form = <CreateSchedulePage />
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