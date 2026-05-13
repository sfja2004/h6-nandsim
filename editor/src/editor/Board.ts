import { rectsCollide, V2 } from "./V2";

export class Board {
  private components: Component[] = [];

  canPlaceComponent(def: ComponentDef, pos: V2): boolean {
    return !this.components.some((comp) =>
      rectsCollide(comp.pos, comp.def.size, pos, def.size),
    );
  }

  placeComponent(def: ComponentDef, pos: V2) {
    this.components.push({ def, pos });
  }

  render(_canvas: HTMLCanvasElement, c: CanvasRenderingContext2D, offset: V2) {
    for (const comp of this.components) {
      const {
        def: {
          size: { x: w, y: h },
          label,
        },
        pos: { x, y },
      } = comp;

      c.fillStyle = `#6abbde`;
      c.fillRect(x + offset.x, y + offset.y, w, h);
      c.strokeStyle = `#333333`;
      c.lineWidth = 2;
      c.strokeRect(x + offset.x, y + offset.y, w, h);
      c.fillStyle = `#333333`;
      c.font = "bold 16px monospace";
      const textMetrix = c.measureText(label);
      c.fillText(
        label,
        x + offset.x + w / 2 - textMetrix.width / 2,
        y + offset.y + 13 + h / 2 - 16 / 2,
      );
    }
  }
}

export class ComponentRepo {
  private defs = new Map<string, ComponentDef>();

  static withDefaults(): ComponentRepo {
    const repo = new ComponentRepo();

    repo.add("and", {
      label: "and",
      size: V2(80, 40),
      inputs: [null, null],
      outputs: [null],
    });
    repo.add("or", {
      label: "or",
      size: V2(80, 40),
      inputs: [null, null],
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

type Component = {
  def: ComponentDef;
  pos: V2;
};

export type ComponentDef = {
  size: V2;
  label: string;
  inputs: (string | null)[];
  outputs: (string | null)[];
};
