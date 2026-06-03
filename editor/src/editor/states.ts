import { Component, Joint, type ComponentKind } from "./Board";
import { ConnectingWire, Selection, type ConnectingWireKind } from "./Cx";
import { SelectionBox, type Cx, type Tool } from "./Cx";
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
  private dragStart = v2(0, 0);
  private isMouseDown = false;

  constructor(private cx: Cx) {}

  enterState(): void {
    this.cx.runSimulation();
  }

  onMouseDown(pos: V2): void {
    if (
      this.cx.board.handleMouseClick(pos.sub(this.cx.offset), {
        onInputPinClicked: (comp, i) => {
          this.cx.connectingWire = new ConnectingWire(
            { tag: "InputPin", comp, i },
            pos.sub(this.cx.offset),
          );
          this.cx.transitionTo(new Wiring(this.cx));
        },
        onOutputPinClicked: (comp, i) => {
          this.cx.connectingWire = new ConnectingWire(
            { tag: "OutputPin", comp, i },
            pos.sub(this.cx.offset),
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
              pos.sub(this.cx.offset),
            );
            this.cx.transitionTo(new Wiring(this.cx));
          }
        },
      }) !== "handled"
    ) {
      this.isMouseDown = true;
      this.dragStart = pos;
    }
  }

  onMouseMove(_deltaPos: V2, pos: V2): void {
    if (this.isMouseDown && this.dragStart.sub(pos).len() > 5) {
      this.cx.selectionBox = new SelectionBox(
        this.dragStart,
        pos.sub(this.dragStart),
      );
      this.cx.transitionTo(new SelectingBox(this.cx));
    }
    this.cx.board.updateMouseHover(pos.sub(this.cx.offset));
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
  private compDef: ComponentKind;

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
  private isMouseDown = false;

  constructor(private cx: Cx) {}

  onMouseDown(pos: V2): void {
    if (
      this.cx.board.handleMouseClick(pos.sub(this.cx.offset), {
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
        this.cx.selectionBox = new SelectionBox(pos);
        this.cx.transitionTo(new SelectingBox(this.cx));
      } else {
        this.cx.selection = null;
        this.cx.selectionBox = new SelectionBox(pos);
        this.cx.transitionTo(new SelectingBox(this.cx));
      }
    }

    this.isMouseDown = true;
  }

  onMouseUp(_pos: V2): void {
    this.isMouseDown = false;
  }

  onMouseMove(_deltaPos: V2, pos: V2): void {
    this.cx.board.updateMouseHover(pos.sub(this.cx.offset));
    if (this.isMouseDown) {
      this.cx.transitionTo(new Moving(this.cx));
    }
  }

  onKeyDown(key: string): void {
    if (key === "Delete") {
      if (!this.cx.selection) {
        throw new Error("expected selection");
      }
      this.cx.board.deleteSelection(this.cx.selection);
      this.cx.selection = null;
      this.cx.transitionTo(new Normal(this.cx));
    }
  }
}

export class Moving implements State {
  constructor(private cx: Cx) {}

  onMouseUp(_pos: V2): void {
    this.cx.transitionTo(new Selecting(this.cx));
  }

  onMouseMove(deltaPos: V2, _pos: V2): void {
    this.cx.selection?.move(deltaPos);
  }
}

export class SelectingBox implements State {
  constructor(private cx: Cx) {}

  onMouseUp(_pos: V2): void {
    if (!this.cx.selectionBox) {
      throw new Error("expected selectionBox to active");
    }
    const { pos, size } = this.cx.selectionBox.normalized();

    const components = this.cx.board.componentsInRect(
      pos.sub(this.cx.offset),
      size,
    );
    const joints = this.cx.board.jointsInRect(pos.sub(this.cx.offset), size);

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

  onMouseMove(deltaPos: V2): void {
    this.cx.selectionBox?.move(deltaPos);
  }

  selectedTool(): Tool | null {
    return "select";
  }
}

export class Wiring implements State {
  constructor(private cx: Cx) {}

  onMouseDown(pos: V2): void {
    if (
      this.cx.board.handleMouseClick(pos.sub(this.cx.offset), {
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
        pos: pos.sub(this.cx.offset),
      };
      this.cx.connectingWire = new ConnectingWire(kind, pos);
    }
  }

  onMouseMove(_deltaPos: V2, pos: V2): void {
    if (!this.cx.connectingWire) {
      throw new Error("expected connectingWire to be active");
    }
    this.cx.connectingWire.move(pos.sub(this.cx.offset));
    this.cx.board.updateMouseHover(pos.sub(this.cx.offset));
  }

  onKeyDown(key: string): void {
    if (key === "Escape") {
      this.cx.transitionTo(new Normal(this.cx));
      this.cx.connectingWire = null;
      return;
    }
  }
}
