import type { Cx, Tool } from "../Cx";
import type { V2 } from "../V2";
import type { State } from "../State";
import { Normal } from "./Normal";

export class Selecting implements State {
  constructor(private cx: Cx) {}

  onMouseUp(_pos: V2): void {
    this.cx.removeSelectionRect();
    this.cx.transitionTo(new Normal(this.cx));
  }

  onMouseMove(deltaPos: V2): void {
    this.cx.moveSelectionRect(deltaPos);
  }

  selectedTool(): Tool | null {
    return "select";
  }
}
