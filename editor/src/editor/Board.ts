import type { Selection } from "./Selection";
import type { Renderer } from "./Renderer";
import {
  lineSegmentPointDistance,
  pointInsideRect,
  rectsCollide,
  v2,
  V2,
} from "./V2";
import * as ir from "./ir";
import { Sim } from "./sim";
import * as ser from "./serialize";

export class Board {
  private components: Component[] = [];
  private joints: Joint[] = [];
  private wires: Wire[] = [];

  private hoveredOverInput: [Component, number] | null = null;
  private hoveredOverOutput: [Component, number] | null = null;
  private hoveredOverJoint: Joint | null = null;
  private hoveredOverWire: Wire | null = null;

  private stateWireMap = new Map<ir.State, Wire[]>();
  private activatedWires = new Set<Wire>();
  private state = new Map<ir.State, boolean>();

  private activatedOutputs = new Set<Component>();

  private wireCachedState = new Map<Wire, ir.State>();

  constructor(private repo: ComponentRepo) {}

  static withExample(repo: ComponentRepo): Board {
    const board = new Board(repo);
    board.placeComponent(repo.get("input"), v2(100, 100));
    board.placeComponent(repo.get("input"), v2(100, 200));
    board.placeComponent(repo.get("and"), v2(300, 150));
    board.placeComponent(repo.get("output"), v2(500, 150));
    board.addWire(
      { tag: "OutputPin", comp: board.components[0], i: 0 },
      { tag: "InputPin", comp: board.components[2], i: 0 },
    );
    board.addWire(
      { tag: "OutputPin", comp: board.components[1], i: 0 },
      { tag: "InputPin", comp: board.components[2], i: 1 },
    );
    board.addWire(
      { tag: "OutputPin", comp: board.components[2], i: 0 },
      { tag: "InputPin", comp: board.components[3], i: 0 },
    );
    return board;
  }

  static fromSerialized(data: ser.Board, repo: ComponentRepo): Board {
    const board = new Board(repo);
    board.components = data.components.map((c) =>
      Component.fromSerialized(c, repo.defs),
    );
    board.joints = data.joints.map((j) => Joint.fromSerialized(j));
    board.wires = data.wires.map((w) =>
      Wire.fromSerialized(w, board.components, board.joints),
    );
    return board;
  }

  serialize(): ser.Board {
    return {
      components: this.components.map((c) => c.serialize()),
      joints: this.joints.map((j) => j.serialize()),
      wires: this.wires.map((w) =>
        w.serialize(
          new Map(this.components.map((v, i) => [v, i])),
          new Map(this.joints.map((v, i) => [v, i])),
        ),
      ),
    };
  }

  canPlaceComponent(kind: ComponentKind, pos: V2): boolean {
    return !this.components.some((comp) =>
      rectsCollide(comp.pos, comp.kind.size, pos, kind.size),
    );
  }

  placeComponent(kind: ComponentKind, pos: V2) {
    this.components.push(new Component(kind, pos));
  }

