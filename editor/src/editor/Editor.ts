import { Board, ComponentRepo } from "./Board";
import { SelectionBox } from "./SelectionBox";
import { ComponentPlacer } from "./ComponentPlacer";
import { Selection } from "./Selection";
import { ConnectingWire } from "./ConnectingWire";
import { EventBus } from "./events";
import { Mouse } from "./Mouse";
import { Renderer } from "./Renderer";
import * as states from "./states";
import type { V2 } from "./V2";
import { ViewPos } from "./ViewPos";

export class Editor {
  public events = new EventBus();
  public viewpos = new ViewPos(this.events);
  private renderNeeded = false;

  private state = new states.Normal(this) as states.State;

  public selectionBox: SelectionBox | null = null;
  private componentPlacer: ComponentPlacer | null = null;
  public selection: Selection | null = null;
  public connectingWire: ConnectingWire | null = null;

  public board = new Board();
  public componentRepo = ComponentRepo.withDefaults();

  public keysPressed = new Set<string>();

  public mouse = new Mouse(this.events);

  constructor() {
    this.state.enter();

    this.events.subscribe(
      ["MouseDown", "MouseUp", "MouseMove", "KeyDown", "KeyUp", "SelectTool"],
      (ev) => {
        switch (ev.tag) {
          case "KeyDown":
            this.keysPressed.add(ev.key);
            break;
          case "KeyUp":
            this.keysPressed.delete(ev.key);
            break;
          case "SelectTool":
            this.onSelectTool(ev.tool);
        }
        this.renderNeeded = true;
      },
    );
  }

  render(canvas: HTMLCanvasElement) {
    const r = new Renderer(canvas, this.viewpos.offset);

    r.clear();
    r.drawGrid();
    this.board.render(r, this.selection);
    this.selectionBox?.render(r);
    this.componentPlacer?.render(r);
    this.connectingWire?.render(r);
  }

  renderIfNeeded(canvas: HTMLCanvasElement) {
    if (this.renderNeeded) {
      this.render(canvas);
      this.renderNeeded = false;
    }
  }

  private onSelectTool(tool: string) {
    switch (tool) {
      case "pan":
        this.transitionTo(new states.Panning(this));
        break;
      case "input":
      case "output":
      case "and":
      case "or":
      case "not":
        this.transitionTo(new states.Placing(this, tool));
        break;
      default:
        this.transitionTo(new states.Normal(this));
    }
    this.events.send({ tag: "ShowSelectedTool", tool });
  }

  transitionTo(newState: states.State) {
    this.state.leave();
    this.state = newState;
    // console.log(`Entering state ${newState.constructor.name}`);
    this.state.enter();
  }

  addComponentPlacer(pos: V2, size: V2) {
    this.componentPlacer = new ComponentPlacer(pos, size);
  }

  removeComponentPlacer() {
    this.componentPlacer = null;
  }

  setComponentPlacerPos(pos: V2) {
    if (this.componentPlacer) {
      this.componentPlacer.pos = pos;
    }
  }

  runSimulation() {
    // const comp = this.board.toIr();
    // console.log("Before optimizing");
    // console.log(...new ir.ComponentPrinter().stringifyToConsole(comp));
    // new ir.ComponentOptimizer(comp).optimize();
    // console.log("After optimizing");
    // console.log(...new ir.ComponentPrinter().stringifyToConsole(comp));
    // const sim = new Sim(comp, [], []);
    // sim.simulate();
  }

  tools(): string[] {
    return ["select", "pan", "input", "output", "and", "or", "not"];
  }
}
