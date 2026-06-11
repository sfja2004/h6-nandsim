import type { ComponentKind } from "./Board";
import { v2, type V2 } from "./V2";

export class Renderer {
  private c: CanvasRenderingContext2D;

  constructor(
    private canvas: HTMLCanvasElement,
    private offset: V2,
  ) {
    this.c = this.canvas.getContext("2d")!;
    // this.c.imageSmoothingEnabled = false;
    this.c.imageSmoothingEnabled = true;
    this.c.imageSmoothingQuality ="high"
  }

  clear() {
    const { canvas, c } = this;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    canvas.width = width;
    canvas.height = height;

    c.fillStyle = "#666";
    c.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawGrid() {
    const { canvas, c } = this;

    const dotSize = { x: 2, y: 2 };
    const gridSize = v2(20, 20);

    c.fillStyle = "#111";
    for (let y = 0; y < canvas.height / gridSize.y + 1; ++y) {
      for (let x = 0; x < canvas.width / gridSize.x + 1; ++x) {
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

  private drawComponentBodyInternal(
    pos: V2,
    kind: ComponentKind,
    label: string,
  ) {
    const { c, offset } = this;
    const { x, y } = pos.add(offset);
    const { x: w, y: h } = kind.size;

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
  }
  private drawComponentBodySelectedInternal(
    pos: V2,
    kind: ComponentKind,
    label: string,
  ) {
    const { c, offset } = this;
    const { x, y } = pos.add(offset);
    const { x: w, y: h } = kind.size;

    c.fillStyle = `#6abbde`;
    c.fillRect(x, y, w, h);
    c.strokeStyle = `#ff8800`;
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
  }

  drawComponentBody(pos: V2, kind: ComponentKind) {
    this.drawComponentBodyInternal(pos, kind, kind.label);
  }
  drawComponentBodySelected(pos: V2, kind: ComponentKind) {
    this.drawComponentBodySelectedInternal(pos, kind, kind.label);
  }

  drawInputComponentBody(pos: V2, kind: ComponentKind, active: boolean) {
    this.drawComponentBodyInternal(
      pos,
      kind,
      `input (${active ? "on" : "off"})`,
    );
  }
  drawInputComponentBodySelected(
    pos: V2,
    kind: ComponentKind,
    active: boolean,
  ) {
    this.drawComponentBodySelectedInternal(
      pos,
      kind,
      `input (${active ? "on" : "off"})`,
    );
  }
  drawOutputComponentBody(pos: V2, kind: ComponentKind, active: boolean) {
    this.drawComponentBodyInternal(
      pos,
      kind,
      `output (${active ? "on" : "off"})`,
    );
  }
  drawOutputComponentBodySelected(
    pos: V2,
    kind: ComponentKind,
    active: boolean,
  ) {
    this.drawComponentBodySelectedInternal(
      pos,
      kind,
      `output (${active ? "on" : "off"})`,
    );
  }

  drawComponentInputPin(pos: V2, pinOffset: number) {
    const { c, offset } = this;
    const { x, y } = pos.add(offset);

    c.fillStyle = `#333333`;
    c.beginPath();
    c.arc(x, y + pinOffset, 4, 0, Math.PI * 2);
    c.fill();
  }

  drawComponentInputPinHover(pos: V2, pinOffset: number) {
    const { c, offset } = this;
    const { x, y } = pos.add(offset);

    c.strokeStyle = `#eee`;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(x, y + pinOffset, 5, 0, Math.PI * 2);
    c.stroke();
  }

  drawComponentOutputPin(pos: V2, kind: ComponentKind, pinOffset: number) {
    const { c, offset } = this;
    const {
      size: { x: w },
    } = kind;
    const { x, y } = pos.add(offset);

    c.fillStyle = `#333333`;
    c.beginPath();
    c.arc(x + w, y + pinOffset, 4, 0, Math.PI * 2);
    c.fill();
  }

  drawComponentOutputPinHover(pos: V2, kind: ComponentKind, pinOffset: number) {
    const { c, offset } = this;
    const {
      size: { x: w },
    } = kind;
    const { x, y } = pos.add(offset);

    c.strokeStyle = `#eee`;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(x + w, y + pinOffset, 5, 0, Math.PI * 2);
    c.stroke();
  }

  drawWire(begin: V2, end: V2, active: boolean) {
    const { c, offset } = this;
    const { x: x0, y: y0 } = begin.add(offset);
    const { x: x1, y: y1 } = end.add(offset);

    c.strokeStyle = active ? `#bb3333` : `#333333`;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
  }

  drawWireHovered(begin: V2, end: V2) {
    const { c, offset } = this;
    const { x: x0, y: y0 } = begin.add(offset);
    const { x: x1, y: y1 } = end.add(offset);

    c.strokeStyle = `#444444`;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
  }

  drawJoint(pos: V2) {
    const { c, offset } = this;
    const { x: x0, y: y0 } = pos.add(offset);

    c.fillStyle = `#333333`;
    c.beginPath();
    c.arc(x0, y0, 3, 0, Math.PI * 2);
    c.fill();
  }

  drawJointSelected(pos: V2) {
    const { c, offset } = this;
    const { x, y } = pos.add(offset);

    this.drawJoint(pos);
    c.strokeStyle = `#ff8800`;
    c.lineWidth = 1;
    c.beginPath();
    c.arc(x, y, 5, 0, Math.PI * 2);
    c.stroke();
  }

  drawJointHover(pos: V2) {
    const { c, offset } = this;
    const { x, y } = pos.add(offset);

    c.strokeStyle = `#eee`;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(x, y, 5, 0, Math.PI * 2);
    c.stroke();
  }

  drawConnectingWire(begin: V2, end: V2) {
    const { c, offset } = this;
    const { x: x0, y: y0 } = begin.add(offset);
    const { x: x1, y: y1 } = end.add(offset);

    c.strokeStyle = `#333333`;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
  }

  drawConnectingWirePoint(pos: V2) {
    const { c, offset } = this;
    const { x: x0, y: y0 } = pos.add(offset);

    c.fillStyle = `#333333`;
    c.beginPath();
    c.arc(x0, y0, 3, 0, Math.PI * 2);
    c.fill();
  }
}
