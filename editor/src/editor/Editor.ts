import { Board, ComponentRepo } from "./Board";
import { SelectionBox } from "./SelectionBox";
import { ComponentPlacer } from "./ComponentPlacer";
import { Selection } from "./Selection";
import { ConnectingWire, type ConnectingWireKind } from "./ConnectingWire";
import { EventBus } from "./events";
import { Mouse } from "./Mouse";
import { Renderer } from "./Renderer";
import { v2, type V2 } from "./V2";
import { ViewPos } from "./ViewPos";
import { type ComponentKind } from "./Board";
import type { EventUnsub } from "./events";
import { Project } from "./Project";

export class Editor {
  public events = new EventBus();
  public viewpos = new ViewPos(this.events);
  public mouse = new Mouse(this.events);

  public project = Project.loadLocalStoreOrInitNew(this.events);
  public board = this.project.currentBoard();

  public selectionBox: SelectionBox | null = null;
  private componentPlacer: ComponentPlacer | null = null;
  public selection: Selection | null = null;
  public connectingWire: ConnectingWire | null = null;

  public keysPressed = new Set<string>();

  private state: State = new Normal(this);

  constructor() {
    this.events.subscribe(
      [
        "MouseDown",
        "MouseUp",
        "MouseMove",
        "KeyDown",
        "KeyUp",
        "SelectTool",
        "CreateTab",
        "SelectTab",
        "SaveComponent",
        "RenameComponent",
      ],
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
            break;
          case "CreateTab": {
            const idx = this.project.newTab();
            this.switchTab(idx);
            break;
          }
          case "SelectTab": {
            this.switchTab(ev.idx);
            break;
          }
          case "SaveComponent": {
            this.project.saveComponent();
            break;
          }
          case "RenameComponent": {
            this.project.renameComponent(ev.newName);
            break;
          }
        }
        this.events.send({ tag: "RenderRequest" });
      },
    );

    this.state.enter();
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

  availableBoardEditors(): string[] {
    return this.project.availableBoardEditors();
  }

  availableTools(): string[] {
    return this.project.availableTools();
  }

  transitionTo(newState: State) {
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
  private onSelectTool(tool: string) {
    switch (tool) {
      case "pan":
        this.transitionTo(new Panning(this));
        break;
      case "input":
      case "output":
      case "and":
      case "or":
      case "not":
        this.transitionTo(new Placing(this, tool));
        break;
      default:
        this.transitionTo(new Normal(this));
    }
    this.events.send({ tag: "ShowSelectedTool", tool });
  }

  private switchTab(idx: number) {
    this.project.switchTab(idx);
    this.events.send({ tag: "ShowSelectedTab", idx });
    this.selectionBox = null;
    this.componentPlacer = null;
    this.selection = null;
    this.connectingWire = null;
    this.viewpos.offset.assign(v2(0, 0));
    this.board = this.project.currentBoard();
    this.transitionTo(new Normal(this));
  }
}

interface State {
  leave(): void;
  enter(): void;
}

class Normal implements State {
  private unsubscribe!: EventUnsub;

  constructor(private cx: Editor) {}

  enter(): void {
    this.unsubscribe = this.cx.events.subscribe(
      [
        "MouseDownOffset",
        "MouseMoveOffset",
        "MouseDragBegin",
        "KeyDown",
        "MouseDoubleClick",
      ],
      (ev) => {
        switch (ev.tag) {
          case "MouseDownOffset":
            this.onMouseDown(ev.pos);
            break;
          case "MouseMoveOffset":
            this.cx.board.updateMouseHover(ev.pos);
            break;
          case "MouseDragBegin": {
            this.cx.selectionBox = new SelectionBox(ev.pos, ev.deltaPos);
            this.cx.transitionTo(new SelectingBox(this.cx));
            break;
          }
          case "KeyDown": {
            if (ev.key === "Shift") {
              this.cx.transitionTo(new Panning(this.cx));
              return;
            }
            break;
          }
          case "MouseDoubleClick": {
            this.cx.board.handleMouseClick(ev.pos, {
              onComponentClicked: (comp) => {
                if (comp.kind.label === "input") {
                }
              },
            });
            break;
          }
        }
      },
    );

    this.cx.events.send({ tag: "ShowSelectedTool", tool: "select" });
    this.cx.runSimulation();
  }

  leave(): void {
    this.unsubscribe();
  }

