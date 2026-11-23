// Runway Dawn — shared constants: world size, dawn palette, vehicles, missions.
// Every value here is original to this game. The airport is fictional: Dawnfield
// International, a small dawn-lit airfield on the edge of a coastal city.

export const WORLD_W = 3600;
export const WORLD_H = 2600;

// Dawn palette: warm low sun, cool tarmac shadows, amber runway lights.
export const PALETTE = {
  grass: '#5d7a44',
  grassDry: '#7a8a4a',
  tarmac: '#3a3d42',
  tarmacDark: '#2e3136',
  runway: '#33363b',
  runwayLine: '#e8d44d',
  taxiway: '#41454c',
  concrete: '#8a8d90',
  buildingRoof: '#6b5a49',
  hangarRoof: '#7d7468',
  terminalRoof: '#5f6f7d',
  towerGlass: '#9fd8e8',
  road: '#2f3237',
  roadLine: '#d8d8c8',
  parkingLine: '#c8c8b8',
  water: '#3f6d8a',
  sunGlow: '#ff9a3c',
  dawnSky: '#ffb36b',
};

export const PLAYER = {
  walkSpeed: 230,
  runSpeed: 330,
  radius: 14,
  health: 100,
};

export const CAR = {
  length: 54,
  width: 26,
  maxSpeed: 560,
  accel: 420,
  brake: 700,
  reverseMax: 180,
  grip: 2.6,
};

// Vehicle roster: name, colour, top-speed multiplier, handling. All fictional makes.
export const CAR_MODELS = [
  { name: 'Comet Sedan', color: '#c0392b', speed: 1.0, grip: 1.0 },
  { name: 'Harbor Taxi', color: '#e8c832', speed: 0.92, grip: 1.05 },
  { name: 'Dune Pickup', color: '#3f6fb5', speed: 0.98, grip: 0.95 },
  { name: 'Baggage Cart', color: '#e8e8e8', speed: 0.55, grip: 1.2 },
  { name: 'Fuel Truck', color: '#d86a1e', speed: 0.7, grip: 0.8 },
  { name: 'Courier Van', color: '#7a4a9e', speed: 0.85, grip: 0.9 },
  { name: 'Interceptor', color: '#1c1c22', speed: 1.15, grip: 1.15 },
];

export const POLICE_COLOR = '#20242e';
export const POLICE_LIGHT_A = '#ff2e2e';
export const POLICE_LIGHT_B = '#2e6bff';

// The three-mission story arc: a rookie ramp rat climbs from baggage theft to a
// tower-top escape. Each mission is one objective chain; rewards are cash.
export const MISSIONS = [
  {
    id: 'baggage-run',
    title: 'MISSION 1 — BAGGAGE RUN',
    brief: 'Steal a baggage cart from the terminal apron and drive it to Hangar 3. No witnesses, no sirens.',
    steps: [
      { text: 'Get to the baggage cart by the terminal', x: 1560, y: 1240, r: 90, needCar: false },
      { text: 'Drive the cart to Hangar 3 (west side)', x: 620, y: 1180, r: 110, needCar: true },
    ],
    reward: 400,
  },
  {
    id: 'hangar-heist',
    title: 'MISSION 2 — HANGAR HEIST',
    brief: 'A crate of "lost" cargo sits in Hangar 2. Grab it on foot, then run for the runway gate.',
    steps: [
      { text: 'Slip into Hangar 2 and grab the cargo crate', x: 620, y: 1420, r: 80, needCar: false },
      { text: 'Escape to the runway east gate', x: 3300, y: 480, r: 110, needCar: false },
    ],
    reward: 900,
  },
  {
    id: 'tower-run',
    title: 'MISSION 3 — TOWER RUN',
    brief: 'The tower crew saw everything. Reach the control tower, snatch the logbook, then vanish through the south gate.',
    steps: [
      { text: 'Reach the control tower', x: 1800, y: 280, r: 100, needCar: false },
      { text: 'Escape through the south perimeter gate', x: 1800, y: 2480, r: 120, needCar: false },
    ],
    reward: 1800,
  },
];

export const WANTED_DECAY_SECONDS = 22;
export const POLICE_MAX = 6;
export const SAVE_KEY = 'runway-dawn-save-v1';
export const GAME_TITLE = 'RUNWAY DAWN';
export const GAME_SUBTITLE = 'A dawn airport open-world crime game — Dawnfield International';
