// Runway Dawn — the airport map. Dawnfield International is a fictional
// airfield: one runway, a parallel taxiway, a terminal, three hangars, a
// control tower, a car park, a fuel depot and a perimeter road ring. All
// geometry is data here; render.js draws it, player.js collides with it.

import { WORLD_W, WORLD_H } from './config.js';

// Axis-aligned solid rectangles the player and cars cannot pass through.
export const SOLIDS = [
  // Terminal building (big, centre).
  { x: 1500, y: 800, w: 620, h: 300, kind: 'terminal', label: 'TERMINAL' },
  // Hangars 1-3, west row.
  { x: 300, y: 950, w: 320, h: 220, kind: 'hangar', label: 'HANGAR 1' },
  { x: 300, y: 1240, w: 320, h: 220, kind: 'hangar', label: 'HANGAR 2' },
  { x: 300, y: 1530, w: 320, h: 220, kind: 'hangar', label: 'HANGAR 3' },
  // Cargo warehouse, south-west.
  { x: 700, y: 1900, w: 420, h: 260, kind: 'warehouse', label: 'CARGO' },
  // Fuel depot tanks are circles; the depot hut is a rect.
  { x: 900, y: 1900, w: 140, h: 120, kind: 'hut', label: 'FUEL OFFICE' },
  // City blocks at the south-east corner (outside the fence).
  { x: 2700, y: 2050, w: 240, h: 180, kind: 'city', label: 'MOTEL' },
  { x: 3000, y: 2050, w: 240, h: 180, kind: 'city', label: 'DINER' },
  { x: 2700, y: 2280, w: 240, h: 180, kind: 'city', label: 'GARAGE' },
  { x: 3050, y: 2280, w: 200, h: 150, kind: 'city', label: 'SHOP' },
];

// Solid circles: control tower base, fuel tanks, radar dome.
export const CIRCLES = [
  { x: 1800, y: 280, r: 58, kind: 'tower', label: 'CONTROL TOWER' },
  { x: 760, y: 1980, r: 46, kind: 'tank', label: 'FUEL' },
  { x: 870, y: 2060, r: 40, kind: 'tank', label: 'FUEL' },
  { x: 3300, y: 2200, r: 42, kind: 'radar', label: 'RADAR' },
];

// Tarmac / paved areas drawn under markings (not colliders).
export const PAVED = [
  { x: 180, y: 400, w: 3240, h: 160, kind: 'runway' },   // runway strip
  { x: 180, y: 620, w: 3240, h: 110, kind: 'taxiway' },  // taxiway
  { x: 1400, y: 730, w: 900, h: 420, kind: 'apron' },    // terminal apron
  { x: 240, y: 900, w: 700, h: 900, kind: 'apron' },     // hangar apron
  { x: 2200, y: 1300, w: 1000, h: 520, kind: 'carpark' }, // car park
  { x: 640, y: 1860, w: 560, h: 340, kind: 'depot' },    // fuel depot
];

// Roads the traffic follows (polylines). Perimeter ring + terminal access road.
export const ROADS = [
  // Perimeter ring (clockwise loop).
  [{ x: 120, y: 120 }, { x: 3480, y: 120 }, { x: 3480, y: 2480 }, { x: 120, y: 2480 }, { x: 120, y: 120 }],
  // Terminal access road: south gate up to the terminal front.
  [{ x: 1800, y: 2480 }, { x: 1800, y: 1150 }],
  // Car park link road.
  [{ x: 1800, y: 1500 }, { x: 2250, y: 1500 }],
];

// Gates in the perimeter fence (mission escape points).
export const GATES = [
  { x: 3300, y: 480, label: 'EAST GATE', r: 70 },
  { x: 1800, y: 2480, label: 'SOUTH GATE', r: 70 },
];

// Where the player starts: the staff car park, south of the terminal.
export const PLAYER_START = { x: 2350, y: 1620, angle: -Math.PI / 2 };

// Parked cars (model index into CAR_MODELS, position, angle).
export const PARKED_CARS = [
  { model: 0, x: 2320, y: 1380, angle: 0 },
  { model: 1, x: 2440, y: 1380, angle: 0 },
  { model: 2, x: 2560, y: 1380, angle: 0 },
  { model: 5, x: 2680, y: 1380, angle: 0 },
  { model: 0, x: 2320, y: 1500, angle: 0 },
  { model: 2, x: 2560, y: 1500, angle: 0 },
  { model: 1, x: 2800, y: 1500, angle: 0 },
  { model: 5, x: 2920, y: 1620, angle: Math.PI / 2 },
  { model: 0, x: 2320, y: 1740, angle: 0 },
  { model: 6, x: 3050, y: 1380, angle: 0 },
  // The mission baggage cart, by the terminal apron.
  { model: 3, x: 1560, y: 1240, angle: Math.PI / 2, mission: 'baggage-run' },
  // Fuel truck at the depot.
  { model: 4, x: 980, y: 1980, angle: -Math.PI / 2 },
];

// Pedestrian spawn zones: terminal front walk and car park.
export const PED_ZONES = [
  { x: 1500, y: 1150, w: 620, h: 90 },
  { x: 2200, y: 1300, w: 1000, h: 520 },
  { x: 240, y: 900, w: 700, h: 120 },
];

// Decorative props (non-solid): runway lights, windsock, light poles, trees.
export function buildProps() {
  const props = [];
  for (let x = 260; x <= 3340; x += 160) {
    props.push({ kind: 'runway-light', x, y: 412 });
    props.push({ kind: 'runway-light', x, y: 548 });
  }
  for (let i = 0; i < 10; i++) {
    props.push({ kind: 'pole', x: 200 + i * 340, y: 180 });
    props.push({ kind: 'pole', x: 200 + i * 340, y: 2420 });
  }
  props.push({ kind: 'windsock', x: 1400, y: 480 });
  props.push({ kind: 'windsock', x: 2900, y: 480 });
  for (let i = 0; i < 26; i++) {
    props.push({ kind: 'tree', x: 140 + Math.random() * 200, y: 300 + i * 85 });
    props.push({ kind: 'tree', x: 3300 + Math.random() * 180, y: 900 + i * 55 });
  }
  return props;
}

// Circle-vs-rect collision resolve: push the circle out of the rect.
// Returns true when a collision happened.
export function collideCircleRect(px, py, r, rect) {
  const cx = Math.max(rect.x, Math.min(px, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(py, rect.y + rect.h));
  const dx = px - cx;
  const dy = py - cy;
  const d2 = dx * dx + dy * dy;
  return d2 < r * r;
}

export function resolveCircleRect(p, r, rect) {
  const cx = Math.max(rect.x, Math.min(p.x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(p.y, rect.y + rect.h));
  let dx = p.x - cx;
  let dy = p.y - cy;
  let d = Math.hypot(dx, dy);
  if (d >= r) return false;
  if (d === 0) { dx = 0; dy = -1; d = 1; }
  const push = r - d;
  p.x += (dx / d) * push;
  p.y += (dy / d) * push;
  return true;
}

export function resolveCircleCircle(p, r, c) {
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  const d = Math.hypot(dx, dy);
  const min = r + c.r;
  if (d >= min || d === 0) return false;
  const push = min - d;
  p.x += (dx / d) * push;
  p.y += (dy / d) * push;
  return true;
}

export function clampToWorld(p, margin) {
  p.x = Math.max(margin, Math.min(WORLD_W - margin, p.x));
  p.y = Math.max(margin, Math.min(WORLD_H - margin, p.y));
}