  private onMouseDown(pos: V2): void {
    this.cx.board.handleMouseClick(pos, {
      onInputPinClicked: (comp, i) => {
        this.cx.connectingWire = new ConnectingWire(
          { tag: "InputPin", comp, i },
          pos,
        );
        this.cx.transitionTo(new Wiring(this.cx));
      },
      onOutputPinClicked: (comp, i) => {
        this.cx.connectingWire = new ConnectingWire(
          { tag: "OutputPin", comp, i },
          pos,
        );
        this.cx.transitionTo(new Wiring(this.cx));
      },
      onComponentClicked: (comp) => {
        this.cx.selection = new Selection();
        this.cx.selection.addComponent(comp);
        this.cx.transitionTo(new Selecting(this.cx));
      },
      onJointClicked: (joint) => {
        if (this.cx.keysPressed.has("Control")) {
          this.cx.selection = new Selection();
          this.cx.selection.addJoint(joint);
          this.cx.transitionTo(new Selecting(this.cx));
        } else {
          this.cx.connectingWire = new ConnectingWire(
            { tag: "Joint", joint },
            pos,
          );
          this.cx.transitionTo(new Wiring(this.cx));
        }
      },
    });
  }
}

class Panning implements State {
  private unsubscribe!: EventUnsub;

  constructor(private cx: Editor) {}

  enter(): void {
    this.unsubscribe = this.cx.events.subscribe(
      ["MouseDragBegin", "MouseDrag", "KeyDown", "KeyUp"],
      (ev) => {
        switch (ev.tag) {
          case "MouseDragBegin":
          case "MouseDrag":
            this.cx.viewpos.move(ev.deltaPos);
            break;
          case "KeyDown": {
            if (ev.key === "Escape") {
              this.cx.transitionTo(new Normal(this.cx));
              break;
            }
            break;
          }
          case "KeyUp": {
            if (ev.key === "Shift") {
              this.cx.transitionTo(new Normal(this.cx));
              break;
            }
            break;
          }
        }
      },
    );

    this.cx.events.send({ tag: "ShowSelectedTool", tool: "pan" });
  }

  leave(): void {
    this.unsubscribe();
  }
}

class Placing implements State {
  private unsubscribe!: EventUnsub;

  private compDef: ComponentKind;

  constructor(
    private cx: Editor,
    private tool: string,
  ) {
    this.compDef = this.cx.project.componentRepo.get(this.tool);
  }

  enter(): void {
    this.unsubscribe = this.cx.events.subscribe(
      ["MouseDownOffset", "MouseMove", "KeyDown"],
      (ev) => {
        switch (ev.tag) {
          case "MouseDownOffset": {
            const boardPos = ev.pos;
            if (this.cx.board.canPlaceComponent(this.compDef, boardPos)) {
              this.cx.board.placeComponent(this.compDef, boardPos);
              this.cx.transitionTo(new Normal(this.cx));
            }
            break;
          }
          case "MouseMove":
            this.cx.setComponentPlacerPos(ev.pos);
            break;
          case "KeyDown": {
            if (ev.key === "Escape") {
              this.cx.transitionTo(new Normal(this.cx));
              break;
            }
            break;
          }
        }
      },
    );

    this.cx.addComponentPlacer(v2(0, 0), this.compDef.size);
  }

  leave(): void {
    this.cx.removeComponentPlacer();
    this.unsubscribe();
  }
}

class Selecting implements State {
  private unsubscribe!: EventUnsub;

  private isMouseDown = false;

  constructor(private cx: Editor) {}

  enter(): void {
    this.unsubscribe = this.cx.events.subscribe(
      ["MouseDownOffset", "MouseUp", "MouseMoveOffset", "KeyDown"],
      (ev) => {
        switch (ev.tag) {
          case "MouseDownOffset":
            this.onMouseDown(ev.pos, ev.absPos);
            break;
          case "MouseUp":
            this.isMouseDown = false;
            break;
          case "MouseMoveOffset": {
            this.cx.board.updateMouseHover(ev.pos);
            if (this.isMouseDown) {
              this.cx.transitionTo(new Moving(this.cx));
            }
            break;
          }
          case "KeyDown": {
            if (ev.key === "Delete") {
              if (!this.cx.selection) {
                throw new Error("expected selection");
              }
              this.cx.board.deleteSelection(this.cx.selection);
              this.cx.selection = null;
              this.cx.transitionTo(new Normal(this.cx));
            }
            break;
          }
        }
      },
    );
  }

  leave(): void {
    this.unsubscribe();
  }

