import type { EventBus, EventUnsub } from "./events";
import { v2, type V2 } from "./V2";

const doubleClickDelay = 200;

export class Mouse {
  private state: State;

  constructor(public eventBus: EventBus) {
    this.state = new Normal(this);
  }

  transitionTo(state: State) {
    this.state.leave();
    this.state = state;
  }
}

interface State {
  leave(): void;
}

class Normal implements State {
  private unsubscribe: EventUnsub;

  constructor(private cx: Mouse) {
    this.unsubscribe = cx.eventBus.subscribe(
      ["MouseDown", "MouseUp", "MouseMove", "MouseLeave"],
      (ev) => {
        switch (ev.tag) {
          case "MouseDown":
            this.cx.transitionTo(new FirstPress(this.cx, ev.pos));
            break;
          case "MouseUp":
            break;
          case "MouseMove":
            break;
          case "MouseLeave":
            break;
          default:
            throw new Error("invalid state");
        }
      },
    );
  }

  leave(): void {
    this.unsubscribe();
  }
}

class FirstPress implements State {
  private unsubscribe: EventUnsub;

  private time = Date.now();
  private totalDelta = v2(0, 0);

  constructor(
    private cx: Mouse,
    private pos: V2,
  ) {
    this.unsubscribe = cx.eventBus.subscribe(
      ["MouseDown", "MouseUp", "MouseMove", "MouseLeave"],
      (ev) => {
        switch (ev.tag) {
          case "MouseUp": {
            if (Date.now() - this.time < doubleClickDelay) {
              this.cx.transitionTo(new FirstRelease(this.cx, this.pos));
              break;
            }
            this.cx.eventBus.send({ tag: "MouseClick", pos: ev.pos });
            this.cx.transitionTo(new Normal(this.cx));
            break;
          }
          case "MouseMove": {
            this.totalDelta = this.totalDelta.add(ev.deltaPos);
            if (this.totalDelta.len() > 5) {
              this.cx.eventBus.send({
                tag: "MouseDragBegin",
                pos: this.pos,
                deltaPos: this.totalDelta,
              });
              this.cx.transitionTo(new Dragging(this.cx));
            }
            break;
          }
          case "MouseLeave":
            this.cx.transitionTo(new Normal(this.cx));
            break;
          default:
            throw new Error(`invalid state, unexpected ${ev.tag}`);
        }
      },
    );
  }

  leave(): void {
    this.unsubscribe();
  }
}

class FirstRelease implements State {
  private unsubscribe: EventUnsub;

  private timeout: ReturnType<typeof setTimeout>;

  constructor(
    private cx: Mouse,
    private pos: V2,
  ) {
    this.unsubscribe = cx.eventBus.subscribe(
      ["MouseDown", "MouseUp", "MouseMove", "MouseLeave"],
      (ev) => {
        switch (ev.tag) {
          case "MouseDown":
            this.cx.transitionTo(new SecondPress(this.cx, this.pos));
            break;
          case "MouseMove":
            break;
          case "MouseLeave":
            this.cx.transitionTo(new Normal(this.cx));
            break;
          default:
            throw new Error(`unexpected event ${ev.tag}`);
        }
      },
    );

    this.timeout = setTimeout(() => {
      this.cx.transitionTo(new Normal(this.cx));
    }, doubleClickDelay);
  }

  leave(): void {
    this.unsubscribe();
    clearTimeout(this.timeout);
  }
}

class SecondPress implements State {
  private unsubscribe: EventUnsub;

  private totalDelta = v2(0, 0);

  constructor(
    private cx: Mouse,
    private pos: V2,
  ) {
    this.unsubscribe = cx.eventBus.subscribe(
      ["MouseDown", "MouseUp", "MouseMove", "MouseLeave"],
      (ev) => {
        switch (ev.tag) {
          case "MouseUp":
            this.cx.eventBus.send({ tag: "MouseDoubleClick", pos: this.pos });
            this.cx.transitionTo(new Normal(this.cx));
            break;
          case "MouseMove":
            this.totalDelta = this.totalDelta.add(ev.deltaPos);
            if (this.totalDelta.len() > 5) {
              this.cx.eventBus.send({
                tag: "MouseDragBegin",
                pos: this.pos,
                deltaPos: this.totalDelta,
              });
              this.cx.transitionTo(new Dragging(this.cx));
              break;
            }
            break;
          case "MouseLeave":
            this.cx.transitionTo(new Normal(this.cx));
            break;
          default:
            throw new Error(`unexpected event ${ev.tag}`);
        }
      },
    );
  }

  leave(): void {
    this.unsubscribe();
  }
}

class Dragging implements State {
  private unsubscribe: EventUnsub;

  constructor(private cx: Mouse) {
    this.unsubscribe = cx.eventBus.subscribe(
      ["MouseDown", "MouseUp", "MouseMove", "MouseLeave"],
      (ev) => {
        switch (ev.tag) {
          case "MouseDown":
            this.cx.transitionTo(new FirstPress(this.cx, ev.pos));
            break;
          case "MouseUp":
            this.cx.transitionTo(new Normal(this.cx));
            break;
          case "MouseMove":
            this.cx.eventBus.send({
              tag: "MouseDrag",
              pos: ev.pos,
              deltaPos: ev.deltaPos,
            });
            break;
          case "MouseLeave":
            this.cx.transitionTo(new Normal(this.cx));
            break;
          default:
            throw new Error(`unexpected event ${ev.tag}`);
        }
      },
    );
  }

  leave(): void {
    this.unsubscribe();
  }
}
