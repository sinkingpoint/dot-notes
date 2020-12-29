import { Col, Row } from "antd";
import React, { ReactElement } from "react";
import { Component } from "react";
import { NoteSchedule } from "../api/client";

interface ScheduledNoteGridState {
  schedules: NoteSchedule[]
}

export class ScheduledNoteGrid extends Component<unknown, ScheduledNoteGridState> {
  constructor(props: unknown) {
    super(props);

    this.state = {
      schedules: [
        {
          cron: "0 0 * * *",
          name: "Notes for Day",
          active: true
        },
      ]
    };
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
            <h3>Schedule</h3>
          </Col>

          <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }}>
            <h3>Name Pattern</h3>
          </Col>
        </Row>);
      this.state.schedules.forEach((s, i) => {
        children.push(<Row key={i}>
          <Col xs={{ span: 5 }} lg={{ span: 6 }}>
            {s.cron}
          </Col>

          <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }}>
            {s.name}
          </Col>
        </Row>);
      });
      return <div>
        {children}
      </div>;
    }
  }
}