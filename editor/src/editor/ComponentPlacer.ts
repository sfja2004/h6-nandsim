import type { Renderer } from "./Renderer";
import type { V2 } from "./V2";

export class ComponentPlacer {
  constructor(
    public pos: V2,
    public size: V2,
  ) {}

  render(r: Renderer) {
    r.drawComponentPlacer(this.pos, this.size);
  }
}
