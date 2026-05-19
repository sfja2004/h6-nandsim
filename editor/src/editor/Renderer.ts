import type { Component } from "./Board";
import { v2, type V2 } from "./V2";

export class Renderer {
  private c: CanvasRenderingContext2D;

  constructor(
    private canvas: HTMLCanvasElement,
    private offset: V2,
  ) {
    this.c = this.canvas.getContext("2d")!;
    this.c.imageSmoothingEnabled = false;
  }

  clear() {
    const { canvas, c } = this;
    c.fillStyle = "#666";
    c.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawGrid() {
    const { canvas, c } = this;

    const dotSize = { x: 2, y: 2 };
    const gridSize = v2(20, 20);

    c.fillStyle = "#111";
    for (let y = 0; y < canvas.width / gridSize.x + 1; ++y) {
      for (let x = 0; x < canvas.height / gridSize.y + 1; ++x) {
        c.fillRect(
          (this.offset.x % gridSize.x) + x * gridSize.x - dotSize.x / 2,
          (this.offset.y % gridSize.y) + y * gridSize.y - dotSize.y / 2,
          dotSize.x,
          dotSize.y,
        );
      }
    }
  }

  drawSelectionBox(pos: V2, size: V2) {
    const { c } = this;
    const { x, y } = pos;
    const { x: w, y: h } = size;
    c.fillStyle = `#ff880088`;
    c.fillRect(x, y, w, h);
    c.strokeStyle = `#ff8800`;
    c.lineWidth = 2;
    c.strokeRect(x, y, w, h);
  }

  drawComponentPlacer(pos: V2, size: V2) {
    const { c } = this;
    const { x, y } = pos;
    const { x: w, y: h } = size;
    c.strokeStyle = `#ffffff`;
    c.lineWidth = 2;
    c.strokeRect(x, y, w, h);
  }

  drawComponent(
    comp: Component,
    hoveredOverInput: [Component, number] | null,
    hoveredOverOutput: [Component, number] | null,
  ) {
    const { c, offset } = this;
    const {
      def: {
        size: { x: w, y: h },
        label,
        inputs,
        outputs,
      },
      pos,
    } = comp;

    const [x, y] = [pos.x + offset.x, pos.y + offset.y];

    c.fillStyle = `#6abbde`;
    c.fillRect(x, y, w, h);
    c.strokeStyle = `#333333`;
    c.lineWidth = 2;
    c.strokeRect(x, y, w, h);

    c.fillStyle = `#333333`;
    c.font = "bold 16px monospace";
    const textMetrix = c.measureText(label);
    c.fillText(
      label,
      x + w / 2 - textMetrix.width / 2,
      y + 13 + h / 2 - 16 / 2,
    );

    {
      const pinSpace = h / (inputs.length + 1);
      for (let i = 0; i < inputs.length; ++i) {
        if (inputs[i] !== null) {
          throw new Error("pin text not implemented");
        }
        c.fillStyle = `#333333`;
        c.beginPath();
        c.arc(x, y + (i + 1) * pinSpace, 4, 0, Math.PI * 2);
        c.fill();

        if (hoveredOverInput?.[0] === comp && hoveredOverInput[1] === i) {
          c.strokeStyle = `#bbbbbb`;
          c.lineWidth = 2;
          c.beginPath();
          c.arc(x, y + (i + 1) * pinSpace, 5, 0, Math.PI * 2);
          c.stroke();
        }
      }
    }
    {
      const pinSpace = h / (outputs.length + 1);
      for (let i = 0; i < outputs.length; ++i) {
        if (outputs[i] !== null) {
          throw new Error("pin text not implemented");
        }
        c.fillStyle = `#333333`;
        c.beginPath();
        c.arc(x + w, y + (i + 1) * pinSpace, 4, 0, Math.PI * 2);
        c.fill();

        if (hoveredOverOutput?.[0] === comp && hoveredOverOutput[1] === i) {
          c.strokeStyle = `#eee`;
          c.lineWidth = 2;
          c.beginPath();
          c.arc(x + w, y + (i + 1) * pinSpace, 5, 0, Math.PI * 2);
          c.stroke();
        }
      }
    }
  }
}
