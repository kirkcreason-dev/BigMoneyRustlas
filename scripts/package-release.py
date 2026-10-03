"""Bundle the playable edition and its complete allowlisted source (Python 3)."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import argparse, shutil

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=root/'dist/packages');args=parser.parse_args()
out=args.output.resolve();out.mkdir(parents=True,exist_ok=True)
allowed=['README.md','index.html','game.js','style.css','icon.svg','package.json','package-lock.json','.gitignore','src','scripts','tests','docs','art','sound','fonts']
files=[]
for name in allowed:
 p=root/name
 files.extend(f for f in sorted(p.rglob('*')) if f.is_file() and '__pycache__' not in f.parts) if p.is_dir() else files.append(p)
html=root/'dist/BigMoneyRustlas.html'
if not html.is_file():raise SystemExit('Run npm run build first.')
shutil.copy2(html,out/'BigMoneyRustlas.html')
readme='''BIG MONEY RUSTLAS — FULL GAME PACKAGE — VERSION 3.1.1

Open BigMoneyRustlas.html in a modern browser to play. Images, font and all 46 original
sounds are embedded. If local-file saving is restricted, use the local server below.
Direct local-file launching has not been browser-tested here.

SOURCE / LOCAL SERVER
Source contains the game, original art and audio, documentation, tests and build scripts.
Requires Node.js 20+; no package install is needed.
From Source: npm start (then open http://localhost:4173/)
             npm run check
             npm run build
Optional: Python 3 regenerates sounds and packages ZIPs with its standard library.

CONTROLS
A/D or arrows: move. Space: jump (hold for height). J: fire. K: pimp hand.
Shift: dodge. Q: High Noon (RB on controller, or tap the gold meter).
R: reload. E: inspect. Esc: pause. Touch controls appear automatically.
Version 3.1 adds original brass-and-leather buttons, at least 64 x 64 pixels,
with larger Shoot/Jump controls, readiness bars, and a dedicated High Noon button.
Portrait and landscape layouts reserve a separate control area below the playfield.
Version 3.1.1 fills the mobile play area, follows rotation and browser resizing,
keeps status panels separate, and fits compact icons within their buttons.
Sanchez’s training uses the pimp hand; Sugar then learns to draw with his other hand.

FRONTIER EXPANSION
12 chapters across three acts. Longer roads, more patrols, clearer story progression.
48 discoveries, 36 gold stashes, 36 optional bounties, 36 lost sheriff badges.
18 permanent store upgrades. 54 fresh illustrated prop and character frames.
Six-frame walking cycle, new original masked Foot design, gunfighter Poot and Chips.
Darker playfields, detailed wells/exits, new pickups, equipment and discovery props.
Chips’ finale is a fast pistol duel: two hits kill, on every difficulty. Read his aim,
dodge his rounds, and shoot during the reload. Gear and High Noon are suspended.
Version-2 saves migrate to the expanded route; upgraded loot survives checkpoints.
See Source/docs/FRONTIER.md and Source/docs/FRONTIER_ART.md.

INTRO, STYLE AND SOUND
The supplied CREASO·NORSE logo opens the skippable/replayable studio intro.
Original poster colors and costumes remain. The studio logo is unchanged.
46 synthesized sound assets, original adaptive guitar score, and scene ambience.
Settings > Test music previews the game score. Effects and music have separate volumes.
No film recordings, sampled songs, performer voices or third-party audio are included.
Inherited unused film-image and soundtrack folders are excluded from this release.
Rye font uses SIL Open Font License; see Source/fonts/OFL.txt.

VALIDATION
42 automated checks pass, including an input-only campaign playthrough, all gaps/shelves,
all discoveries, upgrades, migration, two-hit duel restrictions and audio regressions.
Browser checks cover sprite crops, audio output/mute/pause, and phone-sized layouts.
Physical phone/controller testing and subjective listening remain to be done.
Asset scope: Source/docs/ART_AND_RIGHTS.md. No independent legal clearance is claimed.

REPOSITORY
https://github.com/kirkcreason-dev/BigMoneyRustlas
Playable: https://kirkcreason-dev.github.io/BigMoneyRustlas/
'''
for filename,prefix,full in [('BigMoneyRustlas-source.zip','BigMoneyRustlas',False),('BigMoneyRustlas-Full.zip','Source',True)]:
 target=out/filename;tmp=out/(filename+'.tmp')
 with ZipFile(tmp,'w',ZIP_DEFLATED,compresslevel=6) as z:
  if full:z.write(html,'BigMoneyRustlas.html');z.writestr('README-FIRST.txt',readme)
  for f in files:z.write(f,Path(prefix)/f.relative_to(root))
 with ZipFile(tmp) as z:
  assert z.testzip() is None
  assert sum(name.startswith(prefix+'/sound/') and name.endswith('.wav') for name in z.namelist())==46
 tmp.replace(target)
 print(f'{target.name}: {target.stat().st_size/1048576:.1f} MB; verified')
(out/'START-HERE.md').write_text('# Big Money Rustlas — version 3.1.1\n\n'+readme[readme.index('Open BigMoneyRustlas.html'):])
