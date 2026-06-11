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

  sources(): Stmt[] {
    const k = this.kind;
    switch (k.tag) {
      case "Null":
        return [];
      case "Input":
        return [];
      case "Output":
        return [k.src];
      case "GetState":
        return [];
      case "SetState":
        return [k.src];
      case "Not":
        return [k.op];
      case "And":
      case "Or":
        return [k.lhs, k.rhs];
      case "Component":
        return [...k.inputs];
    }
  }

  replaceSource(oldStmt: Stmt, newStmt: Stmt) {
    const k = this.kind;
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
        k.inputs = k.inputs.map((stmt) =>
          stmt === oldStmt ? newStmt : oldStmt,
        );
        break;
    }
  }

  replaceState(oldState: State, newState: State) {
    const k = this.kind;
    switch (k.tag) {
      case "GetState":
      case "SetState":
        if (k.state === oldState) k.state = newState;
        break;
      default:
        break;
    }
  }
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
  constructor(
    private comp: Component,
    private replacedStates: [State, State][],
  ) {}

  [Symbol.iterator](): Iterator<Stmt> {
    return this.comp.stmts[Symbol.iterator]();
  }

  replaceSource(oldStmt: Stmt, newStmt: Stmt) {
    for (const stmt of this.comp.stmts) {
      stmt.replaceSource(oldStmt, newStmt);
    }
  }

  replaceState(oldState: State, newState: State) {
    this.replacedStates.push([oldState, newState]);
    for (const stmt of this.comp.stmts) {
      stmt.replaceState(oldState, newState);
    }
  }

  removeStmt(stmt: Stmt) {
    this.comp.stmts = this.comp.stmts.filter((s) => s !== stmt);
  }
  removeStmtAt(i: number): Stmt {
    return this.comp.stmts.splice(i, 1)[0];
  }

  insertStmtAt(i: number, stmt: Stmt) {
    this.comp.stmts = [
      ...this.comp.stmts.slice(0, i),
      stmt,
      ...this.comp.stmts.slice(i),
    ];
  }
}

export class ComponentOptimizer {
  constructor(
    private comp: Component,
    private replacedStates: [State, State][],
  ) {}

  optimize() {
    const score = () => this.comp.stmts.length * 100 + this.comp.states.length;

    let scoreBefore: number;
    do {
      scoreBefore = score();

      this.eliminateRedundantState();
      this.hoistInputs();
      this.moveSetStateToSource();
      this.collapseStates();
      this.eliminateUnusedStates();
      this.eliminateRedundantSetState();
    } while (score() !== scoreBefore);
  }

  eliminateRedundantState() {
    const mut = new StmtsMutater(this.comp, this.replacedStates);
    const immediatelyReadStateStmt = new Map<State, Stmt>();

    for (const [i, stmt] of this.comp.stmts.entries()) {
      const k = stmt.kind;
      switch (k.tag) {
        case "GetState": {
          const candidate = immediatelyReadStateStmt.get(k.state);
          if (candidate) {
            mut.replaceSource(stmt, candidate);
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

  moveSetStateToSource() {
    const mut = new StmtsMutater(this.comp, this.replacedStates);

    for (const [baseIdx, stmt] of this.comp.stmts.entries()) {
      const indices = this.indexMap();

      const sourceIndices = stmt.sources().map((stmt) => indices.get(stmt)!);

      if (sourceIndices.length == 0) {
        continue;
      }

      const lastSourceIndex = sourceIndices.reduce((p, v) => Math.max(p, v));

      if (lastSourceIndex >= baseIdx - 1) {
        continue;
      }

      mut.removeStmt(stmt);
      mut.insertStmtAt(lastSourceIndex + 1, stmt);
    }
  }

  collapseStates() {
    const mut = new StmtsMutater(this.comp, this.replacedStates);

    const sourceStates = new MultiMap<Stmt, State>();
    for (const stmt of this.comp.stmts) {
      if (stmt.kind.tag !== "SetState") continue;

      sourceStates.add(stmt.kind.src, stmt.kind.state);
    }

    for (const [_stmt, [newState, ...oldStates]] of sourceStates) {
      for (const oldState of oldStates) {
        mut.replaceState(oldState, newState);
      }
    }
  }

  eliminateUnusedStates() {
    const mut = new StmtsMutater(this.comp, this.replacedStates);

    const usedStates = new Set<State>();
    for (const stmt of mut) {
      const k = stmt.kind;
      switch (k.tag) {
        case "GetState":
        case "SetState":
          usedStates.add(k.state);
          break;
        default:
          break;
      }
    }

    this.comp.states = this.comp.states.filter((state) =>
      usedStates.has(state),
    );
  }

  eliminateRedundantSetState() {
    const mut = new StmtsMutater(this.comp, this.replacedStates);

    for (let i = this.comp.stmts.length - 1; i > 0; --i) {
      const [first, second] = this.comp.stmts.slice(i - 1, i + 1);
      if (
        first.kind.tag === "SetState" &&
        second.kind.tag === first.kind.tag &&
        first.kind.state === second.kind.state &&
        first.kind.src === second.kind.src
      ) {
        mut.removeStmt(second);
      }
    }
  }

  private indexMap(): Map<Stmt, number> {
    return new Map(this.comp.stmts.map((stmt, i) => [stmt, i]));
  }
}

class MultiMap<Key, Value> {
  private map = new Map<Key, Value[]>();

  add(key: Key, ...values: Value[]) {
    if (!this.map.has(key)) {
      this.map.set(key, []);
    }
    this.map.get(key)!.push(...values);
  }

  get(key: Key): Value[] {
    return this.map.get(key) ?? [];
  }

  [Symbol.iterator](): Iterator<[Key, Value[]]> {
    return this.map[Symbol.iterator]();
  }
}

export class ComponentPrinter {
  private stmtIds = new Map<Stmt, number>();
  private stateIds = new Map<State, number>();

  stringify(comp: Component): string {
    return (
      `component ${comp.label} ${comp.inputs} ${comp.outputs} {\n` +
      `    state [ ${comp.states.map((state) => this.stateId(state)).join(", ")} ]\n` +
      `${comp.stmts.map((stmt) => `    ${this.stringifyStmt(stmt)}\n`).join("")}}`
    );
  }

  stringifyToConsole(comp: Component): string[] {
    let fmt = this.stringify(comp)
      .replaceAll(/%\d+/g, "\\c(color: cyan)$&\\c")
      .replaceAll(/#\d+/g, "\\c(color: lightgreen)$&\\c")
      .replaceAll(/ \d+/g, "\\c(color: #bf8bf0)$&\\c")
      .replaceAll(
        /(?:component)|(?:state)/g,
        "\\c(color: #d44949; font-weight: bold)$&\\c",
      )
      .replaceAll(
        /(?:Null)|(?:Input)|(?:Output)|(?:GetState)|(?:SetState)|(?:Not)|(?:And)|(?:Or)|(?:Component)/g,
        "\\c(color: orange)$&\\c",
      );

    const selectors: string[] = [];

    let match;
    while ((match = fmt.match(/\\c(?:\((.*?)\))?/))) {
      fmt = fmt.replace(/\\c(?:\(.*?\))?/, "\r%c");
      selectors.push(match[1]);
    }

    fmt += "%c";
    selectors.push("");

    return [fmt, ...selectors];
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
