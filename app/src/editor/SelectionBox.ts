import type { Renderer } from "./Renderer";
import { V2, v2 } from "./V2";
import type { ViewPos } from "./ViewPos";

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
