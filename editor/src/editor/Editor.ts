import { Cx, type Tool } from "./Cx";
import { V2 } from "./V2";

export class Editor {
  private cx = new Cx();

  render(canvas: HTMLCanvasElement) {
    this.cx.render(canvas);
  }

  renderIfNeeded(canvas: HTMLCanvasElement) {
    this.cx.renderIfNeeded(canvas);
  }

  mouseDown(pos: V2) {
    this.cx.mouseDown(pos);
  }

  mouseUp(pos: V2) {
    this.cx.mouseUp(pos);
  }

  mouseMove(deltaPos: V2, pos: V2) {
    this.cx.mouseMove(deltaPos, pos);
  }

  keyDown(key: string) {
    this.cx.keyDown(key);
  }

  keyUp(key: string) {
    this.cx.keyUp(key);
  }

  selectTool(tool: Tool) {
    this.cx.selectTool(tool);
  }

  selectedTool(): Tool | null {
    return this.cx.selectedTool();
  }

  tools(): Tool[] {
    return ["select", "pan", "and", "or"];
  }

  addUpdateAction(action: () => void): object {
    return this.cx.addUpdateAction(action);
  }

  removeUpdateAction(actionId: object) {
    this.cx.removeUpdateAction(actionId);
  }
}
