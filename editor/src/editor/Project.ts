import { Board, ComponentRepo, type Component } from "./Board";
import { type EventBus } from "./events";

export class Project {
  private current: BoardEditor;
  private selectedIdx = 0;

  private constructor(
    private events: EventBus,
    private boardEditors: BoardEditor[],
    private components: Component[],
    public componentRepo: ComponentRepo,
  ) {
    this.current = boardEditors[this.selectedIdx];
  }

  static loadLocalStoreOrInitNew(events: EventBus): Project {
    if (globalThis.localStorage.getItem("nandsim")) {
      return this.loadLocalStorage();
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
      [],
      repo,
    );
  }

  static loadLocalStorage(): Project {
    throw new Error("not implemented");
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
      board: new Board(),
    });
    this.events.send({ tag: "ShowSelectedTab", idx: this.selectedIdx });
    return this.boardEditors.length - 1;
  }

  switchTab(idx: number) {
    this.selectedIdx = idx;
    this.current = this.boardEditors[this.selectedIdx];
    this.events.send({ tag: "ShowSelectedTab", idx: this.selectedIdx });
    this.events.send({ tag: "ShowSelectedTool", tool: this.current.name });
  }

  closeTab(idx: number) {
    this.boardEditors.splice(idx, 1);
    if (this.boardEditors.length === 0) {
      this.newTab();
    }
    this.selectedIdx = 0;
    this.current = this.boardEditors[this.selectedIdx];
    this.events.send({ tag: "ShowSelectedTab", idx: this.selectedIdx });
  }

  renameComponent(newName: string) {
    this.current.name = newName;
    this.events.send({ tag: "ShowSelectedTab", idx: this.selectedIdx });
  }

  saveComponent() {
    this.componentRepo.add(
      this.current.name,
      this.current.board.toComponentKind(this.current.name),
    );
    this.events.send({ tag: "ShowSelectedTool", tool: this.current.name });
  }
}

type BoardEditor = {
  name: string;
  board: Board;
};
