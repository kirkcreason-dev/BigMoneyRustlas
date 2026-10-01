# Version 2.5 — High Noon and the bounty office

## Gameplay

High Noon charges on enemy hits (8), kills (18 extra), boss hits (7), returned projectiles (22), lost badges (15), and gold stashes (18). At 100 charge, Q / RB / the gold HUD button consumes the meter for five seconds. Firing cooldown changes from 220 to 130 ms; slap cooldown from 500 to 360 ms; slap damage increases by one. Activation refills six rounds, cancels a pending reload, and gives 400 ms of grace. Charge cannot grow during a burst. Ammo still reloads normally. Both final chapters retain their gun restriction.

There are three stashes in each authored level, including elevated detours. A bullet or slap breaks one for eight gold and 80 score. Stashes do not block movement. Broken state, gold reconstruction, charge, and burst counts survive checkpoint loads. Respawn ends a burst; saving during it never refunds the consumed charge. Existing pickup IDs and version-2 save compatibility are preserved.

Each chapter offers stash and badge bounties plus a tailored third challenge. Twenty-four unique IDs are validated on load. Completion pays each newly earned bounty 20 gold once. Failing a challenge does not block campaign progress. The board, story briefing, pause panel, chapter cards, and results make goals and rewards visible. Results offer a direct replay button.

## Presentation and performance

The 15 existing PNGs, 46 original WAVs, and supplied studio logo are retained. Two new original crate states are drawn into small reusable canvas sprites. Saloon light is also cached, rather than rebuilding gradients per frame. No new dependencies or downloaded asset packs are used.

World rendering is enlarged by 12%, with matching camera viewport bounds. Horizontal look-ahead follows velocity; gentle vertical tracking keeps upper-route jumps visible. Landing squash, recoil, run lean, short enemy stagger and defeat tumble, projected platform shadows, warm lanterns, tumbleweeds, and woodland leaves add motion. Defeat sprites are capped at 12 and expire in 380 ms. Stashes are culled to the visible area; ambient loops use fixed small counts. Existing canvas limits, 60 Hz simulation, 20 Hz HUD, and cached character rendering remain.

Reduced-motion preferences suppress the new decorative sway, orbiting burst stars, tumble rotation, player squash/lean/recoil, and enemy hit tilt. Functional camera tracking and attack timing stay consistent.

## Verification

- 34 automated tests pass, including the input-only eight-chapter campaign with earned upgrades. New cases exercise all stash surfaces, bullet/slap destruction, no duplicate loot after reload, meter thresholds and duration, burst consumption on save, melee-only chapters, charge sources, stagger bounds, one-time bounty payouts, and malformed/older saves.
- Desktop browser review checks stash destruction, gold/charge updates, saved progress, bounty navigation and live progress. No browser warnings or errors observed.
- The 320×568 and 844×390 layouts are checked in browser frames, including touch controls. These checks do not emulate physical multitouch or a real controller.
- Production build and packaged single-file edition are checked separately. Full/source ZIP CRC and embedded HTML equality are verified.

Physical phone multitouch, controller feel, sustained device performance, and human full-campaign balance/listening sessions remain release checks.
