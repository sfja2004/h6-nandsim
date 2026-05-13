import { type Cx, type Tool } from "../Cx";
import { V2 } from "../V2";
import type { State } from "../State";
import { Normal } from "./Normal";
import type { ComponentDef } from "../Board";

export class Placing implements State {
  private compDef: ComponentDef;

  constructor(
    private cx: Cx,
    private tool: Tool,
  ) {
    this.compDef = this.cx.componentRepo.get(this.tool);
  }

  enterState(): void {
    this.cx.addComponentPlacer(V2(0, 0), this.compDef.size);
  }

  leaveState(): void {
    this.cx.removeComponentPlacer();
  }

  onMouseDown(pos: V2): void {
    const boardPos = this.cx.canvasPosToBoard(pos);
    if (this.cx.board.canPlaceComponent(this.compDef, boardPos)) {
      this.cx.board.placeComponent(this.compDef, boardPos);
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
