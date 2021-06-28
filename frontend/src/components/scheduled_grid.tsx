import { Col, Row } from "antd";
import React, { ReactElement } from "react";
import { Component } from "react";
import { APIClient, NoteSchedule } from "../api/client";

interface ScheduledNoteGridState {
  schedules: NoteSchedule[]
}

export class ScheduledNoteGrid extends Component<unknown, ScheduledNoteGridState> {
  constructor(props: unknown) {
    super(props);

    const api = new APIClient();

    this.state = {
      schedules: []
    };

    api.get_schedules().then((schedules) => {
      this.setState({schedules: schedules});
    });
  }

  addSchedule(sched: NoteSchedule): void {
    const currentSchedules = [...this.state.schedules];
    currentSchedules.push(sched);
    this.setState({
      schedules: currentSchedules
    })
  }

  render(): ReactElement {
    if(!this.state.schedules) {
      return <div><i>No Scheduled Notes</i></div>;
    }
    else {
      const children: ReactElement[] = [];
      children.push(
        <Row key={-1}>
          <Col xs={{ span: 5 }} lg={{ span: 6 }}>
            <h3>Name</h3>
          </Col>

          <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }}>
            <h3>Schedule</h3>
          </Col>

          <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }}>
            <h3>Title Pattern</h3>
          </Col>
        </Row>);
      this.state.schedules.forEach((s, i) => {
        children.push(<Row key={i}>
          <Col xs={{ span: 5 }} lg={{ span: 6 }}>
            {s.title}
          </Col>

          <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }}>
            {s.schedule_cron}
          </Col>

          <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }}>
            {s.name_template}
          </Col>
        </Row>);
      });

      if(this.state.schedules.length == 0) {
        children.push(<Row key="nonotes">
          <Col xs={{ span: 5 }} lg={{ span: 6 }}>
            No Notes Scheduled!
          </Col>
        </Row>);
      }

      return <div>
        {children}
      </div>;
    }
  }
}