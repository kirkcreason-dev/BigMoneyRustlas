# Big Money Rustlas — story build

A Western platformer on your Kash's/Kylie's engine, following the film's plot.

## Files
- `index.html`, `game.js`, `img/` — drop all three into `app/src/main/assets/`
  (now includes an `audio/` folder) into `app/src/main/assets/` for the Android WebView, or at a GitHub Pages root for web.

## How it plays
- **Sugar Wolf is the only playable character.** Title → story card → play.
- B = shoot, A = jump, ◀▶ move, ▼ crouch/drop, ▲ jetpack (shop item).

## The 8 chapters (follows the script)
1. Back to Mud Bug — Dusty Plains
2. Chips' Welcome — Mud Bug Town
3. **Raw Stank** (boss)
4. **Dusty Poot** (boss) — Hatchetman Saloon
5. The Saloon Floor
6. **Tank** (boss) — the "Tink" assassin; cripples Sugar's gun hand
7. Sanchez's Lesson — High Sierra; Sugar auto-switches to his **slap** form
8. **Big Baby Chips** showdown — Chips' Hideout; he enrages into gold "Big Money
   Chips," then the ending reveals he's **Grizzly Wolf**, Sugar's father.

## Characters
- Big Baby Chips = the fat clown (final boss).
- The Ghost = the laser-eyes sprite (enemy).
- Other outlaws: bandit, gun-hand, gambler, pie-slinger, bruiser, The Foot.

## Art in this build
- Real panoramas: desert (Dusty Plains), Mud Bug street, Hatchetman Saloon,
  snowy High Sierra, jail/cellar (Chips' Hideout).
- Real ground pieces: dirt, wood plank, ice (snow cap preserved).

## This build
- **Checkpoint is now the stone well** ("DO NOT DRINK"); it lights up gold when reached.
- Removed the placeholder flag/gem checkpoint and the controlled-hero arrow.
- **Performance:** ground tiles are pre-rendered and only drawn on-screen (was
  re-sampling the full-length floor every frame); render resolution capped for
  high-density screens.

## Notes
- No dog, no switch puzzles, no water levels.
- Not browser-tested here (no canvas in my environment). Headless pass is clean:
  engine loads, all 8 chapters generate, all 4 boss fights spawn the right
  villain, the slap-hero swap fires on chapter 7, and 102/102 sprites exist.
  Give it a device playtest — most likely tuning is boss HP/speed and the ground
  line against the interior backdrops.
