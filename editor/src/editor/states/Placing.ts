import type { Cx, Tool, V2 } from "../Cx";
import type { State } from "../State";
import { Normal } from "./Normal";

export class Placing implements State {
  constructor(
    private cx: Cx,
    private tool: Tool,
  ) {}

  onMouseUp(pos: V2): void {
    this.cx.transitionTo(new Normal(this.cx));
    console.log("place");
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
