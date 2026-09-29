# Big Money Rustlas — The First Official Video Game

An eight-chapter illustrated Western action platformer. Play Sugar Wolf, reclaim Mud Bug, learn the pimp hand, and confront Big Baby Chips.

## Play and build

Requires Node.js 20 or newer for development. No package dependencies or install step.

- `npm start` opens a local server at http://localhost:4173 (open that address in your browser).
- `npm run check` checks syntax and runs the game tests.
- `npm run build` creates `dist/`, ready for static hosting, plus `dist/BigMoneyRustlas.html`, a self-contained edition with embedded art, fonts, and audio.

Publish the contents of `dist/` for the web edition. The single HTML edition is designed to open directly in a browser. Browsers may handle save persistence differently for local files; the hosted edition has a stable save origin.

## The game

- CREASO·NORSE studio intro, supplied logo on loading/title/credits screens, keyboard/touch skip and replay.

- Eight authored chapters, optional elevated routes, three lost badges in each chapter, and checkpoint wells.
- Four boss fights with attack warnings and recovery windows. Chips has a second, enraged phase.
- Six-shot revolver, automatic reloads, dodge rolls, variable-height jumping, elastic slaps with matching long-range hits, projectile returns, and an eight-pose pimp-hand atlas plus three supernatural extension/recoil poses.
- 24 persistent discoveries with original dialogue, film callbacks, a Hack Benjamin cameo, and a completion reward.
- Six permanent upgrades bought using earned gold. Three difficulty settings. Chapter replay, records, journal, save/continue, pause, and credits.
- Original poster styling throughout: red-and-gold title, weathered paper menus, blue skies, orange desert, matching film costumes, and all 14 art sheets/backdrops.
- 46 original sound assets, an adaptive guitar score, and scene ambience.
- Keyboard, touch controls, and standard gamepad mappings. Reduced screen effects and separate sound/music settings.

The campaign adapts the film into an arcade route. Boss attack patterns, platform routes, side encounters, jokes, and many props are original game inventions. It is not a scene-by-scene recreation.

## Refinements in version 2.4

Short taps on fire, slap, and dodge are remembered for 120 ms so an almost-ready action does not swallow your input. Dodge commits to its starting direction. Readiness meters, live score/combo timing, contact rings, and chapter streak/parry totals make fights easier to read. Health packs wait until you need healing; restart asks before discarding the current run. Slap-only chapters hide gun controls and use matching instructions.

Checkpoint saves retain earned score, best streak, parry totals, and defeated bosses. Old version-2 saves still load. Fatal hits cannot collect a health pack, trigger a checkpoint, or finish a chapter in the same frame. Reduced-motion preferences also suppress camera shake, impact accents, and invulnerability flicker.

Artwork preparation scans 45 unique crops instead of 101 aliases. Terrain and backgrounds are cached at their playfield size; canvas backing resolution is capped at 1920×1080, and the game avoids duplicate drawing between simulation steps. HUD updates are capped at 20 Hz and progress bars use transforms. Run `tests/render-browser.html` through the local server to compare all crops and measure preparation time. See `docs/QUALITY.md` for checks and limitations.

## Studio intro

The owner-supplied CREASO·NORSE logo opens a 6.1-second studio/title sequence. Skip with its button, Enter, Space or Escape; replay by clicking the title-footer logo or Replay intro in Credits. The logo is copied unchanged and embedded in the offline build. Reduced-motion preferences remove the movement/fades. The intro is visual and does not require audio autoplay.

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

`src/core.js` contains browser-independent gameplay; `src/secrets.js` contains discoveries; `src/assets.js` defines sprite frames and visual assets. `game.js` handles rendering, menus, input, and saves. `src/audio.js` manages the sound mix and score; `sound/` holds 46 original WAV assets. `art/` contains the new PNG assets. `scripts/build.mjs` exports only the current game's allowlisted files.

The inherited `img/` and `audio/` directories are retained as source history and are **not loaded or included in the export**. Do not use those directories as the release asset list.

## Validation

Twenty-six automated tests cover an input-only playthrough of all eight chapters with earned upgrades, platform and gap reachability, all 24 secrets, ammunition/reload, parrying, elastic reach and one-hit-per-swing timing, collision, boss patterns, death/checkpoint recovery, save validation, rewards, purchases, audio file integrity, cue timing, and volume settings. Browser review covers the illustrated title/story screens, gameplay and controls, pause/settings, clean sprite boundaries, and portrait/landscape layouts. Physical controller and real phone testing remain outstanding.

## Art and authorization

See `docs/OG_STYLE.md` for the current style references and exact built-in ImageGen prompts. The bundled Rye font uses SIL OFL 1.1 (`fonts/OFL.txt`). See `docs/ART_AND_RIGHTS.md` for the asset manifest, generation directions, user-confirmed scope, and film research notes. No third-party recording, lyric, guest-performer portrait, or band logo is included in the release. See `docs/SOUND_DESIGN.md` for sound design and mix validation.

## Full ZIP and sound design

After `npm run build`, run `python3 scripts/package-release.py` for full-game and source ZIPs in `dist/packages/`. The packager and optional `python3 scripts/design-sounds.py` regeneration step need Python 3 and use only its standard library. Settings has independent effects/music volume sliders and a **Test sounds** preview.
