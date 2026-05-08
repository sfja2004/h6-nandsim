export type V2 = { x: number; y: number };
export const V2 = (x: number, y: number): V2 => ({ x, y });

export class Editor {
  private offset = V2(0, 0);
  private dragging = false;
  private renderNeeded = false;

  render(canvas: HTMLCanvasElement) {
    const cx = canvas.getContext("2d")!;

    cx.imageSmoothingEnabled = false;
    cx.fillStyle = "#666";
    cx.fillRect(0, 0, canvas.width, canvas.height);

    const gridSize = { x: 20, y: 20 };
    const dotSize = { x: 2, y: 2 };

    cx.fillStyle = "#111";
    for (let y = 0; y < canvas.width / gridSize.x + 1; ++y) {
      for (let x = 0; x < canvas.height / gridSize.y + 1; ++x) {
        cx.fillRect(
          (this.offset.x % gridSize.x) + x * gridSize.x - dotSize.x / 2,
          (this.offset.y % gridSize.y) + y * gridSize.y - dotSize.y / 2,
          dotSize.x,
          dotSize.y,
        );
      }
    }
  }

  renderIfNeeded(canvas: HTMLCanvasElement) {
    if (this.renderNeeded) {
      this.render(canvas);
      this.renderNeeded = false;
    }
  }

  mouseDown(pos: V2) {
    this.dragging = true;
  }

  mouseUp(pos: V2) {
    this.dragging = false;
  }

  mouseMove(deltaPos: V2) {
    if (this.dragging) {
      this.offset.x += deltaPos.x;
      this.offset.y += deltaPos.y;
      this.renderNeeded = true;
    }
  }

  selectTool(tool: Tool) {}
}

type Tool = "and" | "not" | "pin in" | "pin out";
