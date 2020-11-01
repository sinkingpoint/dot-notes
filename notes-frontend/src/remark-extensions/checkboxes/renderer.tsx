import { createElement } from "react";

export default {
  checkbox: (props: any) => {
    console.log(props);
    const children = createElement('input', {type: "checkbox", defaultChecked: props.checked});
    return createElement('span', {}, children);
  }
}
