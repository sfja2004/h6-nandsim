import { Cx, type Tool } from "./Cx";
import { EventBus } from "./events";

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
