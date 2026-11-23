// Runway Dawn — the mission chain. Three jobs, each two steps: go to a
// marker, then go to the next one. Completing a mission pays cash and opens
// the next; finishing all three ends the story with a "DAWN HEIST COMPLETE"
// screen and a fat bonus. The state machine is deliberately small so the
// HUD can always show exactly one current objective.

import { MISSIONS } from './config.js';

export function createMissions() {
  return {
    index: 0,          // which mission of MISSIONS is active
    step: 0,           // which step of the mission
    done: false,       // whole arc complete
    banner: '',        // short toast shown on step change
    bannerT: 0,
    justPaid: 0,
  };
}

export function currentMission(m) {
  if (m.done || m.index >= MISSIONS.length) return null;
  return MISSIONS[m.index];
}

export function currentStep(m) {
  const mission = currentMission(m);
  if (!mission) return null;
  return mission.steps[m.step];
}

export function objectiveText(m) {
  const step = currentStep(m);
  if (!step) return 'All jobs done — enjoy Dawnfield.';
  const mission = currentMission(m);
  return `${mission.title}: ${step.text}`;
}

function setBanner(m, text) {
  m.banner = text;
  m.bannerT = 4;
}

// Called every frame: checks whether the player reached the current marker.
export function updateMissions(m, player, audio) {
  const step = currentStep(m);
  if (!step) return;
  const d = Math.hypot(player.x - step.x, player.y - step.y);
  const inCar = !!player.inCar;
  if (d < step.r && (!step.needCar || inCar)) {
    const mission = currentMission(m);
    // Step 1 of the baggage run only counts once the player is in the cart.
    if (mission.id === 'baggage-run' && m.step === 0 && !inCar) {
      setBanner(m, 'Get in the baggage cart first — press E');
      return;
    }
    m.step += 1;
    audio.pickup();
    if (m.step >= mission.steps.length) {
      m.justPaid = mission.reward;
      player.cash += mission.reward;
      audio.cash();
      m.index += 1;
      m.step = 0;
      if (m.index >= MISSIONS.length) {
        m.done = true;
        player.cash += 1200;
        setBanner(m, 'DAWN HEIST COMPLETE! +$1200 bonus');
      } else {
        setBanner(m, `Job done! +$${mission.reward} — next: ${MISSIONS[m.index].title}`);
      }
    } else {
      setBanner(m, 'Objective updated');
    }
  }
  if (m.bannerT > 0) m.bannerT -= 1 / 60;
}

// Serialisable progress for the save file.
export function missionSave(m) {
  return { index: m.index, done: m.done };
}

export function missionLoad(m, save) {
  if (!save) return;
  m.index = Math.min(save.index || 0, MISSIONS.length);
  m.done = !!save.done;
  m.step = 0;
}
