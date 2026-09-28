import { SoundEngine } from './src/audio.js';
import { Game, SLAP_DURATION, slapPose, slapReach, CHAPTERS, ENEMIES, BOSSES, UPGRADES, DIFFICULTIES, WIDTH, HEIGHT, FLOOR, clamp, defaultSave, sanitizeSave, settleRun, purchase } from './src/core.js';

import { SECRETS } from './src/secrets.js';
import { ASSETS, FRAMES, backgroundUrl } from './src/assets.js';

const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false});
const SAVE_KEY='rustlas_save_v2';
let save=defaultSave(),storageOK=true,game=null,mode='loading',menuReturn='home',lastTime=0,accumulator=0,toastTimer,assetsReady=false;
const images={},crops={},keys=new Set(),touchHeld=new Set(),edges={},previousPad={},holdPointers=new Map();
let touchDevice=matchMedia('(pointer:coarse)').matches,padConnected=false,hudCache={};
try { const raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem('rustlas_save_v1');save=sanitizeSave(raw?JSON.parse(raw):null); } catch {storageOK=false;}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch{if(storageOK)toast('Saving is unavailable in this browser. Keep this tab open to continue.');storageOK=false;}}
function saveRun(){if(game&&!game.complete){save.run=game.snapshot();persist();}}
function toast(message,duration=3200){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),duration);}
function fmtTime(n){return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;}
function hintText(text){return touchDevice||save.settings.touch?text.replace('A / D to move · SPACE to jump','Arrows to move · JUMP to leap').replace('Hold J to fire · R to reload · K to slap','Hold FIRE · ↻ to reload · SLAP to strike').replace('SHIFT to dodge','DODGE to roll').replace('K returns','SLAP returns').replace('K / slap','SLAP').replace('K ·','SLAP ·').replace('E ·','LOOK ·'):text;}
function clearInput(){keys.clear();touchHeld.clear();for(const key of Object.keys(edges))delete edges[key];holdPointers.clear();document.querySelectorAll('#touch .pressed').forEach(b=>b.classList.remove('pressed'));}

const audio=new SoundEngine(()=>save.settings,()=>game,()=>mode==='playing');

