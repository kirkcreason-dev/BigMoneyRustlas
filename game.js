import { SoundEngine } from './src/audio.js';
import { Game, BOUNTIES, bountyProgress, SLAP_DURATION, slapPose, slapReach, CHAPTERS, ENEMIES, BOSSES, UPGRADES, DIFFICULTIES, WIDTH, HEIGHT, FLOOR, clamp, defaultSave, sanitizeSave, settleRun, purchase } from './src/core.js';

import { SECRETS } from './src/secrets.js';
import { ASSETS, FRAMES, backgroundUrl } from './src/assets.js';
import { canvasSize, prepareArtwork, prepareScenery } from './src/presentation.js';

const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false});
const WORLD_ZOOM=1.12;
const SAVE_KEY='rustlas_save_v2';
let save=defaultSave(),storageOK=true,game=null,mode='loading',menuReturn='home',lastTime=0,accumulator=0,toastTimer,introTimers=[],assetsReady=false;
const images={},crops={},spriteViews={},keys=new Set(),touchHeld=new Set(),edges={},previousPad={},holdPointers=new Map();
let touchDevice=matchMedia('(pointer:coarse)').matches,padConnected=false,hudCache={};
let scenery={backgrounds:{},tiles:{}},lastHudTime=0;
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const effectsEnabled=()=>save.settings.motion&&!motionPreference.matches;
const hudElements=Object.fromEntries([...document.querySelectorAll('#hud [id]')].map(el=>[el.id,el]));
const atmosphere=ctx.createLinearGradient(0,0,0,HEIGHT);
atmosphere.addColorStop(0,'#1a100608');atmosphere.addColorStop(.6,'#1a100600');atmosphere.addColorStop(1,'#1a100666');
try { const raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem('rustlas_save_v1');save=sanitizeSave(raw?JSON.parse(raw):null); } catch {storageOK=false;}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch{if(storageOK)toast('Saving is unavailable in this browser. Keep this tab open to continue.');storageOK=false;}}
function saveRun(){if(game&&!game.complete){save.run=game.snapshot();persist();}}
function toast(message,duration=3200){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),duration);}
function fmtTime(n){return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;}
function hintText(text){return touchDevice||save.settings.touch?text.replace('A / D to move · SPACE to jump','Arrows to move · JUMP to leap').replace('Hold J to fire · R to reload · K to slap','Hold FIRE · ↻ to reload · SLAP to strike').replace('SHIFT to dodge','DODGE to roll').replace('K returns','SLAP returns').replace('J / K','FIRE / SLAP').replace('press Q','tap HIGH NOON').replace('K / slap','SLAP').replace('K ·','SLAP ·').replace('E ·','LOOK ·'):text;}
function clearInput(){keys.clear();touchHeld.clear();for(const key of Object.keys(edges))delete edges[key];holdPointers.clear();document.querySelectorAll('#touch .pressed,#noon-button.pressed').forEach(b=>b.classList.remove('pressed'));const pad=[...(navigator.getGamepads?.()||[])].find(p=>p?.connected);for(const i of [0,1,4,5,6,9])previousPad[i]=!!pad?.buttons[i]?.pressed;menuPadDown=[0,1,9].some(i=>pad?.buttons[i]?.pressed);}

const audio=new SoundEngine(()=>save.settings,()=>game,()=>mode==='playing');

