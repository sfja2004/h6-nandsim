import type { Selection } from "./Cx";
import type { Renderer } from "./Renderer";
import {
  lineSegmentPointDistance,
  pointInsideRect,
  rectsCollide,
  v2,
  V2,
} from "./V2";

export class Board {
  private components: Component[] = [];
  private joints: Joint[] = [];
  private wires: Wire[] = [];

  private hoveredOverInput: [Component, number] | null = null;
  private hoveredOverOutput: [Component, number] | null = null;
  private hoveredOverJoint: Joint | null = null;
  private hoveredOverWire: Wire | null = null;

  constructor() {}

  canPlaceComponent(kind: ComponentKind, pos: V2): boolean {
    return !this.components.some((comp) =>
      rectsCollide(comp.pos, comp.kind.size, pos, kind.size),
    );
  }

  placeComponent(kind: ComponentKind, pos: V2) {
    this.components.push(new Component(kind, pos));
  }

  render(r: Renderer, selection: Selection | null) {
    for (const comp of this.components) {
      const { pos, kind } = comp;
      if (selection?.isComponentSelected(comp)) {
        r.drawComponentBodySelected(pos, kind);
      } else {
        r.drawComponentBody(pos, kind);
      }

      for (const wire of this.wires) {
        if (this.hoveredOverWire == wire) {
          r.drawWireHovered(wire.beginPos(), wire.endPos());
        } else {
          r.drawWire(wire.beginPos(), wire.endPos());
        }
      }

      for (const joint of this.joints) {
        r.drawJoint(joint.pos);

        if (this.hoveredOverJoint === joint) {
          r.drawJointHover(joint.pos);
        }
      }

      for (const [i, pinOffset] of kind.inputPinOffsets().entries()) {
        if (kind.inputs[i] !== null) {
          throw new Error("pin text not implemented");
        }
        r.drawComponentInputPin(pos, pinOffset);

        if (
          this.hoveredOverInput?.[0] === comp &&
          this.hoveredOverInput[1] === i
        ) {
          r.drawComponentInputPinHover(pos, pinOffset);
        }
      }

      for (const [i, pinOffset] of kind.outputPinOffsets().entries()) {
        if (kind.outputs[i] !== null) {
          throw new Error("pin text not implemented");
        }
        r.drawComponentOutputPin(pos, kind, pinOffset);

        if (
          this.hoveredOverOutput?.[0] === comp &&
          this.hoveredOverOutput[1] === i
        ) {
          r.drawComponentOutputPinHover(pos, kind, pinOffset);
        }
      }
    }
  }

  updateMouseHover(pos: V2) {
    this.hoveredOverInput = null;
    this.hoveredOverOutput = null;
    this.hoveredOverJoint = null;
    this.hoveredOverWire = null;

    for (const comp of this.components) {
      const mouseOverResult = comp.mouseOver(pos);
      switch (mouseOverResult?.tag) {
        case "InputPin":
          this.hoveredOverInput = [comp, mouseOverResult.i];
          return;
        case "OutputPin":
          this.hoveredOverOutput = [comp, mouseOverResult.i];
          return;
      }
    }

    for (const joint of this.joints) {
      if (joint.isMouseOver(pos)) {
        this.hoveredOverJoint = joint;
        return;
      }
    }

    for (const wire of this.wires) {
      if (wire.isMouseOver(pos)) {
        this.hoveredOverWire = wire;
        return;
      }
    }
  }

  handleMouseClick(
    pos: V2,
    actions: {
      onInputPinClicked?(comp: Component, i: number): void;
      onOutputPinClicked?(comp: Component, i: number): void;
      onComponentClicked?(comp: Component): void;
      onJointClicked?(joint: Joint): void;
      onWireClicked?(wire: Wire): void;
    },
  ): "handled" | "not handled" {
    for (const comp of this.components) {
      const mouseOverResult = comp.mouseOver(pos);
      switch (mouseOverResult?.tag) {
        case "Component":
          actions.onComponentClicked?.(comp);
          return "handled";
        case "InputPin":
          actions.onInputPinClicked?.(comp, mouseOverResult.i);
          return "handled";
        case "OutputPin":
          actions.onOutputPinClicked?.(comp, mouseOverResult.i);
          return "handled";
      }
    }

    for (const joint of this.joints) {
      if (joint.isMouseOver(pos)) {
        actions.onJointClicked?.(joint);
        return "handled";
      }
    }

    for (const wire of this.wires) {
      if (wire.isMouseOver(pos)) {
        actions.onWireClicked?.(wire);
        return "handled";
      }
    }
    return "not handled";
  }

