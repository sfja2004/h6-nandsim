import { Board, ComponentRepo } from "./Board";
import { Renderer } from "./Renderer";
import * as states from "./states";
import { v2, V2 } from "./V2";

export class Cx {
  public offset = v2(0, 0);
  private renderNeeded = false;
  private state = new states.Normal(this) as states.State;
  private updateActions: (() => void)[] = [];

  private selectionBox: SelectionBox | null = null;
  private componentPlacer: ComponentPlacer | null = null;

  public board = new Board();
  public componentRepo = ComponentRepo.withDefaults();

  render(canvas: HTMLCanvasElement) {
    const r = new Renderer(canvas, this.offset);

    r.clear();
    r.drawGrid();
    this.board.render(r);
    this.selectionBox?.render(r);
    this.componentPlacer?.render(r);
  }

  renderIfNeeded(canvas: HTMLCanvasElement) {
    if (this.renderNeeded) {
      this.render(canvas);
      this.renderNeeded = false;
    }
  }

  setRenderNeeded() {
    this.renderNeeded = true;
  }

  mouseDown(pos: V2) {
    this.state.onMouseDown?.(pos);
  }
  mouseUp(pos: V2) {
    this.state.onMouseUp?.(pos);
  }
  mouseMove(deltaPos: V2, pos: V2) {
    this.state.onMouseMove?.(deltaPos, pos);
  }
  keyDown(key: string) {
    this.state.onKeyDown?.(key);
  }
  keyUp(key: string) {
    this.state.onKeyUp?.(key);
  }
  selectTool(tool: Tool) {
    switch (tool) {
      case "pan":
        this.transitionTo(new states.Panning(this));
        break;
      case "input":
      case "output":
      case "and":
      case "or":
      case "not":
        this.transitionTo(new states.Placing(this, tool));
        break;
      default:
        this.transitionTo(new states.Normal(this));
    }
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

  transitionTo(newState: states.State) {
    this.state.leaveState?.();
    this.state = newState;
    this.state.enterState?.();
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
    this.selectionBox = new SelectionBox(pos, v2(0, 0));
    this.renderNeeded = true;
  }

  removeSelectionRect() {
    this.selectionBox = null;
    this.renderNeeded = true;
  }

  moveSelectionRect(deltaPos: V2) {
    if (this.selectionBox) {
      this.selectionBox.size.x += deltaPos.x;
      this.selectionBox.size.y += deltaPos.y;
      this.renderNeeded = true;
    }
  }

  addComponentPlacer(pos: V2, size: V2) {
    this.componentPlacer = new ComponentPlacer(pos, size);
    this.renderNeeded = true;
  }

  removeComponentPlacer() {
    this.componentPlacer = null;
    this.renderNeeded = true;
  }

  setComponentPlacerPos(pos: V2) {
    if (this.componentPlacer) {
      this.componentPlacer.pos = pos;
      this.renderNeeded = true;
    }
  }

  canvasPosToBoard(pos: V2): V2 {
    const absX = pos.x - this.offset.x;
    const absY = pos.y - this.offset.y;
    return v2(absX, absY);
  }
}

export class SelectionBox {
  constructor(
    public pos: V2,
    public size: V2,
  ) {}

  render(r: Renderer) {
    r.drawSelectionBox(this.pos, this.size);
  }
}

export class ComponentPlacer {
  constructor(
    public pos: V2,
    public size: V2,
  ) {}

  render(r: Renderer) {
    r.drawComponentPlacer(this.pos, this.size);
  }
}

export type Tool = string;
