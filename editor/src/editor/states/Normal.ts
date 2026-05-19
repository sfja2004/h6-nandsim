import type { Cx, Tool } from "../Cx";
import type { V2 } from "../V2";
import type { State } from "../State";
import { Panning } from "./Panning";
import { SelectingBox } from "./SelectingBox";

export class Normal implements State {
  constructor(private cx: Cx) {}

  onMouseDown(pos: V2): void {
    if (
      this.cx.board.handleMouseClick(
        pos.sub(this.cx.offset),
        (comp, i) => {},
        (comp, i) => {},
        (comp) => {},
      ) === "handled"
    ) {
      return;
    } else {
      this.cx.addSelectionRect(pos);
      this.cx.transitionTo(new SelectingBox(this.cx));
    }
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
