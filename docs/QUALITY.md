# Version 2.4 quality pass

## Play feel and clarity

- Fire, slap, and dodge accept an early tap during the last 120 ms before they become available. Expired taps never fire much later, and a released tap never repeats.
- Dodge takes the direction pressed when it starts and keeps that direction for its 260 ms duration. Menu transitions and respawns clear pending actions. Controller button state is synchronized across pause/resume, so holding Start cannot immediately undo a pause. Disconnecting a controller pauses play.
- Slap/dodge meters show readiness. A live score and combo timeout make the existing quick-kill bonus visible; results show the longest streak and returned shots.
- Slap/stomp contacts and parries get brief impact rings; damage gets a subdued edge accent and a steady low-health color. Screen effects and OS reduced-motion preferences suppress rings, camera shake, damage accents, and invulnerability flicker.
- Health packs remain when health is full and display the actual number healed. Restart has an in-game confirmation. The final two chapters hide gun controls and use melee-specific instructions. Touch targets are at least 44 px, with safe-area margins and separated portrait clusters.

## Correctness

Checkpoint saves retain earned score, best combo, parry count, and defeated bosses. Existing version-2 saves remain compatible, rebuilding the base score when the new fields are absent. Score inputs are bounded and invalid numeric fields are rejected. A fatal collision ends the gameplay update before any healing, checkpoint, or exit can trigger.

The 26-test Node suite includes the complete input-only campaign, all traversable routes and secrets, boss phases, sound regressions, and new cases for action buffering, direction commitment, health pickups, save/resume, fatal-frame ordering, melee-only reloads, respawn state, canvas limits, and transparent crop bounds.

## Rendering and preparation

Original PNGs and the supplied CREASO·NORSE mark are unchanged. `prepareArtwork` caches both alpha trimming and transparent sprite buffers by the exact source rectangle and excluded regions. Processing yields periodically so the loading screen can update. All 101 named frames resolve to 45 unique buffers, reducing alpha scans by 55%.

The browser artwork harness compared all 101 crops with the previous algorithm and checked transparent buffer borders. A local desktop run measured **548.4 ms** for the old repeated scan loop and **214.4 ms** for the new full preparation (including copies and cooperative yields). This is one local preparation measurement, not a network-loading or frame-rate guarantee. Open `/tests/render-browser.html` on the local server to reproduce it.

Backgrounds and terrain tiles are pre-sized once. Offscreen wells are culled. Rendering occurs only after a simulation step, avoiding duplicate frames on high-refresh displays. HUD updates run at most 20 times per second, skip unchanged values, and scale bars with transforms instead of changing layout widths. The canvas backing store is capped at 1920×1080; at a 3840×2160 viewport with DPR 2 this uses 2.07 million backing pixels versus the previous 18.66 million.

## Browser and device review

Desktop review covers startup, HUD, elastic slap, pause, restart cancellation, settings, and touch controls. Phone layouts are checked in fixed-size browser frames. The single-file edition is tested through the local server, with its artwork, audio, font, and runtime embedded. ZIP integrity and offline script parsing are checked during packaging.

Physical-phone multitouch, a real gamepad, long thermal/battery sessions, subjective speaker/headphone listening, and direct local-file launching remain device checks. No claim of 60 fps on every device is made.
