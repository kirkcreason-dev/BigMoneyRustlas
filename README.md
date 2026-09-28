# Big Money Rustlas — The First Official Video Game

An eight-chapter illustrated Western action platformer. Play Sugar Wolf, reclaim Mud Bug, learn the pimp hand, and confront Big Baby Chips.

## Play and build

Requires Node.js 20 or newer for development. No package dependencies or install step.

- `npm start` opens a local server at http://localhost:4173 (open that address in your browser).
- `npm run check` checks syntax and runs the game tests.
- `npm run build` creates `dist/`, ready for static hosting, plus `dist/BigMoneyRustlas.html`, a self-contained edition with embedded art and music synthesis.

Publish the contents of `dist/` for the web edition. The single HTML edition is designed to open directly in a browser. Browsers may handle save persistence differently for local files; the hosted edition has a stable save origin.

## The game

- Eight authored chapters, optional elevated routes, three lost badges in each chapter, and checkpoint wells.
- Four boss fights with attack warnings and recovery windows. Chips has a second gold phase.
- Six-shot revolver, automatic reloads, dodge rolls, variable-height jumping, elastic slaps with matching long-range hits, projectile returns, and a eight-pose pimp-hand atlas plus three supernatural extension/recoil poses.
- 24 persistent discoveries with original dialogue, film callbacks, a Hack Benjamin cameo, and a completion reward.
- Six permanent upgrades bought using earned gold. Three difficulty settings. Chapter replay, records, journal, save/continue, pause, and credits.
- New illustrated sprites, eight terrain pieces, original environments, and original procedural music and effects.
- Keyboard, touch controls, and standard gamepad mappings. Reduced screen effects and separate sound/music settings.

The campaign adapts the film into an arcade route. Boss attack patterns, platform routes, side encounters, jokes, and many props are original game inventions. It is not a scene-by-scene recreation.

## Controls

| Action | Keyboard | Standard controller |
|---|---|---|
| Move | A/D or arrows | Left stick / D-pad |
| Jump (hold for height) | Space / W / Up | A |
| Shoot | J / X | X / RT |
| Pimp hand / return projectiles | K / C | Y |
| Reload | R | LB |
| Dodge | Shift | B |
| Inspect | E | LT |
| Bow / drop through platforms | S / Down | D-pad down |
| Pause | Esc / P | Start |

Touch buttons appear automatically on touch devices, or can be enabled in Settings. Landscape gives more room to play.

## Project layout

`src/core.js` contains browser-independent gameplay; `src/secrets.js` contains discoveries; `src/assets.js` defines sprite frames and visual assets. `game.js` handles rendering, menus, audio, input, and saves. `art/` contains the new PNG assets. `scripts/build.mjs` exports only the current game's allowlisted files.

The inherited `img/` and `audio/` directories are retained as source history and are **not loaded or included in the export**. Do not use those directories as the release asset list.

## Validation

Twelve automated tests cover an input-only playthrough of all eight chapters with earned upgrades, platform and gap reachability, all 24 secrets, ammunition/reload, parrying, elastic reach and one-hit-per-swing timing, collision, boss patterns, death/checkpoint recovery, save validation, rewards, and purchases. Browser review covers the illustrated title/story screens, gameplay and controls, pause/settings, clean sprite boundaries, and portrait/landscape layouts. Physical controller and real phone testing remain outstanding.

## Art and authorization

See `docs/ART_AND_RIGHTS.md` for the asset manifest, generation directions, user-confirmed scope, and film research notes. No third-party recording, lyric, guest-performer portrait, or band logo is included in the release.