  private onMouseDown(pos: V2, absPos: V2): void {
    if (
      this.cx.board.handleMouseClick(pos, {
        onComponentClicked: (comp) => {
          if (this.cx.keysPressed.has("Control")) {
            this.cx.selection?.toggleComponent(comp);
          } else if (!this.cx.selection?.isComponentSelected(comp)) {
            this.cx.selection = new Selection();
            this.cx.selection.addComponent(comp);
          }
        },
        onJointClicked: (joint) => {
          if (this.cx.keysPressed.has("Control")) {
            this.cx.selection?.toggleJoint(joint);
          } else if (!this.cx.selection?.isJointSelected(joint)) {
            this.cx.selection = new Selection();
            this.cx.selection.addJoint(joint);
          }
        },
      }) !== "handled"
    ) {
      if (this.cx.keysPressed.has("Control")) {
        this.cx.selectionBox = new SelectionBox(absPos);
        this.cx.transitionTo(new SelectingBox(this.cx));
      } else {
        this.cx.selection = null;
        this.cx.selectionBox = new SelectionBox(absPos);
        this.cx.transitionTo(new SelectingBox(this.cx));
      }
    }

    this.isMouseDown = true;
  }
}

class Moving implements State {
  private unsubscribe!: EventUnsub;

  constructor(private cx: Editor) {}

  enter(): void {
    this.unsubscribe = this.cx.events.subscribe(
      ["MouseUp", "MouseMove"],
      (ev) => {
        switch (ev.tag) {
          case "MouseUp":
            this.cx.transitionTo(new Selecting(this.cx));
            break;
          case "MouseMove":
            this.cx.selection?.move(ev.deltaPos);
            break;
        }
      },
    );
  }

  leave(): void {
    this.unsubscribe();
  }
}

class SelectingBox implements State {
  private unsubscribe!: EventUnsub;

  constructor(private cx: Editor) {}

  enter(): void {
    this.unsubscribe = this.cx.events.subscribe(
      ["MouseUp", "MouseMove"],
      (ev) => {
        switch (ev.tag) {
          case "MouseUp":
            this.onMouseUp(ev.pos);
            break;
          case "MouseMove":
            this.cx.selectionBox?.move(ev.deltaPos);
            break;
        }
      },
    );
  }

  leave(): void {
    this.unsubscribe();
  }

  private onMouseUp(_pos: V2): void {
    if (!this.cx.selectionBox) {
      throw new Error("expected selectionBox to active");
    }
    const { pos, size } = this.cx.selectionBox.boardRect(this.cx.viewpos);

    const components = this.cx.board.componentsInRect(pos, size);
    const joints = this.cx.board.jointsInRect(pos, size);

    if (components.length > 0 || joints.length > 0) {
      this.cx.selection ??= new Selection();
    }

    for (const comp of components) {
      this.cx.selection?.addComponent(comp);
    }
    for (const joint of joints) {
      this.cx.selection?.addJoint(joint);
    }

    if (this.cx.selection) {
      this.cx.selectionBox = null;
      this.cx.transitionTo(new Selecting(this.cx));
    } else {
      this.cx.selectionBox = null;
      this.cx.transitionTo(new Normal(this.cx));
    }
  }
}

class Wiring implements State {
  private unsubscribe!: EventUnsub;

  constructor(private cx: Editor) {}

  enter(): void {
    this.unsubscribe = this.cx.events.subscribe(
      ["MouseDownOffset", "MouseMoveOffset", "KeyDown"],
      (ev) => {
        switch (ev.tag) {
          case "MouseDownOffset":
            this.onMouseDown(ev.pos);
            break;
          case "MouseMoveOffset": {
            if (!this.cx.connectingWire) {
              throw new Error("expected connectingWire to be active");
            }
            this.cx.connectingWire.move(ev.pos);
            this.cx.board.updateMouseHover(ev.pos);
            break;
          }
          case "KeyDown": {
            if (ev.key === "Escape") {
              this.cx.transitionTo(new Normal(this.cx));
              this.cx.connectingWire = null;
              return;
            }
            break;
          }
        }
      },
    );
  }

  leave(): void {
    this.unsubscribe();
  }

  private onMouseDown(pos: V2): void {
    if (
      this.cx.board.handleMouseClick(pos, {
        onInputPinClicked: (comp, i) => {
          this.cx.connectingWire!.connectToInput(this.cx.board, comp, i);
          this.cx.connectingWire = null;
          this.cx.transitionTo(new Normal(this.cx));
        },
        onOutputPinClicked: (comp, i) => {
          this.cx.connectingWire!.connectToOutput(this.cx.board, comp, i);
          this.cx.connectingWire = null;
          this.cx.transitionTo(new Normal(this.cx));
        },
        onJointClicked: (joint) => {
          this.cx.connectingWire!.connectToJoint(this.cx.board, joint);
          this.cx.connectingWire = null;
          this.cx.transitionTo(new Normal(this.cx));
        },
      }) !== "handled"
    ) {
      const kind: ConnectingWireKind = {
        tag: "Intermediary",
        prev: this.cx.connectingWire!,
        pos,
      };
      this.cx.connectingWire = new ConnectingWire(kind, pos);
    }
  }
}
