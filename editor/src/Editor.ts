export type V2 = { x: number; y: number };
export const V2 = (x: number, y: number): V2 => ({ x, y });

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

  mouseMove(deltaPos: V2) {
    this.cx.mouseMove(deltaPos);
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
    return ["select", "pan", "and"];
  }

  addUpdateAction(action: () => void): object {
    return this.cx.addUpdateAction(action);
  }

  removeUpdateAction(actionId: object) {
    this.cx.removeUpdateAction(actionId);
  }
}

class Cx {
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

interface State {
  onMouseDown?(pos: V2): void;
  onMouseUp?(pos: V2): void;
  onMouseMove?(deltaPos: V2): void;
  onKeyDown?(key: string): void;
  onKeyUp?(key: string): void;
  selectTool?(tool: Tool): void;
  selectedTool?(): Tool | null;
}

class Normal implements State {
  constructor(private cx: Cx) {}

  selectTool(tool: Tool): void {
    switch (tool) {
      case "pan":
        this.cx.transitionTo(new Panning(this.cx));
        break;
      case "and":
        this.cx.transitionTo(new Placing(this.cx, "and"));
    }
  }

  onMouseDown(pos: V2): void {
    this.cx.addSelectionRect(pos);
    this.cx.transitionTo(new Selecting(this.cx));
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

class Panning implements State {
  private dragging = false;

  constructor(private cx: Cx) {}

  onMouseDown(_pos: V2): void {
    this.dragging = true;
  }

  onMouseUp(_pos: V2): void {
    this.dragging = false;
  }

  onMouseMove(deltaPos: V2): void {
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

  selectTool(tool: Tool): void {
    this.cx.transitionTo(new Normal(this.cx));
    this.cx.selectTool(tool);
  }

  selectedTool(): Tool | null {
    return "pan";
  }
}

type SelectionRect = {
  pos: V2;
  size: V2;
};

class Selecting implements State {
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

class Placing implements State {
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

type Tool = "select" | "pan" | "and";
