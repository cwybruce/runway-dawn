// Runway Dawn — ambient life: civilian traffic on the roads, pedestrians on
// the terminal walk, and airliners taxiing between the runway and the apron.
// Traffic is dumb on purpose: cars follow road polylines, planes shuttle the
// taxiway, pedestrians wander and flee from speeding cars.

import { CAR_MODELS, WORLD_W, WORLD_H } from './config.js';
import { ROADS, PED_ZONES, PARKED_CARS } from './world.js';

function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function createTraffic() {
  const cars = [];
  const peds = [];
  const planes = [
    { x: 700, y: 675, angle: 0, speed: 42, dir: 1, len: 170, color: '#dfe8ee', tail: '#c0392b' },
    { x: 2600, y: 675, angle: Math.PI, speed: 34, dir: -1, len: 140, color: '#cfd8de', tail: '#2e6fb5' },
  ];

  // Civilian cars circulating on the road loops.
  for (let i = 0; i < 9; i++) {
    const road = pick(ROADS);
    const seg = Math.floor(Math.random() * (road.length - 1));
    const a = road[seg];
    const b = road[seg + 1];
    const t = Math.random();
    cars.push({
      model: Math.floor(rand(0, 6)),
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      angle: Math.atan2(b.y - a.y, b.x - a.x),
      speed: rand(90, 150),
      road, seg, t,
      civilian: true,
      color: CAR_MODELS[Math.floor(rand(0, 6))].color,
    });
  }

  // Parked cars from the map data (stealable).
  for (const p of PARKED_CARS) {
    cars.push({
      model: p.model,
      x: p.x, y: p.y, angle: p.angle,
      speed: 0, parked: true, civilian: false,
      color: CAR_MODELS[p.model].color,
      mission: p.mission || null,
      stolen: false,
    });
  }

  for (let i = 0; i < 14; i++) {
    const z = pick(PED_ZONES);
    peds.push({
      x: rand(z.x, z.x + z.w),
      y: rand(z.y, z.y + z.h),
      angle: rand(0, Math.PI * 2),
      speed: rand(28, 55),
      color: pick(['#e8b04b', '#4b9e8a', '#b54b6a', '#6a8ab5', '#c8c8c8', '#8a6ab5']),
      state: 'walk',
      panic: 0,
      wait: rand(0, 4),
    });
  }

  return { cars, peds, planes };
}

function roadPoint(road, seg, t) {
  const a = road[seg];
  const b = road[seg + 1];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angle: Math.atan2(b.y - a.y, b.x - a.x) };
}

export function updateTraffic(traffic, dt, playerPos, playerSpeed) {
  // Civilian cars drive their road loop.
  for (const c of traffic.cars) {
    if (c.parked || c.stolen) continue;
    const a = c.road[c.seg];
    const b = c.road[c.seg + 1];
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    c.t += (c.speed * dt) / segLen;
    if (c.t >= 1) {
      c.t = 0;
      c.seg = (c.seg + 1) % (c.road.length - 1);
    }
    const p = roadPoint(c.road, c.seg, c.t);
    c.x = p.x; c.y = p.y; c.angle = p.angle;
  }

  // Planes taxi back and forth along the taxiway.
  for (const pl of traffic.planes) {
    pl.x += pl.dir * pl.speed * dt;
    if (pl.x > 3300) { pl.dir = -1; pl.angle = Math.PI; }
    if (pl.x < 320) { pl.dir = 1; pl.angle = 0; }
  }

  // Pedestrians wander; they panic and run from a fast car nearby.
  for (const p of traffic.peds) {
    const dPlayer = Math.hypot(p.x - playerPos.x, p.y - playerPos.y);
    if (playerSpeed > 260 && dPlayer < 160) p.panic = 2.2;
    if (p.panic > 0) {
      p.panic -= dt;
      const away = Math.atan2(p.y - playerPos.y, p.x - playerPos.x);
      p.x += Math.cos(away) * 150 * dt;
      p.y += Math.sin(away) * 150 * dt;
      p.angle = away;
    } else if (p.wait > 0) {
      p.wait -= dt;
    } else {
      p.x += Math.cos(p.angle) * p.speed * dt;
      p.y += Math.sin(p.angle) * p.speed * dt;
      if (Math.random() < dt * 0.25) p.angle = rand(0, Math.PI * 2);
      if (Math.random() < dt * 0.1) p.wait = rand(1, 4);
    }
    p.x = Math.max(40, Math.min(WORLD_W - 40, p.x));
    p.y = Math.max(40, Math.min(WORLD_H - 40, p.y));
  }
}

// Find the nearest stealable parked car within reach of a point.
export function nearestStealableCar(traffic, x, y, maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const c of traffic.cars) {
    if (!c.parked || c.stolen) continue;
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}
