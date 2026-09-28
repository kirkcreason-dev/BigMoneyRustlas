import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ASSETS} from '../src/assets.js';
import {SOUND_ASSETS} from '../src/sound-bank.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const dist=path.join(root,'dist');
await mkdir(dist,{recursive:true});
// Explicit allowlist: inherited portraits, film stills, and theme.m4a never ship.
for(const name of ['index.html','style.css','game.js','icon.svg','src'])await cp(path.join(root,name),path.join(dist,name),{recursive:true});
await rm(path.join(dist,'art'),{recursive:true,force:true});
await mkdir(path.join(dist,'art'),{recursive:true});
const data={};
for(const [id,name]of Object.entries(ASSETS)){
  const bytes=await readFile(path.join(root,name));
  await cp(path.join(root,name),path.join(dist,name));
  data[id]=`data:image/png;base64,${bytes.toString('base64')}`;
}
const soundData={};
await rm(path.join(dist,'sound'),{recursive:true,force:true});
await mkdir(path.join(dist,'sound'),{recursive:true});
for(const [id,name]of Object.entries(SOUND_ASSETS)){
  const bytes=await readFile(path.join(root,name));
  await cp(path.join(root,name),path.join(dist,name));
  soundData[id]=`data:audio/wav;base64,${bytes.toString('base64')}`;
}
const read=name=>readFile(path.join(root,name),'utf8');
const strip=code=>code.replace(/^import .*?;\s*$/gm,'').replace(/\bexport /g,'');
const wrap=(code,names)=>`const {${names}}=(()=>{\n${strip(code)}\nreturn {${names}};})();\n`;
const secrets=wrap(await read('src/secrets.js'),'SECRETS,secretById');
const core=wrap(await read('src/core.js'),'Game,SLAP_DURATION,slapPose,slapReach,CHAPTERS,ENEMIES,BOSSES,UPGRADES,DIFFICULTIES,WIDTH,HEIGHT,FLOOR,clamp,defaultSave,sanitizeSave,settleRun,purchase');
let assetSource=await read('src/assets.js');
assetSource=assetSource.replace(/export const ASSETS=\{[\s\S]*?\n\};/,`export const ASSETS=${JSON.stringify(data)};`);
const assets=wrap(assetSource,'ASSETS,FRAMES,backgroundUrl');
const soundBank=`const SOUND_ASSETS=${JSON.stringify(soundData)};\n`;
const audioSource=wrap(await read('src/audio.js'),'SoundEngine,soundScene,soundCue');
let css=await read('style.css');
for(const [id,name]of Object.entries(ASSETS))css=css.split(`url('${name}')`).join(`var(--asset-${id})`);
const configure='for(const [id,url]of Object.entries(ASSETS))document.documentElement.style.setProperty(`--asset-${id}`,`url("${url}")`);\n';
const script=`(()=>{\n${secrets}${core}${assets}${soundBank}${audioSource}${configure}${strip(await read('game.js'))}\n})();`;
const icon='data:image/svg+xml;base64,'+(await readFile(path.join(root,'icon.svg'))).toString('base64');
const html=(await read('index.html')).replace('<link rel="stylesheet" href="style.css">',`<style>${css}</style>`).replace('href="icon.svg"',`href="${icon}"`).replace('<script type="module" src="game.js"></script>',`<script>${script}</script>`);
// The brand mark is authored in a JS template, so inline that image too.
await writeFile(path.join(dist,'BigMoneyRustlas.html'),html.replaceAll('src="icon.svg"',`src="${icon}"`));
console.log(`Built static site and self-contained offline game in ${dist}`);
