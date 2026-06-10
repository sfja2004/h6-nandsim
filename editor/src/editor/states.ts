import { Component, Joint, type ComponentKind } from "./Board";
import { ConnectingWire, Selection, type ConnectingWireKind } from "./Cx";
import { SelectionBox, type Cx, type Tool } from "./Cx";
import type { EventUnsub } from "./events";
import { v2, type V2 } from "./V2";

export interface State {
  leave(): void;
  enter(): void;
}

export class Normal implements State {
  private unsubscribe!: EventUnsub;

  constructor(private cx: Cx) {}

  enter(): void {
    this.unsubscribe = this.cx.events.subscribe(
      ["MouseDownOffset", "MouseMoveOffset", "MouseDragBegin", "KeyDown"],
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

export class Panning implements State {
  private unsubscribe!: EventUnsub;

  constructor(private cx: Cx) {}

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

export class Placing implements State {
  private unsubscribe!: EventUnsub;

  private compDef: ComponentKind;

  constructor(
    private cx: Cx,
    private tool: Tool,
  ) {
    this.compDef = this.cx.componentRepo.get(this.tool);
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

export class Selecting implements State {
  private unsubscribe!: EventUnsub;

  private isMouseDown = false;

  constructor(private cx: Cx) {}

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

export class Moving implements State {
  private unsubscribe!: EventUnsub;

  constructor(private cx: Cx) {}

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

export class SelectingBox implements State {
  private unsubscribe!: EventUnsub;

  constructor(private cx: Cx) {}

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

  selectedTool(): Tool | null {
    return "select";
  }
}

export class Wiring implements State {
  private unsubscribe!: EventUnsub;

  constructor(private cx: Cx) {}

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
