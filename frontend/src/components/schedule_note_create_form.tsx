import { Button, Col, Input, Row } from "antd";
import React, { ChangeEvent, ReactNode } from "react";
import { Component } from "react";
import { APIClient, NoteSchedule } from "../api/client";
import cronstrue from 'cronstrue';

export interface ScheduleNoteCreateFormProps {
  onCreateNote?(sched: NoteSchedule): void;
}

interface ScheduleNoteCreateFormState {
  creating: boolean;
  currentTexts: {
    name: string,
    cron: string,
    title: string
  }
}

export class ScheduledNoteCreateForm extends Component<ScheduleNoteCreateFormProps, ScheduleNoteCreateFormState> {
  nameInput: React.RefObject<Input>;
  cronInput: React.RefObject<Input>;
  titleInput: React.RefObject<Input>;

  constructor(props: ScheduleNoteCreateFormProps) {
    super(props);
    this.createSchedule = this.createSchedule.bind(this);
    this.onTitleChange = this.onTitleChange.bind(this);
    this.onCronChange = this.onCronChange.bind(this);
    this.onNameChange = this.onNameChange.bind(this);

    this.nameInput = React.createRef();
    this.cronInput = React.createRef();
    this.titleInput = React.createRef();

    this.state = {
      creating: false,
      currentTexts: {
        name: "",
        cron: "",
        title: ""
      },
    };
  }

  validateForm(): boolean {
    const current = {...this.state.currentTexts};

    let error = false;

    if(!current.name) {
      this.nameInput.current.input.setCustomValidity("Invalid Name");
      error = true;
      console.log("ERROR empty name");
    }
    else {
      this.nameInput.current.input.setCustomValidity("");
    }

    if(!current.title) {
      this.titleInput.current.input.setCustomValidity("Invalid Title");
      error = true;
      console.log("ERROR empty title");
    }
    else {
      this.titleInput.current.input.setCustomValidity("");
    }

    if(!current.cron) {
      this.cronInput.current.input.setCustomValidity("Invalid Cron");
      error = true;
      console.log("ERROR empty cron");
    }
    else {
      try {
        cronstrue.toString(current.cron);
        this.cronInput.current.input.setCustomValidity("");
      }
      catch {
        this.cronInput.current.input.setCustomValidity("Invalid Cron");
        error = true;
        console.log("ERROR bad cron");
      }
    }

    return !error;
  }

  createSchedule(): void {
    const name = this.nameInput.current.state.value;
    const cron = this.cronInput.current.state.value;
    const title = this.titleInput.current.state.value;

    if(this.validateForm()) {
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

  onNameChange(e: ChangeEvent<HTMLInputElement>): void {
    const current = {...this.state.currentTexts};
    current.name = e.target.value;

    this.setState({
      currentTexts: current
    });

    this.validateForm();
  }

  onCronChange(e: ChangeEvent<HTMLInputElement>): void {
    const current = {...this.state.currentTexts};
    current.cron = e.target.value;

    this.setState({
      currentTexts: current
    });

    this.validateForm();
  }

  onTitleChange(e: ChangeEvent<HTMLInputElement>): void {
    const current = {...this.state.currentTexts};
    current.title = e.target.value;

    this.setState({
      currentTexts: current
    });

    this.validateForm();
  }

  render(): ReactNode {
    let nameplaceholder;
    let cronplaceholder;
    let titleplaceholder;

    const cronText = this.state.currentTexts.cron;
    if(cronText != "") {
      try {
        cronplaceholder = <span>{cronstrue.toString(cronText)}</span>
      }
      catch {
        cronplaceholder = <span>Invalid Cron!</span>
      }
    }
    else {
      cronplaceholder = <span>When to create this page</span>
    }

    if(this.state.currentTexts.title !== "") {
      titleplaceholder = <span>Create a Note</span>
    }
    else {
      titleplaceholder = <span>The Name of the Schedule</span>
    }

    if(this.state.currentTexts.name !== "") {
      nameplaceholder = <span>Called {this.state.currentTexts.name}</span>
    }
    else {
      nameplaceholder = <span>The name of the page to create</span>;
    }

    return (<Row className="form">
      <Col xs={{ span: 3 }} lg={{ span: 4 }}>
        <Input placeholder="Schedule Name" ref={this.titleInput} onChange={this.onTitleChange} />
        {titleplaceholder}
      </Col>

      <Col xs={{ span: 3, offset: 1 }} lg={{ span: 4, offset: 1 }}>
        <Input placeholder="Cron" ref={this.cronInput} onChange={this.onCronChange} />
        {cronplaceholder}
      </Col>

      <Col xs={{ span: 3, offset: 1 }} lg={{ span: 4, offset: 1 }}>
        <Input placeholder="Note Name Pattern" ref={this.nameInput} onChange={this.onNameChange} />
        {nameplaceholder}
      </Col>

      <Col xs={{ span: 3, offset: 1 }} lg={{ span: 3, offset: 1 }}>
        <Button type="default" onClick={this.createSchedule} loading={this.state.creating} className="button-submit">Create Schedule</Button>
      </Col>
    </Row>);
  }
}