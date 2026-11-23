// Runway Dawn — all drawing: the dawn-lit airport, cars, planes, people,
// police lights, and the full HUD (cash, health, wanted stars, minimap,
// objective, speed, banners, start screen and busted screen). One canvas,
// no images, no external assets — every shape is drawn in code.

import { WORLD_W, WORLD_H, PALETTE, CAR, CAR_MODELS, GAME_TITLE, GAME_SUBTITLE } from './config.js';
import { SOLIDS, CIRCLES, PAVED, GATES } from './world.js';
import { currentStep, objectiveText, currentMission } from './missions.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCarShape(ctx, x, y, angle, color, opts) {
  const o = opts || {};
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Soft shadow (dawn sun comes from the east: shadows fall west).
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  rr(ctx, -CAR.length / 2 + 7, -CAR.width / 2 + 6, CAR.length, CAR.width, 8);
  ctx.fill();
  ctx.fillStyle = color;
  rr(ctx, -CAR.length / 2, -CAR.width / 2, CAR.length, CAR.width, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(20,28,38,0.85)';
  rr(ctx, -8, -CAR.width / 2 + 4, 18, CAR.width - 8, 4);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(CAR.length / 2 - 3, -CAR.width / 2 + 3, 3, 5);
  ctx.fillRect(CAR.length / 2 - 3, CAR.width / 2 - 8, 3, 5);
  ctx.fillStyle = '#ff5a4a';
  ctx.fillRect(-CAR.length / 2, -CAR.width / 2 + 3, 3, 5);
  ctx.fillRect(-CAR.length / 2, CAR.width / 2 - 8, 3, 5);
  if (o.police) {
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(-4, -CAR.width / 2, 8, CAR.width);
    ctx.fillStyle = '#1c1c22';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('APD', 0, 3);
    const blink = Math.sin(o.lightPhase || 0) > 0;
    ctx.fillStyle = blink ? '#ff2e2e' : '#2e6bff';
    ctx.beginPath(); ctx.arc(-2, -CAR.width / 2 - 1, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = blink ? '#2e6bff' : '#ff2e2e';
    ctx.beginPath(); ctx.arc(4, -CAR.width / 2 - 1, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (o.label) {
    // Label in world space (unrotated) so it stays readable at any heading.
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(o.label, x, y - CAR.width / 2 - 8);
  }
}

function drawPlane(ctx, pl) {
  ctx.save();
  ctx.translate(pl.x, pl.y);
  ctx.rotate(pl.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(8, 8, pl.len / 2, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = pl.color;
  ctx.beginPath(); ctx.ellipse(0, 0, pl.len / 2, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-pl.len * 0.1, -44, 22, 88); // wings
  ctx.fillRect(pl.len * 0.28, -20, 10, 40); // tailplane
  ctx.fillStyle = pl.tail;
  ctx.fillRect(-pl.len / 2, -14, 12, 28); // tail fin
  ctx.fillStyle = '#2a3542';
  ctx.beginPath(); ctx.ellipse(pl.len * 0.32, 0, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPed(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(3, 3, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.color;
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8c39a';
  ctx.beginPath(); ctx.arc(3, 0, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPlayerShape(ctx, player, time) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(4, 5, 13, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(player.angle);
  // Dawn jacket: amber with a dark stripe.
  ctx.fillStyle = '#e8862e';
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#20242e';
  ctx.fillRect(-4, -13, 8, 26);
  ctx.fillStyle = '#e8c39a';
  ctx.beginPath(); ctx.arc(9, 0, 6, 0, Math.PI * 2); ctx.fill();
  if (player.punchT > 0) {
    ctx.fillStyle = '#e8c39a';
    ctx.beginPath(); ctx.arc(20, 0, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // Interaction hint ring.
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.arc(player.x, player.y, 22 + Math.sin(time * 3) * 2, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
}

export function drawWorld(r, state, time) {
  const { ctx, canvas } = r;
  const cam = state.camera;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Dawn sky tint at the world edges: warm gradient framing the map.
  const sky = ctx.createLinearGradient(0, 0, W, H);
  sky.addColorStop(0, '#ff9a3c');
  sky.addColorStop(0.5, '#e87a5a');
  sky.addColorStop(1, '#7a5a8a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(W / 2 - cam.x, H / 2 - cam.y);

  // Grass base with mow stripes.
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.fillStyle = PALETTE.grassDry;
  for (let y = 0; y < WORLD_H; y += 160) {
    if ((y / 160) % 2 === 0) ctx.fillRect(0, y, WORLD_W, 80);
  }

  // Paved areas.
  for (const p of PAVED) {
    ctx.fillStyle = p.kind === 'runway' ? PALETTE.runway : p.kind === 'taxiway' ? PALETTE.taxiway : p.kind === 'apron' ? PALETTE.concrete : p.kind === 'carpark' ? '#4a4d52' : '#55504a';
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }

  // Runway markings: centreline dashes and threshold bars.
  ctx.fillStyle = PALETTE.runwayLine;
  for (let x = 260; x < 3380; x += 120) ctx.fillRect(x, 476, 60, 8);
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(220 + i * 18, 420, 10, 40);
    ctx.fillRect(220 + i * 18, 500, 10, 40);
    ctx.fillRect(3300 + i * 18, 420, 10, 40);
    ctx.fillRect(3300 + i * 18, 500, 10, 40);
  }
  // Taxiway centreline.
  ctx.fillStyle = '#e8d44d';
  for (let x = 260; x < 3380; x += 90) ctx.fillRect(x, 671, 45, 5);

  // Car park bay lines.
  ctx.strokeStyle = PALETTE.parkingLine;
  ctx.lineWidth = 2;
  for (let x = 2280; x <= 3120; x += 120) {
    ctx.beginPath(); ctx.moveTo(x, 1330); ctx.lineTo(x, 1440); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, 1560); ctx.lineTo(x, 1680); ctx.stroke();
  }

  // Roads: perimeter ring + access road.
  ctx.strokeStyle = PALETTE.road;
  ctx.lineWidth = 26;
  ctx.lineJoin = 'round';
  const ring = [{ x: 120, y: 120 }, { x: 3480, y: 120 }, { x: 3480, y: 2480 }, { x: 120, y: 2480 }, { x: 120, y: 120 }];
  ctx.beginPath();
  ring.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1800, 2480); ctx.lineTo(1800, 1150); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1800, 1500); ctx.lineTo(2250, 1500); ctx.stroke();
  ctx.strokeStyle = PALETTE.roadLine;
  ctx.lineWidth = 2;
  ctx.setLineDash([18, 18]);
  ctx.beginPath();
  ring.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.setLineDash([]);

  // Props: runway edge lights (amber glow), windsocks, poles, trees.
  for (const prop of state.props) {
    if (prop.kind === 'runway-light') {
      ctx.fillStyle = '#ffb13c';
      ctx.beginPath(); ctx.arc(prop.x, prop.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,177,60,0.25)';
      ctx.beginPath(); ctx.arc(prop.x, prop.y, 11, 0, Math.PI * 2); ctx.fill();
    } else if (prop.kind === 'windsock') {
      ctx.strokeStyle = '#c8c8c8';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(prop.x, prop.y); ctx.lineTo(prop.x, prop.y - 34); ctx.stroke();
      ctx.fillStyle = '#ff7a3c';
      ctx.beginPath(); ctx.moveTo(prop.x, prop.y - 34); ctx.lineTo(prop.x + 22, prop.y - 28); ctx.lineTo(prop.x, prop.y - 22); ctx.closePath(); ctx.fill();
    } else if (prop.kind === 'pole') {
      ctx.fillStyle = '#3a3d42';
      ctx.fillRect(prop.x - 2, prop.y - 2, 4, 4);
      ctx.fillStyle = 'rgba(255,220,140,0.5)';
      ctx.beginPath(); ctx.arc(prop.x, prop.y, 6, 0, Math.PI * 2); ctx.fill();
    } else if (prop.kind === 'tree') {
      ctx.fillStyle = '#3f5a2e';
      ctx.beginPath(); ctx.arc(prop.x, prop.y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#557a38';
      ctx.beginPath(); ctx.arc(prop.x - 4, prop.y - 4, 8, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Buildings.
  for (const s of SOLIDS) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    rr(ctx, s.x + 10, s.y + 12, s.w, s.h, 6); ctx.fill();
    ctx.fillStyle = s.kind === 'terminal' ? PALETTE.terminalRoof : s.kind === 'hangar' ? PALETTE.hangarRoof : s.kind === 'city' ? '#7d5a4a' : PALETTE.buildingRoof;
    rr(ctx, s.x, s.y, s.w, s.h, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    rr(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 12, 4); ctx.stroke();
    if (s.kind === 'hangar') {
      ctx.fillStyle = '#2e3136';
      ctx.fillRect(s.x + 20, s.y + s.h - 34, s.w - 40, 26);
      ctx.fillStyle = '#c8c8b8';
      for (let i = 0; i < 5; i++) ctx.fillRect(s.x + 34 + i * 52, s.y + s.h - 30, 6, 18);
    }
    if (s.kind === 'terminal') {
      ctx.fillStyle = '#3f5a6e';
      for (let i = 0; i < 8; i++) ctx.fillRect(s.x + 30 + i * 72, s.y + 16, 44, 26);
      ctx.fillStyle = '#e8e8e8';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DAWNFIELD TERMINAL', s.x + s.w / 2, s.y + s.h / 2 + 10);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.label, s.x + s.w / 2, s.y + s.h - 44);
  }

  // Circles: tower, tanks, radar.
  for (const c of CIRCLES) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.arc(c.x + 8, c.y + 10, c.r, 0, Math.PI * 2); ctx.fill();
    if (c.kind === 'tower') {
      ctx.fillStyle = '#8a8d90';
      ctx.fillRect(c.x - 14, c.y - 10, 28, 40);
      ctx.fillStyle = PALETTE.towerGlass;
      ctx.beginPath(); ctx.arc(c.x, c.y - 22, c.r - 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#20242e';
      ctx.beginPath(); ctx.arc(c.x, c.y - 22, c.r - 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff5a4a';
      ctx.beginPath(); ctx.arc(c.x, c.y - 22 - c.r + 2, 5, 0, Math.PI * 2); ctx.fill();
    } else if (c.kind === 'tank') {
      ctx.fillStyle = '#c8c8c8';
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9a9a9a';
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r - 10, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#e8e8e8';
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a8d90';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r - 8, -0.6, 2.2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.label, c.x, c.y + c.r + 16);
  }

  // Gates.
  for (const g of GATES) {
    ctx.strokeStyle = '#ffcf3c';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffcf3c';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.label, g.x, g.y - g.r - 8);
  }

  // Mission marker: pulsing diamond + beam.
  const step = currentStep(state.missions);
  if (step && state.phase === 'play') {
    const pulse = 1 + Math.sin(time * 4) * 0.12;
    ctx.save();
    ctx.translate(step.x, step.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(255,207,60,0.18)';
    ctx.beginPath(); ctx.arc(0, 0, step.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffcf3c';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, step.r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffcf3c';
    ctx.beginPath();
    ctx.moveTo(0, -26); ctx.lineTo(18, 0); ctx.lineTo(0, 26); ctx.lineTo(-18, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // Direction arrow at screen edge is drawn in HUD space below.
  }

  // Planes, cars, pedestrians, police, player.
  for (const pl of state.traffic.planes) drawPlane(ctx, pl);
  for (const c of state.traffic.cars) {
    if (state.player.inCar === c) continue;
    const model = CAR_MODELS[c.model];
    drawCarShape(ctx, c.x, c.y, c.angle, c.color, { label: c.mission ? '★ CART' : (c.parked ? '' : '') });
    if (c.parked && !c.stolen) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(model.name, c.x, c.y - 24);
    }
  }
  for (const p of state.traffic.peds) drawPed(ctx, p);
  for (const c of state.police.cruisers) {
    drawCarShape(ctx, c.x, c.y, c.angle, c.color, { police: true, lightPhase: c.lightPhase });
  }
  if (state.player.inCar) {
    const car = state.player.inCar;
    drawCarShape(ctx, car.x, car.y, car.angle, car.color, { label: CAR_MODELS[car.model].name });
    // Player marker above the driven car.
    ctx.fillStyle = '#ffcf3c';
    ctx.beginPath();
    ctx.moveTo(car.x, car.y - 40);
    ctx.lineTo(car.x - 8, car.y - 54);
    ctx.lineTo(car.x + 8, car.y - 54);
    ctx.closePath(); ctx.fill();
  } else {
    drawPlayerShape(ctx, state.player, time);
  }

  ctx.restore();
}

export function drawHUD(r, state, time) {
  const { ctx, canvas } = r;
  const W = canvas.width;
  const H = canvas.height;
  const player = state.player;

  // Top-left: cash, health, wanted stars.
  ctx.fillStyle = 'rgba(10,14,20,0.72)';
  rr(ctx, 14, 12, 300, 96, 10); ctx.fill();
  ctx.fillStyle = '#7ee787';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`$${player.cash.toLocaleString()}`, 28, 44);
  ctx.fillStyle = '#e8e8e8';
  ctx.font = '13px sans-serif';
  ctx.fillText('CASH', 28, 62);
  // Health bar.
  ctx.fillStyle = '#3a3d42';
  rr(ctx, 28, 70, 150, 12, 6); ctx.fill();
  ctx.fillStyle = player.health > 40 ? '#7ee787' : '#ff5a4a';
  rr(ctx, 28, 70, Math.max(0, 150 * player.health / 100), 12, 6); ctx.fill();
  ctx.fillStyle = '#e8e8e8';
  ctx.font = '11px sans-serif';
  ctx.fillText('HEALTH', 186, 81);
  // Wanted stars.
  ctx.font = '26px sans-serif';
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < state.police.wanted ? '#ffcf3c' : 'rgba(255,255,255,0.25)';
    ctx.fillText('★', 28 + i * 30, 104 - 4 + 4);
  }

  // Top-centre: objective banner.
  const obj = objectiveText(state.missions);
  ctx.font = 'bold 15px sans-serif';
  const objW = Math.min(640, ctx.measureText(obj).width + 36);
  ctx.fillStyle = 'rgba(10,14,20,0.72)';
  rr(ctx, W / 2 - objW / 2, 12, objW, 40, 10); ctx.fill();
  ctx.fillStyle = '#ffcf3c';
  ctx.textAlign = 'center';
  ctx.fillText(obj, W / 2, 38);

  // Mission banner toast.
  if (state.missions.bannerT > 0) {
    ctx.globalAlpha = Math.min(1, state.missions.bannerT);
    ctx.fillStyle = 'rgba(20,26,34,0.85)';
    ctx.font = 'bold 17px sans-serif';
    const bw = ctx.measureText(state.missions.banner).width + 40;
    rr(ctx, W / 2 - bw / 2, 60, bw, 36, 10); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(state.missions.banner, W / 2, 84);
    ctx.globalAlpha = 1;
  }

  // Minimap (top-right): whole airport scaled down.
  const mw = 230;
  const mh = 166;
  const mx = W - mw - 14;
  const my = 12;
  const sx = mw / WORLD_W;
  const sy = mh / WORLD_H;
  ctx.fillStyle = 'rgba(10,14,20,0.78)';
  rr(ctx, mx - 6, my - 6, mw + 12, mh + 12, 10); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip();
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(mx, my, mw, mh);
  ctx.fillStyle = PALETTE.runway;
  ctx.fillRect(mx + 180 * sx, my + 400 * sy, 3240 * sx, 160 * sy);
  ctx.fillStyle = PALETTE.terminalRoof;
  ctx.fillRect(mx + 1500 * sx, my + 800 * sy, 620 * sx, 300 * sy);
  ctx.fillStyle = PALETTE.hangarRoof;
  for (let i = 0; i < 3; i++) ctx.fillRect(mx + 300 * sx, my + (950 + i * 290) * sy, 320 * sx, 220 * sy);
  ctx.fillStyle = '#ffcf3c';
  ctx.beginPath(); ctx.arc(mx + 1800 * sx, my + 280 * sy, 5, 0, Math.PI * 2); ctx.fill();
  const step = currentStep(state.missions);
  if (step) {
    ctx.fillStyle = '#ffcf3c';
    ctx.beginPath(); ctx.arc(mx + step.x * sx, my + step.y * sy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffcf3c';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mx + step.x * sx, my + step.y * sy, 10 + Math.sin(time * 4) * 3, 0, Math.PI * 2); ctx.stroke();
  }
  for (const c of state.police.cruisers) {
    ctx.fillStyle = '#ff2e2e';
    ctx.beginPath(); ctx.arc(mx + c.x * sx, my + c.y * sy, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(mx + player.x * sx, my + player.y * sy, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(mx, my, mw, mh);
  ctx.restore();
  ctx.fillStyle = '#e8e8e8';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DAWNFIELD — MINIMAP', mx + mw / 2, my + mh + 20);

  // Bottom-right: speed + controls hint.
  if (player.inCar) {
    ctx.fillStyle = 'rgba(10,14,20,0.72)';
    rr(ctx, W - 190, H - 64, 176, 50, 10); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(Math.abs(player.speed) * 0.12)} mph`, W - 28, H - 30);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#c8c8c8';
    ctx.fillText(CAR_MODELS[player.inCar.model].name, W - 28, H - 16);
  } else {
    ctx.fillStyle = 'rgba(10,14,20,0.72)';
    rr(ctx, W - 330, H - 64, 316, 50, 10); ctx.fill();
    ctx.fillStyle = '#e8e8e8';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('WASD move · SHIFT run · E steal car · SPACE punch', W - 28, H - 32);
  }

  // Off-screen objective arrow.
  if (step && state.phase === 'play') {
    const dx = step.x - player.x;
    const dy = step.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 420) {
      const ang = Math.atan2(dy, dx);
      const ax = W / 2 + Math.cos(ang) * 220;
      const ay = H / 2 + Math.sin(ang) * 160;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(ang);
      ctx.fillStyle = '#ffcf3c';
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -10); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#ffcf3c';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(dist)}m`, ax, ay + 26);
    }
  }

  // Busted overlay.
  if (player.busted) {
    ctx.fillStyle = 'rgba(10,10,16,0.78)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff5a4a';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUSTED', W / 2, H / 2 - 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px sans-serif';
    ctx.fillText('The airport police caught up with you. Back on your feet in a moment…', W / 2, H / 2 + 20);
  }

  // Story-complete overlay.
  if (state.missions.done && state.phase === 'play') {
    ctx.fillStyle = 'rgba(10,14,20,0.55)';
    ctx.fillRect(0, H - 110, W, 110);
    ctx.fillStyle = '#ffcf3c';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ DAWN HEIST COMPLETE ★', W / 2, H - 66);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('All three jobs done. Dawnfield is yours — free roam, keep the cash coming.', W / 2, H - 34);
  }
}

export function drawMenu(r, state, hasSave) {
  const { ctx, canvas } = r;
  const W = canvas.width;
  const H = canvas.height;

  // Dawn gradient backdrop with a low sun.
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2a2140');
  g.addColorStop(0.45, '#c65a4a');
  g.addColorStop(0.75, '#ff9a3c');
  g.addColorStop(1, '#ffd28a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff3c8';
  ctx.beginPath(); ctx.arc(W * 0.85, H * 0.20, 64, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,243,200,0.35)';
  ctx.beginPath(); ctx.arc(W * 0.85, H * 0.20, 110, 0, Math.PI * 2); ctx.fill();

  // Runway silhouette at the bottom.
  ctx.fillStyle = '#2e3136';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.82); ctx.lineTo(W, H * 0.72); ctx.lineTo(W, H); ctx.lineTo(0, H);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8d44d';
  for (let i = 0; i < 12; i++) ctx.fillRect(60 + i * 110, H * 0.78 - i * 4, 52, 6);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 84px sans-serif';
  ctx.fillText(GAME_TITLE, W / 2, H * 0.34);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '20px sans-serif';
  ctx.fillText(GAME_SUBTITLE, W / 2, H * 0.34 + 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Steal cars · dodge the airport police · pull off three dawn heists', W / 2, H * 0.34 + 66);

  const btnW = 300;
  const btnH = 52;
  const bx = W / 2 - btnW / 2;
  const by = H * 0.55;
  ctx.fillStyle = '#ffcf3c';
  rr(ctx, bx, by, btnW, btnH, 10); ctx.fill();
  ctx.fillStyle = '#20242e';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(hasSave ? 'CONTINUE  ▶' : 'START  ▶', W / 2, by + 34);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '15px sans-serif';
  ctx.fillText('WASD move/drive · E steal or exit car · SPACE punch · M mute · P pause', W / 2, by + 92);
  ctx.fillText('Three missions: Baggage Run → Hangar Heist → Tower Run. Save: automatic.', W / 2, by + 118);

  state.menuButton = { x: bx, y: by, w: btnW, h: btnH };
}
