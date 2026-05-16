import type { Cx, Tool } from "../Cx";
import type { V2_ } from "../V2";
import type { State } from "../State";
import { Normal } from "./Normal";

export class Panning implements State {
  private dragging = false;

  constructor(private cx: Cx) {}

  onMouseDown(_pos: V2_): void {
    this.dragging = true;
  }

  onMouseUp(_pos: V2_): void {
    this.dragging = false;
  }

  onMouseMove(deltaPos: V2_): void {
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

  selectedTool(): Tool | null {
    return "pan";
  }
}
