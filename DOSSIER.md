# Runway Dawn — Dossier

An open-world crime game set at Dawnfield International, a fictional airport
at dawn. The player explores on foot and by car, steals vehicles, dodges the
airport police under a 5-star wanted system, and works through a three-mission
story arc (Baggage Run → Hangar Heist → Tower Run). The HUD shows cash,
health, wanted stars, a minimap of the whole airport, the current objective,
and speed. Sound is synthesized with the Web Audio API; there are no audio,
image or font files and no network requests. Progress autosaves to
localStorage.

## Screenshots (all real renders of the game's own code, 1280×720)

- `1-cover.jpg` — the cover. The player drives the black Interceptor at
  58 mph along the runway, chased by two airport-police cruisers with
  flashing red/blue lights. The HUD shows $1,300 cash, a full health bar,
  three wanted stars, the objective "MISSION 2 — HANGAR HEIST: Escape to
  the runway east gate", a minimap of Dawnfield in the top right, and a
  1300 m objective arrow. A white airliner taxis on the taxiway below and
  the control tower stands north of the runway.
- `2-heist.jpg` — on foot at Hangar 2. The player (amber jacket, dashed
  ring) stands at the hangar door next to the yellow mission marker for
  "Slip into Hangar 2 and grab the cargo crate". One police cruiser is
  approaching from the east. The HUD shows $400, one wanted star, the
  minimap, and the on-foot controls hint.
- `3-tower.jpg` — the player sits in the white baggage cart on the runway
  below the control tower, with the yellow mission marker on the tower and
  the objective "MISSION 3 — TOWER RUN: Reach the control tower". The HUD
  shows $2,200, zero wanted stars, the minimap, and 0 mph.
- `4-menu.jpg` — the start screen: the title RUNWAY DAWN over a dawn
  gradient with a low sun and a runway silhouette, the START button, the
  controls (WASD move/drive, E steal or exit car, SPACE punch, M mute,
  P pause), and the three-mission list.

## Controls

- WASD / arrows: move on foot, drive when in a car; SHIFT: run
- E: steal the nearest parked car / get out of a car
- SPACE: punch (hitting a pedestrian raises the wanted level)
- M: mute, P / Esc: pause

## Systems

- Open world: runway, taxiway, terminal, three hangars, control tower,
  car park, fuel depot, perimeter road ring, city blocks, taxiing planes,
  civilian traffic on road loops, wandering pedestrians who flee cars
- Wanted system: stealing, punching or running over pedestrians raises
  stars (0–5); police cruisers spawn at the map edge and chase/ram; heat
  cools after a clean stretch; being busted costs $150 and respawns the
  player at the terminal
- Missions: three two-step jobs with cash rewards ($400 / $900 / $1,800)
  plus a $1,200 completion bonus; objective marker, off-screen arrow and
  minimap blip always point at the current step
- Vehicles: seven fictional models (sedan, taxi, pickup, baggage cart,
  fuel truck, van, Interceptor) with different speed and handling
- Save: cash and mission progress autosave every 10 seconds and load on
  the start screen's CONTINUE button

## Files

- `game/index.html` — page shell, canvas, module entry point
- `game/src/config.js` — world size, dawn palette, vehicle roster, missions
- `game/src/input.js` — keyboard and mouse state
- `game/src/audio.js` — procedural Web Audio effects (engine, siren, crash)
- `game/src/world.js` — airport map: solids, paved areas, roads, gates, props
- `game/src/traffic.js` — civilian cars, pedestrians, taxiing planes
- `game/src/police.js` — wanted level and cruiser AI
- `game/src/missions.js` — three-mission story state machine
- `game/src/player.js` — on-foot movement, stealing, driving physics, punch
- `game/src/render.js` — world drawing, HUD, minimap, menus
- `game/src/shots.js` — deterministic `?shot=` staging for screenshots
- `game/src/main.js` — loop, phases, camera, autosave
- `main.ts` — entrypoint: copies game/ + screenshots/ and writes dossier.json
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
