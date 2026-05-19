import type { Cx } from "../Cx";
import type { State } from "../State";

export class Selecting implements State {
  constructor(private cx: Cx) {}
}
