// Runway Dawn — the player: on-foot movement, car stealing, driving physics
// and a simple punch. Driving is arcade: accelerate, steer, drift a little,
// crash into things and lose speed. Stealing a parked car or punching a
// pedestrian is a crime and raises the wanted level.

import { PLAYER, CAR, CAR_MODELS } from './config.js';
import { SOLIDS, CIRCLES, resolveCircleRect, resolveCircleCircle, clampToWorld } from './world.js';
import { nearestStealableCar } from './traffic.js';
import { addWanted } from './police.js';

export function createPlayer() {
  return {
    x: 2350, y: 1620, angle: -Math.PI / 2,
    vx: 0, vy: 0,
    health: PLAYER.health,
    cash: 0,
    inCar: null,       // the car object when driving, else null
    speed: 0,          // current driving speed (signed)
    punchT: 0,         // punch animation timer
    punchCooldown: 0,
    busted: false,
    bustedT: 0,
  };
}

function collideWorld(p, r) {
  for (const s of SOLIDS) resolveCircleRect(p, r, s);
  for (const c of CIRCLES) resolveCircleCircle(p, r, c);
  clampToWorld(p, r + 4);
}

export function updatePlayer(player, input, dt, traffic, police, audio) {
  if (player.busted) {
    player.bustedT -= dt;
    return;
  }
  player.punchCooldown = Math.max(0, player.punchCooldown - dt);
  player.punchT = Math.max(0, player.punchT - dt);

  if (player.inCar) {
    updateDriving(player, input, dt, traffic, police, audio);
  } else {
    updateOnFoot(player, input, dt, traffic, police, audio);
  }

  // Getting busted: health hits zero.
  if (player.health <= 0 && !player.busted) {
    player.busted = true;
    player.bustedT = 3.5;
    player.health = 0;
    if (player.inCar) {
      player.inCar.parked = true;
      player.inCar.stolen = false;
      player.inCar.speed = 0;
      player.inCar = null;
    }
    audio.sirenOff();
    audio.engineOff();
  }
}

function updateOnFoot(player, input, dt, traffic, police, audio) {
  const run = input.isDown('shift');
  const speed = run ? PLAYER.runSpeed : PLAYER.walkSpeed;
  let mx = 0;
  let my = 0;
  if (input.isDown('w', 'arrowup')) my -= 1;
  if (input.isDown('s', 'arrowdown')) my += 1;
  if (input.isDown('a', 'arrowleft')) mx -= 1;
  if (input.isDown('d', 'arrowright')) mx += 1;
  if (mx || my) {
    const len = Math.hypot(mx, my);
    mx /= len; my /= len;
    player.x += mx * speed * dt;
    player.y += my * speed * dt;
    player.angle = Math.atan2(my, mx);
  }
  collideWorld(player, PLAYER.radius);

  // E: steal the nearest parked car.
  if (input.wasPressed('e')) {
    const car = nearestStealableCar(traffic, player.x, player.y, 70);
    if (car) {
      car.parked = false;
      car.stolen = true;
      car.speed = 0;
      player.inCar = car;
      player.x = car.x;
      player.y = car.y;
      player.angle = car.angle;
      player.speed = 0;
      addWanted(police, 1);
      audio.pickup();
    }
  }

  // Space: punch. Hitting a pedestrian nearby is a crime.
  if (input.wasPressed('space') && player.punchCooldown <= 0) {
    player.punchT = 0.22;
    player.punchCooldown = 0.45;
    audio.punch();
    const fx = player.x + Math.cos(player.angle) * 30;
    const fy = player.y + Math.sin(player.angle) * 30;
    for (const p of traffic.peds) {
      if (Math.hypot(p.x - fx, p.y - fy) < 42) {
        p.panic = 3;
        addWanted(police, 1);
      }
    }
  }

  // Slow health regen when calm.
  if (police.wanted === 0 && player.health < PLAYER.health) {
    player.health = Math.min(PLAYER.health, player.health + 3 * dt);
  }
}

function updateDriving(player, input, dt, traffic, police, audio) {
  const car = player.inCar;
  const model = CAR_MODELS[car.model];
  const maxSpeed = CAR.maxSpeed * model.speed;

  const forward = input.isDown('w', 'arrowup') || player.cruise;
  const back = input.isDown('s', 'arrowdown');
  if (forward) player.speed += CAR.accel * dt;
  else if (back) player.speed -= (player.speed > 0 ? CAR.brake : CAR.accel * 0.6) * dt;
  else player.speed -= Math.sign(player.speed) * 160 * dt;
  if (Math.abs(player.speed) < 8 && !forward && !back) player.speed = 0;
  player.speed = Math.max(-CAR.reverseMax, Math.min(maxSpeed, player.speed));

  // Steering scales with speed; a touch of drift at high speed.
  const steerInput = (input.isDown('a', 'arrowleft') ? -1 : 0) + (input.isDown('d', 'arrowright') ? 1 : 0);
  const steerAuthority = Math.min(1, Math.abs(player.speed) / 140);
  player.angle += steerInput * 2.5 * steerAuthority * Math.sign(player.speed) * dt;

  const nx = player.x + Math.cos(player.angle) * player.speed * dt;
  const ny = player.y + Math.sin(player.angle) * player.speed * dt;
  const before = { x: player.x, y: player.y };
  player.x = nx;
  player.y = ny;
  // Buildings stop the car hard; the crash costs speed and a little health.
  let hit = false;
  for (const s of SOLIDS) {
    if (resolveCircleRect(player, 24, s)) hit = true;
  }
  for (const c of CIRCLES) {
    if (resolveCircleCircle(player, 24, c)) hit = true;
  }
  clampToWorld(player, 30);
  if (hit && Math.abs(player.speed) > 180) {
    audio.crash();
    player.health -= 6;
  }
  if (hit) player.speed *= 0.45;
  if (before.x === player.x && before.y === player.y && Math.abs(player.speed) > 200) {
    player.speed *= 0.9;
  }
  car.x = player.x;
  car.y = player.y;
  car.angle = player.angle;
  car.speed = player.speed;

  // Running over a pedestrian is a crime.
  for (const p of traffic.peds) {
    if (Math.hypot(p.x - player.x, p.y - player.y) < 30 && Math.abs(player.speed) > 60) {
      p.panic = 3;
      p.x += Math.cos(player.angle) * 60;
      p.y += Math.sin(player.angle) * 60;
      if (!p._hit) { p._hit = true; addWanted(police, 1); setTimeout(() => { p._hit = false; }, 3000); }
    }
  }

  // E: get out of the car.
  if (input.wasPressed('e')) {
    const outAngle = player.angle + Math.PI / 2;
    player.x += Math.cos(outAngle) * 42;
    player.y += Math.sin(outAngle) * 42;
    collideWorld(player, PLAYER.radius);
    car.parked = true;
    car.speed = 0;
    player.inCar = null;
    player.speed = 0;
    audio.engineOff();
  }

  audio.engine(Math.abs(player.speed) / maxSpeed);
}
