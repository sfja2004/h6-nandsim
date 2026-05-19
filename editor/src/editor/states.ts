import type { ComponentDef } from "./Board";
import type { Cx, Tool } from "./Cx";
import { v2, type V2 } from "./V2";

export interface State {
  enterState?(): void;
  leaveState?(): void;
  onMouseDown?(pos: V2): void;
  onMouseUp?(pos: V2): void;
  onMouseMove?(deltaPos: V2, pos: V2): void;
  onKeyDown?(key: string): void;
  onKeyUp?(key: string): void;
  selectedTool?(): Tool | null;
}

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

export class Panning implements State {
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

  selectedTool(): Tool | null {
    return "pan";
  }
}

export class Placing implements State {
  private compDef: ComponentDef;

  constructor(
    private cx: Cx,
    private tool: Tool,
  ) {
    this.compDef = this.cx.componentRepo.get(this.tool);
  }

  enterState(): void {
    this.cx.addComponentPlacer(v2(0, 0), this.compDef.size);
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

export class Selecting implements State {
  constructor(private cx: Cx) {}
}

export class SelectingBox implements State {
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
