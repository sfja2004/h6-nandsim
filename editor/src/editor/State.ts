import type { Tool } from "./Cx";
import type { V2 } from "./V2";

export interface State {
  enterState?(): void;
  leaveState?(): void;
  onMouseDown?(pos: V2): void;
  onMouseUp?(pos: V2): void;
  onMouseMove?(deltaPos: V2, pos: V2): void;
  onKeyDown?(key: string): void;
  onKeyUp?(key: string): void;
  selectedTool?(): Tool | null;
}
