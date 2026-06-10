import type { Board, Component, Joint, WireConnection } from "./Board";
import type { Renderer } from "./Renderer";
import { V2, v2 } from "./V2";

export class ConnectingWire {
  constructor(
    public kind: ConnectingWireKind,
    public pos: V2,
  ) {}

  render(r: Renderer) {
    switch (this.kind.tag) {
      case "InputPin":
      case "OutputPin":
        break;
      case "Intermediary":
        this.kind.prev.render(r);
        r.drawConnectingWirePoint(this.beginPos());
        break;
    }
    r.drawConnectingWire(this.beginPos(), this.pos);
  }

  move(pos: V2) {
    this.pos = pos;
  }

  connectToInput(board: Board, comp: Component, i: number) {
    this.pushWire(board, { tag: "InputPin", comp, i });
  }

  connectToOutput(board: Board, comp: Component, i: number) {
    this.pushWire(board, { tag: "OutputPin", comp, i });
  }

  connectToJoint(board: Board, joint: Joint) {
    this.pushWire(board, { tag: "Joint", joint });
  }

  private pushWire(board: Board, end: WireConnection) {
    switch (this.kind.tag) {
      case "InputPin":
      case "OutputPin": {
        const { tag, comp, i } = this.kind;
        board.addWire({ tag, comp, i }, end);
        break;
      }
      case "Intermediary": {
        const joint = board.addJoint(this.kind.pos);
        board.addWire({ tag: "Joint", joint }, end);
        this.kind.prev.pushWire(board, { tag: "Joint", joint });
        break;
      }
      case "Joint": {
        const joint = this.kind.joint;
        board.addWire({ tag: "Joint", joint }, end);
        break;
      }
      default:
        this.kind satisfies never;
    }
  }

  private beginPos(): V2 {
    switch (this.kind.tag) {
      case "InputPin":
        return v2(
          this.kind.comp.pos.x,
          this.kind.comp.pos.y +
            this.kind.comp.kind.inputPinOffsets()[this.kind.i],
        );
      case "OutputPin":
        return v2(
          this.kind.comp.pos.x + this.kind.comp.kind.size.x,
          this.kind.comp.pos.y +
            this.kind.comp.kind.outputPinOffsets()[this.kind.i],
        );
      case "Intermediary":
        return this.kind.pos;
      case "Joint":
        return this.kind.joint.pos;
    }
  }
}

export type ConnectingWireKind =
  | { tag: "InputPin"; comp: Component; i: number }
  | { tag: "OutputPin"; comp: Component; i: number }
  | { tag: "Intermediary"; prev: ConnectingWire; pos: V2 }
  | { tag: "Joint"; joint: Joint };
