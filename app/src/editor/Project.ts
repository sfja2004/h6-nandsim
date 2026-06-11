import { Board, ComponentRepo } from "./Board";
import { type EventBus } from "./events";
import * as ser from "./serialize";

export class Project {
  private current: BoardEditor;
  private selectedIdx = 0;

  private constructor(
    private events: EventBus,
    private boardEditors: BoardEditor[],
    public componentRepo: ComponentRepo,
  ) {
    this.current = boardEditors[this.selectedIdx];
  }

  static loadLocalStoreOrInitNew(events: EventBus): Project {
    // globalThis.localStorage.removeItem("nandsim");
    if (globalThis.localStorage.getItem("nandsim")) {
      return this.loadLocalStorage(events);
    } else {
      return this.initNew(events);
    }
  }
  static initNew(events: EventBus): Project {
    const repo = ComponentRepo.withDefaults();
    return new Project(
      events,
      [
        {
          name: "(Unnamed)",
          board: Board.withExample(repo),
        },
      ],
      repo,
    );
  }

  static loadLocalStorage(events: EventBus): Project {
    const data = JSON.parse(
      globalThis.localStorage.getItem("nandsim")!,
    ) as ser.Project;
    return Project.fromSerialized(data, events);
  }

  save() {
    // console.log("Saving");
    const data = this.serialize();
    globalThis.localStorage.setItem("nandsim", JSON.stringify(data));
    // console.log(data);
  }

  private static fromSerialized(data: ser.Project, events: EventBus): Project {
    const repo = ComponentRepo.fromSerialized(data.componentRepo);
    const project = new Project(
      events,
      data.boardEditors.map(
        (data): BoardEditor => ({
          name: data.name,
          board: Board.fromSerialized(data.board, repo),
        }),
      ),
      repo,
    );
    return project;
  }

  private serialize(): ser.Project {
    const componentRepo = this.componentRepo.serialize();
    return {
      boardEditors: this.boardEditors.map(
        (b): ser.BoardEditor => ({
          name: b.name,
          board: b.board.serialize(),
        }),
      ),
      currentBoardEditorIdx: this.selectedIdx,
      componentRepo,
    };
  }

  currentBoard(): Board {
    return this.current.board;
  }

  availableBoardEditors(): string[] {
    return this.boardEditors.map((e) => e.name);
  }

  availableTools(): string[] {
    return this.componentRepo
      .available()
      .filter((e) => e !== this.current.name);
  }

  newTab(): number {
    this.boardEditors.push({
      name: `(Unnamed ${this.boardEditors.length})`,
      board: new Board(this.componentRepo),
    });
    this.events.send({ tag: "ShowSelectedTab", idx: this.selectedIdx });
    return this.boardEditors.length - 1;
  }

  switchTab(idx: number) {
    this.selectedIdx = idx;
    this.current = this.boardEditors[this.selectedIdx];
    this.events.send({ tag: "ShowSelectedTab", idx: this.selectedIdx });
    this.events.send({ tag: "ShowSelectedTool", tool: this.current.name });
    this.events.send({ tag: "SaveRequest" });
  }

  closeTab(): number {
    const [_removed] = this.boardEditors.splice(this.selectedIdx, 1);
    this.events.send({ tag: "SaveRequest" });

    if (this.boardEditors.length === 0) {
      this.newTab();
    }
    return 0;
  }

  renameComponent(newName: string) {
    this.current.name = newName;
    this.events.send({ tag: "ShowSelectedTab", idx: this.selectedIdx });
    this.events.send({ tag: "ShowSelectedTool", tool: this.current.name });
  }

  saveComponent() {
    this.componentRepo.add(
      this.current.name,
      this.current.board.toComponentKind(this.current.name),
    );
    this.componentRepo.addSavedBoard(
      this.current.name,
      this.current.board.serialize(),
    );

    this.events.send({ tag: "ShowSelectedTool", tool: this.current.name });
    this.events.send({ tag: "SaveRequest" });
  }

  tabWithTool(name: string): number {
    const foundIdx = this.boardEditors.findIndex((b) => b.name === name);

    if (foundIdx != -1) {
      return foundIdx;
    }

    const saved = this.componentRepo.getSavedBoard(name);
    if (!saved) throw new Error(`cannot open '${name}'`);

    this.boardEditors.push({
      name: name,
      board: Board.fromSerialized(saved, this.componentRepo),
    });
    this.events.send({ tag: "ShowSelectedTab", idx: this.selectedIdx });
    return this.boardEditors.length - 1;
  }
}

type BoardEditor = {
  name: string;
  board: Board;
};
