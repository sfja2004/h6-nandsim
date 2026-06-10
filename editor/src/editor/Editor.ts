import { Cx, type Tool } from "./Cx";
import { EventBus } from "./events";
import { V2 } from "./V2";

export class Editor {
  public events = new EventBus();
  private cx = new Cx(this.events);

  render(canvas: HTMLCanvasElement) {
    this.cx.render(canvas);
  }

  renderIfNeeded(canvas: HTMLCanvasElement) {
    this.cx.renderIfNeeded(canvas);
  }

  tools(): Tool[] {
    return ["select", "pan", "input", "output", "and", "or", "not"];
  }
}
