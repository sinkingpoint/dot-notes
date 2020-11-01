import { createElement } from "react";
import { Position } from "../utils";

export default (onClick: (e: React.ChangeEvent<HTMLInputElement>, pos: Position) => void) => {
  return {
    checkbox: (props: any) => {
      const children = createElement('input', {
        type: "checkbox", 
        defaultChecked: props.checked,
        onClick: (e: React.ChangeEvent<HTMLInputElement>) => { onClick(e, props.sourcePosition); }
      });

      return createElement('span', {}, children);
    }
  }
}
