import type { Tool } from "./Cx";
import type { V2_ } from "./V2";

export interface State {
  enterState?(): void;
  leaveState?(): void;
  onMouseDown?(pos: V2_): void;
  onMouseUp?(pos: V2_): void;
  onMouseMove?(deltaPos: V2_, pos: V2_): void;
  onKeyDown?(key: string): void;
  onKeyUp?(key: string): void;
  selectTool?(tool: Tool): void;
  selectedTool?(): Tool | null;
}
