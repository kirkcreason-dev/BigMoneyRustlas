# Sound design — version 2.1

The game uses 46 newly synthesized PCM WAV assets. No field recordings, film audio, performer voices, music samples, or external libraries were used. `scripts/design-sounds.py` creates the entire bank deterministically with Python's standard library. Run `python3 scripts/design-sounds.py` to regenerate it.

The revolver combines a brief high-frequency crack, a lower noise report, a falling body resonance, a mechanical click, and quiet delayed reflections. Enemy reports are distinct, positioned across the stereo field, and attenuated with distance. Reloading has cylinder-open, rotation, and closing sounds; pies use a throw sound instead of a gun report.

The pimp hand has separate wind-up/stretch, full-extension snap, elastic recoil, and contact cues. The simulation emits extension and recoil events at the matching animation phases. A dodge cancels future slap cues. Projectile returns use a descending metallic ricochet. Footsteps alternate between three dirt or three wood variations, with separate takeoff, landing, and clothing movement.

Pickups, checkpoints, secrets, damage, and victories have distinct cues. Boss high/low/charge warnings differ audibly. Notification-only events remain silent. Rapid impacts and coins are rate-limited to avoid a wall of repeated sounds.

The original score uses damped-string guitar and bass samples, a quiet harmonic lead, brushed percussion, and an eight-bar progression. The scheduler uses the audio clock with a short lookahead. Exploration, saloon, woodland, boss, and enraged boss tempos differ. Four ambience loops add wind, room/wood creaks, or synthesized woodland chirps.

Effects and music have separate saved volume controls. Important combat cues briefly lower the music. A low-frequency filter, compressor, capped voice count, short fades, and conservative gains control the mix. Pausing stops scheduled gameplay audio; sound-disabled and zero-volume settings remain respected. Settings includes a short effects preview.

## Validation

The automated checks validate all WAV headers, signal energy, headroom, fade boundaries, cue routing, slap timing/cancellation, footstep conditions, and save migration. The browser harness at `/tests/audio-browser.html` renders the actual mixer through OfflineAudioContext. Effects plus score rendered with peak 0.4264 and RMS 0.0184; muted and immediately paused renders were silent. All 46 assets decoded. The in-game preview, volume sliders, and normal gameplay were exercised without browser errors.

These checks establish playback, timing, mute behavior, and signal integrity. They do not replace subjective speaker/headphone listening or testing on physical phones and controllers.
