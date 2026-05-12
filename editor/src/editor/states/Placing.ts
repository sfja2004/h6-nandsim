import { type Cx, type Tool } from "../Cx";
import { V2 } from "../V2";
import type { State } from "../State";
import { Normal } from "./Normal";

export class Placing implements State {
  constructor(
    private cx: Cx,
    private tool: Tool,
  ) {}

  enterState(): void {
    this.cx.addComponentPlacer(V2(0, 0), V2(20 * 4, 20 * 2));
  }

  leaveState(): void {
    this.cx.removeComponentPlacer();
  }

  onMouseDown(pos: V2): void {
    const boardPos = this.cx.canvasPosToBoard(pos);
    if (this.cx.board.canPlaceComponent(boardPos, V2(4, 2))) {
      console.log("place");
      this.cx.board.placeComponent(boardPos, V2(4, 2), "AND");
      this.cx.transitionTo(new Normal(this.cx));
    }
  }

  onMouseMove(_deltaPos: V2, pos: V2): void {
    this.cx.setComponentPlacerPos(pos);
  }

  onKeyDown(key: string): void {
    if (key === "Escape") {
      this.cx.transitionTo(new Normal(this.cx));
      return;
    }
  }

  selectedTool(): Tool | null {
    return this.tool;
  }
}
