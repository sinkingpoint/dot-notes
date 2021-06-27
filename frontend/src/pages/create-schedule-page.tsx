import { Divider } from 'antd';
import React, { Component, ReactNode } from 'react';
import { NoteSchedule } from '../api/client';
import { ScheduledNoteGrid } from '../components/scheduled_grid';
import { ScheduledNoteCreateForm } from '../components/schedule_note_create_form';

class CreateSchedulePage extends Component {
  scheduleDisplay: React.RefObject<ScheduledNoteGrid>;
  constructor(props: unknown) {
    super(props);

    this.onCreateNote = this.onCreateNote.bind(this);
    this.scheduleDisplay = React.createRef();
  }

  onCreateNote(note: NoteSchedule): void {
    if(this.scheduleDisplay.current) {
      this.scheduleDisplay.current.addSchedule(note);
    }
  }

  render(): ReactNode {
    return <div className="schedule-form">
      <h2>Scheduled Notes</h2>
      <ScheduledNoteCreateForm onCreateNote={this.onCreateNote} />

      <Divider />

      <ScheduledNoteGrid ref={this.scheduleDisplay} />
    </div>;
  }
}

export default CreateSchedulePage;