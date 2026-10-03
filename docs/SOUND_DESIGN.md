# Sound design — version 2.1

The game uses 46 newly synthesized PCM WAV assets. These effects use no field recordings, film audio, performer voices, music samples, or external libraries. The separately supplied `audio/theme.m4a` is included as music starting in version 3.1.2 at the owner’s direction. `scripts/design-sounds.py` creates the entire bank deterministically with Python's standard library. Run `python3 scripts/design-sounds.py` to regenerate it.

The revolver combines a brief high-frequency crack, a lower noise report, a falling body resonance, a mechanical click, and quiet delayed reflections. Enemy reports are distinct, positioned across the stereo field, and attenuated with distance. Reloading has cylinder-open, rotation, and closing sounds; pies use a throw sound instead of a gun report.

The pimp hand has separate wind-up/stretch, full-extension snap, elastic recoil, and contact cues. The simulation emits extension and recoil events at the matching animation phases. A dodge cancels future slap cues. Projectile returns use a descending metallic ricochet. Footsteps alternate between three dirt or three wood variations, with separate takeoff, landing, and clothing movement.

Pickups, checkpoints, secrets, damage, and victories have distinct cues. Boss high/low/charge warnings differ audibly. Notification-only events remain silent. Rapid impacts and coins are rate-limited to avoid a wall of repeated sounds.

The supplied theme loops at its original speed, routes directly through the music volume and ducking buses, and retains its playhead on pause/resume. It bypasses the synthesized score’s reverb. Settings previews the same recording. The web build copies the exact M4A; the offline build embeds it.

The fallback original score uses damped-string guitar and bass samples, a quiet harmonic lead, brushed percussion, and an eight-bar progression. The scheduler uses the audio clock with a short lookahead. Exploration, saloon, woodland, boss, and enraged boss tempos differ. Four ambience loops add wind, room/wood creaks, or synthesized woodland chirps.

Effects and music have separate saved volume controls. Important combat cues briefly lower the music. A low-frequency filter, compressor, capped voice count, short fades, and conservative gains control the mix. Pausing stops scheduled gameplay audio; sound-disabled and zero-volume settings remain respected. Settings includes a short effects preview.

## Validation

The automated checks validate all WAV headers, signal energy, headroom, fade boundaries, cue routing, slap timing/cancellation, footstep conditions, and save migration. The browser harness at `/tests/audio-browser.html` renders the actual mixer through OfflineAudioContext. Effects plus score rendered with peak 0.4264 and RMS 0.0184; muted and immediately paused renders were silent. All 46 assets decoded. The in-game preview, volume sliders, and normal gameplay were exercised without browser errors.

These checks establish playback, timing, mute behavior, and signal integrity. They do not replace subjective speaker/headphone listening or testing on physical phones and controllers.


Version 3.1.2 verification: the supplied M4A decodes as 124.92 seconds of stereo AAC audio. Browser rendering of the theme alone reached peak 0.1600 / RMS 0.0271; effects plus theme reached peak 0.4836 / RMS 0.0325. Muted and hard-paused renders were silent. The automated suite now has 44 passing checks, including loop exclusivity, pause/resume position and music-volume isolation. The web export, embedded offline recording and both ZIP copies match the supplied file byte for byte.
