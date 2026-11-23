// Runway Dawn — entrypoint for make.fun gta6-01 (Node 22, standard library
// only). The game itself is plain static files under game/ (game/index.html
// plus its ES modules, no libraries, no network requests). This program hands
// the entry in: it copies game/ and screenshots/ from beside this file into
// the output directory and writes output/dossier.json with the vendored
// make.fun library, so the sealed scorer can check the game and the judge
// can read its dossier.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's caps from the competition's reference data: the dossier text
// is capped at 160 KiB, at most 4 screenshots of 256 KiB each, game/ holds
// at most 993 files and 48 MiB in all, and no path under game/ is over
// 1000 bytes. Enforcing the same limits here means a local run that writes
// a dossier is one the scorer will accept on those rows.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
