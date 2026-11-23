// Runway Dawn — game loop and state machine. Phases: menu -> play -> paused.
// The loop clamps delta time, updates player / traffic / police / missions,
// follows the player with the camera, autosaves progress, and renders the
// world + HUD. A ?shot= query (see shots.js) stages deterministic scenes
// for screenshots without changing how the game plays.

import { SAVE_KEY } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { buildProps, PLAYER_START } from './world.js';
import { createTraffic, updateTraffic } from './traffic.js';
import { createPolice, updatePolice } from './police.js';
import { createMissions, updateMissions, missionSave, missionLoad } from './missions.js';
import { createPlayer, updatePlayer } from './player.js';
import { createRenderer, drawWorld, drawHUD, drawMenu } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const input = createInput(canvas);
const audio = createAudio();
const renderer = createRenderer(canvas);

function fitCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const state = {
  phase: 'menu', // menu | play | paused
  time: 0,
  camera: { x: PLAYER_START.x, y: PLAYER_START.y },
  player: createPlayer(),
  traffic: createTraffic(),
  police: createPolice(),
  missions: createMissions(),
  props: buildProps(),
  menuButton: null,
  saveTimer: 0,
  hasSave: false,
};

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    state.player.cash = s.cash || 0;
    missionLoad(state.missions, s.missions);
    state.hasSave = true;
    return true;
  } catch (_e) {
    return false;
  }
}

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      cash: state.player.cash,
      missions: missionSave(state.missions),
    }));
  } catch (_e) { /* private mode: saving is best-effort */ }
}

function startGame() {
  state.phase = 'play';
  audio.unlock();
  if (statusEl) statusEl.textContent = 'Playing Runway Dawn. Objective: ' + state.missions.banner;
}

// Busted recovery: respawn on foot near the terminal with a fine.
function recoverFromBusted() {
  const p = state.player;
  p.busted = false;
  p.health = 60;
  p.cash = Math.max(0, p.cash - 150);
  p.x = 2100;
  p.y = 1150;
  p.angle = -Math.PI / 2;
  state.police.wanted = 0;
  state.police.cruisers = [];
  state.camera.x = p.x;
  state.camera.y = p.y;
}

loadSave();
const shotName = new URLSearchParams(window.location.search).get('shot');
if (shotName) {
  applyShot(shotName, state);
  // Staged screenshots freeze the simulation: the composed scene is drawn
  // exactly as staged, with no police shove or mission trigger moving it.
  state.frozen = shotName !== 'menu';
  if (shotName !== 'menu') startGame();
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;
  state.time += dt;

  if (state.phase === 'menu') {
    if (input.mouse.clicked && state.menuButton) {
      const b = state.menuButton;
      const m = input.mouse;
      if (m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h) startGame();
    }
    if (input.wasPressed('enter') || input.wasPressed('space')) startGame();
    drawMenu(renderer, state, state.hasSave);
  } else if (state.phase === 'play') {
    if (input.wasPressed('p') || input.wasPressed('escape')) {
      state.phase = 'paused';
    } else if (input.wasPressed('m')) {
      audio.toggleMute();
    } else {
      if (!state.frozen) {
        updatePlayer(state.player, input, dt, state.traffic, state.police, audio);
        if (state.player.busted && state.player.bustedT <= 0) recoverFromBusted();
        updateTraffic(state.traffic, dt, state.player, Math.abs(state.player.speed || 0));
        updatePolice(state.police, dt, state.player, audio);
        updateMissions(state.missions, state.player, audio);

        // Camera follows the player smoothly.
        const p = state.player;
        state.camera.x += (p.x - state.camera.x) * Math.min(1, 5 * dt);
        state.camera.y += (p.y - state.camera.y) * Math.min(1, 5 * dt);

        // Autosave every 10 seconds of play.
        state.saveTimer += dt;
        if (state.saveTimer > 10) {
          state.saveTimer = 0;
          saveGame();
        }
      }

      drawWorld(renderer, state, state.time);
      drawHUD(renderer, state, state.time);
    }
  } else if (state.phase === 'paused') {
    drawWorld(renderer, state, state.time);
    drawHUD(renderer, state, state.time);
    const ctx = renderer.ctx;
    ctx.fillStyle = 'rgba(10,14,20,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    ctx.font = '16px sans-serif';
    ctx.fillText('Press P to resume · M to mute', canvas.width / 2, canvas.height / 2 + 36);
    if (input.wasPressed('p') || input.wasPressed('escape')) state.phase = 'play';
  }

  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
