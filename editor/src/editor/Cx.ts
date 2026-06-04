import {
  Board,
  ComponentRepo,
  Joint,
  type Component,
  type WireConnection,
} from "./Board";
import { Renderer } from "./Renderer";
import * as states from "./states";
import { v2, V2 } from "./V2";
import * as ir from "./ir";

export type Tool = string;

export class Cx {
  public offset = v2(0, 0);
  private renderNeeded = false;
  private state = new states.Normal(this) as states.State;
  private updateActions: (() => void)[] = [];

  public selectionBox: SelectionBox | null = null;
  private componentPlacer: ComponentPlacer | null = null;
  public selection: Selection | null = null;
  public connectingWire: ConnectingWire | null = null;

  public board = new Board();
  public componentRepo = ComponentRepo.withDefaults();

  public keysPressed = new Set<string>();

  render(canvas: HTMLCanvasElement) {
    const r = new Renderer(canvas, this.offset);

    r.clear();
    r.drawGrid();
    this.board.render(r, this.selection);
    this.selectionBox?.render(r);
    this.componentPlacer?.render(r);
    this.connectingWire?.render(r);
  }

  renderIfNeeded(canvas: HTMLCanvasElement) {
    if (this.renderNeeded) {
      this.render(canvas);
      this.renderNeeded = false;
    }
  }

  mouseDown(pos: V2) {
    this.state.onMouseDown?.(pos);
    this.renderNeeded = true;
  }
  mouseUp(pos: V2) {
    this.state.onMouseUp?.(pos);
    this.renderNeeded = true;
  }
  mouseMove(deltaPos: V2, pos: V2) {
    this.state.onMouseMove?.(deltaPos, pos);
    this.renderNeeded = true;
  }
  keyDown(key: string) {
    this.keysPressed.add(key);
    this.state.onKeyDown?.(key);
    this.renderNeeded = true;
  }
  keyUp(key: string) {
    this.keysPressed.delete(key);
    this.state.onKeyUp?.(key);
    this.renderNeeded = true;
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
  selectedTool(): Tool {
    return this.state.selectedTool?.() || "select";
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
    console.log(`Entering state ${newState.constructor.name}`);
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
  }

  addComponentPlacer(pos: V2, size: V2) {
    this.componentPlacer = new ComponentPlacer(pos, size);
  }

  removeComponentPlacer() {
    this.componentPlacer = null;
  }

  setComponentPlacerPos(pos: V2) {
    if (this.componentPlacer) {
      this.componentPlacer.pos = pos;
    }
  }

  canvasPosToBoard(pos: V2): V2 {
    const absX = pos.x - this.offset.x;
    const absY = pos.y - this.offset.y;
    return v2(absX, absY);
  }

  runSimulation() {
    const comp = this.board.toIr();
    console.log("Before optimizing");
    console.log(...new ir.ComponentPrinter().stringifyToConsole(comp));

    new ir.ComponentOptimizer(comp).optimize();

    console.log("After optimizing");
    console.log(...new ir.ComponentPrinter().stringifyToConsole(comp));
  }
}

export class SelectionBox {
  constructor(
    public pos: V2,
    public size = v2(0, 0),
  ) {}

  render(r: Renderer) {
    r.drawSelectionBox(this.pos, this.size);
  }

  move(deltaPos: V2) {
    this.size = this.size.add(deltaPos);
  }

  normalized(): { pos: V2; size: V2 } {
    const normalizedAxis = (p: number, s: number): [number, number] =>
      s >= 0 ? [p, s] : [p + s, -s];

    const [x, w] = normalizedAxis(this.pos.x, this.size.x);
    const [y, h] = normalizedAxis(this.pos.y, this.size.y);

    return { pos: v2(x, y), size: v2(w, h) };
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

export class Selection {
  private selectedComponents = new Set<Component>();
  private selectedJoints = new Set<Joint>();

  addComponent(comp: Component) {
    this.selectedComponents.add(comp);
  }
  addJoint(joint: Joint) {
    this.selectedJoints.add(joint);
  }

  toggleComponent(comp: Component) {
    if (this.selectedComponents.has(comp)) {
      this.selectedComponents.delete(comp);
    } else {
      this.selectedComponents.add(comp);
    }
  }
  toggleJoint(joint: Joint) {
    if (this.selectedJoints.has(joint)) {
      this.selectedJoints.delete(joint);
    } else {
      this.selectedJoints.add(joint);
    }
  }

  isComponentSelected(comp: Component) {
    return this.selectedComponents.has(comp);
  }
  isJointSelected(joint: Joint) {
    return this.selectedJoints.has(joint);
  }

  move(deltaPos: V2) {
    for (const comp of this.selectedComponents) {
      comp.pos = comp.pos.add(deltaPos);
    }
    for (const joint of this.selectedJoints) {
      joint.pos = joint.pos.add(deltaPos);
    }
  }
}

export class ConnectingWire {
  constructor(
    public kind: ConnectingWireKind,
    public pos: V2,
  ) {}

  render(r: Renderer) {
    switch (this.kind.tag) {
      case "InputPin":
      case "OutputPin":
        break;
      case "Intermediary":
        this.kind.prev.render(r);
        r.drawConnectingWirePoint(this.beginPos());
        break;
    }
    r.drawConnectingWire(this.beginPos(), this.pos);
  }

  move(pos: V2) {
    this.pos = pos;
  }

  connectToInput(board: Board, comp: Component, i: number) {
    this.pushWire(board, { tag: "InputPin", comp, i });
  }

  connectToOutput(board: Board, comp: Component, i: number) {
    this.pushWire(board, { tag: "OutputPin", comp, i });
  }

  connectToJoint(board: Board, joint: Joint) {
    this.pushWire(board, { tag: "Joint", joint });
  }

  private pushWire(board: Board, end: WireConnection) {
    switch (this.kind.tag) {
      case "InputPin":
      case "OutputPin": {
        const { tag, comp, i } = this.kind;
        board.addWire({ tag, comp, i }, end);
        break;
      }
      case "Intermediary": {
        const joint = board.addJoint(this.kind.pos);
        board.addWire({ tag: "Joint", joint }, end);
        this.kind.prev.pushWire(board, { tag: "Joint", joint });
        break;
      }
      case "Joint": {
        const joint = this.kind.joint;
        board.addWire({ tag: "Joint", joint }, end);
        break;
      }
      default:
        this.kind satisfies never;
    }
  }

  private beginPos(): V2 {
    switch (this.kind.tag) {
      case "InputPin":
        return v2(
          this.kind.comp.pos.x,
          this.kind.comp.pos.y +
            this.kind.comp.kind.inputPinOffsets()[this.kind.i],
        );
      case "OutputPin":
        return v2(
          this.kind.comp.pos.x + this.kind.comp.kind.size.x,
          this.kind.comp.pos.y +
            this.kind.comp.kind.outputPinOffsets()[this.kind.i],
        );
      case "Intermediary":
        return this.kind.pos;
      case "Joint":
        return this.kind.joint.pos;
    }
  }
}

export type ConnectingWireKind =
  | { tag: "InputPin"; comp: Component; i: number }
  | { tag: "OutputPin"; comp: Component; i: number }
  | { tag: "Intermediary"; prev: ConnectingWire; pos: V2 }
  | { tag: "Joint"; joint: Joint };
