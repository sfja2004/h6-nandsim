import { rectsCollide, type V2 } from "./V2";

export class Board {
  private components: Component[] = [];

  canPlaceComponent(pos: V2, size: V2): boolean {
    return !this.components.some((comp) =>
      rectsCollide(comp.pos, comp.size, pos, size),
    );
  }

  placeComponent(pos: V2, size: V2, label: string) {
    this.components.push({ pos, size, label });
  }

  render(
    canvas: HTMLCanvasElement,
    c: CanvasRenderingContext2D,
    offset: V2,
    gridSize: Readonly<V2>,
  ) {
    for (const comp of this.components) {
      const {
        pos: { x, y },
        size: { x: w, y: h },
      } = comp;

      c.fillStyle = `#0088cc`;
      c.fillRect(
        x * gridSize.x + offset.x,
        y * gridSize.y + offset.y,
        w * gridSize.x,
        h * gridSize.y,
      );
      c.strokeStyle = `#333333`;
      c.lineWidth = 2;
      c.strokeRect(
        x * gridSize.x + offset.x,
        y * gridSize.y + offset.y,
        w * gridSize.x,
        h * gridSize.y,
      );
      c.fillStyle = `#333333`;
      c.font = "bold 16px monospace";
      const textMetrix = c.measureText(comp.label);
      c.fillText(
        comp.label,
        x * gridSize.x + offset.x + (w * gridSize.x) / 2 - textMetrix.width / 2,
        y * gridSize.y + offset.y + 13 + (h * gridSize.y) / 2 - 16 / 2,
      );
    }
  }
}

type Component = {
  pos: V2;
  size: V2;
  label: string;
};