  render(
    r: Renderer,
    selection: Selection | null,
    inputStates: Map<Component, boolean>,
  ) {
    for (const comp of this.components) {
      const { pos, kind } = comp;

      const isSelected = selection?.isComponentSelected(comp);

      for (const wire of this.wires) {
        if (this.hoveredOverWire == wire) {
          r.drawWireHovered(wire.beginPos(), wire.endPos());
        } else {
          r.drawWire(
            wire.beginPos(),
            wire.endPos(),
            this.activatedWires.has(wire),
          );
        }
      }

      if (comp.kind.label === "input") {
        const active = inputStates.get(comp) ?? false;
        if (isSelected) {
          r.drawInputComponentBodySelected(pos, kind, active);
        } else {
          r.drawInputComponentBody(pos, kind, active);
        }
      } else if (comp.kind.label === "output") {
        const active = this.activatedOutputs.has(comp);
        if (isSelected) {
          r.drawOutputComponentBodySelected(pos, kind, active);
        } else {
          r.drawOutputComponentBody(pos, kind, active);
        }
      } else {
        if (isSelected) {
          r.drawComponentBodySelected(pos, kind);
        } else {
          r.drawComponentBody(pos, kind);
        }
      }

      for (const joint of this.joints) {
        if (selection?.isJointSelected(joint)) {
          r.drawJointSelected(joint.pos);
        } else {
          r.drawJoint(joint.pos);
        }

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
  jointsInRect(pos: V2, size: V2): Joint[] {
    return this.joints.filter((joint) => pointInsideRect(joint.pos, pos, size));
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

  deleteSelection(selection: Selection) {
    this.components = this.components.filter(
      (comp) => !selection.isComponentSelected(comp),
    );
    this.joints = this.joints.filter(
      (joint) => !selection.isJointSelected(joint),
    );
    this.wires = this.wires.filter((wire) => !wire.isSelected(selection));
  }

  toComponentKind(name: string): ComponentKind {
    const inputCount = this.components.filter(
      (comp) => comp.kind.label === "input",
    ).length;
    const outputCount = this.components.filter(
      (comp) => comp.kind.label === "output",
    ).length;
    const pinMax = Math.max(inputCount, outputCount);
    return new ComponentKind(
      v2(60 + name.length * 5, 40 + 10 * pinMax),
      name,
      new Array<null>(inputCount).fill(null),
      new Array<null>(outputCount).fill(null),
    );
  }

  inputsOrdered(): Component[] {
    return this.components
      .filter((c) => c.kind.label === "input")
      .toSorted((a, b) => a.pos.y - b.pos.y);
  }

  outputsOrdered(): Component[] {
    return this.components
      .filter((c) => c.kind.label === "output")
      .toSorted((a, b) => a.pos.y - b.pos.y);
  }

  inputArray(activatedInputs: Map<Component, boolean>): boolean[] {
    return this.inputsOrdered().map((c) => activatedInputs.get(c) ?? false);
  }

  outputCount(): number {
    return this.components.filter((c) => c.kind.label === "output").length;
  }

  simulate(inputStates: Map<Component, boolean>) {
    console.log("Lowering to IR");
    const comps = new Map<string, ir.Component>();
    const comp = this.toIr("<main>", comps);
    console.log("Before optimizing");
    for (const [_label, comp] of comps) {
      console.log(...new ir.ComponentPrinter().stringifyToConsole(comp));
    }
    console.log(...new ir.ComponentPrinter().stringifyToConsole(comp));

    for (const [_label, comp] of comps) {
      new ir.ComponentOptimizer(comp, []).optimizeComponent();
    }

    const replacedStates: [ir.State, ir.State][] = [];
    new ir.ComponentOptimizer(comp, replacedStates).optimizeMain();

    for (const [oldState, newState] of replacedStates) {
      this.stateWireMap
        .get(newState)!
        .push(...this.stateWireMap.get(oldState)!);
      this.stateWireMap.delete(oldState);
    }

    console.log("After optimizing");
    for (const [_label, comp] of comps) {
      console.log(...new ir.ComponentPrinter().stringifyToConsole(comp));
    }
    console.log(...new ir.ComponentPrinter().stringifyToConsole(comp));

    const inputs = this.inputArray(inputStates);
    const outputs = this.outputsOrdered();
    const outputStates = outputs.map(() => false);
    const sim = new Sim(comp, inputs, outputStates, this.state);

    sim.simulate();

    this.activatedWires.clear();
    for (const state of sim.activatedState()) {
      for (const wire of this.stateWireMap.get(state) ?? []) {
        this.activatedWires.add(wire);
      }
    }

    this.activatedOutputs.clear();
    for (const [i, active] of outputStates.entries()) {
      if (active) {
        this.activatedOutputs.add(outputs[i]);
      }
    }
  }

  toIr(label: string, comps: Map<string, ir.Component>): ir.Component {
    for (const comp of this.components) {
      comp.markedWiresConnected = [];
    }
    for (const joint of this.joints) {
      joint.markedWiresConnected = [];
    }
    for (const wire of this.wires) {
      wire.markConnections();
    }

    const inputs = this.components.filter(
      (comp) => comp.kind.label === "input",
    );
    const outputs = this.components.filter(
      (comp) => comp.kind.label === "output",
    );

    const inputIdcs = new Map<Component, number>();
    for (const [i, input] of inputs.entries()) {
      inputIdcs.set(input, i);
    }
    const outputIdcs = new Map<Component, number>();
    for (const [i, output] of outputs.entries()) {
      outputIdcs.set(output, i);
    }

    const b = new ir.ComponentBuilder(inputs.length, outputs.length, label);

    this.stateWireMap.clear();
    const wireStates = new Map<Wire, ir.State>();
    for (const wire of this.wires) {
      const state = this.wireCachedState.get(wire) ?? b.makeState();
      this.wireCachedState.set(wire, state);
      wireStates.set(wire, state);
      this.stateWireMap.set(state, [wire]);
    }

    const compSet = new Set<Component>();
    const jointSet = new Set<Joint>();
    const wireSet = new Set<Wire>();

    const visitor: BoardVisitor = {
      visitComponent: (comp) => {
        if (compSet.has(comp)) return "break";
        compSet.add(comp);

        const inputStates = new Map<number, ir.State>();
        for (const [wire, connection] of comp.markedWiresConnected) {
          if (connection.tag === "InputPin") {
            inputStates.set(connection.i, wireStates.get(wire)!);
          }
        }

        const inputStmt = (i: number) => {
          return inputStates.has(i)
            ? b.makeGetState(inputStates.get(i)!)
            : b.makeNull();
        };

        const stmt = (() => {
          switch (comp.kind.label) {
            case "input":
              return b.makeInput(inputIdcs.get(comp)!);
            case "output":
              return b.makeOutput(outputIdcs.get(comp)!, inputStmt(0));
            case "not":
              return b.makeNot(inputStmt(0));
            case "and":
              return b.makeBinary("And", inputStmt(0), inputStmt(1));
            case "or":
              return b.makeBinary("Or", inputStmt(0), inputStmt(1));
            default: {
              const savedBoard = this.repo.getSavedBoard(comp.kind.label);
              if (!savedBoard) {
                throw new Error(`no component '${comp.kind.label}'`);
              }

              const label = comp.kind.label;
              const board = Board.fromSerialized(savedBoard, this.repo);

              const ir = comps.get(label) ?? board.toIr(label, comps);
              comps.set(label, ir);

              return b.makeCall(
                ir,
                comp.kind.inputs.map((_, i) => inputStmt(i)),
              );
            }
          }
        })();

        for (const [wire, connection] of comp.markedWiresConnected) {
          if (connection.tag === "OutputPin") {
            b.makeSetState(
              wireStates.get(wire)!,
              stmt.kind.tag === "Call" ? b.makeElem(stmt, connection.i) : stmt,
            );
          }
        }
      },
      visitJoint: (joint) => {
        if (jointSet.has(joint)) return "break";
        jointSet.add(joint);

        const visited = joint.markedWiresConnected.filter(([wire]) =>
          wireSet.has(wire),
        );
        if (visited.length > 1) {
          throw new Error("joint has more than 1 input");
        }

        const notVisited = joint.markedWiresConnected.filter(
          ([wire]) => !wireSet.has(wire),
        );

        const sourceState = wireStates.get(visited[0][0]);
        if (!sourceState) {
          throw new Error("assert");
        }
        const src = b.makeGetState(sourceState);

        for (const [wire] of notVisited) {
          const dst = wireStates.get(wire);
          if (!dst) {
            throw new Error("assert");
          }
          b.makeSetState(dst, src);
        }
      },
      visitWire: (wire) => {
        if (wireSet.has(wire)) return "break";
        wireSet.add(wire);
      },
    };

    for (const comp of this.components) {
      comp.visitForward(visitor);
    }

    return b.build();
  }
}

export interface BoardVisitor {
  visitComponent(comp: Component): void | "break";
  visitJoint(joint: Joint): void | "break";
  visitWire(wire: Wire): void | "break";
}

export class ComponentRepo {
  public defs = new Map<string, ComponentKind>();
  private savedBoards = new Map<string, ser.Board>();

  static withDefaults(): ComponentRepo {
    const repo = new ComponentRepo();

    for (const { label, size, inputs, outputs } of defaultDefs) {
      repo.add(label, new ComponentKind(size, label, inputs, outputs));
    }

    return repo;
  }

  static fromSerialized(data: ser.ComponentRepo): ComponentRepo {
    const repo = new ComponentRepo();
    repo.defs = new Map(
      data.defs.map((e) => [e[0], ComponentKind.fromSerialized(e[1])]),
    );
    repo.savedBoards = new Map(data.savedBoards);
    return repo;
  }

  serialize(): ser.ComponentRepo {
    return {
      defs: [...this.defs.entries()].map((e) => [e[0], e[1].serialize()]),
      savedBoards: [...this.savedBoards],
    };
  }

  available(): string[] {
    return [...this.defs.keys()];
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

  addSavedBoard(ident: string, savedBoard: ser.Board) {
    this.savedBoards.set(ident, savedBoard);
  }

  getSavedBoard(ident: string): ser.Board | null {
    return this.savedBoards.get(ident) ?? null;
  }
}

export class Component {
  public markedWiresConnected: [Wire, WireConnection][] = [];

  constructor(
    public kind: ComponentKind,
    public pos: V2,
  ) {}

  static fromSerialized(
    data: ser.Component,
    kindMap: Map<string, ComponentKind>,
  ): Component {
    return new Component(
      kindMap.get(data.kindKey)!,
      V2.fromSerialized(data.pos),
    );
  }

  serialize(): ser.Component {
    return {
      kindKey: this.kind.label,
      pos: this.pos.serialize(),
    };
  }

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

  visitForward(visitor: BoardVisitor) {
    if (visitor.visitComponent(this) === "break") return;
    for (const [wire, connection] of this.markedWiresConnected) {
      switch (connection.tag) {
        case "OutputPin":
          wire.visitForward(visitor, connection);
          break;
      }
    }
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

  static fromSerialized(data: ser.ComponentKind): ComponentKind {
    return new ComponentKind(
      V2.fromSerialized(data.size),
      data.label,
      data.inputs,
      data.outputs,
    );
  }

  serialize(): ser.ComponentKind {
    return {
      size: this.size.serialize(),
      label: this.label,
      inputs: this.inputs,
      outputs: this.outputs,
    };
  }

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
  public markedWiresConnected: [Wire, WireConnection][] = [];

  constructor(public pos: V2) {}

  static fromSerialized(data: ser.Joint): Joint {
    return new Joint(V2.fromSerialized(data.pos));
  }

  serialize(): ser.Joint {
    return { pos: this.pos.serialize() };
  }

  isMouseOver(pos: V2): boolean {
    return this.pos.distance(pos) < 6;
  }

  visitForward(visitor: BoardVisitor, entryWire: Wire) {
    if (visitor.visitJoint(this) === "break") return;
    for (const [wire, connection] of this.markedWiresConnected) {
      if (wire === entryWire) {
        continue;
      }
      wire.visitForward(visitor, connection);
    }
  }
}

export class Wire {
  constructor(
    private begin: WireConnection,
    private end: WireConnection,
  ) {}

  static fromSerialized(
    data: ser.Wire,
    comps: Component[],
    joints: Joint[],
  ): Wire {
    const [begin, end] = [data.begin, data.end].map((conn): WireConnection => {
      switch (conn.tag) {
        case "Joint":
          return { tag: "Joint", joint: joints[conn.jointIdx] };
        case "InputPin":
        case "OutputPin":
          return {
            tag: conn.tag,
            comp: comps[conn.compIdx],
            i: conn.i,
          };
      }
    });

    return new Wire(begin, end);
  }

  serialize(
    compIdxMap: Map<Component, number>,
    jointIdxMap: Map<Joint, number>,
  ): ser.Wire {
    const [begin, end] = [this.begin, this.end].map(
      (conn): ser.WireConnection => {
        switch (conn.tag) {
          case "Joint":
            return { tag: "Joint", jointIdx: jointIdxMap.get(conn.joint)! };
          case "InputPin":
          case "OutputPin":
            return {
              tag: conn.tag,
              compIdx: compIdxMap.get(conn.comp)!,
              i: conn.i,
            };
        }
      },
    );

    return { begin, end };
  }

  isInput(): boolean {
    return this.mapConns((connection) => connection.tag === "InputPin").some(
      (v) => v,
    );
  }

  markConnections() {
    this.mapConns((connection) => {
      switch (connection.tag) {
        case "InputPin":
        case "OutputPin":
          connection.comp.markedWiresConnected.push([this, connection]);
          break;
        case "Joint":
          connection.joint.markedWiresConnected.push([this, connection]);
          break;
      }
    });
  }

  isMouseOver(pos: V2): boolean {
    const distance = lineSegmentPointDistance(
      this.beginPos(),
      this.endPos(),
      pos,
    );
    return distance !== null && distance < 6;
  }

  isSelected(selection: Selection): boolean {
    return this.mapConns((connection) => {
      switch (connection.tag) {
        case "InputPin":
        case "OutputPin":
          return selection.isComponentSelected(connection.comp);
        case "Joint":
          return selection.isJointSelected(connection.joint);
      }
    }).some((v) => v);
  }

  connectedToComponent(comp: Component): boolean {
    return this.mapConns((connection) => {
      switch (connection.tag) {
        case "InputPin":
        case "OutputPin":
          return connection.comp === comp;
        case "Joint":
          return false;
      }
    }).some((v) => v);
  }
  connectedToJoint(joint: Joint): boolean {
    return this.mapConns((connection) => {
      switch (connection.tag) {
        case "InputPin":
        case "OutputPin":
          return false;
        case "Joint":
          return connection.joint === joint;
      }
    }).some((v) => v);
  }

  connectedComponents(): Component[] {
    return this.mapConns((connection) => {
      switch (connection.tag) {
        case "InputPin":
        case "OutputPin":
          return [connection.comp];
        case "Joint":
          return [];
      }
    }).flat();
  }

  connectedJoints(): Joint[] {
    return this.mapConns((connection) => {
      switch (connection.tag) {
        case "InputPin":
        case "OutputPin":
          return [];
        case "Joint":
          return [connection.joint];
      }
    }).flat();
  }

  private mapConns<R>(mapper: (connection: WireConnection) => R): [R, R] {
    return [mapper(this.begin), mapper(this.end)];
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

  visitForward(visitor: BoardVisitor, prev: WireConnection) {
    if (visitor.visitWire(this) === "break") return;
    const connection = this.begin === prev ? this.end : this.begin;
    switch (connection.tag) {
      case "InputPin":
        connection.comp.visitForward(visitor);
        break;
      case "Joint":
        connection.joint.visitForward(visitor, this);
        break;
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
    size: v2(120, 40),
    inputs: [],
    outputs: [null],
  },
  {
    label: "output",
    size: v2(140, 40),
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
