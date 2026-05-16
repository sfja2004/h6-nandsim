export class V2 {
  constructor(
    public x: number,
    public y: number,
  ) {}

  add(other: V2): V2 {
    return new V2(this.x + other.x, this.y + other.y);
  }
  sub(other: V2): V2 {
    return new V2(this.x - other.x, this.y - other.y);
  }
  rsub(other: V2): V2 {
    return new V2(other.x - this.x, other.y - this.y);
  }

  len(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  distance(other: V2) {
    return this.rsub(other).len();
  }
}

export const v2 = (x: number, y: number): V2 => new V2(x, y);

export function rectsCollide(
  { x: ax, y: ay }: V2,
  { x: aw, y: ah }: V2,
  { x: bx, y: by }: V2,
  { x: bw, y: bh }: V2,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function pointInsideRect(
  { x: ax, y: ay }: V2,
  { x: bx, y: by }: V2,
  { x: bw, y: bh }: V2,
): boolean {
  return ax < bx + bw && ax > bx && ay < by + bh && ay > by;
}
