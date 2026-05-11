import type { State } from "./State";
import { Normal } from "./states/Normal";

export class Cx {
  private offset = V2(0, 0);
  private renderNeeded = false;
  private state = new Normal(this) as State;
  private updateActions: (() => void)[] = [];
  private selectionRect: SelectionRect | null = null;

  render(canvas: HTMLCanvasElement) {
    const c = canvas.getContext("2d")!;

    c.imageSmoothingEnabled = false;
    c.fillStyle = "#666";
    c.fillRect(0, 0, canvas.width, canvas.height);

    const gridSize = { x: 20, y: 20 };
    const dotSize = { x: 2, y: 2 };

    c.fillStyle = "#111";
    for (let y = 0; y < canvas.width / gridSize.x + 1; ++y) {
      for (let x = 0; x < canvas.height / gridSize.y + 1; ++x) {
        c.fillRect(
          (this.offset.x % gridSize.x) + x * gridSize.x - dotSize.x / 2,
          (this.offset.y % gridSize.y) + y * gridSize.y - dotSize.y / 2,
          dotSize.x,
          dotSize.y,
        );
      }
    }

    if (this.selectionRect) {
      const {
        pos: { x, y },
        size: { x: w, y: h },
      } = this.selectionRect;

      c.fillStyle = `#ff880088`;
      c.fillRect(x, y, w, h);
      c.strokeStyle = `#ff8800`;
      c.lineWidth = 2;
      c.strokeRect(x, y, w, h);
    }
  }

  renderIfNeeded(canvas: HTMLCanvasElement) {
    if (this.renderNeeded) {
      this.render(canvas);
      this.renderNeeded = false;
    }
  }

  mouseDown(pos: V2) {
    this.state.onMouseDown?.(pos);
  }
  mouseUp(pos: V2) {
    this.state.onMouseUp?.(pos);
  }
  mouseMove(deltaPos: V2) {
    this.state.onMouseMove?.(deltaPos);
  }
  keyDown(key: string) {
    this.state.onKeyDown?.(key);
  }
  keyUp(key: string) {
    this.state.onKeyUp?.(key);
  }
  selectTool(tool: Tool) {
    this.state.selectTool?.(tool);
  }
  selectedTool(): Tool | null {
    return this.state.selectedTool?.() ?? null;
  }

  addUpdateAction(action: () => void): object {
    this.updateActions.push(action);
    return action;
  }

  removeUpdateAction(actionId: object) {
    this.updateActions = this.updateActions.filter(
      (action) => action !== actionId,
    );
  }

  transitionTo(newState: State) {
    this.state = newState;
    this.notifyListeners();
  }

  notifyListeners() {
    for (const action of this.updateActions) {
      action();
    }
  }

  moveOffset(deltaPos: V2) {
    this.offset.x += deltaPos.x;
    this.offset.y += deltaPos.y;
    this.renderNeeded = true;
  }

  addSelectionRect(pos: V2) {
    this.selectionRect = { pos, size: V2(0, 0) };
    this.renderNeeded = true;
  }

  removeSelectionRect() {
    this.selectionRect = null;
    this.renderNeeded = true;
  }

  moveSelectionRect(deltaPos: V2) {
    if (this.selectionRect) {
      this.selectionRect.size.x += deltaPos.x;
      this.selectionRect.size.y += deltaPos.y;
      this.renderNeeded = true;
    }
  }
}

export type V2 = { x: number; y: number };
export const V2 = (x: number, y: number): V2 => ({ x, y });

export type SelectionRect = {
  pos: V2;
  size: V2;
};

export type Tool = "select" | "pan" | "and";
