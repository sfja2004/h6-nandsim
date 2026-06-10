import type { EventBus } from "./events";
import { v2, type V2 } from "./V2";

export class ViewPos {
  public offset = v2(0, 0);

  constructor(private events: EventBus) {
    this.events.subscribe(["MouseDown", "MouseMove"], (ev) => {
      const absPos = ev.pos;
      const pos = this.canvasToBoard(absPos);
      switch (ev.tag) {
        case "MouseDown":
          this.events.send({ tag: "MouseDownOffset", pos, absPos });
          break;
        case "MouseMove":
          this.events.send({
            tag: "MouseMoveOffset",
            pos,
            deltaPos: ev.deltaPos,
          });
          break;
      }
    });
  }

  canvasToBoard(pos: V2): V2 {
    return pos.sub(this.offset);
  }

  move(deltaPos: V2) {
    this.offset.x += deltaPos.x;
    this.offset.y += deltaPos.y;
  }
}
