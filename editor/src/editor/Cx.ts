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
import { Sim } from "./sim";
import { EventBus } from "./events";
import { Mouse } from "./Mouse";
import { ViewPos } from "./ViewPos";

export type Tool = string;

export class Cx {
  public viewpos: ViewPos;
  private renderNeeded = false;

  private state = new states.Normal(this) as states.State;

  public selectionBox: SelectionBox | null = null;
  private componentPlacer: ComponentPlacer | null = null;
  public selection: Selection | null = null;
  public connectingWire: ConnectingWire | null = null;

  public board = new Board();
  public componentRepo = ComponentRepo.withDefaults();

  public keysPressed = new Set<string>();

  public mouse: Mouse;

  constructor(public events: EventBus) {
    this.viewpos = new ViewPos(events);
    this.mouse = new Mouse(this.events);

    this.state.enter();

    this.events.subscribe(
      ["MouseDown", "MouseUp", "MouseMove", "KeyDown", "KeyUp", "SelectTool"],
      (ev) => {
        switch (ev.tag) {
          case "KeyDown":
            this.keysPressed.add(ev.key);
            break;
          case "KeyUp":
            this.keysPressed.delete(ev.key);
            break;
          case "SelectTool":
            this.onSelectTool(ev.tool);
        }
        this.renderNeeded = true;
      },
    );
  }

  render(canvas: HTMLCanvasElement) {
    const r = new Renderer(canvas, this.viewpos.offset);

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

  private onSelectTool(tool: Tool) {
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
    this.events.send({ tag: "ShowSelectedTool", tool });
  }

  transitionTo(newState: states.State) {
    this.state.leave();
    this.state = newState;
    // console.log(`Entering state ${newState.constructor.name}`);
    this.state.enter();
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

  runSimulation() {
    // const comp = this.board.toIr();
    // console.log("Before optimizing");
    // console.log(...new ir.ComponentPrinter().stringifyToConsole(comp));
    // new ir.ComponentOptimizer(comp).optimize();
    // console.log("After optimizing");
    // console.log(...new ir.ComponentPrinter().stringifyToConsole(comp));
    // const sim = new Sim(comp, [], []);
    // sim.simulate();
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

  boardRect(viewpos: ViewPos): { pos: V2; size: V2 } {
    const normalizedAxis = (p: number, s: number): [number, number] =>
      s >= 0 ? [p, s] : [p + s, -s];

    const [x, w] = normalizedAxis(this.pos.x, this.size.x);
    const [y, h] = normalizedAxis(this.pos.y, this.size.y);

    return { pos: v2(x, y).sub(viewpos.offset), size: v2(w, h) };
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
