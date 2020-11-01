import { createElement, ElementType } from "react";
import { Position } from "../utils";

export default (onClick: (e: React.ChangeEvent<HTMLInputElement>, pos: Position) => void): {[nodeType: string]: ElementType<any>} => {
  return {
    checkbox: (props: { checked: boolean; sourcePosition: Position; }) => {
      const children = createElement('input', {
        type: "checkbox", 
        defaultChecked: props.checked,
        onClick: (e: React.ChangeEvent<HTMLInputElement>) => { onClick(e, props.sourcePosition); }
      });

      return createElement('span', {}, children);
    }
  }
}
