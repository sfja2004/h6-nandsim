import type { Cx, Tool } from "../Cx";
import type { V2 } from "../V2";
import type { State } from "../State";
import { Panning } from "./Panning";
import { Placing } from "./Placing";
import { Selecting } from "./Selecting";

export class Normal implements State {
  constructor(private cx: Cx) {}

  selectTool(tool: Tool): void {
    switch (tool) {
      case "pan":
        this.cx.transitionTo(new Panning(this.cx));
        break;
      case "input":
      case "output":
      case "and":
      case "or":
      case "not":
        this.cx.transitionTo(new Placing(this.cx, tool));
    }
  }

  onMouseDown(pos: V2): void {
    this.cx.addSelectionRect(pos);
    this.cx.transitionTo(new Selecting(this.cx));
  }

  onMouseMove(_deltaPos: V2, pos: V2): void {
    this.cx.board.updateMouseHover(pos.sub(this.cx.offset));
    this.cx.setRenderNeeded();
  }

  onKeyDown(key: string): void {
    if (key === "Shift") {
      this.cx.transitionTo(new Panning(this.cx));
      return;
    }
  }

  selectedTool(): Tool | null {
    return "select";
  }
}
