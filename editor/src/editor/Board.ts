import type { Renderer } from "./Renderer";
import { pointInsideRect, rectsCollide, v2, V2 } from "./V2";

export class Board {
  private components: Component[] = [];

  private hoveredOverInput: [Component, number] | null = null;
  private hoveredOverOutput: [Component, number] | null = null;

  canPlaceComponent(def: ComponentDef, pos: V2): boolean {
    return !this.components.some((comp) =>
      rectsCollide(comp.pos, comp.def.size, pos, def.size),
    );
  }

  placeComponent(def: ComponentDef, pos: V2) {
    this.components.push({ def, pos });
  }

  render(r: Renderer) {
    for (const comp of this.components) {
      r.drawComponent(comp, this.hoveredOverInput, this.hoveredOverOutput);
    }
  }

  updateMouseHover(pos: V2) {
    this.hoveredOverInput = null;
    this.hoveredOverOutput = null;

    for (const comp of this.components) {
      const {
        pos: { x, y },
        def: {
          size: { x: w, y: h },
          inputs,
          outputs,
        },
      } = comp;

      if (
        !pointInsideRect(
          pos,
          comp.pos.sub(v2(5, 5)),
          comp.def.size.add(v2(10, 10)),
        )
      ) {
        continue;
      }
      {
        const pinSpace = h / (inputs.length + 1);
        for (let i = 0; i < inputs.length; ++i) {
          if (v2(x, y + (i + 1) * pinSpace).distance(pos) < 5) {
            this.hoveredOverInput = [comp, i];
          }
        }
      }
      {
        const pinSpace = h / (outputs.length + 1);
        for (let i = 0; i < outputs.length; ++i) {
          if (v2(x + w, y + (i + 1) * pinSpace).distance(pos) < 5) {
            this.hoveredOverOutput = [comp, i];
          }
        }
      }
    }
  }

  handleMouseClick(
    pos: V2,
    inputPinClicked: (comp: Component, i: number) => void,
    outputPinClicked: (comp: Component, i: number) => void,
    componentClicked: (comp: Component) => void,
  ): "handled" | "not handled" {
    for (const comp of this.components) {
      const {
        pos: { x, y },
        def: {
          size: { x: w, y: h },
          inputs,
          outputs,
        },
      } = comp;

      if (
        !pointInsideRect(
          pos,
          comp.pos.sub(v2(5, 5)),
          comp.def.size.add(v2(10, 10)),
        )
      ) {
        continue;
      }
      {
        const pinSpace = h / (inputs.length + 1);
        for (let i = 0; i < inputs.length; ++i) {
          if (v2(x, y + (i + 1) * pinSpace).distance(pos) < 5) {
            inputPinClicked(comp, i);
            return "handled";
          }
        }
      }
      {
        const pinSpace = h / (outputs.length + 1);
        for (let i = 0; i < outputs.length; ++i) {
          if (v2(x + w, y + (i + 1) * pinSpace).distance(pos) < 5) {
            outputPinClicked(comp, i);
            return "handled";
          }
        }
      }
      componentClicked(comp);
      return "handled";
    }
    return "not handled";
  }
}

export class ComponentRepo {
  private defs = new Map<string, ComponentDef>();

  static withDefaults(): ComponentRepo {
    const repo = new ComponentRepo();

    repo.add("input", {
      label: "input",
      size: v2(80, 40),
      inputs: [],
      outputs: [null],
    });
    repo.add("output", {
      label: "output",
      size: v2(80, 40),
      inputs: [null],
      outputs: [],
    });
    repo.add("and", {
      label: "and",
      size: v2(80, 40),
      inputs: [null, null],
      outputs: [null],
    });
    repo.add("or", {
      label: "or",
      size: v2(80, 40),
      inputs: [null, null],
      outputs: [null],
    });
    repo.add("not", {
      label: "not",
      size: v2(80, 40),
      inputs: [null],
      outputs: [null],
    });

    return repo;
  }

  add(ident: string, def: ComponentDef) {
    this.defs.set(ident, def);
  }

  get(ident: string): ComponentDef {
    const def = this.defs.get(ident);
    if (!def) {
      throw new Error("should be defined");
    }
    return def;
  }
}

export type Component = {
  def: ComponentDef;
  pos: V2;
};

export type ComponentDef = {
  size: V2;
  label: string;
  inputs: (string | null)[];
  outputs: (string | null)[];
};
