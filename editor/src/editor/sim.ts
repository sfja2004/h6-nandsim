import * as ir from "./ir";

export class Sim {
  constructor(
    private comp: ir.Component,
    private inputs: boolean[],
    private outputs: boolean[],
  ) {}

  simulate() {
    const { comp, inputs, outputs } = this;

    const stmtIdcs = new Map(comp.stmts.map((stmt, i) => [stmt, i]));
    const state = new Map(comp.states.map((state) => [state, false]));

    const regs = new Array<boolean>(comp.stmts.length).fill(false);

    const operation = <Ops extends ir.Stmt[]>(
      action: (...ops: boolean[]) => boolean,
      ...ops: Ops
    ) => action(...ops.map((op) => regs[stmtIdcs.get(op)!]));

    for (const [i, stmt] of comp.stmts.entries()) {
      const k = stmt.kind;
      switch (k.tag) {
        case "Null":
          regs[i] = false;
          break;
        case "Input":
          regs[i] = inputs[k.i];
          break;
        case "Output":
          outputs[k.i] = regs[i];
          break;
        case "GetState":
          regs[i] = state.get(k.state)!;
          break;
        case "SetState":
          state.set(k.state, regs[i]);
          break;
        case "Not":
          regs[i] = operation((v) => !v, k.op);
          break;
        case "And":
          regs[i] = operation((a, b) => a && b, k.lhs, k.rhs);
          break;
        case "Or":
          regs[i] = operation((a, b) => a || b, k.lhs, k.rhs);
          break;
        case "Component":
          throw new Error("not implemented");
      }
    }
  }
}
