import type { Cx, Tool, V2 } from "../Cx";
import type { State } from "../State";
import { Normal } from "./Normal";

export class Panning implements State {
  private dragging = false;

  constructor(private cx: Cx) {}

  onMouseDown(_pos: V2): void {
    this.dragging = true;
  }

  onMouseUp(_pos: V2): void {
    this.dragging = false;
  }

  onMouseMove(deltaPos: V2): void {
    if (this.dragging) {
      this.cx.moveOffset(deltaPos);
    }
  }

  onKeyDown(key: string): void {
    if (key === "Escape") {
      this.cx.transitionTo(new Normal(this.cx));
      return;
    }
  }

  onKeyUp(key: string): void {
    if (key === "Shift") {
      this.cx.transitionTo(new Normal(this.cx));
      return;
    }
  }

  selectTool(tool: Tool): void {
    this.cx.transitionTo(new Normal(this.cx));
    this.cx.selectTool(tool);
  }

  selectedTool(): Tool | null {
    return "pan";
  }
}