const btn=(label,action,kind='secondary',extra='')=>`<button class="${kind}" data-action="${action}" ${extra}>${label}</button>`;
const header=(eyebrow,title,sub='',right='')=>`<div class="panel-header"><div class="panel-heading"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}</div>${right||btn('← Back','home','text-button')}</div>`;
const balance=()=>`<div class="balance"><small>YOUR GOLD</small>◈ ${save.coins}</div>`;
function show(html,nextMode){
  mode=nextMode;clearInput();accumulator=0;$('menu').innerHTML=html;$('menu').scrollTop=0;
  for(const cv of $('menu').querySelectorAll('[data-portrait]')){const name=cv.dataset.portrait,im=images[name],r=crops[name];if(im&&r){const c=cv.getContext('2d'),h=570,w=h*r.w/r.h;c.drawImage(im,r.x,r.y,r.w,r.h,(480-w)/2,600-h,w,h);}}
  const playing=mode==='playing';$('hud').hidden=!playing;$('touch').hidden=!playing||!(touchDevice||save.settings.touch);$('hint').hidden=!playing;
  document.body.classList.toggle('touch-mode',touchDevice||save.settings.touch);
  if(playing){audio.musicPlay();$('hint').textContent=hintText(game.secretPrompt||game.lastSign);}else{audio.pause(mode==='paused');}
  if(html)requestAnimationFrame(()=>{const el=$('menu').querySelector('button.primary:not(:disabled)')||$('menu').querySelector('button:not(:disabled),select,input[type=range]');el?.focus({preventScroll:true});});
}
function home(){
  const continuation=save.run?`CONTINUE CHAPTER ${save.run.chapter}`:save.unlocked>1&&!save.beaten?`RIDE ON · CHAPTER ${save.unlocked}`:save.beaten?'RIDE AGAIN':'START YOUR STORY';
  show(`<div class="home"><header class="topbar"><div class="brand-mark"><img src="icon.svg" alt="Sheriff star"><span>BIG MONEY RUSTLAS</span></div><div class="topbar-right"><span class="official">THE FIRST OFFICIAL VIDEO GAME</span>${btn('⚙','settings','icon-button','aria-label="Settings"')}</div></header><div class="title-lockup"><span class="title-star">★</span><h1><span>BIG MONEY</span>RUSTLAS</h1><span class="title-kicker">THE OFFICIAL GAME</span></div><div class="home-bottom"><p class="home-tagline">A BADGE. SIX BULLETS. A TOWN TO TAKE BACK.</p><div class="button-row">${btn(`${continuation} <span aria-hidden="true">→</span>`,'continue','primary')}${btn('Chapter select','chapters')}${btn('The general store','shop')}${btn('Field guide','guide')}${btn('Trail secrets','journal')}</div><p class="save-label">${save.run?'Your checkpoint is waiting.':save.beaten?'Mud Bug is free. There’s still gold in those hills.':'Eight chapters. Four showdowns. Twenty-four dirty little secrets.'}</p><footer class="home-foot"><span>THE OFFICIAL BIG MONEY RUSTLAS GAME</span><span>KEYBOARD · CONTROLLER · TOUCH</span><button class="text-button" data-action="credits" style="padding:0;font-size:9px">CREDITS / V2.1</button></footer></div></div>`,'home');
}
function chapters(){
  const completed=Object.keys(save.best).length,badges=Object.values(save.best).reduce((n,b)=>n+b.relics,0);
  show(`<div class="panel-screen">${header('THE ROAD TO MUD BUG','Every town has a story.','Choose a chapter. Find every lost badge. Earn your legend.',balance())}<div class="map-grid">${CHAPTERS.map((c,i)=>{const n=i+1,locked=n>save.unlocked,b=save.best[n];return `<button class="chapter-card ${locked?'locked':''} ${n===save.unlocked?'current':''}" data-action="chapter:${n}" ${locked?'disabled':''} aria-label="Chapter ${n}: ${c.name}${locked?', locked':''}"><div class="chapter-art" style="background-image:url('${backgroundUrl(c.bg)}')"><span class="chapter-number">${String(n).padStart(2,'0')}</span><span class="chapter-type">${locked?'LOCKED':c.boss?'SHOWDOWN':'CHAPTER'}</span></div><div class="chapter-info"><h3>${c.name}</h3><div class="chapter-meta"><span>${locked?'FINISH PREVIOUS CHAPTER':b?`${'★'.repeat(b.relics)}${'☆'.repeat(3-b.relics)}`:c.place}</span><span>${b?fmtTime(b.time):locked?'': '→'}</span></div></div></button>`;}).join('')}</div><div class="panel-footer"><span>${completed}/8 CHAPTERS CLEARED · ${badges}/24 LOST BADGES</span><div class="button-row">${btn('General store','shop','text-button')}${btn('← Main menu','home','secondary')}</div></div></div>`,'chapters');
}
function story(chapter){
  if(chapter>save.unlocked)return;const c=CHAPTERS[chapter-1];
  const portrait=c.boss?`${BOSSES[c.boss].prefix}1`:c.training?'rl_sanchez_arms_crossed':'rl_sugarwolf_gun_idle';
  show(`<div class="story-screen"><div class="story-art" style="background-image:url('${backgroundUrl(c.bg)}')"><span class="chapter-stamp">CHAPTER ${String(chapter).padStart(2,'0')}</span><canvas class="story-portrait" data-portrait="${portrait}" width="480" height="600" aria-label="${c.boss?BOSSES[c.boss].name:c.training?'Sanchez':'Sugar Wolf'}"></canvas></div><div class="story-copy"><span class="eyebrow">${c.place} / ${c.boss?'WANTED DEAD OR DEFEATED':'THE STORY SO FAR'}</span><h2>${c.name}</h2><div class="story-quote">“${c.quote}”</div><p>${c.story}</p><div class="mission"><b>YOUR MISSION</b>${c.objective}</div><div class="button-row">${btn('Saddle up →',`start:${chapter}`,'primary')}${btn('← Chapters','chapters','text-button')}</div><p class="tiny" style="margin-bottom:0">${DIFFICULTIES[save.settings.difficulty].name.toUpperCase()} · 3 LOST BADGES · CHECKPOINTS SAVE AUTOMATICALLY</p></div></div>`,'story');
}
function start(chapter,resume=false){
  audio.init();game=new Game(chapter,save.settings,save.items,resume?save.run:null);save.run=game.snapshot();persist();hudCache={};for(const secret of game.secrets)secret.found=save.secrets.includes(secret.id);
  show('','playing');$('hint').textContent='';updateHud();toast(resume?'Back in the saddle.':`Chapter ${chapter} · ${CHAPTERS[chapter-1].name}`);lastTime=performance.now();
}
function resume(){show('','playing');lastTime=performance.now();}
function pause(){
  if(!game||game.complete)return;saveRun();
  show(`<div class="center-screen"><div class="dialog"><span class="eyebrow">TAKE A BREATHER, SHERIFF</span><div class="pause-layout"><div><h2>Hold your fire.</h2><div class="pause-menu">${btn('Back in the saddle','resume','primary')}${btn('Restart chapter','restart')}${btn('Trail secrets','journal')}${btn('Field guide','guide')}${btn('Settings','settings')}${btn('Save & quit','quit')}</div></div><div class="pause-info"><span class="eyebrow">CHAPTER ${game.chapter}</span><h3>${game.world.def.name}</h3><p>GOLD ON THE TRAIL</p><strong>◈ ${game.coins}</strong><p>LOST BADGES</p><strong>${game.relics} / 3</strong><p>Your last checkpoint and collected items are saved. Gold is banked when the chapter is complete.</p></div></div></div></div>`,'paused');
}
function shop(){
  show(`<div class="panel-screen">${header('MUD BUG GENERAL STORE','A little edge goes a long way.','Spend the gold you earn. Every upgrade stays with you.',balance())}<div class="shop-grid">${UPGRADES.map(it=>{const owned=save.items[it.id],afford=save.coins>=it.cost;return `<article class="shop-item ${owned?'owned':''}"><div class="symbol" aria-hidden="true">${it.symbol}</div><h3>${it.name}</h3><p>${it.desc}</p>${btn(owned?'✓ EQUIPPED':afford?`BUY · ◈ ${it.cost}`:`◈ ${it.cost} · NEED ${it.cost-save.coins} MORE`,`buy:${it.id}`,'primary',owned||!afford?'disabled':'')}</article>`;}).join('')}</div><footer class="panel-footer"><span>UPGRADES APPLY WHEN YOU ENTER A CHAPTER.<br>NO ADS. NO REAL-MONEY PURCHASES.</span>${btn('← Back',`back:${menuReturn}`,'secondary')}</footer></div>`,'shop');
}
function settings(){
  const s=save.settings;
  const volume=(key,label)=>`<div class="settings-row volume-row"><label for="${key}">${label}</label><div><input id="${key}" type="range" min="0" max="100" step="5" value="${s[key]}"><output id="${key}-value" for="${key}">${s[key]}%</output></div></div>`;
  const toggle=(key,title,desc)=>`<div class="settings-row"><div><strong>${title}</strong><small>${desc}</small></div>${btn(s[key]?'ON':'OFF',`toggle:${key}`,`toggle ${s[key]?'':'off'}`,`aria-pressed="${s[key]}" aria-label="${title}"`)}</div>`;
  show(`<div class="center-screen"><div class="dialog settings-dialog"><span class="eyebrow">MAKE YOURSELF AT HOME</span><h2>Settings</h2><div class="settings-row"><div><strong>Difficulty</strong><small id="difficulty-desc">${DIFFICULTIES[s.difficulty].description}<br>Applies to newly started chapters.</small></div><select id="difficulty" aria-label="Difficulty">${Object.entries(DIFFICULTIES).map(([id,d])=>`<option value="${id}" ${s.difficulty===id?'selected':''}>${d.name}</option>`).join('')}</select></div>${toggle('sound','Sound effects','Layered gunfire, elastic slaps, footsteps, and ambience.')}${toggle('music','Music','Fingerpicked guitar, bass, and a faster showdown rhythm.')}${volume('soundVolume','Effects volume')}${volume('musicVolume','Music volume')}<div class="sound-preview">${btn('Test sounds','sound-preview','secondary')}<span id="sound-status" role="status">Play a short effects preview.</span></div>${toggle('motion','Screen effects','Camera shake and impact flashes.')}${toggle('touch','Show touch controls','Touch devices show these automatically.')}<div class="button-row settings-actions">${btn('Done',`back:${menuReturn}`,'primary')}${btn('Reset progress','reset','text-button')}</div></div></div>`,'settings');
  for(const key of ['soundVolume','musicVolume'])$(key).addEventListener('input',e=>{save.settings[key]=Number(e.target.value);$(key+'-value').textContent=save.settings[key]+'%';audio.applySettings();persist();});
  $('difficulty').addEventListener('change',e=>{save.settings.difficulty=e.target.value;persist();$('difficulty-desc').innerHTML=`${DIFFICULTIES[e.target.value].description}<br>Applies to newly started chapters.`;});
}
function guide(){
  show(`<div class="panel-screen">${header('THE SHERIFF’S FIELD GUIDE','Stay quick. Shoot straight.','Everything you need to take Mud Bug back.')}<div class="guide-grid"><div><h3>The controls</h3><div class="key-table"><span>Move</span><span><kbd>A</kbd> <kbd>D</kbd> / <kbd>←</kbd> <kbd>→</kbd></span><span>Jump · hold for height</span><span><kbd>SPACE</kbd> / <kbd>W</kbd> / <kbd>↑</kbd></span><span>Fire · hold to keep shooting</span><span><kbd>J</kbd> / <kbd>X</kbd></span><span>Slap · return incoming bullets</span><span><kbd>K</kbd> / <kbd>C</kbd></span><span>Reload your six-shooter</span><kbd>R</kbd><span>Dodge · brief invulnerability</span><kbd>SHIFT</kbd><span>Drop through a platform</span><span><kbd>S</kbd> / <kbd>↓</kbd></span><span>Inspect something suspicious</span><kbd>E</kbd><span>Pause</span><span><kbd>ESC</kbd> / <kbd>P</kbd></span></div><div class="guide-note">Controller: left stick / D-pad to move, A to jump, X or RT to fire, Y to slap, B to dodge, LB to reload, LT to inspect, Start to pause. Touch controls appear on phones and tablets.</div></div><div><h3>A few things to remember</h3><p><b>Six bullets. Unlimited nerve.</b> Your revolver reloads automatically when empty. Reload before a showdown. You have unlimited reserve ammunition.</p><p><b>A slap beats a bullet.</b> Slap incoming shots to return them for triple damage. Your arm stretches across the street: wind up, let the palm connect, then recover. Dodge cancels the swing. From chapter seven onward, your injured gun hand makes the pimp hand your only weapon.</p><p><b>Watch the warning.</b> Enemies flash a gold tell before attacking. Bosses have a recovery window. Dodge through a charge or jump a low volley.</p><p><b>Wells are your lifeline.</b> They restore health and ammunition, and save your checkpoint. Falling costs a heart. Losing all hearts sends you back with your collected loot intact.</p><p><b>Look up.</b> Each chapter hides three lost sheriff badges. Recover them for bonus gold. Clear without dying to earn a clean-run mark, then replay for a faster time and higher score.</p><p><b>The frontier is deeply weird.</b> Inspect odd props with E, slap suspicious objects, or hold down to pay your respects. Each of 24 secrets earns 15 gold once and an entry in your trail journal. Find them all to become Tumbleweed Marshal.</p><p><b>Gold buys a permanent advantage.</b> It is banked when you finish a chapter. Visit the general store between chapters to improve your gear.</p></div></div><div class="panel-footer"><span>PROGRESS SAVES ON THIS BROWSER AND DEVICE.</span>${btn('Let’s ride',`back:${menuReturn}`,'primary')}</div></div>`,'guide');
}
function results(result){
  const final=game.chapter===8,c=game.world.def;
  show(`<div class="center-screen"><div class="dialog"><span class="eyebrow">CHAPTER ${game.chapter} COMPLETE / ${result.first?'FIRST CLEAR':'BACK FOR MORE'}</span><h2>${final?'The town is yours.':'That’s a day’s work.'}</h2><p>${c.name} is behind you. ${final?'Chips has played his last hand.':'There’s more trouble down the road.'}</p><div class="stats"><div class="stat"><strong>${fmtTime(result.time)}</strong><span>TRAIL TIME</span></div><div class="stat"><strong>${result.score.toLocaleString()}</strong><span>SCORE</span></div><div class="stat"><strong>+${result.reward}</strong><span>GOLD BANKED</span></div><div class="stat"><strong>${result.relics}/3</strong><span>LOST BADGES</span></div></div><div class="awards"><span class="award">★ CHAPTER CLEARED</span><span class="award ${result.relics===3?'':'missing'}">${result.relics===3?'★':'☆'} BADGE COLLECTOR</span><span class="award ${result.deaths===0?'':'missing'}">${result.deaths===0?'★':'☆'} NO DEATHS</span></div><div class="button-row">${btn(final?'The final word →':'Next chapter →',final?'ending':`chapter:${game.chapter+1}`,'primary')}${btn('General store','shop')}${btn('Chapters','chapters','text-button')}</div></div></div>`,'results');
}
function ending(){
  show(`<div class="center-screen ending"><div class="dialog"><span class="eyebrow">MUD BUG IS FREE</span><h2>Some legends<br>run in the family.</h2><p>Chips falls. Beneath the gold and the paint is Grizzly Wolf—Sugar’s own father. The truth lands harder than any bullet. But the badge still means something.</p><p>With the town free and the road quiet, Sugar Wolf rides into the sunset. Mud Bug will remember its sheriff.</p><div class="story-quote">“A town worth saving. A story worth telling.”</div><div class="credits">BIG MONEY RUSTLAS<br>THE FIRST OFFICIAL VIDEO GAME<br><br>You completed all eight chapters. Return to the trail to find all 24 lost badges and set new records.</div><div class="button-row">${btn('Back to the trail','chapters','primary')}${btn('Credits','credits')}</div></div></div>`,'ending');
}
function credits(){
  show(`<div class="center-screen"><div class="dialog"><span class="eyebrow">THE FIRST OFFICIAL VIDEO GAME</span><h2>Big Money Rustlas</h2><p>Sugar Wolf’s story, from the dusty road to the last showdown in Mud Bug.</p><div class="credits">FEATURING<br>Sugar Wolf · Big Baby Chips · Dirty Sanchez<br>Raw Stank · Dusty Poot · Tank · Hack Benjamin<br><br>BASED ON BIG MONEY RUSTLAS<br>Licensed title and fictional characters.<br>New illustrated environments, terrain, and character animation.<br>Sugar Wolf · Shaggy 2 Dope<br>Big Baby Chips · Violent J<br>Hack Benjamin · Jumpsteady<br>Other characters use original covered-face designs.<br>Original sound design and adaptive guitar score.<br>24 frontier secrets, movie callbacks, and original encounters.<br><br>GAME EDITION<br>Eight-chapter campaign · Version 2.1<br><br>Thanks for riding with us.</div><div class="button-row">${btn('Main menu','home','primary')}${save.beaten?btn('Chapter select','chapters'):''}</div></div></div>`,'credits');
}
function journal(){
  const all=save.secrets.length===SECRETS.length;
  show(`<div class="panel-screen">${header('THE THINGS THIS TOWN DOESN’T ADVERTISE',all?'Tumbleweed Marshal.':'The trail gets weird.',`${save.secrets.length} / 24 secrets discovered. Each new discovery earns 15 gold.`,balance())}${all?'<div class="guide-note">The Tumbleweed Council has granted you its highest honor. A gold star follows your sheriff on every future ride.</div>':''}<div class="journal-grid">${SECRETS.map((s,i)=>{const found=save.secrets.includes(s.id);return `<article class="journal-entry ${found?'found':''}"><span class="eyebrow">${String(i+1).padStart(2,'0')} / CHAPTER ${s.chapter} ${found?'· DISCOVERED':''}</span><h3>${found?s.name:'Unknown business'}</h3><p>${found?s.text:s.clue}</p><small>${found?'✓ 15 GOLD CLAIMED':s.action==='slap'?'TRY A SLAP':s.action==='down'?'HOLD DOWN TO BOW':'E / INSPECT'}</small></article>`;}).join('')}</div><div class="panel-footer"><span>ORIGINAL NONSENSE, FOUND IN THE WILD.</span>${btn('Back',`back:${menuReturn}`,'primary')}</div></div>`,'journal');
}
function back(where){if(where==='paused'&&game)pause();else if(where==='chapters')chapters();else if(where==='results'&&game?.result)results(game.result);else home();}
function action(value){
  const [name,arg]=value.split(':');audio.init();audio.sfx('click');
  if(name==='continue'){if(save.run)start(save.run.chapter,true);else story(save.beaten?1:save.unlocked);}
  else if(name==='home')home();else if(name==='chapters')chapters();else if(name==='chapter')story(Number(arg));else if(name==='start')start(Number(arg));
  else if(name==='resume')resume();else if(name==='restart')start(game.chapter);else if(name==='quit'){saveRun();home();}
  else if(['shop','settings','guide','journal'].includes(name)){if(!['shop','settings','guide','journal'].includes(mode))menuReturn=mode;({shop,settings,guide,journal})[name]();}
  else if(name==='back')back(arg);
  else if(name==='buy'){if(purchase(save,arg)){persist();audio.sfx('buy');shop();toast(`${UPGRADES.find(i=>i.id===arg).name} equipped.`);}}
  else if(name==='toggle'){
    save.settings[arg]=!save.settings[arg];persist();audio.applySettings();applyPreferences();settings();requestAnimationFrame(()=>$('menu').querySelector(`[data-action="toggle:${arg}"]`)?.focus());
  }else if(name==='sound-preview'){audio.preview().then(ok=>{if($('sound-status'))$('sound-status').textContent=ok?'Revolver · reload · pimp hand · ricochet · gold':save.settings.sound?'Audio is unavailable in this browser.':'Turn sound effects on to hear the preview.';});}else if(name==='ending')ending();else if(name==='credits')credits();
  else if(name==='reset')show(`<div class="center-screen"><div class="dialog"><span class="eyebrow">START FROM SCRATCH</span><h2>Hang up this badge?</h2><p class="reset-warning">This erases all saved chapters, gold, upgrades, and records on this device. Your next ride will begin at chapter one.</p><div class="button-row">${btn('Keep my progress','settings','primary')}${btn('Erase saved progress','erase')}</div></div></div>`,'reset');
  else if(name==='erase'){save=defaultSave();game=null;persist();applyPreferences();home();toast('A fresh start. Welcome back to Mud Bug.');}
}
$('menu').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&!b.disabled)action(b.dataset.action);});
$('pause').addEventListener('click',pause);
function applyPreferences(){document.body.classList.toggle('reduced-motion',!save.settings.motion);}
applyPreferences();

