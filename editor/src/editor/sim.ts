import * as ir from "./ir";

export class Sim {
  constructor(
    private comp: ir.Component,
    private inputs: boolean[],
    private outputs: boolean[],
    private state: Map<ir.State, boolean>,
  ) {}

  simulate() {
    const { comp, inputs, outputs } = this;

    const stmtIdcs = new Map(comp.stmts.map((stmt, i) => [stmt, i]));

    const regs = new Array<boolean>(comp.stmts.length).fill(false);

    const stateDependents = new Map<ir.State, number>();
    const callOutput = new Map<ir.Stmt, boolean[]>();

    const operation = <Ops extends ir.Stmt[]>(
      action: (...ops: boolean[]) => boolean,
      ...ops: Ops
    ) => action(...ops.map((op) => regs[stmtIdcs.get(op)!]));

    for (let i = 0; i < comp.stmts.length; ++i) {
      const stmt = comp.stmts[i];
      const k = stmt.kind;
      switch (k.tag) {
        case "Null":
          regs[i] = false;
          break;
        case "Input":
          regs[i] = inputs[k.i];
          break;
        case "Output":
          outputs[k.i] = regs[stmtIdcs.get(k.src)!];
          break;
        case "GetState":
          regs[i] = this.state.get(k.state)! ?? false;
          stateDependents.set(
            k.state,
            Math.min(
              i,
              stateDependents.get(k.state) ?? Number.MAX_SAFE_INTEGER,
            ),
          );
          break;
        case "SetState": {
          const prev = this.state.get(k.state) ?? false;
          const val = regs[stmtIdcs.get(k.src)!];
          this.state.set(k.state, val);
          if (val !== prev) {
            if (stateDependents.has(k.state)) {
              i = stateDependents.get(k.state)! - 1;
            }
          }
          break;
        }
        case "Not":
          regs[i] = operation((v) => !v, k.op);
          break;
        case "And":
          regs[i] = operation((a, b) => a && b, k.lhs, k.rhs);
          break;
        case "Or":
          regs[i] = operation((a, b) => a || b, k.lhs, k.rhs);
          break;
        case "Nand":
          regs[i] = operation((a, b) => !(a && b), k.lhs, k.rhs);
          break;
        case "Nor":
          regs[i] = operation((a, b) => !(a || b), k.lhs, k.rhs);
          break;
        case "Call": {
          const outputs = new Array<boolean>(k.comp.outputs).fill(false);
          new Sim(
            k.comp,
            k.inputs.map((stmt) => regs[stmtIdcs.get(stmt)!]),
            outputs,
            this.state,
          ).simulate();
          callOutput.set(stmt, outputs);
          break;
        }
        case "Elem": {
          const outputs = callOutput.get(k.src);
          if (!outputs) {
            throw new Error();
          }
          regs[i] = outputs[k.i];
          break;
        }
        default:
          k satisfies never;
      }

      // console.log("Sim:", i, stmt.kind.tag, inputs, outputs, this.state);
    }
  }

  activatedState(): ir.State[] {
    return [...this.state].filter(([_s, v]) => v).map(([s, _v]) => s);
  }
}
