export class V2 {
  constructor(
    public x: number,
    public y: number,
  ) {}

  static fromSerialized(data: [number, number]): V2 {
    return new V2(data[0], data[1]);
  }

  serialize(): [number, number] {
    return [this.x, this.y];
  }

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

  abs(): V2 {
    return new V2(Math.abs(this.x), Math.abs(this.y));
  }

  assign(rhs: V2) {
    this.x = rhs.x;
    this.y = rhs.y;
  }

  toString(): string {
    return `V2(${this.x}, ${this.y})`;
  }
}

export const v2 = (x: number, y: number): V2 => new V2(x, y);

export function lineSegmentPointDistance(p1: V2, p2: V2, p: V2): number | null {
  const len = p2.sub(p1).len();
  const dist1 = p1.sub(p).len();
  const dist2 = p2.sub(p).len();

  return dist1 < len && dist2 < len ? linePointDistance(p1, p2, p) : null;
}

export function linePointDistance(p1: V2, p2: V2, p: V2): number {
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;
  const { x, y } = p;

  return (
    Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) /
    Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  );
}

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
