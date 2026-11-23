// Runway Dawn — deterministic screenshot staging. A ?shot=<name> URL query
// places the player, cars and police into a composed scene so the four
// screenshots each show a different system of the game (chase, heist, tower,
// menu). This only runs when the query is present; normal play is untouched.

import { CAR_MODELS } from './config.js';

function putPlayerInCar(state, modelIndex, x, y, angle, speed) {
  const car = state.traffic.cars.find((c) => c.parked && c.model === modelIndex && !c.stolen);
  const use = car || state.traffic.cars.find((c) => c.parked && !c.stolen);
  if (!use) return;
  use.parked = false;
  use.stolen = true;
  use.x = x;
  use.y = y;
  use.angle = angle;
  use.speed = speed;
  state.player.inCar = use;
  state.player.x = x;
  state.player.y = y;
  state.player.angle = angle;
  state.player.speed = speed;
  state.camera.x = x;
  state.camera.y = y;
}

function placePolice(state, spots) {
  state.police.cruisers = spots.map((s) => ({
    x: s.x, y: s.y, angle: s.angle, speed: s.speed || 380,
    maxSpeed: 460, color: '#20242e', lightPhase: s.phase || 0, stuck: 0,
  }));
}

export function applyShot(name, state) {
  const p = state.player;
  if (name === 'cover') {
    // Runway chase: player in the Interceptor, two cruisers closing in,
    // 3 stars, mission 2 in progress, planes taxiing behind.
    putPlayerInCar(state, 6, 2000, 480, 0, 480);
    state.player.cruise = true; // keep the chase at speed for the screenshot
    state.police.wanted = 3;
    state.police.heatTimer = 22;
    placePolice(state, [
      { x: 1760, y: 500, angle: 0.1, phase: 0 },
      { x: 1640, y: 440, angle: 0.2, phase: 1.6 },
    ]);
    state.missions.index = 1;
    state.missions.step = 1;
    p.cash = 1300;
  } else if (name === 'heist') {
    // On foot at Hangar 2 with the cargo marker, one cruiser approaching.
    // Spawned outside the marker radius so the step is not already complete.
    p.inCar = null;
    p.x = 770; p.y = 1490; p.angle = -Math.PI / 2;
    state.camera.x = 770; state.camera.y = 1490;
    state.police.wanted = 1;
    state.police.heatTimer = 22;
    placePolice(state, [{ x: 1250, y: 1560, angle: Math.PI, phase: 0.8 }]);
    state.missions.index = 1;
    state.missions.step = 0;
    p.cash = 400;
  } else if (name === 'tower') {
    // Baggage cart by the control tower at dawn, mission 3, no heat.
    putPlayerInCar(state, 3, 1560, 420, Math.PI / 2, 0);
    state.police.wanted = 0;
    state.missions.index = 2;
    state.missions.step = 0;
    p.cash = 2200;
  } else if (name === 'menu') {
    // Start screen: nothing to stage, main.js leaves the phase at menu.
    state.phase = 'menu';
  }
}
