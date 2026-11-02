/** Door logic is independent of rendering and physics so safety can be tested deterministically. */
export interface DoorState { open: boolean; manual: boolean; clearTime: number }
export const newDoorState = (): DoorState => ({ open: false, manual: false, clearTime: 0 });
export function updateDoor(state: DoorState, x: number, z: number, dt: number, toggle = false): DoorState {
  const sensor = Math.abs(x) < 3.5 && Math.abs(z) < 4.6;
  // Wider than the capsule and full panel sweep, on both sides of the threshold.
  const safety = Math.abs(x) < 2.9 && Math.abs(z) < 1.1;
  let { open, manual, clearTime } = state;
  if (!sensor) manual = false;
  if (toggle) { open = !open; manual = true; clearTime = 0; }
  if (safety) { open = true; clearTime = 0; }
  else if (sensor) { clearTime = 0; if (!manual) open = true; }
  else { clearTime += dt; if (clearTime > 2) open = false; }
  return { open, manual, clearTime };
}
export function slidePosition(progress: number, side: -1 | 1) { return side * (1.05 + 2.05 * progress); }

export function easeSlide(t: number) { const p=Math.max(0,Math.min(1,t));return p*p*(3-2*p); }
