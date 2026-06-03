export class Component {
  constructor(
    public stmts: Stmt[],
    public states: State[],
    public inputs: number,
    public outputs: number,
    public label: string,
  ) {}
}

export class Stmt {
  constructor(public kind: StmtKind) {}
}

export type StmtKind =
  | { tag: "Null" }
  | { tag: "Input"; i: number }
  | { tag: "Output"; i: number; src: Stmt }
  | { tag: "GetState"; state: State }
  | { tag: "SetState"; state: State; src: Stmt }
  | { tag: "Not"; op: Stmt }
  | { tag: "And" | "Or"; lhs: Stmt; rhs: Stmt }
  | { tag: "Component"; comp: Component; inputs: Stmt[]; outputs: Stmt[] };

export class State {}

export class ComponentBuilder {
  private stmts: Stmt[] = [];
  private states: State[] = [];

  constructor(
    private inputs: number,
    private outputs: number,
    private label: string,
  ) {}

  makeState(): State {
    const state = new State();
    this.states.push(state);
    return state;
  }

  makeNull(): Stmt {
    return this.makeStmt({ tag: "Null" });
  }
  makeInput(i: number): Stmt {
    return this.makeStmt({ tag: "Input", i });
  }
  makeOutput(i: number, src: Stmt): Stmt {
    return this.makeStmt({ tag: "Output", i, src });
  }
  makeGetState(state: State): Stmt {
    return this.makeStmt({ tag: "GetState", state });
  }
  makeSetState(state: State, src: Stmt): Stmt {
    return this.makeStmt({ tag: "SetState", state, src });
  }
  makeNot(op: Stmt): Stmt {
    return this.makeStmt({ tag: "Not", op });
  }
  makeBinary(tag: "And" | "Or", lhs: Stmt, rhs: Stmt): Stmt {
    return this.makeStmt({ tag, lhs, rhs });
  }

  private makeStmt(kind: StmtKind): Stmt {
    const stmt = new Stmt(kind);
    this.stmts.push(stmt);
    return stmt;
  }

  build(): Component {
    return new Component(
      this.stmts,
      this.states,
      this.inputs,
      this.outputs,
      this.label,
    );
  }
}

class StmtsMutater {
  constructor(private comp: Component) {}

  replaceStmt(oldStmt: Stmt, newStmt: Stmt) {
    for (const stmt of this.comp.stmts) {
      const k = stmt.kind;
      switch (k.tag) {
        case "Null":
        case "Input":
        case "GetState":
          break;
        case "Output":
        case "SetState":
          if (k.src === oldStmt) k.src = newStmt;
          break;
        case "Not":
          if (k.op === oldStmt) k.op = newStmt;
          break;
        case "And":
        case "Or":
          if (k.lhs === oldStmt) k.lhs = newStmt;
          if (k.rhs === oldStmt) k.rhs = newStmt;
          break;
        case "Component":
          throw new Error("not implemented");
      }
    }
  }

  removeStmtAt(i: number) {
    this.comp.stmts.splice(i, 1);
  }
}

export class ComponentOptimizer {
  constructor(private comp: Component) {}

  optimize() {
    let lengthBefore: number;
    do {
      lengthBefore = this.comp.stmts.length;

      this.eliminateRedundantState();
      this.hoistInputs();
    } while (this.comp.stmts.length !== lengthBefore);
  }

  eliminateRedundantState() {
    const mut = new StmtsMutater(this.comp);
    const immediatelyReadStateStmt = new Map<State, Stmt>();

    for (const [i, stmt] of this.comp.stmts.entries()) {
      const k = stmt.kind;
      switch (k.tag) {
        case "GetState": {
          const candidate = immediatelyReadStateStmt.get(k.state);
          if (candidate) {
            mut.replaceStmt(stmt, candidate);
            mut.removeStmtAt(i);
          }
          break;
        }
        case "SetState":
          immediatelyReadStateStmt.set(k.state, k.src);
          break;
      }
    }
  }

  hoistInputs() {
    const inputs = this.comp.stmts.filter((stmt) => stmt.kind.tag === "Input");
    const notInputs = this.comp.stmts.filter(
      (stmt) => stmt.kind.tag !== "Input",
    );
    this.comp.stmts = [...inputs, ...notInputs];
  }
}

export class ComponentPrinter {
  private stmtIds = new Map<Stmt, number>();
  private stateIds = new Map<State, number>();

  stringify(comp: Component): string {
    return (
      `component ${comp.label} ${comp.inputs} ${comp.outputs} {\n` +
      // `    states [ ${comp.states.map((state) => this.stateId(state)).join(", ")} ]\n` +
      `${comp.stmts.map((stmt) => `    ${this.stringifyStmt(stmt)}\n`).join("")}}`
    );
  }

  private stmtId(stmt: Stmt): string {
    if (!this.stmtIds.has(stmt)) {
      this.stmtIds.set(stmt, this.stmtIds.size);
    }
    return `%${this.stmtIds.get(stmt)!}`;
  }
  private stateId(state: State): string {
    if (!this.stateIds.has(state)) {
      this.stateIds.set(state, this.stateIds.size);
    }
    return `#${this.stateIds.get(state)!}`;
  }

  private stringifyStmt(stmt: Stmt) {
    const stmtId = (stmt: Stmt) => this.stmtId(stmt);
    const stateId = (state: State) => this.stateId(state);

    const k = stmt.kind;
    switch (k.tag) {
      case "Null":
        return `${stmtId(stmt)} = Null`;
      case "Input":
        return `${stmtId(stmt)} = Input ${k.i}`;
      case "Output":
        return `Output ${k.i}, ${stmtId(k.src)}`;
      case "GetState":
        return `${stmtId(stmt)} = GetState ${stateId(k.state)}`;
      case "SetState":
        return `SetState ${stateId(k.state)}, ${stmtId(k.src)}`;
      case "Not":
        return `${stmtId(stmt)} = Not ${stmtId(k.op)}`;
      case "And":
      case "Or":
        return `${stmtId(stmt)} = ${k.tag} ${stmtId(k.lhs)}, ${stmtId(k.rhs)}`;
      case "Component":
        return `Component <...>`;
    }
  }
}
