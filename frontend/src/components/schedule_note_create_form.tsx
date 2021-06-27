import { Button, Col, Input, Row } from "antd";
import React, { ReactNode } from "react";
import { Component } from "react";
import { APIClient, NoteSchedule } from "../api/client";

export interface ScheduleNoteCreateFormProps {
  onCreateNote?(sched: NoteSchedule): void;
}

interface ScheduleNoteCreateFormState {
  creating: boolean;
}

export class ScheduledNoteCreateForm extends Component<ScheduleNoteCreateFormProps, ScheduleNoteCreateFormState> {
  nameInput: React.RefObject<Input>;
  cronInput: React.RefObject<Input>;
  titleInput: React.RefObject<Input>;

  constructor(props: ScheduleNoteCreateFormProps) {
    super(props);
    this.createSchedule = this.createSchedule.bind(this);

    this.nameInput = React.createRef();
    this.cronInput = React.createRef();
    this.titleInput = React.createRef();

    this.state = {
      creating: false
    }
  }

  validateForm(name: string, cron: string, title: string): boolean {
    return true;
  }

  createSchedule(): void {
    const name = this.nameInput.current.state.value;
    const cron = this.cronInput.current.state.value;
    const title = this.titleInput.current.state.value;

    if(this.validateForm(name, cron, title)) {
      new APIClient().create_schedule({name_template: name, schedule_cron: cron, title: title}).then((id) => {
        if(this.props.onCreateNote) {
          this.props.onCreateNote({
            id: id,
            title: title,
            schedule_cron: cron,
            name_template: name,
            enabled: true
          });
        }

        this.setState({
          creating: false
        })
      });
    }
  }

  render(): ReactNode {
    return (<Row>
      <Col xs={{ span: 3 }} lg={{ span: 4 }}>
        <Input placeholder="Name" ref={this.titleInput} />
        <span>The title of this schedule</span>
      </Col>

      <Col xs={{ span: 3, offset: 1 }} lg={{ span: 4, offset: 1 }}>
        <Input placeholder="Cron" ref={this.cronInput} />
        <span>How often to create the page</span>
      </Col>

      <Col xs={{ span: 3, offset: 1 }} lg={{ span: 4, offset: 1 }}>
        <Input placeholder="Name Pattern" ref={this.nameInput} />
        <span>The name of the page to create</span>
      </Col>

      <Col xs={{ span: 3, offset: 1 }} lg={{ span: 3, offset: 1 }}>
        <Button type="default" onClick={this.createSchedule} loading={this.state.creating}>Create Schedule</Button>
      </Col>
    </Row>);
  }
}