import type { V2, Tool } from "./Cx";

export interface State {
  onMouseDown?(pos: V2): void;
  onMouseUp?(pos: V2): void;
  onMouseMove?(deltaPos: V2): void;
  onKeyDown?(key: string): void;
  onKeyUp?(key: string): void;
  selectTool?(tool: Tool): void;
  selectedTool?(): Tool | null;
}
