"""Bundle the playable edition and its complete allowlisted source (Python 3)."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import argparse, shutil

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=root/'dist/packages');args=parser.parse_args()
out=args.output.resolve();out.mkdir(parents=True,exist_ok=True)
allowed=['README.md','index.html','game.js','style.css','icon.svg','package.json','package-lock.json','.gitignore','src','scripts','tests','docs','art','sound']
files=[]
for name in allowed:
 p=root/name
 files.extend(f for f in sorted(p.rglob('*')) if f.is_file() and '__pycache__' not in f.parts) if p.is_dir() else files.append(p)
html=root/'dist/BigMoneyRustlas.html'
if not html.is_file():raise SystemExit('Run npm run build first.')
shutil.copy2(html,out/'BigMoneyRustlas.html')
readme='''BIG MONEY RUSTLAS — FULL GAME PACKAGE — VERSION 2.1

Open BigMoneyRustlas.html in a modern browser to play. All images and all 46 original
sound assets are embedded. If your browser restricts local HTML or saving, use the
local server below. Direct local-file launching has not been browser-tested here.

SOURCE / LOCAL SERVER
Source contains the complete current game, art, sound, documentation, tests, and build
scripts. Requires Node.js 20+ for development; no package install is necessary.
From Source: npm start (then open http://localhost:4173/)
             npm run check
             npm run build
Optional: Python 3 regenerates sounds and packages ZIPs; no Python packages are needed.

CONTROLS
A/D or arrows: move. Space: jump (hold for height). J: fire. K: pimp hand.
Shift: dodge. R: reload. E: inspect. Esc: pause. Touch controls appear automatically.
From chapter seven onward, Sugar uses the pimp hand instead of the injured gun hand.

NEW SOUND MIX
Layered revolver reports; mechanical reloads; timed elastic stretch, snap, recoil and
contact; projectile ricochets; dirt/wood footsteps; distinct pickups and boss warnings.
Original guitar/bass score changes for showdowns. Four scene ambience loops, stereo
positioning, music ducking, and separate volume sliders. Try Settings > Test sounds.
No film recordings, sampled songs, performer voices, or third-party audio are included.

CONTENTS
Eight chapters, four bosses, 24 secrets, checkpoints/saves, earned upgrades, original
art and audio, source, tests, and reproducible sound-design and build scripts.
Art and likeness notes: Source/docs/ART_AND_RIGHTS.md
Sound details and verification: Source/docs/SOUND_DESIGN.md
Inherited unused film-image and soundtrack folders are excluded from this release.

VALIDATION
16 automated checks pass, including full-campaign playthrough and audio regressions.
The browser mixer decoded all 46 sounds and passed signal, mute, and pause checks.
Physical phone/controller and subjective speaker/headphone listening remain to be done.

REPOSITORY
https://github.com/kirkcreason-dev/BigMoneyRustlas/pull/1
Branch: codex/full-campaign
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
(out/'START-HERE.md').write_text('# Big Money Rustlas — version 2.1\n\n'+readme[readme.index('Open BigMoneyRustlas.html'):])
