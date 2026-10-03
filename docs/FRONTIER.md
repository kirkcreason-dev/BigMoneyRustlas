# Frontier expansion — version 3.0

Twelve connected chapters, 48 discoveries, 18 store upgrades, and a final pistol duel where two hits kill Sugar. The core route remains Sugar arriving, confronting Chips’ hired killers, losing his shooting hand, learning from Sanchez, and returning. The new return chapter establishes that he draws with his trained other hand. This is an arcade adaptation, not a recreation of every film scene.

## Art and atmosphere

Six new transparent PNG atlases supply 54 frames. Wells, exits, pickups, stashes, equipment and discovery scenery replace the old simple drawings. Poot holds a revolver, and raiders throw axes. Sugar uses six distinct walk poses; moving gunfire composites the walking legs with his firing pose. The Foot has idle, two steps, wind-up, kick and recovery poses in an original masked design. Dark color washes sit behind actors so action remains legible. Exact prompts are in `FRONTIER_ART.md`.

## Campaign and fights

Four new travel chapters and 2,200-unit extensions to the older travel chapters add patrols, elevated detours and checkpoint wells. Every gap and optional shelf is reachable without buying boots. Ground patrols are kept on actual floors. Three story acts and explicit chapter outcomes connect the encounters.

Ordinary bosses have higher health and shorter attack/recovery timing. Poot fires staggered crossfire volleys. Chips uses quickdraw, double-shot and fan patterns with locked aim, 960-unit-per-second bullets (1,120 when enraged), short reload openings, and lateral dashes. His two phases take 18 and 14 pistol hits. No health upgrade, armor or High Noon can negate the two-hit rule, even on Easy Rider. The full-campaign input pilot wins by reading warnings, jumping/dodging and shooting; it cannot teleport, grant health, or damage enemies directly.

## Progress and equipment

The store has six original upgrades and twelve additions: cylinder, trigger, penetration, first-round damage, run speed, dodge recovery, High Noon duration, charge rate, medicine, stash payout, bounty payout and returned-shot damage. Each has live gameplay effects. The finale suspends gear bonuses. Version-2 chapter IDs map to the expanded routes so old records and checkpoints remain attached to the correct scene. Discovery IDs remain stable. New saves use version 3 with the same browser storage key.

## Music

The 46 original synthesized sounds and adaptive guitar/bass score remain. The fallback score uses a faster rhythm in the duel. Settings offers separate Test sounds and Test music controls. In version 3.1.2 the owner explicitly selected `audio/theme.m4a`; it now plays as the looping gameplay theme and is included in the web/offline exports. The synthesized guitar score remains only as a decoding-failure fallback.

## Validation

41 automated checks pass, covering all twelve chapters via inputs, every gap and shelf, all 48 discoveries, patrol floors, upgrades, save migration, stash/bounty persistence, final-duel health and vulnerability, and audio regressions. Browser checks exercise the actual artwork cache and audio mixer. `tests/frontier-browser.html` displays all 54 new frames and a live six-frame walking cycle. `tests/render-browser.html` checks cached crop bounds and transparency; `tests/audio-browser.html` checks the sound signal, mute and pause behavior.

Browser results: 155 exact crop matches with 95 unique transparent buffers; 413.6 ms preparation versus 858.9 ms for the independent baseline scan on this machine. All 46 sound assets decoded; mixed peak 0.4264, RMS 0.0184; mute/pause output zero. The live rendered duel pilot cleared in 52 seconds without a death. Phone layouts were inspected at 320×568 and 844×390. The self-contained build opened successfully through the local server with all 18 store entries. These are development checks, not a broad user playtest.

Physical phone/controller testing and subjective speaker/headphone listening are still outstanding. The user-provided license scope is recorded in `ART_AND_RIGHTS.md`; this is not independent legal clearance.