  componentsInRect(pos: V2, size: V2): Component[] {
    return this.components.filter((comp) =>
      rectsCollide(pos, size, comp.pos, comp.kind.size),
    );
  }

  addJoint(pos: V2): Joint {
    const t = new Joint(pos);
    this.joints.push(t);
    return t;
  }
  addWire(begin: WireConnection, end: WireConnection): Wire {
    const wire = new Wire(begin, end);
    this.wires.push(wire);
    return wire;
  }
}

export class ComponentRepo {
  private defs = new Map<string, ComponentKind>();

  static withDefaults(): ComponentRepo {
    const repo = new ComponentRepo();

    for (const { label, size, inputs, outputs } of defaultDefs) {
      repo.add(label, new ComponentKind(size, label, inputs, outputs));
    }

    return repo;
  }

  add(ident: string, kind: ComponentKind) {
    this.defs.set(ident, kind);
  }

  get(ident: string): ComponentKind {
    const kind = this.defs.get(ident);
    if (!kind) {
      throw new Error("should be defined");
    }
    return kind;
  }
}

export class Component {
  constructor(
    public kind: ComponentKind,
    public pos: V2,
  ) {}

  mouseOver(pos: V2): ComponentMouseOverResult | null {
    const {
      pos: { x, y },
      kind: {
        size: { x: w },
      },
    } = this;

    if (
      !pointInsideRect(
        pos,
        this.pos.sub(v2(5, 5)),
        this.kind.size.add(v2(10, 10)),
      )
    ) {
      return null;
    }

    for (const [i, pinOffset] of this.kind.inputPinOffsets().entries()) {
      if (v2(x, y + pinOffset).distance(pos) < 6) {
        return { tag: "InputPin", i };
      }
    }
    for (const [i, pinOffset] of this.kind.outputPinOffsets().entries()) {
      if (v2(x + w, y + pinOffset).distance(pos) < 6) {
        return { tag: "OutputPin", i };
      }
    }
    return { tag: "Component" };
  }

  inputPinPos(i: number): V2 {
    return this.pos.add(v2(0, this.kind.inputPinOffsets()[i]));
  }

  outputPinPos(i: number): V2 {
    return this.pos.add(v2(this.kind.size.x, this.kind.outputPinOffsets()[i]));
  }
}

type ComponentMouseOverResult =
  | { tag: "Component" }
  | { tag: "InputPin" | "OutputPin"; i: number };

export class ComponentKind {
  constructor(
    public size: V2,
    public label: string,
    public inputs: (string | null)[],
    public outputs: (string | null)[],
  ) {}

  inputPinOffsets(): number[] {
    return this.inputs.map(
      (_, i) => ((i + 1) * this.size.y) / (this.inputs.length + 1),
    );
  }
  outputPinOffsets(): number[] {
    return this.outputs.map(
      (_, i) => ((i + 1) * this.size.y) / (this.outputs.length + 1),
    );
  }
}

export class Joint {
  constructor(public pos: V2) {}

  isMouseOver(pos: V2): boolean {
    return this.pos.distance(pos) < 6;
  }
}

export class Wire {
  constructor(
    private begin: WireConnection,
    private end: WireConnection,
  ) {}

  isMouseOver(pos: V2): boolean {
    const distance = lineSegmentPointDistance(
      this.beginPos(),
      this.endPos(),
      pos,
    );
    return distance !== null && distance < 6;
  }

  beginPos(): V2 {
    return this.connectionPos(this.begin);
  }

  endPos(): V2 {
    return this.connectionPos(this.end);
  }

  private connectionPos(connection: WireConnection): V2 {
    switch (connection.tag) {
      case "InputPin":
        return connection.comp.inputPinPos(connection.i);
      case "OutputPin":
        return connection.comp.outputPinPos(connection.i);
      case "Joint":
        return connection.joint.pos;
    }
  }
}

export type WireConnection =
  | { tag: "InputPin"; comp: Component; i: number }
  | { tag: "OutputPin"; comp: Component; i: number }
  | { tag: "Joint"; joint: Joint };

const defaultDefs = [
  {
    label: "input",
    size: v2(80, 40),
    inputs: [],
    outputs: [null],
  },
  {
    label: "output",
    size: v2(80, 40),
    inputs: [null],
    outputs: [],
  },
  {
    label: "and",
    size: v2(80, 40),
    inputs: [null, null],
    outputs: [null],
  },
  {
    label: "or",
    size: v2(80, 40),
    inputs: [null, null],
    outputs: [null],
  },
  {
    label: "not",
    size: v2(80, 40),
    inputs: [null],
    outputs: [null],
  },
];
