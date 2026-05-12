export type V2 = { x: number; y: number };
export const V2 = (x: number, y: number): V2 => ({ x, y });

export function rectsCollide(
  { x: ax, y: ay }: V2,
  { x: aw, y: ah }: V2,
  { x: bx, y: by }: V2,
  { x: bw, y: bh }: V2,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