const btn=(label,action,kind='secondary',extra='')=>`<button class="${kind}" data-action="${action}" ${extra}>${label}</button>`;
const header=(eyebrow,title,sub='',right='')=>`<div class="panel-header"><div class="panel-heading"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}</div>${right||btn('← Back','home','text-button')}</div>`;
const balance=()=>`<div class="balance"><small>YOUR GOLD</small>◈ ${save.coins}</div>`;
function show(html,nextMode){
  for(const timer of introTimers)clearTimeout(timer);introTimers=[];
  mode=nextMode;clearInput();accumulator=0;$('menu').innerHTML=html;$('menu').scrollTop=0;$('menu').setAttribute('aria-label',nextMode==='playing'?'Game':nextMode+' menu');
  if(game)for(const key of ['jumpBuffer','rollBuffer','slapBuffer','fireBuffer'])game.player[key]=0;
  for(const cv of $('menu').querySelectorAll('[data-portrait]')){const name=cv.dataset.portrait,im=images[name],r=crops[name];if(im&&r){const c=cv.getContext('2d'),h=570,w=h*r.w/r.h;const view=spriteViews[name],scale=h/r.h;c.drawImage(view,0,0,view.width,view.height,(480-w)/2-2*scale,600-h-2*scale,w+4*scale,h+4*scale);}}
  const playing=mode==='playing';$('hud').hidden=!playing;$('touch').hidden=!playing||!(touchDevice||save.settings.touch);$('hint').hidden=!playing;
  document.body.classList.toggle('touch-mode',touchDevice||save.settings.touch);
  if(playing){audio.musicPlay();$('hint').textContent=hintText(game.secretPrompt||game.lastSign);document.body.classList.toggle('melee-only',!!(game.world.def.training||game.world.def.meleeOnly));}else{audio.pause(mode==='paused');}
  if(html)requestAnimationFrame(()=>{const el=$('menu').querySelector('button.primary:not(:disabled)')||$('menu').querySelector('button:not(:disabled),select,input[type=range]');el?.focus({preventScroll:true});});
}
function intro(){
  clearTimeout(toastTimer);$('toast').classList.remove('show');
  const still=!save.settings.motion||matchMedia('(prefers-reduced-motion: reduce)').matches;
  show(`<div class="studio-intro ${still?'intro-still':''}" data-intro="studio"><h1 class="sr-only">CREASO·NORSE presents Big Money Rustlas</h1><div class="intro-stage intro-studio" aria-hidden="true"><span class="intro-overline">A GAME BY</span><img src="${ASSETS.studio}" alt="" width="444" height="90"><span class="intro-rule"></span><span class="intro-presents">PRESENTS</span></div><div class="intro-stage intro-game" aria-hidden="true"><img src="${ASSETS.logo}" alt="" width="1774" height="887"><span class="intro-game-label">THE FIRST OFFICIAL VIDEO GAME</span><p>A badge. Six bullets. A town to take back.</p></div><div class="intro-bottom"><span>CREASO·NORSE</span>${btn('Skip intro →','skip-intro','intro-skip')}</div></div>`,'intro');
  introTimers.push(setTimeout(()=>{const screen=$('menu').querySelector('.studio-intro');if(mode==='intro'&&screen)screen.dataset.intro='game';},2700));
  introTimers.push(setTimeout(()=>{if(mode==='intro')home();},6100));
}
function home(){
  const continuation=save.run?`CONTINUE CHAPTER ${save.run.chapter}`:save.unlocked>1&&!save.beaten?`RIDE ON · CHAPTER ${save.unlocked}`:save.beaten?'RIDE AGAIN':'START YOUR STORY';
  show(`<div class="home"><header class="topbar"><div class="brand-mark"><img src="icon.svg" alt="Sheriff star"><span>BIG MONEY RUSTLAS</span></div><div class="topbar-right"><span class="official">THE FIRST OFFICIAL VIDEO GAME</span>${btn('⚙','settings','icon-button','aria-label="Settings"')}</div></header><div class="title-lockup"><h1><img class="title-wordmark" src="${ASSETS.logo}" alt="Big Money Rustlas"></h1><span class="title-kicker">THE OFFICIAL GAME</span></div><div class="home-bottom"><p class="home-tagline">A BADGE. SIX BULLETS. A TOWN TO TAKE BACK.</p><div class="button-row">${btn(`${continuation} <span aria-hidden="true">→</span>`,'continue','primary')}${btn('Chapter select','chapters')}${btn('The general store','shop')}${btn('Bounty board','bounties')}${btn('Trail secrets','journal')}</div><p class="save-label">${save.run?'Your checkpoint is waiting.':save.beaten?'Mud Bug is free. There’s still gold in those hills.':'Eight chapters. Four showdowns. Twenty-four dirty little secrets.'}</p><footer class="home-foot"><button class="studio-brand" data-action="intro" aria-label="Replay CREASO NORSE intro"><img src="${ASSETS.studio}" alt="CREASO·NORSE" width="444" height="90"></button><span>KEYBOARD · CONTROLLER · TOUCH</span>${btn('Field guide','guide','text-button')}<button class="text-button" data-action="credits" style="padding:0;font-size:9px">CREDITS / V2.5</button></footer></div></div>`,'home');
}
function chapters(){
  const completed=Object.keys(save.best).length,badges=Object.values(save.best).reduce((n,b)=>n+b.relics,0);
  show(`<div class="panel-screen">${header('THE ROAD TO MUD BUG','Every town has a story.','Choose a chapter. Find every lost badge. Earn your legend.',balance())}<div class="map-grid">${CHAPTERS.map((c,i)=>{const n=i+1,locked=n>save.unlocked,b=save.best[n];return `<button class="chapter-card ${locked?'locked':''} ${n===save.unlocked?'current':''}" data-action="chapter:${n}" ${locked?'disabled':''} aria-label="Chapter ${n}: ${c.name}${locked?', locked':''}"><div class="chapter-art" style="background-image:url('${backgroundUrl(c.bg)}')"><span class="chapter-number">${String(n).padStart(2,'0')}</span><span class="chapter-type">${locked?'LOCKED':c.boss?'SHOWDOWN':'CHAPTER'}</span></div><div class="chapter-info"><h3>${c.name}</h3><div class="chapter-meta"><span>${locked?'FINISH PREVIOUS CHAPTER':b?`${'★'.repeat(b.relics)}${'☆'.repeat(3-b.relics)}`:c.place}</span><span>${b?fmtTime(b.time):locked?'': '→'}</span></div><div class="chapter-bounties">${locked?'':`${BOUNTIES.filter(b=>b.chapter===n&&save.bounties.includes(b.id)).length}/3 BOUNTIES CLAIMED`}</div></div></button>`;}).join('')}</div><div class="panel-footer"><span>${completed}/8 CHAPTERS CLEARED · ${badges}/24 LOST BADGES</span><div class="button-row">${btn('General store','shop','text-button')}${btn('← Main menu','home','secondary')}</div></div></div>`,'chapters');
}
function story(chapter){
  if(chapter>save.unlocked)return;const c=CHAPTERS[chapter-1];
  const portrait=c.boss?`${BOSSES[c.boss].prefix}1`:c.training?'rl_sanchez_arms_crossed':'rl_sugarwolf_gun_idle';
  show(`<div class="story-screen"><div class="story-art" style="background-image:url('${backgroundUrl(c.bg)}')"><span class="chapter-stamp">CHAPTER ${String(chapter).padStart(2,'0')}</span><canvas class="story-portrait" data-portrait="${portrait}" width="480" height="600" aria-label="${c.boss?BOSSES[c.boss].name:c.training?'Sanchez':'Sugar Wolf'}"></canvas></div><div class="story-copy"><span class="eyebrow">${c.place} / ${c.boss?'WANTED DEAD OR DEFEATED':'THE STORY SO FAR'}</span><h2>${c.name}</h2><div class="story-quote">“${c.quote}”</div><p>${c.story}</p><div class="mission"><b>YOUR MISSION</b>${c.objective}</div>${bountyStrip(chapter)}<div class="button-row">${btn('Saddle up →',`start:${chapter}`,'primary')}${btn('← Chapters','chapters','text-button')}</div><p class="tiny" style="margin-bottom:0">${DIFFICULTIES[save.settings.difficulty].name.toUpperCase()} · 3 LOST BADGES · CHECKPOINTS SAVE AUTOMATICALLY</p></div></div>`,'story');
}
function start(chapter,resume=false){
  audio.init();game=new Game(chapter,save.settings,save.items,resume?save.run:null);game.viewWidth=WIDTH/WORLD_ZOOM;save.run=game.snapshot();persist();hudCache={};for(const secret of game.secrets)secret.found=save.secrets.includes(secret.id);
  show('','playing');$('hint').textContent='';updateHud();toast(resume?'Back in the saddle.':`Chapter ${chapter} · ${CHAPTERS[chapter-1].name}`);lastTime=performance.now();
}
function resume(){show('','playing');lastTime=performance.now();}
function pause(){
  if(!game||game.complete)return;saveRun();
  show(`<div class="center-screen"><div class="dialog"><span class="eyebrow">TAKE A BREATHER, SHERIFF</span><div class="pause-layout"><div><h2>Hold your fire.</h2><div class="pause-menu">${btn('Back in the saddle','resume','primary')}${btn('Restart chapter','restart')}${btn('Bounty board','bounties')}${btn('Trail secrets','journal')}${btn('Field guide','guide')}${btn('Settings','settings')}${btn('Save & quit','quit')}</div></div><div class="pause-info"><span class="eyebrow">CHAPTER ${game.chapter}</span><h3>${game.world.def.name}</h3><p>GOLD ON THE TRAIL</p><strong>◈ ${game.coins}</strong><p>LOST BADGES</p><strong>${game.relics} / 3</strong><p>TRAIL SCORE</p><strong>${game.score.toLocaleString()}</strong>${bountyStrip(game.chapter,game)}<p>Your last checkpoint and collected items are saved. Gold is banked when the chapter is complete.</p></div></div></div></div>`,'paused');
}
function shop(){
  show(`<div class="panel-screen">${header('MUD BUG GENERAL STORE','A little edge goes a long way.','Spend the gold you earn. Every upgrade stays with you.',balance())}<div class="shop-grid">${UPGRADES.map(it=>{const owned=save.items[it.id],afford=save.coins>=it.cost;return `<article class="shop-item ${owned?'owned':''}"><div class="symbol" aria-hidden="true">${it.symbol}</div><h3>${it.name}</h3><p>${it.desc}</p>${btn(owned?'✓ EQUIPPED':afford?`BUY · ◈ ${it.cost}`:`◈ ${it.cost} · NEED ${it.cost-save.coins} MORE`,`buy:${it.id}`,'primary',owned||!afford?'disabled':'')}</article>`;}).join('')}</div><footer class="panel-footer"><span>UPGRADES APPLY WHEN YOU ENTER A CHAPTER.<br>NO ADS. NO REAL-MONEY PURCHASES.</span>${btn('← Back',`back:${menuReturn}`,'secondary')}</footer></div>`,'shop');
}
function settings(){
  const s=save.settings;
  const volume=(key,label)=>`<div class="settings-row volume-row"><label for="${key}">${label}</label><div><input id="${key}" type="range" min="0" max="100" step="5" value="${s[key]}"><output id="${key}-value" for="${key}">${s[key]}%</output></div></div>`;
  const toggle=(key,title,desc)=>`<div class="settings-row"><div><strong>${title}</strong><small>${desc}</small></div>${btn(s[key]?'ON':'OFF',`toggle:${key}`,`toggle ${s[key]?'':'off'}`,`aria-pressed="${s[key]}" aria-label="${title}"`)}</div>`;
  show(`<div class="center-screen"><div class="dialog settings-dialog"><span class="eyebrow">MAKE YOURSELF AT HOME</span><h2>Settings</h2><div class="settings-row"><div><strong>Difficulty</strong><small id="difficulty-desc">${DIFFICULTIES[s.difficulty].description}<br>Applies to newly started chapters.</small></div><select id="difficulty" aria-label="Difficulty">${Object.entries(DIFFICULTIES).map(([id,d])=>`<option value="${id}" ${s.difficulty===id?'selected':''}>${d.name}</option>`).join('')}</select></div>${toggle('sound','Sound effects','Layered gunfire, elastic slaps, footsteps, and ambience.')}${toggle('music','Music','Fingerpicked guitar, bass, and a faster showdown rhythm.')}${volume('soundVolume','Effects volume')}${volume('musicVolume','Music volume')}<div class="sound-preview">${btn('Test sounds','sound-preview','secondary')}<span id="sound-status" role="status">Play a short effects preview.</span></div>${toggle('motion','Screen effects','Camera shake and impact accents. Respects reduced-motion preferences.')}${toggle('touch','Show touch controls','Touch devices show these automatically.')}<div class="button-row settings-actions">${btn('Done',`back:${menuReturn}`,'primary')}${btn('Reset progress','reset','text-button')}</div></div></div>`,'settings');
  for(const key of ['soundVolume','musicVolume'])$(key).addEventListener('input',e=>{save.settings[key]=Number(e.target.value);$(key+'-value').textContent=save.settings[key]+'%';audio.applySettings();persist();});
  $('difficulty').addEventListener('change',e=>{save.settings.difficulty=e.target.value;persist();$('difficulty-desc').innerHTML=`${DIFFICULTIES[e.target.value].description}<br>Applies to newly started chapters.`;});
}
function guide(){
  show(`<div class="panel-screen">${header('THE SHERIFF’S FIELD GUIDE','Stay quick. Shoot straight.','Everything you need to take Mud Bug back.')}<div class="guide-grid"><div><h3>The controls</h3><div class="key-table"><span>Move</span><span><kbd>A</kbd> <kbd>D</kbd> / <kbd>←</kbd> <kbd>→</kbd></span><span>Jump · hold for height</span><span><kbd>SPACE</kbd> / <kbd>W</kbd> / <kbd>↑</kbd></span><span>Fire · hold to keep shooting</span><span><kbd>J</kbd> / <kbd>X</kbd></span><span>Slap · return incoming bullets</span><span><kbd>K</kbd> / <kbd>C</kbd></span><span>High Noon · unleash a full meter</span><kbd>Q</kbd><span>Reload your six-shooter</span><kbd>R</kbd><span>Dodge · brief invulnerability</span><kbd>SHIFT</kbd><span>Drop through a platform</span><span><kbd>S</kbd> / <kbd>↓</kbd></span><span>Inspect something suspicious</span><kbd>E</kbd><span>Pause</span><span><kbd>ESC</kbd> / <kbd>P</kbd></span></div><div class="guide-note">Controller: left stick / D-pad to move, A to jump, X or RT to fire, Y to slap, B to dodge, LB to reload, LT to inspect, RB for High Noon, Start to pause. Touch controls appear on phones and tablets.</div></div><div><h3>A few things to remember</h3><p><b>Six bullets. Unlimited nerve.</b> Your revolver reloads automatically when empty. Reload before a showdown. You have unlimited reserve ammunition.</p><p><b>A slap beats a bullet.</b> Slap incoming shots to return them for triple damage. Your arm stretches across the street: wind up, let the palm connect, then recover. Dodge cancels the swing. Slap and dodge meters show when you can act again; a tap just before they refill is remembered. From chapter seven onward, your injured gun hand makes the pimp hand your only weapon.</p><p><b>Make it High Noon.</b> Combat, returned shots, badges, and gold stashes charge your meter. Press Q, controller RB, or the High Noon button when full for five seconds of faster firing and stronger, faster slaps. It refills your revolver, but you still need to dodge.</p><p><b>Break into Chips’ fortune.</b> Three star-stamped gold stashes sit along each trail. Shoot or slap them for gold and High Noon charge. The bounty board offers 24 optional challenges, each worth 20 extra gold once you finish the chapter.</p><p><b>Watch the warning.</b> Enemies flash a gold tell before attacking. Bosses have a recovery window. Dodge through a charge or jump a low volley.</p><p><b>Wells are your lifeline.</b> They restore health and ammunition, and save your checkpoint. Health packs stay on the trail until you need them. Falling costs a heart. Losing all hearts sends you back with your collected loot intact.</p><p><b>Look up.</b> Each chapter hides three lost sheriff badges. Recover them for bonus gold. Clear without dying to earn a clean-run mark, then replay for a faster time and higher score.</p><p><b>The frontier is deeply weird.</b> Inspect odd props with E, slap suspicious objects, or hold down to pay your respects. Each of 24 secrets earns 15 gold once and an entry in your trail journal. Find them all to become Tumbleweed Marshal.</p><p><b>Gold buys a permanent advantage.</b> It is banked when you finish a chapter. Visit the general store between chapters to improve your gear.</p></div></div><div class="panel-footer"><span>PROGRESS SAVES ON THIS BROWSER AND DEVICE.</span>${btn('Let’s ride',`back:${menuReturn}`,'primary')}</div></div>`,'guide');
}
function results(result){
  const final=game.chapter===8,c=game.world.def;
  show(`<div class="center-screen"><div class="dialog"><span class="eyebrow">CHAPTER ${game.chapter} COMPLETE / ${result.first?'FIRST CLEAR':'BACK FOR MORE'}</span><h2>${final?'The town is yours.':'That’s a day’s work.'}</h2><p>${c.name} is behind you. ${final?'Chips has played his last hand.':'There’s more trouble down the road.'}</p><div class="stats"><div class="stat"><strong>${fmtTime(result.time)}</strong><span>TRAIL TIME</span></div><div class="stat"><strong>${result.score.toLocaleString()}</strong><span>SCORE</span></div><div class="stat"><strong>+${result.reward}</strong><span>GOLD BANKED</span></div><div class="stat"><strong>${result.relics}/3</strong><span>LOST BADGES</span></div></div><div class="awards"><span class="award">★ CHAPTER CLEARED</span><span class="award ${result.relics===3?'':'missing'}">${result.relics===3?'★':'☆'} BADGE COLLECTOR</span><span class="award ${result.deaths===0?'':'missing'}">${result.deaths===0?'★':'☆'} NO DEATHS</span></div><div class="bounty-results"><span class="eyebrow">${result.bounties.length?`NEW BOUNTIES · +${result.bountyGold} GOLD INCLUDED`:'BOUNTIES ON THIS TRAIL'}</span>${bountyStrip(game.chapter,game)}</div><div class="run-summary"><span><b>${result.bestCombo||0}×</b> BEST STREAK</span><span><b>${result.parries||0}</b> SHOTS RETURNED</span></div><div class="button-row">${btn(final?'The final word →':'Next chapter →',final?'ending':`chapter:${game.chapter+1}`,'primary')}${btn('General store','shop')}${btn('Ride this trail again',`chapter:${game.chapter}`)}${btn('Chapters','chapters','text-button')}</div></div></div>`,'results');
}
function ending(){
  show(`<div class="center-screen ending"><div class="dialog"><span class="eyebrow">MUD BUG IS FREE</span><h2>Some legends<br>run in the family.</h2><p>Chips falls. Beneath the gold and the paint is Grizzly Wolf—Sugar’s own father. The truth lands harder than any bullet. But the badge still means something.</p><p>With the town free and the road quiet, Sugar Wolf rides into the sunset. Mud Bug will remember its sheriff.</p><div class="story-quote">“A town worth saving. A story worth telling.”</div><div class="credits">BIG MONEY RUSTLAS<br>THE FIRST OFFICIAL VIDEO GAME<br><br>You completed all eight chapters. Return to the trail to find all 24 lost badges and set new records.</div><div class="button-row">${btn('Back to the trail','chapters','primary')}${btn('Credits','credits')}</div></div></div>`,'ending');
}
function credits(){
  show(`<div class="center-screen"><div class="dialog"><span class="eyebrow">THE FIRST OFFICIAL VIDEO GAME</span><h2>Big Money Rustlas</h2><p>Sugar Wolf’s story, from the dusty road to the last showdown in Mud Bug.</p><div class="credits-studio"><img src="${ASSETS.studio}" alt="CREASO·NORSE" width="444" height="90"></div><div class="credits">A CREASO·NORSE GAME<br><br>FEATURING<br>Sugar Wolf · Big Baby Chips · Dirty Sanchez<br>Raw Stank · Dusty Poot · Tank · Hack Benjamin<br><br>BASED ON BIG MONEY RUSTLAS<br>Licensed title and fictional characters.<br>Original poster styling, illustrated worlds, and character animation.<br>Sugar Wolf · Shaggy 2 Dope<br>Big Baby Chips · Violent J<br>Hack Benjamin · Jumpsteady<br>Other characters use original covered-face designs.<br>Original sound design and adaptive guitar score.<br>Rye typeface © Sorkin Type Co · SIL Open Font License.<br>24 frontier secrets, movie callbacks, and original encounters.<br><br>GAME EDITION<br>Eight-chapter campaign · Version 2.5<br><br>Thanks for riding with us.</div><div class="button-row">${btn('Main menu','home','primary')}${btn('Replay intro','intro')}${save.beaten?btn('Chapter select','chapters'):''}</div></div></div>`,'credits');
}
function journal(){
  const all=save.secrets.length===SECRETS.length;
  show(`<div class="panel-screen">${header('THE THINGS THIS TOWN DOESN’T ADVERTISE',all?'Tumbleweed Marshal.':'The trail gets weird.',`${save.secrets.length} / 24 secrets discovered. Each new discovery earns 15 gold.`,balance())}${all?'<div class="guide-note">The Tumbleweed Council has granted you its highest honor. A gold star follows your sheriff on every future ride.</div>':''}<div class="journal-grid">${SECRETS.map((s,i)=>{const found=save.secrets.includes(s.id);return `<article class="journal-entry ${found?'found':''}"><span class="eyebrow">${String(i+1).padStart(2,'0')} / CHAPTER ${s.chapter} ${found?'· DISCOVERED':''}</span><h3>${found?s.name:'Unknown business'}</h3><p>${found?s.text:s.clue}</p><small>${found?'✓ 15 GOLD CLAIMED':s.action==='slap'?'TRY A SLAP':s.action==='down'?'HOLD DOWN TO BOW':'E / INSPECT'}</small></article>`;}).join('')}</div><div class="panel-footer"><span>ORIGINAL NONSENSE, FOUND IN THE WILD.</span>${btn('Back',`back:${menuReturn}`,'primary')}</div></div>`,'journal');
}
function bountyStrip(chapter,run=null){
  return `<div class="bounty-strip">${BOUNTIES.filter(b=>b.chapter===chapter).map(b=>{
    const claimed=save.bounties.includes(b.id),p=run?bountyProgress(b,run):null;
    return `<div class="bounty-line ${claimed?'claimed':p?.met?'on-track':''}"><span aria-hidden="true">${claimed?'★':'☆'}</span><span><b>${b.name}</b><small>${b.description}</small></span><em>${claimed?'CLAIMED':p?p.label:'+20 ◈'}</em></div>`;
  }).join('')}</div>`;
}
function bounties(){
  show(`<div class="panel-screen">${header('MUD BUG BOUNTY OFFICE','Make a name for yourself.',`${save.bounties.length} / 24 bounties claimed. Earn 20 gold per stamp by finishing the chapter.`,balance())}<div class="bounty-board">${CHAPTERS.map((c,i)=>`<article class="bounty-poster ${i+1>save.unlocked?'locked':''}"><span class="eyebrow">CHAPTER ${String(i+1).padStart(2,'0')} · ${i+1>save.unlocked?'TRAIL LOCKED':'WANTED'}</span><h3>${c.name}</h3>${bountyStrip(i+1,menuReturn==='paused'&&game?.chapter===i+1?game:null)}${menuReturn==='paused'?'':btn(i+1>save.unlocked?'Finish the previous trail':'Ride this trail →',`chapter:${i+1}`,'text-button',i+1>save.unlocked?'disabled':'')}</article>`).join('')}</div><div class="panel-footer"><span>GOLD STASHES · LOST BADGES · FEATS OF FRONTIER NONSENSE</span>${btn('Back',`back:${menuReturn}`,'primary')}</div></div>`,'bounties');
}
function back(where){if(where==='paused'&&game)pause();else if(where==='chapters')chapters();else if(where==='results'&&game?.result)results(game.result);else home();}
function action(value){
  const [name,arg]=value.split(':');audio.init();audio.sfx('click');
  if(name==='intro')intro();else if(name==='skip-intro')home();
  else if(name==='continue'){if(save.run)start(save.run.chapter,true);else story(save.beaten?1:save.unlocked);}
  else if(name==='home')home();else if(name==='chapters')chapters();else if(name==='chapter')story(Number(arg));else if(name==='start')start(Number(arg));
  else if(name==='resume')resume();else if(name==='restart')show(`<div class="center-screen"><div class="dialog"><span class="eyebrow">A FRESH RUN</span><h2>Ride this trail again?</h2><p>This restarts the current chapter. Your banked gold, upgrades, and discovered secrets stay with you.</p><div class="button-row">${btn('Keep riding','resume','primary')}${btn('Restart chapter','restart-confirm')}</div></div></div>`,'restart');else if(name==='restart-confirm')start(game.chapter);else if(name==='quit'){saveRun();home();}
  else if(['shop','settings','guide','journal','bounties'].includes(name)){if(!['shop','settings','guide','journal','bounties'].includes(mode))menuReturn=mode;({shop,settings,guide,journal,bounties})[name]();}
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
$('noon-button').addEventListener('click',e=>{if(e.detail===0&&mode==='playing')edges.special=true;});
function applyPreferences(){document.body.classList.toggle('reduced-motion',!effectsEnabled());}
motionPreference.addEventListener('change',applyPreferences);
applyPreferences();

const keyActions={KeyQ:'special',Space:'jump',KeyW:'jump',ArrowUp:'jump',KeyR:'reload',ShiftLeft:'roll',ShiftRight:'roll',KeyE:'interact',KeyJ:'fire',KeyX:'fire',KeyK:'slap',KeyC:'slap'};
const gameKeys=new Set(['KeyQ','Space','KeyW','ArrowUp','KeyR','ShiftLeft','ShiftRight','ArrowLeft','ArrowRight','ArrowDown','KeyA','KeyD','KeyS','KeyJ','KeyK','KeyX','KeyC','KeyE','Escape','KeyP']);
addEventListener('keydown',e=>{
  if(!assetsReady)return;
  if(mode==='intro'&&['Enter','Space','Escape'].includes(e.code)){e.preventDefault();if(!e.repeat)home();return;}
  if(e.code==='Tab'&&mode!=='playing'){
    const list=[...$('menu').querySelectorAll('button:not(:disabled),select,input[type=range]')];if(list.length){const first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;
  }
  if(e.code==='Escape'||(e.code==='KeyP'&&mode==='playing')){
    if(e.repeat)return;e.preventDefault();if(mode==='playing')pause();else if(mode==='paused')resume();else if(mode==='restart')pause();else if(['settings','guide','shop','journal','bounties'].includes(mode))back(menuReturn);else if(mode!=='home')home();return;
  }
  if(mode!=='playing')return;if(gameKeys.has(e.code))e.preventDefault();
  if(!keys.has(e.code)&&keyActions[e.code])edges[keyActions[e.code]]=true;keys.add(e.code);
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{clearInput();if(mode==='playing')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(mode==='playing')pause();audio.pause(true);}});
addEventListener('pagehide',saveRun);
addEventListener('gamepaddisconnected',()=>{if(padConnected&&mode==='playing'){pause();toast('Controller disconnected. Reconnect or use the keyboard.');}padConnected=false;});
window.onAndroidPause=()=>{if(mode==='playing')pause();};
window.onAndroidBack=()=>{if(mode==='playing')pause();else if(mode==='paused')resume();else home();};
for(const button of document.querySelectorAll('#touch button,#noon-button')){
  button.addEventListener('contextmenu',e=>e.preventDefault());
  button.addEventListener('pointerdown',e=>{e.preventDefault();audio.init();button.setPointerCapture(e.pointerId);button.classList.add('pressed');const control=button.dataset.hold||button.dataset.tap;holdPointers.set(e.pointerId,{button,control});if(button.dataset.hold)touchHeld.add(control);if(['jump','fire','slap'].includes(control)||button.dataset.tap)edges[control]=true;});
  const release=e=>{const held=holdPointers.get(e.pointerId);if(!held)return;holdPointers.delete(e.pointerId);if(![...holdPointers.values()].some(p=>p.control===held.control))touchHeld.delete(held.control);if(![...holdPointers.values()].some(p=>p.button===held.button))held.button.classList.remove('pressed');};
  button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
}
function readInput(){
  let move=(keys.has('KeyD')||keys.has('ArrowRight')||touchHeld.has('right')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')||touchHeld.has('left')?1:0);
  const input={move,special:!!edges.special,jump:!!edges.jump,jumpHeld:keys.has('Space')||keys.has('KeyW')||keys.has('ArrowUp')||touchHeld.has('jump'),fire:!!edges.fire||keys.has('KeyJ')||keys.has('KeyX')||touchHeld.has('fire'),slap:!!edges.slap||keys.has('KeyK')||keys.has('KeyC')||touchHeld.has('slap'),down:keys.has('KeyS')||keys.has('ArrowDown')||touchHeld.has('down'),reload:!!edges.reload,roll:!!edges.roll,interact:!!edges.interact};
  const pad=[...(navigator.getGamepads?.()||[])].find(p=>p?.connected);
  if(pad){
    if(!padConnected){padConnected=true;toast('Controller connected. A jump · X fire · Y slap · B dodge');}
    const pressed=i=>!!pad.buttons[i]?.pressed;
    const axis=Math.abs(pad.axes[0])>.2?pad.axes[0]:0;input.move=axis||((pressed(15)?1:0)-(pressed(14)?1:0))||input.move;
    input.jumpHeld||=pressed(0);input.fire||=pressed(2)||pressed(7);input.slap||=pressed(3);input.down||=pressed(13);
    for(const [i,k]of [[0,'jump'],[1,'roll'],[4,'reload'],[5,'special'],[6,'interact']]){if(pressed(i)&&!previousPad[i])input[k]=true;previousPad[i]=pressed(i);}
    if(pressed(9)&&!previousPad[9])pause();previousPad[9]=pressed(9);
  }else{padConnected=false;for(const k of Object.keys(previousPad))delete previousPad[k];}
  for(const k of Object.keys(edges))delete edges[k];return input;
}
let menuPadStamp=0,menuPadDown=false;
function pollMenuPad(now){
  const pad=[...(navigator.getGamepads?.()||[])].find(p=>p?.connected);if(!pad){menuPadDown=false;return;}
  const a=pad.buttons[0]?.pressed,b=pad.buttons[1]?.pressed,start=pad.buttons[9]?.pressed;
  if((a||b||start)&&!menuPadDown){if(start&&mode==='paused')resume();else if(b&&mode!=='home')back(menuReturn);else if(a)document.activeElement?.click();}menuPadDown=!!(a||b||start);previousPad[9]=!!start;
  const dir=(pad.buttons[13]?.pressed||pad.buttons[15]?.pressed||pad.axes[1]>.6||pad.axes[0]>.6?1:0)-(pad.buttons[12]?.pressed||pad.buttons[14]?.pressed||pad.axes[1]<-.6||pad.axes[0]<-.6?1:0);
  if(dir&&now-menuPadStamp>220){menuPadStamp=now;const list=[...$('menu').querySelectorAll('button:not(:disabled),select,input[type=range]')];if(list.length){const i=list.indexOf(document.activeElement);list[(i+dir+list.length)%list.length].focus();}}
}

function updateHud(){
  if(!game)return;const g=game,p=g.player;
  const set=(id,key,html)=>{if(hudCache[id]!==key){hudElements[id].innerHTML=html;hudCache[id]=key;return true;}};
  const bar=(id,value)=>{const v=Math.round(clamp(value,0,1)*100);if(hudCache[id]!==v){hudElements[id].style.transform=`scaleX(${v/100})`;hudCache[id]=v;}};
  if(set('health',`${g.hp}/${g.maxHp}`,`${'♥'.repeat(Math.max(0,g.hp))}<span class="empty">${'♡'.repeat(g.maxHp-Math.max(0,g.hp))}</span>`)){hudElements.health.setAttribute('aria-label',`${g.hp} of ${g.maxHp} health`);hudElements.health.classList.toggle('low-health',g.hp<=2);}
  set('shield',g.shield,g.shield?'◇ ARMOR READY':'');set('chapter-label',g.chapter,`CHAPTER ${String(g.chapter).padStart(2,'0')}`);set('place-label',g.chapter,g.world.def.place);
  set('gold',g.coins,String(g.coins));set('badges',g.relics,`${'★'.repeat(g.relics)}<span style="opacity:.35">${'☆'.repeat(3-g.relics)}</span>`);
  const training=g.world.def.training||g.world.def.meleeOnly;set('rounds',`${training}/${g.ammo}`,training?'':Array.from({length:6},(_,i)=>`<i class="round ${i>=g.ammo?'empty':''}"></i>`).join(''));
  const label=training?'THE PIMP HAND':g.reload>0?'RELOADING…':'SIX-SHOOTER';set('weapon-label',label,label);
  hudElements['reload-track'].hidden=g.reload<=0;bar('reload-fill',1-g.reload/g.reloadDuration);
  bar('trail-fill',p.x/g.world.exit);
  for(const [ability,duration]of [['slap',g.noonTime>0?.36:.5],['roll',.85]]){const ready=p[ability+'CD']<=0;set(ability+'-status',ready,ready?'READY':'WAIT');bar(ability+'-fill',1-p[ability+'CD']/duration);}
  const noonState=g.noonTime>0?'active':g.noon>=100?'ready':'charging';
  const noonLabel=g.noonTime>0?`${Math.ceil(g.noonTime)}s BURST`:g.noon>=100?'UNLEASH':`${Math.floor(g.noon)}%`;
  set('noon-status',noonLabel,noonLabel);bar('noon-fill',g.noonTime>0?g.noonTime/5:g.noon/100);
  if(hudCache.noonState!==noonState){hudCache.noonState=noonState;const button=hudElements['noon-button'];button.dataset.state=noonState;button.disabled=noonState!=='ready';button.setAttribute('aria-label',noonState==='ready'?'Unleash High Noon (Q or RB)':noonState==='active'?'High Noon active':'High Noon charging: earn charge with combat and loot');}
  set('run-score',g.score,g.score.toLocaleString());
  set('combo-label',g.combo>1?g.combo:0,g.combo>1?`${g.combo}× QUICK JUSTICE`:'TRAIL SCORE');bar('combo-fill',g.combo>1?g.comboTimer/3:0);
  const b=g.world.boss;$('boss-hud').hidden=!b?.active||b.dead;
  if(b?.active&&!b.dead){set('boss-name',b.enraged?'rage':b.name,b.enraged?'Big Money Chips':b.name);bar('boss-fill',b.hp/b.maxHp);const state=b.phase==='tell'?({charge:'DODGE!',slam:'GET READY TO JUMP',pies:'RETURN TO SENDER',volley:'JUMP THE VOLLEY',high:'STAY LOW'})[b.attack]:b.phase==='recover'?(training?'SLAP NOW':'STRIKE NOW'):b.phase==='rage'?'ALL THAT GLITTERS…':'';set('boss-state',state,state);}
}
function processEvents(){
  for(const e of game.events){
    audio.sfx(e.type,e);
    if(e.type==='checkpoint'){saveRun();toast(e.message);}
    if(e.type==='hint'&&!game.secretPrompt)$('hint').textContent=hintText(e.text);
    if(e.type==='secret-prompt')$('hint').textContent=hintText(e.text||game.lastSign);
    if(e.type==='secret'){if(!save.secrets.includes(e.id)){save.secrets.push(e.id);save.coins+=15;persist();}toast(`${e.name} · +15 gold. ${e.text}`,7000);}
    if(e.type==='noon-ready')toast('HIGH NOON READY · Q / RB / tap the gold button');
    if(e.type==='high-noon')toast('HIGH NOON · Five seconds. Make them count.',2000);
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
  const view=spriteViews[name],scale=h/r.h;
  if(view)ctx.drawImage(view,0,0,view.width,view.height,-w/2-2*scale,-h-2*scale,w+4*scale,h+4*scale);
  else ctx.drawImage(im,r.x,r.y,r.w,r.h,-w/2,-h,w,h);
  ctx.restore();
}
function shadow(x,y,w){ctx.fillStyle='#160d0844';ctx.beginPath();ctx.ellipse(x,y,w,6,0,0,Math.PI*2);ctx.fill();}
function text(s,x,y,size=12,color='#f8e1ad',align='center',font='Arial'){ctx.font=`bold ${size}px ${font}`;ctx.textAlign=align;ctx.fillStyle=color;ctx.shadowColor='#100b09';ctx.shadowBlur=4;ctx.fillText(s,x,y);ctx.shadowBlur=0;}
function drawStar(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.43:r;const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();}
function drawPlatforms(g){
  const w=g.world;const row=g.chapter===7?2:w.def.bg==='bg_saloon'?1:w.def.bg==='bg_hideout'?3:w.def.bg==='bg_town'?1:0;
  for(const p of w.platforms){
    if(p.x+p.w<g.cam-60||p.x>g.cam+WIDTH+60)continue;
    const name='terrain'+(row*2+(p.oneWay?1:0)),im=scenery.tiles[name];
    if(!p.oneWay){ctx.fillStyle=['#4d321d','#291d14','#363537','#25201c'][row];ctx.fillRect(p.x,p.y,p.w,p.h);}
    if(im){const h=im.height,tileW=im.width;ctx.save();ctx.beginPath();ctx.rect(p.x,p.y-5,p.w,p.oneWay?80:p.h+5);ctx.clip();
      const start=p.x+Math.floor(Math.max(0,g.cam-p.x)/tileW)*tileW;
      for(let x=start;x<Math.min(p.x+p.w,g.cam+WIDTH+tileW);x+=tileW-1)ctx.drawImage(im,x,p.y-3,tileW,h);
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
  const w=g.world,t=g.time,bg=scenery.backgrounds[w.def.bg],motion=effectsEnabled();ctx.fillStyle='#19120e';ctx.fillRect(0,0,WIDTH,HEIGHT);
  if(bg){const bh=HEIGHT,bw=bg.width/bg.height*bh,off=-(g.cam*.23)%bw;for(let x=off-bw;x<WIDTH;x+=bw)ctx.drawImage(bg,x,0,bw,bh);}
  if(g.chapter===7){ctx.fillStyle='#57738626';ctx.fillRect(0,0,WIDTH,HEIGHT);}if(g.chapter===5){ctx.fillStyle='#20162050';ctx.fillRect(0,0,WIDTH,HEIGHT);}
  ctx.fillStyle=atmosphere;ctx.fillRect(0,0,WIDTH,HEIGHT);
  const shake=motion&&g.shake>0?(Math.random()-.5)*g.shake*32:0;ctx.save();ctx.translate(shake,FLOOR*(1-WORLD_ZOOM)-g.camY*WORLD_ZOOM+shake*.4);ctx.scale(WORLD_ZOOM,WORLD_ZOOM);ctx.translate(-Math.round(g.cam),0);
  drawPlatforms(g);
  drawLivingTrail(g,motion);
  drawSecrets(g);
  drawStashes(g,motion);
  for(const c of w.checkpoints){
    if(c.x<g.cam-90||c.x>g.cam+WIDTH+90)continue;
    drawWell(c.x+25,FLOOR,c.hit);
    text(c.hit?'CHECKPOINT SAVED':'REST & SAVE',c.x+25,FLOOR-140,10,c.hit?'#f8db93':'#e8d8ba');
    if(c.hit){ctx.globalAlpha=.2+.1*Math.sin(t*3);ctx.strokeStyle='#eac777';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(c.x+25,FLOOR-3,58,12,0,0,7);ctx.stroke();ctx.globalAlpha=1;}
  }
  // Signs make the destination legible without relying on the HUD.
  const exit=w.exit;ctx.fillStyle='#493422';ctx.fillRect(exit,FLOOR-112,9,112);ctx.fillStyle='#9b7144';ctx.beginPath();ctx.moveTo(exit-55,FLOOR-126);ctx.lineTo(exit+58,FLOOR-126);ctx.lineTo(exit+80,FLOOR-102);ctx.lineTo(exit+58,FLOOR-78);ctx.lineTo(exit-55,FLOOR-78);ctx.closePath();ctx.fill();text(w.boss&&!w.boss.dead?'LOCKED':'RIDE ON',exit+5,FLOOR-97,13,'#ffe2a7');
  if(!w.boss||w.boss.dead){ctx.globalAlpha=.2+.1*Math.sin(t*3);ctx.fillStyle='#ffdc7b';ctx.fillRect(exit+93,FLOOR-180,4,180);ctx.globalAlpha=1;}
  for(const c of w.pickups){if(c.got||c.x<g.cam-50||c.x>g.cam+WIDTH+50)continue;const bob=Math.sin(t*3+c.x)*4;
    if(c.type==='coin'){ctx.fillStyle='#e2ad4e';ctx.beginPath();ctx.ellipse(c.x,c.y+bob,Math.max(3,Math.abs(Math.cos(t*4+c.x))*11),13,0,0,7);ctx.fill();ctx.strokeStyle='#ffe4a0';ctx.lineWidth=2;ctx.stroke();}
    else if(c.type==='relic'){ctx.save();ctx.shadowColor='#ffc852';ctx.shadowBlur=18;drawStar(c.x,c.y+bob,19,'#f6ca6b');ctx.restore();drawStar(c.x,c.y+bob,10,'#8a562b');text('R',c.x,c.y+5+bob,11,'#f8d78f','center','Rye');}
    else{ctx.fillStyle='#23402c';ctx.fillRect(c.x-14,c.y-14+bob,28,28);ctx.strokeStyle='#a7c99a';ctx.strokeRect(c.x-14,c.y-14+bob,28,28);ctx.fillStyle='#c5e0b1';ctx.fillRect(c.x-3,c.y-10+bob,6,20);ctx.fillRect(c.x-10,c.y-3+bob,20,6);}
  }
  for(const e of w.enemies){if(e.dead||e.x<g.cam-130||e.x>g.cam+WIDTH+130)continue;shadow(e.x+e.w/2,surfaceBelow(g,e.x+e.w/2,e.y+e.h),25);const bob=e.attack==='walk'?Math.sin(e.t*10)*2:0;
    ctx.save();const ex=e.x+e.w/2,ey=e.y+e.h+bob;ctx.translate(ex,ey);if(motion&&e.stagger>0)ctx.rotate(Math.sign(e.knock)*e.stagger*.55);sprite(e.img,0,0,e.h+24,e.dir<0,e.flash>0?.68:1);ctx.restore();
    if(e.phase==='aim'){text('!',e.x+e.w/2,e.y-37,27,'#ffcb65');ctx.strokeStyle='#ffc96f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x+e.w/2,e.y-47,17,0,7);ctx.stroke();}
    if(e.hp<e.maxHp){ctx.fillStyle='#33251b';ctx.fillRect(e.x,e.y-20,e.w,3);ctx.fillStyle='#e0a667';ctx.fillRect(e.x,e.y-20,e.w*e.hp/e.maxHp,3);}
  }
  for(const d of g.defeats){ctx.save();ctx.translate(d.x,d.y);if(motion)ctx.rotate((.38-d.life)*Math.sign(d.vx)*2);sprite(d.img,0,0,d.h,d.dir<0,d.life/.38);ctx.restore();}
  const b=w.boss;
  if(b&&!b.dead){
    shadow(b.x+b.w/2,FLOOR,b.w*.6);
    if(b.phase==='tell'){
      ctx.save();ctx.globalAlpha=motion?.45+.15*Math.sin(t*22):.6;ctx.fillStyle='#f9bb58';
      if(b.attack==='slam'){ctx.beginPath();ctx.ellipse(b.targetX+21,FLOOR-5,88,13,0,0,7);ctx.fill();}
      else if(b.attack==='volley'||b.attack==='high'){ctx.fillRect(b.arena-100,FLOOR-(b.attack==='high'?130:37),w.def.length-b.arena+80,5);}
      else if(b.attack==='charge'){ctx.fillRect(Math.min(b.x,b.targetX),FLOOR-5,Math.abs(b.x-b.targetX)+30,5);}
      ctx.restore();text('!',b.x+b.w/2,b.y-38,35,'#ffcf79');
    }
    let frame=b.phase==='tell'?5:b.phase==='attack'?7:1+Math.floor(t*5)%3;
    const name=b.enraged?`${b.prefix}gold${1+Math.floor(t*6)%5}`:`${b.prefix}${frame}`;
    sprite(images[name]?name:`${b.prefix}1`,b.x+b.w/2,b.y+b.h,b.h+20,b.dir<0,b.flash>0?(motion&&Math.floor(t*30)%2?.55:.8):1);
  }
  for(const s of g.shots){
    const color=s.friendly?(s.kind==='return'?'#bbf0c0':s.charged?'#fff3b6':'#ffe1a3'):'#ff9d76';ctx.fillStyle=color;ctx.strokeStyle=color;
    if(s.kind==='pie'){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(t*7);ctx.fillStyle=s.friendly?'#b9efbd':'#dfae6f';ctx.beginPath();ctx.ellipse(0,0,15,8,0,0,7);ctx.fill();ctx.fillStyle='#684133';ctx.fillRect(-12,-3,24,3);ctx.restore();}
    else if(s.kind==='wave'){ctx.lineWidth=4;ctx.beginPath();ctx.arc(s.x,s.y,14,Math.PI,0);ctx.stroke();}
    else {ctx.save();ctx.shadowColor=color;ctx.shadowBlur=8;ctx.beginPath();ctx.ellipse(s.x,s.y,s.friendly?10:8,s.friendly?3:5,0,0,7);ctx.fill();ctx.globalAlpha=.35;ctx.fillRect(s.x-Math.sign(s.vx)*22,s.y-1,Math.sign(s.vx)*18,2);ctx.restore();}
  }
  const p=g.player,feet=p.y+p.h,ground=surfaceBelow(g,p.x+21,feet);shadow(p.x+21,ground,Math.max(10,24-(ground-feet)*.035));
  if(g.noonTime>0){ctx.save();ctx.strokeStyle='#ffe4a3';ctx.globalAlpha=.55;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x+21,feet-40,34,57,0,0,7);ctx.stroke();if(motion){for(let i=0;i<4;i++)drawStar(p.x+21+Math.cos(t*5+i*1.57)*38,feet-40+Math.sin(t*5+i*1.57)*49,4,'#ffe4a3');}ctx.restore();}
  const pimpMode=w.def.training||w.def.meleeOnly;
  let pose='idle',prefix=pimpMode?'rl_sugarwolf_slap_':'rl_sugarwolf_gun_';
  if(p.action>0)pose=p.actionKind==='slap'?'slap2':'shoot';else if(p.roll>0||p.ground&&p.duck)pose='crouch';else if(!p.ground)pose='jump';else if(Math.abs(p.vx)>35)pose=`walk${1+Math.floor(p.anim*10)%3}`;
  let name=prefix+pose;
  if(pose==='slap2'){
    name='pimp_'+slapPose(p.action);
  }else if(pimpMode&&pose==='idle')name='pimp_ready';else if(pimpMode&&pose==='crouch')name='pimp_low';
  if(!images[name])name=prefix+'idle';
  let alpha=p.invuln>0?(motion?(Math.floor(t*14)%2?.45:1):.7):1;if(g.dead)alpha=.35;
  const playerHeight=109*(crops[name]?.h||480)/480;
  ctx.save();if(FRAMES[name]?.bodyHeight){
    const f=FRAMES[name],scale=109/f.bodyHeight,xScale=scale*(g.items.slap?1.18:1),r=crops[name];
    ctx.translate(p.x+p.w/2,p.y+p.h+2);ctx.scale(p.dir*xScale,scale);ctx.globalAlpha=alpha;
    const view=spriteViews[name];ctx.drawImage(view,r.x-f.anchorX-2,r.y-f.baseY-2);
  }else if(p.roll>0){ctx.translate(p.x+p.w/2,p.y+p.h-24);if(motion)ctx.rotate(p.dir*(1-p.roll/.26)*Math.PI*2);sprite(name,0,35,playerHeight,p.dir<0,alpha);}else{
    ctx.translate(p.x+21,feet+2);
    if(motion){const squash=(p.landing||0)/.16;ctx.scale(1+squash*.09,1-squash*.09);ctx.rotate(p.vx/340*.035-p.dir*(p.recoil||0)*.32);}
    sprite(name,0,0,playerHeight,p.dir<0,alpha);
  }ctx.restore();
  if(p.action>0&&p.actionKind==='slap'&&slapPose(p.action)==='extend'){
    const tip=p.x+p.w/2+p.dir*slapReach(p.action,g.items.slap);
    ctx.save();ctx.globalAlpha=.65;ctx.strokeStyle='#ffe1a0';ctx.lineWidth=3;
    for(const dy of [-20,0,20]){ctx.beginPath();ctx.moveTo(tip+p.dir*5,p.y+20+dy);ctx.lineTo(tip+p.dir*18,p.y+20+dy*1.35);ctx.stroke();}ctx.restore();
  }
  if(save.secrets.length===24){drawStar(p.x+p.w/2,p.y-41+Math.sin(t*3)*4,10,'#f8db86');}
  if(g.shield){ctx.strokeStyle='#c8dfa77a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x+p.w/2,p.y+p.h/2,38,60,0,0,7);ctx.stroke();}
  for(const q of g.particles){ctx.globalAlpha=clamp(q.life/q.max,0,1);ctx.fillStyle=q.color;ctx.fillRect(q.x-q.r/2,q.y-q.r/2,q.r,q.r);}ctx.globalAlpha=1;
  if(motion)for(const hit of g.impacts){
    const progress=1-hit.life/.22;ctx.save();ctx.translate(hit.x,hit.y);ctx.globalAlpha=1-progress;ctx.strokeStyle=hit.kind==='parry'?'#c9f8db':'#ffe6ac';ctx.lineWidth=3*(1-progress)+1;
    const radius=12+progress*38;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*(radius+5),Math.sin(a)*(radius+5));ctx.lineTo(Math.cos(a)*(radius+17),Math.sin(a)*(radius+17));ctx.stroke();}ctx.restore();
  }
  for(const f of g.texts){ctx.globalAlpha=Math.min(1,f.life*2);text(f.text,f.x,f.y,12,f.color);}ctx.globalAlpha=1;ctx.restore();
  if(motion&&g.hurtFlash>0){ctx.strokeStyle=`rgba(176,48,26,${g.hurtFlash*.9})`;ctx.lineWidth=22;ctx.strokeRect(0,0,WIDTH,HEIGHT);}
  if(g.dead){ctx.fillStyle='#160c08aa';ctx.fillRect(0,0,WIDTH,HEIGHT);text('BACK IN THE SADDLE…',WIDTH/2,HEIGHT/2,30,'#efd4a1','center','Rye');}
  // Fine dust drifts at a fixed cost, away from the combat silhouette.
  if(motion){ctx.fillStyle='#f4dbad55';for(let i=0;i<14;i++){const x=(i*107+t*12)%WIDTH,y=170+(i*59)%270+Math.sin(t+i)*5;ctx.fillRect(x,y,2,2);}}
}
function render(){
  ctx.setTransform(canvas.width/WIDTH,0,0,canvas.height/HEIGHT,0,0);ctx.imageSmoothingEnabled=true;
  if(game)drawWorld(game);else{ctx.fillStyle='#17130f';ctx.fillRect(0,0,WIDTH,HEIGHT);}
}
function resize(){
  const size=canvasSize(innerWidth,innerHeight,devicePixelRatio||1);
  if(canvas.width!==size.width||canvas.height!==size.height){canvas.width=size.width;canvas.height=size.height;}
  render();
}
addEventListener('resize',resize);
function frame(now){
  const delta=Math.min((now-lastTime)/1000,.1);lastTime=now;
  if(mode==='playing'&&game){
    accumulator+=delta;let first=true,input;
    while(accumulator>=1/60&&mode==='playing'){
      if(first){input=readInput();first=false;}else input={...input,jump:false,roll:false,reload:false,interact:false,special:false};
      if(mode!=='playing')break;game.step(1/60,input);processEvents();accumulator-=1/60;
    }
    if(!first){if(now-lastHudTime>=50){updateHud();lastHudTime=now;}render();}
  }else{accumulator=0;pollMenuPad(now);}
  requestAnimationFrame(frame);
}
async function loadAssets(){
  let count=0;const failures=[];const entries=Object.entries(ASSETS);
  await Promise.all(entries.map(([name,url])=>new Promise(resolve=>{
    const im=new Image();im.onload=()=>{images[name]=im;done();};im.onerror=()=>{failures.push(name);done();};
    const done=()=>{count++;$('loading-progress').style.width=`${count/entries.length*80}%`;$('loading-text').textContent=`Packing the saddle · ${Math.round(count/entries.length*80)}%`;resolve();};im.src=url;
  })));
  if(failures.length){$('loading').innerHTML=`<div class="load-error"><h2>The wagon lost a wheel.</h2><p>Some game art couldn’t load. Check your connection and try again.</p><button class="primary" id="retry-load">Try again</button></div>`;$('retry-load').onclick=()=>location.reload();console.error('Missing assets:',failures);return;}
  const prepared=await prepareArtwork(images,FRAMES,progress=>{const percent=Math.round(80+progress*20);$('loading-progress').style.width=`${percent}%`;$('loading-text').textContent=`Preparing the trail · ${percent}%`;});
  Object.assign(crops,prepared.crops);Object.assign(spriteViews,prepared.views);
  for(const [name,r]of Object.entries(FRAMES))images[name]=images[r.sheet];
  scenery=prepareScenery(images,crops);scenery.stashes=prepareStashArt();scenery.lanternGlow=prepareLanternGlow();
  assetsReady=true;$('loading').hidden=true;resize();intro();lastTime=performance.now();requestAnimationFrame(frame);
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

function surfaceBelow(g,x,feet){
  let y=HEIGHT+160;
  for(const q of g.world.platforms)if(x>=q.x&&x<=q.x+q.w&&q.y>=feet-5)y=Math.min(y,q.y);
  return y;
}
// Small original prop illustrations are drawn once, then reused as sprites.
function prepareStashArt(){
  return [false,true].map(broken=>{
    const cv=document.createElement('canvas');cv.width=144;cv.height=138;
    const c=cv.getContext('2d');c.scale(2,2);c.translate(36,62);
    if(broken){
      c.fillStyle='#3a2316';c.fillRect(-26,-8,52,9);
      for(let i=0;i<6;i++){c.save();c.translate(-24+i*9,-6-(i%3)*2);c.rotate((i%2?1:-1)*.3);c.fillStyle=i%2?'#a5713c':'#6e4627';c.fillRect(-3,-4,15,6);c.strokeStyle='#c6934b';c.strokeRect(-3,-4,15,6);c.restore();}
    }else{
      const wood=c.createLinearGradient(0,-50,0,0);wood.addColorStop(0,'#b57d3d');wood.addColorStop(1,'#57351d');
      c.fillStyle=wood;c.fillRect(-25,-47,50,47);c.fillStyle='#d6a960';c.beginPath();c.moveTo(-25,-47);c.lineTo(-18,-54);c.lineTo(31,-54);c.lineTo(25,-47);c.fill();
      c.fillStyle='#573821';c.beginPath();c.moveTo(25,-47);c.lineTo(31,-54);c.lineTo(31,-8);c.lineTo(25,0);c.fill();
      c.strokeStyle='#352519';c.lineWidth=1.5;for(let y=-37;y<0;y+=12){c.beginPath();c.moveTo(-25,y);c.lineTo(25,y);c.stroke();}
      c.strokeStyle='#edba6966';c.lineWidth=.7;for(let i=0;i<18;i++){c.beginPath();c.moveTo(-22+(i*7)%17,-44+i*2.4);c.lineTo(20-(i*11)%18,-45+i*2.4);c.stroke();}
      c.fillStyle='#b99357';for(const x of [-22,16]){c.fillRect(x,-47,6,47);c.fillStyle='#2d2720';for(const y of [-42,-7])c.fillRect(x+2,y,2,2);c.fillStyle='#b99357';}
      c.fillStyle='#e4b858';c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?6:14;i?c.lineTo(Math.cos(a)*r,-25+Math.sin(a)*r):c.moveTo(Math.cos(a)*r,-25+Math.sin(a)*r);}c.closePath();c.fill();
      c.fillStyle='#4c301c';c.font='bold 7px Arial';c.textAlign='center';c.fillText('GOLD',0,-8);c.strokeStyle='#2c1b13';c.lineWidth=1.5;c.strokeRect(-25,-47,50,47);
    }
    return cv;
  });
}
function drawStashes(g,motion){
  for(const c of g.world.stashes){
    if(c.x<g.cam-100||c.x>g.cam+g.viewWidth+100)continue;
    shadow(c.x+25,c.y+49,29);ctx.drawImage(scenery.stashes[c.broken?1:0],c.x-11,c.y-13,72,69);
    if(!c.broken){
      if(motion){const f=(g.time*.75+c.x*.003)%1;ctx.globalAlpha=Math.sin(f*Math.PI)*.8;drawStar(c.x+43,c.y+7-f*7,3+Math.sin(f*Math.PI)*2,'#fff0b3');ctx.globalAlpha=1;}
      if(Math.abs(g.player.x-c.x)<140)text('SMASH FOR GOLD',c.x+25,c.y-18,9,'#f7dc9d');
    }
  }
}
function drawLivingTrail(g,motion){
  const saloon=g.world.def.bg==='bg_saloon',woods=g.chapter===7,t=motion?g.time:0;
  if(saloon){
    const first=Math.floor(g.cam/580);
    for(let i=first;i<=first+2;i++){
      const x=i*580+290,y=215+(i%2)*20;ctx.save();ctx.translate(x,y-75);ctx.rotate(Math.sin(t*1.25+i)*.035);
      ctx.strokeStyle='#26180f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-100);ctx.lineTo(0,75);ctx.stroke();
      ctx.translate(0,75);ctx.drawImage(scenery.lanternGlow,-96,-93,192,192);
      ctx.fillStyle='#3a2418';ctx.fillRect(-14,-17,28,6);ctx.fillRect(-13,17,26,5);ctx.fillStyle='#ffc572';ctx.globalAlpha=.88+Math.sin(t*7+i)*.1;ctx.fillRect(-8,-10,16,25);ctx.globalAlpha=1;ctx.strokeStyle='#442919';ctx.lineWidth=3;ctx.strokeRect(-11,-13,22,33);ctx.fillStyle='#ffe9ac';ctx.fillRect(-2,3,4,12);ctx.restore();
    }
  }else if(!woods){
    const first=Math.floor(g.cam/850);
    for(let i=first;i<=first+2;i++){
      const x=i*850+(t*23+i*157)%700,ground=surfaceBelow(g,x,FLOOR);
      if(ground!==FLOOR)continue;
      shadow(x,FLOOR,16);ctx.save();ctx.translate(x,FLOOR-16-Math.abs(Math.sin(t*2+i))*3);ctx.rotate(t*1.4+i);ctx.strokeStyle='#967644bb';ctx.lineWidth=1.7;
      for(let k=0;k<5;k++){ctx.beginPath();ctx.ellipse(0,0,17,7,k*Math.PI/5,0,Math.PI*2);ctx.stroke();}ctx.restore();
    }
  }
  if(woods&&motion){ctx.fillStyle='#c8ae6a88';for(let i=0;i<8;i++){const x=g.cam+(i*173+t*18)%g.viewWidth,y=110+(i*61+t*25)%380;ctx.save();ctx.translate(x,y);ctx.rotate(t+i);ctx.beginPath();ctx.ellipse(0,0,5,2,0,0,7);ctx.fill();ctx.restore();}}
}

function prepareLanternGlow(){
  const cv=document.createElement('canvas');cv.width=cv.height=192;const c=cv.getContext('2d');
  const light=c.createRadialGradient(96,96,1,96,96,96);light.addColorStop(0,'#f9bc5940');light.addColorStop(1,'#f9bc5900');c.fillStyle=light;c.fillRect(0,0,192,192);return cv;
}
