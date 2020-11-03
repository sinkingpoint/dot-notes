import React from "react";
import { ElementType } from "react";
import { NoteLink } from "../../components/note_link";

export default {
  // eslint-disable-next-line react/display-name
  noteLink: (props: { contents: string }) => {
    return <NoteLink note_id={props.contents} />
  }
} as {[nodeType: string]: ElementType};
