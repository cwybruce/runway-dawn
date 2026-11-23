// Runway Dawn — wanted level and police response. Crimes raise stars;
// police cruisers spawn at the map edge and chase the player, ramming the
// car or tackling the player on foot. Stay clean for a while and the heat
// cools off. Getting busted costs cash and drops the wanted level.

import { POLICE_MAX, WANTED_DECAY_SECONDS, WORLD_W, WORLD_H } from './config.js';
import { SOLIDS, CIRCLES, resolveCircleRect, resolveCircleCircle, clampToWorld } from './world.js';

export function createPolice() {
  return {
    wanted: 0,
    heatTimer: 0,
    cruisers: [],
    bustedFlash: 0,
  };
}

export function addWanted(police, stars) {
  police.wanted = Math.min(5, police.wanted + stars);
  police.heatTimer = WANTED_DECAY_SECONDS;
}

function spawnCruiser(police, player) {
  // Spawn at a map edge away from the player's view centre, heading in.
  const edges = [
    { x: 80, y: 80 }, { x: WORLD_W - 80, y: 80 },
    { x: 80, y: WORLD_H - 80 }, { x: WORLD_W - 80, y: WORLD_H - 80 },
  ];
  let spot = edges[0];
  let best = -1;
  for (const e of edges) {
    const d = Math.hypot(e.x - player.x, e.y - player.y);
    if (d > best) { best = d; spot = e; }
  }
  police.cruisers.push({
    x: spot.x, y: spot.y,
    angle: Math.atan2(player.y - spot.y, player.x - spot.x),
    speed: 0,
    maxSpeed: 430 + police.wanted * 28,
    color: '#20242e',
    lightPhase: Math.random() * Math.PI * 2,
    stuck: 0,
  });
}

export function updatePolice(police, dt, player, audio) {
  // Wanted decays after a clean stretch with no new crime.
  if (police.wanted > 0) {
    police.heatTimer -= dt;
    if (police.heatTimer <= 0) {
      police.wanted -= 1;
      police.heatTimer = WANTED_DECAY_SECONDS;
    }
  }

  // Desired cruiser count scales with stars: 1 star -> 1 car, up to 6.
  const want = police.wanted === 0 ? 0 : Math.min(POLICE_MAX, police.wanted + 1);
  while (police.cruisers.length < want) spawnCruiser(police, player);
  while (police.cruisers.length > want) police.cruisers.pop();

  const siren = police.wanted >= 2;
  if (siren) audio.sirenOn(); else audio.sirenOff();

  for (const c of police.cruisers) {
    const dx = player.x - c.x;
    const dy = player.y - c.y;
    const dist = Math.hypot(dx, dy) || 1;
    const wantAngle = Math.atan2(dy, dx);
    let diff = wantAngle - c.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    c.angle += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
    // Ease off when right on top of the player so they ram instead of orbit.
    const target = dist < 90 ? c.maxSpeed * 0.55 : c.maxSpeed;
    c.speed += (target - c.speed) * Math.min(1, 1.6 * dt);
    c.x += Math.cos(c.angle) * c.speed * dt;
    c.y += Math.sin(c.angle) * c.speed * dt;
    c.lightPhase += dt * 9;

    // Slide around buildings instead of driving through them.
    for (const s of SOLIDS) {
      if (resolveCircleRect(c, 24, s)) c.speed *= 0.6;
    }
    for (const circ of CIRCLES) resolveCircleCircle(c, 24, circ);
    clampToWorld(c, 30);

    // Ram the player: on foot it hurts, in a car it shoves and damages.
    // The shove is small and the damage is per-second, so a cruiser cannot
    // pin or insta-bust the player by touching them for one frame.
    const d = Math.hypot(player.x - c.x, player.y - c.y);
    if (d < 46) {
      const push = Math.atan2(player.y - c.y, player.x - c.x);
      if (player.inCar) {
        player.car.x += Math.cos(push) * 10;
        player.car.y += Math.sin(push) * 10;
        player.car.speed *= 0.92;
        player.health -= 12 * dt;
      } else {
        player.x += Math.cos(push) * 12;
        player.y += Math.sin(push) * 12;
        player.health -= 25 * dt;
      }
      audio.crash();
    }
  }
}