const keyActions={Space:'jump',KeyW:'jump',ArrowUp:'jump',KeyR:'reload',ShiftLeft:'roll',ShiftRight:'roll',KeyE:'interact',KeyJ:'fire',KeyX:'fire',KeyK:'slap',KeyC:'slap'};
const gameKeys=new Set(['Space','KeyW','ArrowUp','KeyR','ShiftLeft','ShiftRight','ArrowLeft','ArrowRight','ArrowDown','KeyA','KeyD','KeyS','KeyJ','KeyK','KeyX','KeyC','KeyE','Escape','KeyP']);
addEventListener('keydown',e=>{
  if(!assetsReady)return;
  if(e.code==='Tab'&&mode!=='playing'){
    const list=[...$('menu').querySelectorAll('button:not(:disabled),select,input[type=range]')];if(list.length){const first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;
  }
  if(e.code==='Escape'||(e.code==='KeyP'&&mode==='playing')){
    if(e.repeat)return;e.preventDefault();if(mode==='playing')pause();else if(mode==='paused')resume();else if(['settings','guide','shop','journal'].includes(mode))back(menuReturn);else if(mode!=='home')home();return;
  }
  if(mode!=='playing')return;if(gameKeys.has(e.code))e.preventDefault();
  if(!keys.has(e.code)&&keyActions[e.code])edges[keyActions[e.code]]=true;keys.add(e.code);
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{clearInput();if(mode==='playing')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(mode==='playing')pause();audio.pause(true);}});
addEventListener('pagehide',saveRun);
window.onAndroidPause=()=>{if(mode==='playing')pause();};
window.onAndroidBack=()=>{if(mode==='playing')pause();else if(mode==='paused')resume();else home();};
for(const button of document.querySelectorAll('#touch button')){
  button.addEventListener('pointerdown',e=>{e.preventDefault();audio.init();button.setPointerCapture(e.pointerId);button.classList.add('pressed');const control=button.dataset.hold||button.dataset.tap;holdPointers.set(e.pointerId,{button,control});if(button.dataset.hold)touchHeld.add(control);if(['jump','fire','slap'].includes(control)||button.dataset.tap)edges[control]=true;});
  const release=e=>{const held=holdPointers.get(e.pointerId);if(!held)return;holdPointers.delete(e.pointerId);if(![...holdPointers.values()].some(p=>p.control===held.control))touchHeld.delete(held.control);held.button.classList.remove('pressed');};
  button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
}
function readInput(){
  let move=(keys.has('KeyD')||keys.has('ArrowRight')||touchHeld.has('right')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')||touchHeld.has('left')?1:0);
  const input={move,jump:!!edges.jump,jumpHeld:keys.has('Space')||keys.has('KeyW')||keys.has('ArrowUp')||touchHeld.has('jump'),fire:!!edges.fire||keys.has('KeyJ')||keys.has('KeyX')||touchHeld.has('fire'),slap:!!edges.slap||keys.has('KeyK')||keys.has('KeyC')||touchHeld.has('slap'),down:keys.has('KeyS')||keys.has('ArrowDown')||touchHeld.has('down'),reload:!!edges.reload,roll:!!edges.roll,interact:!!edges.interact};
  const pad=[...(navigator.getGamepads?.()||[])].find(p=>p?.connected);
  if(pad){
    if(!padConnected){padConnected=true;toast('Controller connected. A jump · X fire · Y slap · B dodge');}
    const pressed=i=>!!pad.buttons[i]?.pressed;
    const axis=Math.abs(pad.axes[0])>.2?pad.axes[0]:0;input.move=axis||((pressed(15)?1:0)-(pressed(14)?1:0))||input.move;
    input.jumpHeld||=pressed(0);input.fire||=pressed(2)||pressed(7);input.slap||=pressed(3);input.down||=pressed(13);
    for(const [i,k]of [[0,'jump'],[1,'roll'],[4,'reload'],[6,'interact']]){if(pressed(i)&&!previousPad[i])input[k]=true;previousPad[i]=pressed(i);}
    if(pressed(9)&&!previousPad[9])pause();previousPad[9]=pressed(9);
  }else{padConnected=false;for(const k of Object.keys(previousPad))delete previousPad[k];}
  for(const k of Object.keys(edges))delete edges[k];return input;
}
let menuPadStamp=0,menuPadDown=false;
function pollMenuPad(now){
  const pad=[...(navigator.getGamepads?.()||[])].find(p=>p?.connected);if(!pad)return;
  const a=pad.buttons[0]?.pressed,b=pad.buttons[1]?.pressed,start=pad.buttons[9]?.pressed;
  if((a||b||start)&&!menuPadDown){if(start&&mode==='paused')resume();else if(b&&mode!=='home')back(menuReturn);else if(a)document.activeElement?.click();}menuPadDown=!!(a||b||start);previousPad[9]=!!start;
  const dir=(pad.buttons[13]?.pressed||pad.buttons[15]?.pressed||pad.axes[1]>.6||pad.axes[0]>.6?1:0)-(pad.buttons[12]?.pressed||pad.buttons[14]?.pressed||pad.axes[1]<-.6||pad.axes[0]<-.6?1:0);
  if(dir&&now-menuPadStamp>220){menuPadStamp=now;const list=[...$('menu').querySelectorAll('button:not(:disabled),select,input[type=range]')];if(list.length){const i=list.indexOf(document.activeElement);list[(i+dir+list.length)%list.length].focus();}}
}

function updateHud(){
  if(!game)return;const g=game,p=g.player;
  const set=(id,key,html)=>{if(hudCache[id]!==key){$(id).innerHTML=html;hudCache[id]=key;}};
  set('health',`${g.hp}/${g.maxHp}`,`${'♥'.repeat(Math.max(0,g.hp))}<span class="empty">${'♡'.repeat(g.maxHp-Math.max(0,g.hp))}</span>`);$('health').setAttribute('aria-label',`${g.hp} of ${g.maxHp} health`);
  set('shield',g.shield,g.shield?'◇ ARMOR READY':'');set('chapter-label',g.chapter,`CHAPTER ${String(g.chapter).padStart(2,'0')}`);set('place-label',g.chapter,g.world.def.place);
  set('gold',g.coins,String(g.coins));set('badges',g.relics,`${'★'.repeat(g.relics)}<span style="opacity:.35">${'☆'.repeat(3-g.relics)}</span>`);
  const training=g.world.def.training||g.world.def.meleeOnly;set('rounds',`${training}/${g.ammo}`,training?'':Array.from({length:6},(_,i)=>`<i class="round ${i>=g.ammo?'empty':''}"></i>`).join(''));
  const label=training?'THE PIMP HAND':g.reload>0?'RELOADING…':'SIX-SHOOTER';set('weapon-label',label,label);
  $('reload-track').style.visibility=g.reload>0?'visible':'hidden';$('reload-track').firstElementChild.style.width=`${(1-g.reload/g.reloadDuration)*100}%`;
  $('trail-fill').style.width=`${clamp(p.x/g.world.exit*100,0,100)}%`;
  const b=g.world.boss;$('boss-hud').hidden=!b?.active||b.dead;
  if(b?.active&&!b.dead){set('boss-name',b.enraged?'rage':b.name,b.enraged?'Big Money Chips':b.name);$('boss-fill').style.width=`${Math.max(0,b.hp/b.maxHp)*100}%`;const state=b.phase==='tell'?({charge:'DODGE!',slam:'GET READY TO JUMP',pies:'RETURN TO SENDER',volley:'JUMP THE VOLLEY',high:'STAY LOW'})[b.attack]:b.phase==='recover'?'TAKE YOUR SHOT':b.phase==='rage'?'ALL THAT GLITTERS…':'';set('boss-state',state,state);}
}
function processEvents(){
  for(const e of game.events){
    audio.sfx(e.type,e);
    if(e.type==='checkpoint'){saveRun();toast(e.message);}
    if(e.type==='hint'&&!game.secretPrompt)$('hint').textContent=hintText(e.text);
    if(e.type==='secret-prompt')$('hint').textContent=hintText(e.text||game.lastSign);
    if(e.type==='secret'){if(!save.secrets.includes(e.id)){save.secrets.push(e.id);save.coins+=15;persist();}toast(`${e.name} · +15 gold. ${e.text}`,7000);}
    if(e.type==='relic')toast(`Lost sheriff badge · ${game.relics} of 3 recovered`);
    if(e.type==='boss-start')toast(`${e.name.toUpperCase()} · The showdown begins`);
    if(e.type==='boss-defeated')toast(`${e.name} is down. Ride through the exit →`);
    if(e.type==='rage')toast('BIG MONEY CHIPS · This isn’t over.');
    if(e.type==='complete'){game.result=settleRun(save,game);persist();results(game.result);}
  }
  game.events=[];
}

function sprite(name,x,y,h,flip=false,alpha=1){
  const im=images[name];if(!im)return;const r=crops[name]||{x:0,y:0,w:im.width,h:im.height},w=h*r.w/r.h;
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);if(flip !== (FRAMES[name]?.baseFacing===-1))ctx.scale(-1,1);
  const omit=FRAMES[name]?.omit;
  if(omit){const scale=h/r.h;ctx.beginPath();ctx.rect(-w/2,-h,w,h);for(const q of omit)ctx.rect(-w/2+(q.x-r.x)*scale,-h+(q.y-r.y)*scale,q.w*scale,q.h*scale);ctx.clip('evenodd');}
  ctx.drawImage(im,r.x,r.y,r.w,r.h,-w/2,-h,w,h);ctx.restore();
}
function shadow(x,y,w){ctx.fillStyle='#160d0844';ctx.beginPath();ctx.ellipse(x,y,w,6,0,0,Math.PI*2);ctx.fill();}
function text(s,x,y,size=12,color='#f8e1ad',align='center',font='Arial'){ctx.font=`bold ${size}px ${font}`;ctx.textAlign=align;ctx.fillStyle=color;ctx.shadowColor='#100b09';ctx.shadowBlur=4;ctx.fillText(s,x,y);ctx.shadowBlur=0;}
function drawStar(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.43:r;const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();}
function drawPlatforms(g){
  const w=g.world;const row=g.chapter===7?2:w.def.bg==='bg_saloon'?1:w.def.bg==='bg_hideout'?3:w.def.bg==='bg_town'?1:0;
  for(const p of w.platforms){
    if(p.x+p.w<g.cam-60||p.x>g.cam+WIDTH+60)continue;
    const name='terrain'+(row*2+(p.oneWay?1:0)),im=images[name],r=crops[name];
    if(!p.oneWay){ctx.fillStyle=['#4d321d','#291d14','#363537','#25201c'][row];ctx.fillRect(p.x,p.y,p.w,p.h);}
    if(im&&r){const h=p.oneWay?58:142,tileW=h*r.w/r.h;ctx.save();ctx.beginPath();ctx.rect(p.x,p.y-5,p.w,p.oneWay?80:p.h+5);ctx.clip();
      const start=p.x+Math.floor(Math.max(0,g.cam-p.x)/tileW)*tileW;
      for(let x=start;x<Math.min(p.x+p.w,g.cam+WIDTH+tileW);x+=tileW-1)ctx.drawImage(im,r.x,r.y,r.w,r.h,x,p.y-3,tileW,h);
      ctx.restore();
    }
  }
}
function drawWell(x,y,active){
  shadow(x,y,48);ctx.fillStyle='#524a3b';ctx.fillRect(x-41,y-52,82,52);ctx.strokeStyle='#b4a17c';ctx.lineWidth=2;
  for(let row=0;row<3;row++)for(let col=0;col<4;col++)ctx.strokeRect(x-40+col*20+(row%2?5:0),y-50+row*16,20,16);
  ctx.fillStyle='#c3b08a';ctx.beginPath();ctx.ellipse(x,y-52,44,12,0,0,7);ctx.fill();ctx.fillStyle=active?'#c59c56':'#221d17';ctx.beginPath();ctx.ellipse(x,y-53,32,7,0,0,7);ctx.fill();
  ctx.fillStyle='#7e5832';ctx.fillRect(x-36,y-110,7,65);ctx.fillRect(x+29,y-110,7,65);ctx.fillRect(x-42,y-116,84,8);ctx.strokeStyle='#b6a078';ctx.beginPath();ctx.moveTo(x,y-108);ctx.lineTo(x,y-55);ctx.stroke();
  if(active)drawStar(x,y-96,10,'#f6cf76');
}

function drawWorld(g){
  const w=g.world,t=g.time,bg=images[w.def.bg];ctx.fillStyle='#19120e';ctx.fillRect(0,0,WIDTH,HEIGHT);
  if(bg){const bh=HEIGHT,bw=bg.width/bg.height*bh,off=-(g.cam*.23)%bw;for(let x=off-bw;x<WIDTH;x+=bw)ctx.drawImage(bg,x,0,bw,bh);}
  if(g.chapter===7){ctx.fillStyle='#57738626';ctx.fillRect(0,0,WIDTH,HEIGHT);}if(g.chapter===5){ctx.fillStyle='#20162050';ctx.fillRect(0,0,WIDTH,HEIGHT);}
  const atmosphere=ctx.createLinearGradient(0,0,0,HEIGHT);atmosphere.addColorStop(0,'#1a100622');atmosphere.addColorStop(.6,'#1a100600');atmosphere.addColorStop(1,'#1a100666');ctx.fillStyle=atmosphere;ctx.fillRect(0,0,WIDTH,HEIGHT);
  const shake=save.settings.motion&&g.shake>0?(Math.random()-.5)*g.shake*32:0;ctx.save();ctx.translate(-Math.round(g.cam)+shake,shake*.4);
  drawPlatforms(g);
  drawSecrets(g);
  for(const c of w.checkpoints){
    drawWell(c.x+25,FLOOR,c.hit);
    text(c.hit?'CHECKPOINT SAVED':'REST & SAVE',c.x+25,FLOOR-140,10,c.hit?'#f8db93':'#e8d8ba');
    if(c.hit){ctx.globalAlpha=.2+.1*Math.sin(t*3);ctx.strokeStyle='#eac777';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(c.x+25,FLOOR-3,58,12,0,0,7);ctx.stroke();ctx.globalAlpha=1;}
  }
  // Signs make the destination legible without relying on the HUD.
  const exit=w.exit;ctx.fillStyle='#493422';ctx.fillRect(exit,FLOOR-112,9,112);ctx.fillStyle='#9b7144';ctx.beginPath();ctx.moveTo(exit-55,FLOOR-126);ctx.lineTo(exit+58,FLOOR-126);ctx.lineTo(exit+80,FLOOR-102);ctx.lineTo(exit+58,FLOOR-78);ctx.lineTo(exit-55,FLOOR-78);ctx.closePath();ctx.fill();text(w.boss&&!w.boss.dead?'LOCKED':'RIDE ON',exit+5,FLOOR-97,13,'#ffe2a7');
  if(!w.boss||w.boss.dead){ctx.globalAlpha=.2+.1*Math.sin(t*3);ctx.fillStyle='#ffdc7b';ctx.fillRect(exit+93,FLOOR-180,4,180);ctx.globalAlpha=1;}
  for(const c of w.pickups){if(c.got||c.x<g.cam-50||c.x>g.cam+WIDTH+50)continue;const bob=Math.sin(t*3+c.x)*4;
    if(c.type==='coin'){ctx.fillStyle='#e2ad4e';ctx.beginPath();ctx.ellipse(c.x,c.y+bob,Math.max(3,Math.abs(Math.cos(t*4+c.x))*11),13,0,0,7);ctx.fill();ctx.strokeStyle='#ffe4a0';ctx.lineWidth=2;ctx.stroke();}
    else if(c.type==='relic'){ctx.save();ctx.shadowColor='#ffc852';ctx.shadowBlur=18;drawStar(c.x,c.y+bob,19,'#f6ca6b');ctx.restore();drawStar(c.x,c.y+bob,10,'#8a562b');text('R',c.x,c.y+5+bob,11,'#f8d78f','center','Georgia');}
    else{ctx.fillStyle='#23402c';ctx.fillRect(c.x-14,c.y-14+bob,28,28);ctx.strokeStyle='#a7c99a';ctx.strokeRect(c.x-14,c.y-14+bob,28,28);ctx.fillStyle='#c5e0b1';ctx.fillRect(c.x-3,c.y-10+bob,6,20);ctx.fillRect(c.x-10,c.y-3+bob,20,6);}
  }
  for(const e of w.enemies){if(e.dead||e.x<g.cam-130||e.x>g.cam+WIDTH+130)continue;shadow(e.x+e.w/2,FLOOR,25);const bob=e.attack==='walk'?Math.sin(e.t*10)*2:0;
    sprite(e.img,e.x+e.w/2,e.y+e.h+bob,e.h+24,e.dir<0,e.flash>0?.5:1);
    if(e.phase==='aim'){text('!',e.x+e.w/2,e.y-37,27,'#ffcb65');ctx.strokeStyle='#ffc96f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x+e.w/2,e.y-47,17,0,7);ctx.stroke();}
    if(e.hp<e.maxHp){ctx.fillStyle='#33251b';ctx.fillRect(e.x,e.y-20,e.w,3);ctx.fillStyle='#e0a667';ctx.fillRect(e.x,e.y-20,e.w*e.hp/e.maxHp,3);}
  }
  const b=w.boss;
  if(b&&!b.dead){
    shadow(b.x+b.w/2,FLOOR,b.w*.6);
    if(b.phase==='tell'){
      ctx.save();ctx.globalAlpha=.45+.15*Math.sin(t*22);ctx.fillStyle='#f9bb58';
      if(b.attack==='slam'){ctx.beginPath();ctx.ellipse(b.targetX+21,FLOOR-5,88,13,0,0,7);ctx.fill();}
      else if(b.attack==='volley'||b.attack==='high'){ctx.fillRect(b.arena-100,FLOOR-(b.attack==='high'?130:37),w.def.length-b.arena+80,5);}
      else if(b.attack==='charge'){ctx.fillRect(Math.min(b.x,b.targetX),FLOOR-5,Math.abs(b.x-b.targetX)+30,5);}
      ctx.restore();text('!',b.x+b.w/2,b.y-38,35,'#ffcf79');
    }
    let frame=b.phase==='tell'?5:b.phase==='attack'?7:1+Math.floor(t*5)%3;
    const name=b.enraged?`${b.prefix}gold${1+Math.floor(t*6)%5}`:`${b.prefix}${frame}`;
    sprite(images[name]?name:`${b.prefix}1`,b.x+b.w/2,b.y+b.h,b.h+20,b.dir<0,b.flash>0&&Math.floor(t*30)%2?.55:1);
  }
  for(const s of g.shots){
    const color=s.friendly?(s.kind==='return'?'#bbf0c0':'#ffe1a3'):'#ff9d76';ctx.fillStyle=color;ctx.strokeStyle=color;
    if(s.kind==='pie'){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(t*7);ctx.fillStyle=s.friendly?'#b9efbd':'#dfae6f';ctx.beginPath();ctx.ellipse(0,0,15,8,0,0,7);ctx.fill();ctx.fillStyle='#684133';ctx.fillRect(-12,-3,24,3);ctx.restore();}
    else if(s.kind==='wave'){ctx.lineWidth=4;ctx.beginPath();ctx.arc(s.x,s.y,14,Math.PI,0);ctx.stroke();}
    else {ctx.save();ctx.shadowColor=color;ctx.shadowBlur=8;ctx.beginPath();ctx.ellipse(s.x,s.y,s.friendly?10:8,s.friendly?3:5,0,0,7);ctx.fill();ctx.globalAlpha=.35;ctx.fillRect(s.x-Math.sign(s.vx)*22,s.y-1,Math.sign(s.vx)*18,2);ctx.restore();}
  }
  const p=g.player;shadow(p.x+p.w/2,FLOOR,24);
  const pimpMode=w.def.training||w.def.meleeOnly;
  let pose='idle',prefix=pimpMode?'rl_sugarwolf_slap_':'rl_sugarwolf_gun_';
  if(p.action>0)pose=p.actionKind==='slap'?'slap2':'shoot';else if(!p.ground)pose='jump';else if(p.roll>0)pose='crouch';else if(Math.abs(p.vx)>35)pose=`walk${1+Math.floor(p.anim*10)%3}`;
  let name=prefix+pose;
  if(pose==='slap2'){
    name='pimp_'+slapPose(p.action);
  }else if(pimpMode&&pose==='idle')name='pimp_ready';else if(pimpMode&&pose==='crouch')name='pimp_low';
  if(!images[name])name=prefix+'idle';
  let alpha=p.invuln>0&&Math.floor(t*14)%2?.45:1;if(g.dead)alpha=.35;
  const playerHeight=109*(crops[name]?.h||480)/480;
  ctx.save();if(FRAMES[name]?.bodyHeight){
    const f=FRAMES[name],scale=109/f.bodyHeight,xScale=scale*(g.items.slap?1.18:1),r=crops[name];
    ctx.translate(p.x+p.w/2,p.y+p.h+2);ctx.scale(p.dir*xScale,scale);ctx.globalAlpha=alpha;
    ctx.beginPath();ctx.rect(r.x-f.anchorX,r.y-f.baseY,r.w,r.h);for(const q of f.omit||[])ctx.rect(q.x-f.anchorX,q.y-f.baseY,q.w,q.h);ctx.clip('evenodd');
    ctx.drawImage(images[name],r.x,r.y,r.w,r.h,r.x-f.anchorX,r.y-f.baseY,r.w,r.h);
  }else if(p.roll>0){ctx.translate(p.x+p.w/2,p.y+p.h-24);ctx.rotate(p.dir*(1-p.roll/.26)*Math.PI*2);sprite(name,0,35,playerHeight,p.dir<0,alpha);}else sprite(name,p.x+p.w/2,p.y+p.h+2,playerHeight,p.dir<0,alpha);ctx.restore();
  if(p.action>0&&p.actionKind==='slap'&&slapPose(p.action)==='extend'){
    const tip=p.x+p.w/2+p.dir*slapReach(p.action,g.items.slap);
    ctx.save();ctx.globalAlpha=.65;ctx.strokeStyle='#ffe1a0';ctx.lineWidth=3;
    for(const dy of [-20,0,20]){ctx.beginPath();ctx.moveTo(tip+p.dir*5,p.y+20+dy);ctx.lineTo(tip+p.dir*18,p.y+20+dy*1.35);ctx.stroke();}ctx.restore();
  }
  if(save.secrets.length===24){drawStar(p.x+p.w/2,p.y-41+Math.sin(t*3)*4,10,'#f8db86');}
  if(g.shield){ctx.strokeStyle='#c8dfa77a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x+p.w/2,p.y+p.h/2,38,60,0,0,7);ctx.stroke();}
  for(const q of g.particles){ctx.globalAlpha=clamp(q.life/q.max,0,1);ctx.fillStyle=q.color;ctx.fillRect(q.x-q.r/2,q.y-q.r/2,q.r,q.r);}ctx.globalAlpha=1;
  for(const f of g.texts){ctx.globalAlpha=Math.min(1,f.life*2);text(f.text,f.x,f.y,12,f.color);}ctx.globalAlpha=1;ctx.restore();
  if(g.dead){ctx.fillStyle='#160c08aa';ctx.fillRect(0,0,WIDTH,HEIGHT);text('BACK IN THE SADDLE…',WIDTH/2,HEIGHT/2,30,'#efd4a1','center','Georgia');}
  if(g.combo>1&&g.comboTimer>0)text(`${g.combo}×  QUICK JUSTICE`,WIDTH-32,HEIGHT-120,17,'#f4d28a','right');
  // Fine dust drifts at a fixed cost, away from the combat silhouette.
  if(save.settings.motion){ctx.fillStyle='#f4dbad55';for(let i=0;i<14;i++){const x=(i*107+t*12)%WIDTH,y=170+(i*59)%270+Math.sin(t+i)*5;ctx.fillRect(x,y,2,2);}}
}
function render(){
  ctx.setTransform(canvas.width/WIDTH,0,0,canvas.height/HEIGHT,0,0);ctx.imageSmoothingEnabled=true;
  if(game)drawWorld(game);else{ctx.fillStyle='#17130f';ctx.fillRect(0,0,WIDTH,HEIGHT);}
}
function resize(){
  const dpr=Math.min(devicePixelRatio||1,1.5),factor=Math.min(innerWidth/WIDTH,innerHeight/HEIGHT)*dpr;
  canvas.width=Math.round(WIDTH*factor);canvas.height=Math.round(HEIGHT*factor);render();
}
addEventListener('resize',resize);
function frame(now){
  const delta=Math.min((now-lastTime)/1000,.1);lastTime=now;
  if(mode==='playing'&&game){
    accumulator+=delta;let first=true,input;
    while(accumulator>=1/60&&mode==='playing'){
      if(first){input=readInput();first=false;}else input={...input,jump:false,roll:false,reload:false,interact:false};
      if(mode!=='playing')break;game.step(1/60,input);processEvents();accumulator-=1/60;
    }
    updateHud();render();
  }else{accumulator=0;pollMenuPad(now);}
  requestAnimationFrame(frame);
}
async function loadAssets(){
  let count=0;const failures=[];const entries=Object.entries(ASSETS);
  await Promise.all(entries.map(([name,url])=>new Promise(resolve=>{
    const im=new Image();im.onload=()=>{images[name]=im;done();};im.onerror=()=>{failures.push(name);done();};
    const done=()=>{count++;$('loading-progress').style.width=`${count/entries.length*100}%`;$('loading-text').textContent=`Packing the saddle · ${Math.round(count/entries.length*100)}%`;resolve();};im.src=url;
  })));
  if(failures.length){$('loading').innerHTML=`<div class="load-error"><h2>The wagon lost a wheel.</h2><p>Some game art couldn’t load. Check your connection and try again.</p><button class="primary" id="retry-load">Try again</button></div>`;$('retry-load').onclick=()=>location.reload();console.error('Missing assets:',failures);return;}
  // Trim transparent padding inside source rectangles, retaining original PNG data.
  const sheetPixels={};
  for(const [name,r] of Object.entries(FRAMES)){
    const im=images[r.sheet];images[name]=im;
    if(!sheetPixels[r.sheet]){const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(im,0,0);sheetPixels[r.sheet]=cx.getImageData(0,0,c.width,c.height).data;}
    const pixels=sheetPixels[r.sheet];let x0=r.x+r.w,y0=r.y+r.h,x1=r.x,y1=r.y;
    for(let y=r.y;y<Math.min(im.height,r.y+r.h);y++)for(let x=r.x;x<Math.min(im.width,r.x+r.w);x++)if(pixels[(y*im.width+x)*4+3]>80&&!r.omit?.some(q=>x>=q.x&&x<q.x+q.w&&y>=q.y&&y<q.y+q.h)){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
    crops[name]={x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};
  }
  assetsReady=true;$('loading').hidden=true;resize();home();lastTime=performance.now();requestAnimationFrame(frame);
  if(!storageOK)toast('Browser storage is unavailable. Progress will last for this session.');
}
loadAssets();

function drawSecrets(g){
  for(const s of g.secrets){
    if(s.x<g.cam-80||s.x>g.cam+WIDTH+80)continue;ctx.save();ctx.translate(s.x,s.y);
    const gold=s.found?'#d9bb7a':'#95795a',wood='#57402c',light='#ccb085';ctx.fillStyle=wood;ctx.strokeStyle=light;ctx.lineWidth=2;
    if(s.kind==='hack'){
      sprite(s.found?'hack_tip':'hack_idle',0,0,133,g.player.x<s.x);
      text('HACK BENJAMIN',0,-150,10,'#e8cf96');
    }else if(s.kind==='population'){
      ctx.fillRect(-38,-94,7,94);ctx.fillRect(31,-94,7,94);ctx.fillStyle='#ae8451';ctx.fillRect(-63,-116,126,81);ctx.strokeRect(-63,-116,126,81);
      text('MUD BUG',0,-92,15,'#26180e');text('POPULATION',0,-71,9,'#302013');text(String(Math.max(1,69-g.kills)),0,-46,21,'#26180e');
    }else if(s.kind==='bucket'||s.kind==='pot'||s.kind==='jar'){
      ctx.fillStyle=s.kind==='jar'?'#788b7c':gold;ctx.beginPath();ctx.moveTo(-16,-34);ctx.lineTo(16,-34);ctx.lineTo(12,0);ctx.lineTo(-12,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#3e342a';ctx.strokeRect(-15,-31,30,4);if(s.kind==='bucket')drawStar(0,-18,7,'#dfb46c');
    }else if(s.kind==='sign'||s.kind==='paper'){
      ctx.fillRect(-3,-54,6,54);ctx.fillStyle=s.kind==='paper'?'#c5b185':'#886343';ctx.fillRect(-26,-66,52,39);ctx.fillStyle='#49351f';for(let i=0;i<3;i++)ctx.fillRect(-16,-57+i*8,32-i*6,2);if(s.found)drawStar(0,-46,10,'#e9c87d');
    }else if(s.kind==='cactus'){
      ctx.strokeStyle=s.found?'#a7b475':'#727e55';ctx.lineWidth=11;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(0,-62);ctx.moveTo(0,-26);ctx.lineTo(-19,-26);ctx.lineTo(-19,-42);ctx.moveTo(0,-39);ctx.lineTo(17,-39);ctx.lineTo(17,-56);ctx.stroke();if(s.found){ctx.fillStyle='#e5ad9e';ctx.beginPath();ctx.arc(0,-65,7,0,7);ctx.fill();}
    }else if(s.kind==='hitch'){
      ctx.fillRect(-25,-56,7,56);ctx.fillRect(22,-56,7,56);ctx.fillStyle=gold;ctx.fillRect(-34,-62,72,10);ctx.strokeStyle='#bca47c';ctx.beginPath();ctx.arc(9,-53,12,0,Math.PI*1.5);ctx.stroke();
    }else if(s.kind==='barrel'){
      ctx.fillStyle='#8a6240';ctx.beginPath();ctx.ellipse(0,-26,24,29,0,0,7);ctx.fill();ctx.fillStyle='#46382a';ctx.fillRect(-23,-45,46,5);ctx.fillRect(-23,-13,46,5);ctx.strokeStyle='#b19057';ctx.beginPath();ctx.ellipse(0,-51,17,5,0,0,7);ctx.stroke();
    }else if(s.kind==='jail'){
      ctx.fillStyle='#7f786d';ctx.fillRect(-22,-32,44,32);ctx.fillStyle='#211d19';ctx.fillRect(-17,-26,34,26);ctx.fillStyle='#aaa194';for(let x=-12;x<20;x+=9)ctx.fillRect(x,-26,3,26);if(!s.found){ctx.fillStyle='#b5a78c';ctx.beginPath();ctx.ellipse(2,-6,5,3,0,0,7);ctx.fill();}
    }else if(s.kind==='hat'){
      ctx.fillStyle=gold;ctx.fillRect(-12,-28,25,22);ctx.beginPath();ctx.ellipse(0,-6,29,6,0,0,7);ctx.fill();ctx.fillStyle='#3d2b20';ctx.fillRect(-13,-14,26,5);
    }else if(s.kind==='piano'){
      ctx.fillStyle='#4f3526';ctx.fillRect(-34,-64,68,55);ctx.fillRect(-31,-15,7,15);ctx.fillRect(25,-15,7,15);ctx.fillStyle='#d3c5a5';ctx.fillRect(-32,-29,64,12);ctx.fillStyle='#241b15';for(let x=-25;x<30;x+=9)ctx.fillRect(x,-29,4,7);
    }else if(s.kind==='chair'){
      ctx.fillRect(-19,-57,6,57);ctx.fillRect(15,-28,6,28);ctx.fillRect(-19,-57,40,7);ctx.fillRect(-19,-32,40,7);ctx.fillRect(-19,-21,40,7);
    }else if(s.kind==='bell'){
      ctx.fillRect(-3,-65,6,65);ctx.fillRect(-3,-65,34,5);ctx.fillStyle=gold;ctx.beginPath();ctx.moveTo(17,-58);ctx.lineTo(31,-58);ctx.lineTo(38,-30);ctx.lineTo(10,-30);ctx.closePath();ctx.fill();ctx.beginPath();ctx.arc(24,-27,4,0,7);ctx.fill();
    }else if(s.kind==='chicken'){
      ctx.fillStyle='#e6d9b6';ctx.beginPath();ctx.ellipse(0,-16,17,12,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(14,-30,9,0,7);ctx.fill();ctx.fillStyle='#b24c39';ctx.fillRect(11,-43,6,7);ctx.fillStyle='#d4a252';ctx.fillRect(22,-30,8,4);ctx.fillRect(-5,-5,3,5);ctx.fillRect(5,-5,3,5);
    }else if(s.kind==='crate'){
      ctx.fillStyle='#8b6848';ctx.fillRect(-23,-43,46,43);ctx.strokeStyle=light;ctx.strokeRect(-23,-43,46,43);ctx.beginPath();ctx.moveTo(-22,-42);ctx.lineTo(22,-1);ctx.moveTo(22,-42);ctx.lineTo(-22,-1);ctx.stroke();
    }else{
      ctx.fillStyle='#93866c';ctx.beginPath();ctx.moveTo(-24,0);ctx.lineTo(-16,-19);ctx.lineTo(8,-25);ctx.lineTo(27,0);ctx.closePath();ctx.fill();
    }
    if(!s.found){ctx.globalAlpha=.45+.4*Math.sin(g.time*3+s.x);drawStar(25,-74,4,'#f4ce7e');ctx.globalAlpha=1;}
    if(s.fx>0){
      const t=4-s.fx;ctx.globalAlpha=Math.min(1,s.fx);
      if(s.effect==='notes'){for(let i=0;i<4;i++)text('♪',Math.sin(t*2+i)*28,-70-t*19-i*15,19,'#e9ce8c');}
      else if(s.effect==='horse'){ctx.setLineDash([7,7]);ctx.strokeStyle='#eddbb588';ctx.beginPath();ctx.ellipse(0,-90,48,20,0,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(29,-90);ctx.lineTo(45,-125);ctx.lineTo(61,-116);ctx.moveTo(-28,-78);ctx.lineTo(-32,-44);ctx.moveTo(28,-78);ctx.lineTo(32,-44);ctx.stroke();}
      else if(s.effect==='mustache'){ctx.fillStyle='#241711';ctx.beginPath();ctx.ellipse(-12,-80,16,7,-.2,0,7);ctx.ellipse(12,-80,16,7,.2,0,7);ctx.fill();}
      else if(s.effect==='chickens')for(let i=0;i<4;i++)text('EGG',-60+i*38,-70-Math.abs(Math.sin(t*3+i))*25,10,'#efe1b3');
      else if(s.effect==='tumbleweeds'){ctx.strokeStyle='#ceac78';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(t*65+i*35-80,-15,13,0,7);ctx.stroke();}}
      else if(s.effect==='boot'){ctx.fillStyle='#574031';ctx.fillRect(t*10,-90-Math.sin(t)*40,14,30);ctx.fillRect(t*10,-65-Math.sin(t)*40,28,9);}
      else if(s.effect==='ghost'){ctx.fillStyle='#f5e4c177';ctx.beginPath();ctx.arc(0,-80-Math.sin(t*2)*10,16,Math.PI,0);ctx.lineTo(16,-48);ctx.lineTo(0,-54);ctx.lineTo(-16,-48);ctx.fill();}
      else {for(let i=0;i<5;i++)drawStar(Math.sin(i+t)*40,-55-t*12-i*7,5,'#e8c575');}
    }
    ctx.restore();
  }
}
