import type { Selection } from "./Cx";
import type { Renderer } from "./Renderer";
import { pointInsideRect, rectsCollide, v2, V2 } from "./V2";

export class Board {
  private components: PlacedComponent[] = [];

  private hoveredOverInput: [PlacedComponent, number] | null = null;
  private hoveredOverOutput: [PlacedComponent, number] | null = null;

  constructor() {}

  canPlaceComponent(kind: ComponentKind, pos: V2): boolean {
    return !this.components.some((comp) =>
      rectsCollide(comp.pos, comp.kind.size, pos, kind.size),
    );
  }

  placeComponent(kind: ComponentKind, pos: V2) {
    this.components.push({ kind: kind, pos });
  }

  render(r: Renderer, selection: Selection | null) {
    for (const comp of this.components) {
      const { pos, kind } = comp;
      if (selection?.isComponentSelected(comp)) {
        r.drawComponentBodySelected(pos, kind);
      } else {
        r.drawComponentBody(pos, kind);
      }

      for (const { i, pinOffset } of kind.inputPinIter()) {
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

      for (const { i, pinOffset } of kind.outputPinIter()) {
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

    for (const comp of this.components) {
      const {
        pos: { x, y },
        kind: {
          size: { x: w },
        },
      } = comp;

      if (
        !pointInsideRect(
          pos,
          comp.pos.sub(v2(5, 5)),
          comp.kind.size.add(v2(10, 10)),
        )
      ) {
        continue;
      }
      for (const { i, pinOffset } of comp.kind.inputPinIter()) {
        if (v2(x, y + pinOffset).distance(pos) < 6) {
          this.hoveredOverInput = [comp, i];
        }
      }
      for (const { i, pinOffset } of comp.kind.outputPinIter()) {
        if (v2(x + w, y + pinOffset).distance(pos) < 6) {
          this.hoveredOverOutput = [comp, i];
        }
      }
    }
  }

  handleMouseClick(
    pos: V2,
    inputPinClicked: (comp: PlacedComponent, i: number) => void,
    outputPinClicked: (comp: PlacedComponent, i: number) => void,
    componentClicked: (comp: PlacedComponent) => void,
  ): "handled" | "not handled" {
    for (const comp of this.components) {
      const {
        pos: { x, y },
        kind: {
          size: { x: w },
        },
      } = comp;

      if (
        !pointInsideRect(
          pos,
          comp.pos.sub(v2(5, 5)),
          comp.kind.size.add(v2(10, 10)),
        )
      ) {
        continue;
      }
      for (const { i, pinOffset } of comp.kind.inputPinIter()) {
        if (v2(x, y + pinOffset).distance(pos) < 6) {
          inputPinClicked(comp, i);
          return "handled";
        }
      }
      for (const { i, pinOffset } of comp.kind.outputPinIter()) {
        if (v2(x + w, y + pinOffset).distance(pos) < 6) {
          outputPinClicked(comp, i);
          return "handled";
        }
      }
      componentClicked(comp);
      return "handled";
    }
    return "not handled";
  }

  componentsInRect(pos: V2, size: V2): PlacedComponent[] {
    return this.components.filter((comp) =>
      rectsCollide(pos, size, comp.pos, comp.kind.size),
    );
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

export type PlacedComponent = {
  kind: ComponentKind;
  pos: V2;
};

export class ComponentKind {
  constructor(
    public size: V2,
    public label: string,
    public inputs: (string | null)[],
    public outputs: (string | null)[],
  ) {}

  inputPinIter(): { i: number; pinOffset: number }[] {
    return this.inputs.map((_, i) => ({
      i,
      pinOffset: ((i + 1) * this.size.y) / (this.inputs.length + 1),
    }));
  }
  outputPinIter(): { i: number; pinOffset: number }[] {
    return this.outputs.map((_, i) => ({
      i,
      pinOffset: ((i + 1) * this.size.y) / (this.outputs.length + 1),
    }));
  }
}

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
