export type Project = {
  boardEditors: BoardEditor[];
  currentBoardEditorIdx: number;
  componentRepo: ComponentRepo;
};

export type BoardEditor = {
  name: string;
  board: Board;
};

export type Board = {
  components: Component[];
  joints: Joint[];
  wires: Wire[];
};

export type Component = {
  kindKey: string;
  pos: V2;
};

export type Joint = {
  pos: V2;
};

export type Wire = {
  begin: WireConnection;
  end: WireConnection;
};

export type WireConnection =
  | { tag: "InputPin"; compIdx: number; i: number }
  | { tag: "OutputPin"; compIdx: number; i: number }
  | { tag: "Joint"; jointIdx: number };

export type ComponentRepo = {
  defs: [string, ComponentKind][];
  savedBoards: [string, Board][];
};

export type ComponentKind = {
  size: V2;
  label: string;
  inputs: (string | null)[];
  outputs: (string | null)[];
};

export type V2 = [number, number];
