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
  for(const cv of $('menu').querySelectorAll('[data-item-art]')){const view=spriteViews[cv.dataset.itemArt];if(view){const scale=Math.min(144/view.width,110/view.height);cv.getContext('2d').drawImage(view,(160-view.width*scale)/2,(120-view.height*scale)/2,view.width*scale,view.height*scale);}}
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
  show(`<div class="home"><header class="topbar"><div class="brand-mark"><img src="icon.svg" alt="Sheriff star"><span>BIG MONEY RUSTLAS</span></div><div class="topbar-right"><span class="official">THE FIRST OFFICIAL VIDEO GAME</span>${btn('⚙','settings','icon-button','aria-label="Settings"')}</div></header><div class="title-lockup"><h1><img class="title-wordmark" src="${ASSETS.logo}" alt="Big Money Rustlas"></h1><span class="title-kicker">THE OFFICIAL GAME</span></div><div class="home-bottom"><p class="home-tagline">A BADGE. SIX BULLETS. A TOWN TO TAKE BACK.</p><div class="button-row">${btn(`${continuation} <span aria-hidden="true">→</span>`,'continue','primary')}${btn('Chapter select','chapters')}${btn('The general store','shop')}${btn('Bounty board','bounties')}${btn('Trail secrets','journal')}</div><p class="save-label">${save.run?'Your checkpoint is waiting.':save.beaten?'Mud Bug is free. There’s still gold in those hills.':'Twelve chapters. Four showdowns. Forty-eight dirty little secrets.'}</p><footer class="home-foot"><button class="studio-brand" data-action="intro" aria-label="Replay CREASO NORSE intro"><img src="${ASSETS.studio}" alt="CREASO·NORSE" width="444" height="90"></button><span>KEYBOARD · CONTROLLER · TOUCH</span>${btn('Field guide','guide','text-button')}<button class="text-button" data-action="credits" style="padding:0;font-size:9px">CREDITS / V3.0</button></footer></div></div>`,'home');
}
function chapters(){
  const completed=Object.keys(save.best).length,badges=Object.values(save.best).reduce((n,b)=>n+b.relics,0);
  show(`<div class="panel-screen">${header('THE ROAD TO MUD BUG','Every town has a story.','Choose a chapter. Find every lost badge. Earn your legend.',balance())}<div class="map-grid">${CHAPTERS.map((c,i)=>{const n=i+1,locked=n>save.unlocked,b=save.best[n];return `<button class="chapter-card ${locked?'locked':''} ${n===save.unlocked?'current':''}" data-action="chapter:${n}" ${locked?'disabled':''} aria-label="Chapter ${n}: ${c.name}${locked?', locked':''}"><div class="chapter-art" style="background-image:url('${backgroundUrl(c.bg)}')"><span class="chapter-number">${String(n).padStart(2,'0')}</span><span class="chapter-type">${locked?'LOCKED':c.boss?'SHOWDOWN':'CHAPTER'}</span></div><div class="chapter-info"><h3>${c.name}</h3><div class="chapter-meta"><span>${locked?'FINISH PREVIOUS CHAPTER':b?`${'★'.repeat(b.relics)}${'☆'.repeat(3-b.relics)}`:c.place}</span><span>${b?fmtTime(b.time):locked?'': '→'}</span></div><div class="chapter-bounties">${locked?'':`${BOUNTIES.filter(b=>b.chapter===n&&save.bounties.includes(b.id)).length}/3 BOUNTIES CLAIMED`}</div></div></button>`;}).join('')}</div><div class="panel-footer"><span>${completed}/${CHAPTERS.length} CHAPTERS CLEARED · ${badges}/${CHAPTERS.length*3} LOST BADGES</span><div class="button-row">${btn('General store','shop','text-button')}${btn('← Main menu','home','secondary')}</div></div></div>`,'chapters');
}
function story(chapter){
  if(chapter>save.unlocked)return;const c=CHAPTERS[chapter-1];
  const portrait=c.boss?`${BOSSES[c.boss].prefix}1`:c.training?'rl_sanchez_arms_crossed':'rl_sugarwolf_gun_idle';
  show(`<div class="story-screen"><div class="story-art" style="background-image:url('${backgroundUrl(c.bg)}')"><span class="chapter-stamp">CHAPTER ${String(chapter).padStart(2,'0')}</span><canvas class="story-portrait" data-portrait="${portrait}" width="480" height="600" aria-label="${c.boss?BOSSES[c.boss].name:c.training?'Sanchez':'Sugar Wolf'}"></canvas></div><div class="story-copy"><span class="eyebrow">${c.act}<br>${c.place} / ${c.boss?'WANTED DEAD OR DEFEATED':'THE STORY SO FAR'}</span><h2>${c.name}</h2><div class="story-quote">“${c.quote}”</div><p>${c.story}</p><div class="mission"><b>YOUR MISSION</b>${c.objective}</div>${bountyStrip(chapter)}<div class="button-row">${btn('Saddle up →',`start:${chapter}`,'primary')}${btn('← Chapters','chapters','text-button')}</div><p class="tiny" style="margin-bottom:0">${DIFFICULTIES[save.settings.difficulty].name.toUpperCase()} · 3 LOST BADGES · CHECKPOINTS SAVE AUTOMATICALLY</p></div></div>`,'story');
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
function storeArt(id){return 'prop_'+({heart:'medicine',reload:'ammo',magnet:'horseshoe',boots:'spurs',shield:'badge',slap:'glove',cylinder:'revolver',trigger:'revolver',pierce:'ammo',powder:'ammo',spurs:'spurs',dodge:'spurs',noon:'watch',charge:'badge',medic:'medicine',stash:'stash',bounty:'cards',parry:'glove'})[id];}
function shop(){
  show(`<div class="panel-screen">${header('MUD BUG GENERAL STORE','A little edge goes a long way.','18 permanent upgrades. Build your style. The final two-hit duel suspends equipment bonuses.',balance())}<div class="shop-grid">${UPGRADES.map(it=>{const owned=save.items[it.id],afford=save.coins>=it.cost;return `<article class="shop-item ${owned?'owned':''}"><canvas class="store-art" data-item-art="${storeArt(it.id)}" width="160" height="120" aria-hidden="true"></canvas><h3>${it.name}</h3><p>${it.desc}</p>${btn(owned?'✓ EQUIPPED':afford?`BUY · ◈ ${it.cost}`:`◈ ${it.cost} · NEED ${it.cost-save.coins} MORE`,`buy:${it.id}`,'primary',owned||!afford?'disabled':'')}</article>`;}).join('')}</div><footer class="panel-footer"><span>UPGRADES APPLY WHEN YOU ENTER A CHAPTER.<br>NO ADS. NO REAL-MONEY PURCHASES.</span>${btn('← Back',`back:${menuReturn}`,'secondary')}</footer></div>`,'shop');
}
function settings(){
  const s=save.settings;
  const volume=(key,label)=>`<div class="settings-row volume-row"><label for="${key}">${label}</label><div><input id="${key}" type="range" min="0" max="100" step="5" value="${s[key]}"><output id="${key}-value" for="${key}">${s[key]}%</output></div></div>`;
  const toggle=(key,title,desc)=>`<div class="settings-row"><div><strong>${title}</strong><small>${desc}</small></div>${btn(s[key]?'ON':'OFF',`toggle:${key}`,`toggle ${s[key]?'':'off'}`,`aria-pressed="${s[key]}" aria-label="${title}"`)}</div>`;
  show(`<div class="center-screen"><div class="dialog settings-dialog"><span class="eyebrow">MAKE YOURSELF AT HOME</span><h2>Settings</h2><div class="settings-row"><div><strong>Difficulty</strong><small id="difficulty-desc">${DIFFICULTIES[s.difficulty].description}<br>Applies to newly started chapters.</small></div><select id="difficulty" aria-label="Difficulty">${Object.entries(DIFFICULTIES).map(([id,d])=>`<option value="${id}" ${s.difficulty===id?'selected':''}>${d.name}</option>`).join('')}</select></div>${toggle('sound','Sound effects','Layered gunfire, elastic slaps, footsteps, and ambience.')}${toggle('music','Music','Fingerpicked guitar, bass, and a faster showdown rhythm.')}${volume('soundVolume','Effects volume')}${volume('musicVolume','Music volume')}<div class="sound-preview">${btn('Test sounds','sound-preview','secondary')}${btn('Test music','music-preview','secondary')}<span id="sound-status" role="status">Play a short effects preview.</span></div>${toggle('motion','Screen effects','Camera shake and impact accents. Respects reduced-motion preferences.')}${toggle('touch','Show touch controls','Touch devices show these automatically.')}<div class="button-row settings-actions">${btn('Done',`back:${menuReturn}`,'primary')}${btn('Reset progress','reset','text-button')}</div></div></div>`,'settings');
  for(const key of ['soundVolume','musicVolume'])$(key).addEventListener('input',e=>{save.settings[key]=Number(e.target.value);$(key+'-value').textContent=save.settings[key]+'%';audio.applySettings();persist();});
  $('difficulty').addEventListener('change',e=>{save.settings.difficulty=e.target.value;persist();$('difficulty-desc').innerHTML=`${DIFFICULTIES[e.target.value].description}<br>Applies to newly started chapters.`;});
}
function guide(){
  show(`<div class="panel-screen">${header('THE SHERIFF’S FIELD GUIDE','Stay quick. Shoot straight.','Everything you need to take Mud Bug back.')}<div class="guide-grid"><div><h3>The controls</h3><div class="key-table"><span>Move</span><span><kbd>A</kbd> <kbd>D</kbd> / <kbd>←</kbd> <kbd>→</kbd></span><span>Jump · hold for height</span><span><kbd>SPACE</kbd> / <kbd>W</kbd> / <kbd>↑</kbd></span><span>Fire · hold to keep shooting</span><span><kbd>J</kbd> / <kbd>X</kbd></span><span>Slap · return incoming bullets</span><span><kbd>K</kbd> / <kbd>C</kbd></span><span>High Noon · unleash a full meter</span><kbd>Q</kbd><span>Reload your six-shooter</span><kbd>R</kbd><span>Dodge · brief invulnerability</span><kbd>SHIFT</kbd><span>Drop through a platform</span><span><kbd>S</kbd> / <kbd>↓</kbd></span><span>Inspect something suspicious</span><kbd>E</kbd><span>Pause</span><span><kbd>ESC</kbd> / <kbd>P</kbd></span></div><div class="guide-note">Controller: left stick / D-pad to move, A to jump, X or RT to fire, Y to slap, B to dodge, LB to reload, LT to inspect, RB for High Noon, Start to pause. Touch controls appear on phones and tablets.</div></div><div><h3>A few things to remember</h3><p><b>Six bullets. Unlimited nerve.</b> Your revolver reloads automatically when empty. Reload before a showdown. You have unlimited reserve ammunition.</p><p><b>A slap beats a bullet.</b> Slap incoming shots to return them for triple damage. Your arm stretches across the street: wind up, let the palm connect, then recover. Dodge cancels the swing. Slap and dodge meters show when you can act again; a tap just before they refill is remembered. In Sanchez’s lesson, the pimp hand is your only weapon. The return to town teaches Sugar to draw with his other hand.</p><p><b>Make it High Noon.</b> Combat, returned shots, badges, and gold stashes charge your meter. Press Q, controller RB, or the High Noon button when full for five seconds of faster firing and stronger, faster slaps. It refills your revolver, but you still need to dodge.</p><p><b>Break into Chips’ fortune.</b> Three star-stamped gold stashes sit along each trail. Shoot or slap them for gold and High Noon charge. The bounty board offers 36 optional challenges, each worth 20 extra gold once you finish the chapter.</p><p><b>Chips plays for keeps.</b> The last showdown is a fast pistol duel: two hits kill you. Equipment bonuses and High Noon stay outside the street. Move when his aim locks, dodge the shot, and fire during his reload.</p><p><b>Watch the warning.</b> Enemies flash a gold tell before attacking. Bosses have a recovery window. Dodge through a charge or jump a low volley.</p><p><b>Wells are your lifeline.</b> They restore health and ammunition, and save your checkpoint. Health packs stay on the trail until you need them. Falling costs a heart. Losing all hearts sends you back with your collected loot intact.</p><p><b>Look up.</b> Each chapter hides three lost sheriff badges. Recover them for bonus gold. Clear without dying to earn a clean-run mark, then replay for a faster time and higher score.</p><p><b>The frontier is deeply weird.</b> Inspect odd props with E, slap suspicious objects, or hold down to pay your respects. Each of 48 secrets earns 15 gold once and an entry in your trail journal. Find them all to become Tumbleweed Marshal.</p><p><b>Gold buys a permanent advantage.</b> It is banked when you finish a chapter. Visit the general store between chapters to improve your gear.</p></div></div><div class="panel-footer"><span>PROGRESS SAVES ON THIS BROWSER AND DEVICE.</span>${btn('Let’s ride',`back:${menuReturn}`,'primary')}</div></div>`,'guide');
}
function results(result){
  const final=game.chapter===CHAPTERS.length,c=game.world.def;
  show(`<div class="center-screen"><div class="dialog"><span class="eyebrow">CHAPTER ${game.chapter} COMPLETE / ${result.first?'FIRST CLEAR':'BACK FOR MORE'}</span><h2>${final?'The town is yours.':'That’s a day’s work.'}</h2><p>${c.after}${final?'':` Next: ${CHAPTERS[game.chapter].name}.`}</p><div class="stats"><div class="stat"><strong>${fmtTime(result.time)}</strong><span>TRAIL TIME</span></div><div class="stat"><strong>${result.score.toLocaleString()}</strong><span>SCORE</span></div><div class="stat"><strong>+${result.reward}</strong><span>GOLD BANKED</span></div><div class="stat"><strong>${result.relics}/3</strong><span>LOST BADGES</span></div></div><div class="awards"><span class="award">★ CHAPTER CLEARED</span><span class="award ${result.relics===3?'':'missing'}">${result.relics===3?'★':'☆'} BADGE COLLECTOR</span><span class="award ${result.deaths===0?'':'missing'}">${result.deaths===0?'★':'☆'} NO DEATHS</span></div><div class="bounty-results"><span class="eyebrow">${result.bounties.length?`NEW BOUNTIES · +${result.bountyGold} GOLD INCLUDED`:'BOUNTIES ON THIS TRAIL'}</span>${bountyStrip(game.chapter,game)}</div><div class="run-summary"><span><b>${result.bestCombo||0}×</b> BEST STREAK</span><span><b>${result.parries||0}</b> SHOTS RETURNED</span></div><div class="button-row">${btn(final?'The final word →':'Next chapter →',final?'ending':`chapter:${game.chapter+1}`,'primary')}${btn('General store','shop')}${btn('Ride this trail again',`chapter:${game.chapter}`)}${btn('Chapters','chapters','text-button')}</div></div></div>`,'results');
}
function ending(){
  show(`<div class="center-screen ending"><div class="dialog"><span class="eyebrow">MUD BUG IS FREE</span><h2>Some legends<br>run in the family.</h2><p>Chips falls. Beneath the gold and the paint is Grizzly Wolf—Sugar’s own father. The truth lands harder than any bullet. But the badge still means something.</p><p>With the town free and the road quiet, Sugar Wolf rides into the sunset. Mud Bug will remember its sheriff.</p><div class="story-quote">“A town worth saving. A story worth telling.”</div><div class="credits">BIG MONEY RUSTLAS<br>THE FIRST OFFICIAL VIDEO GAME<br><br>You completed all twelve chapters. Return to the trail to find all 36 lost badges and set new records.</div><div class="button-row">${btn('Back to the trail','chapters','primary')}${btn('Credits','credits')}</div></div></div>`,'ending');
}
function credits(){
  show(`<div class="center-screen"><div class="dialog"><span class="eyebrow">THE FIRST OFFICIAL VIDEO GAME</span><h2>Big Money Rustlas</h2><p>Sugar Wolf’s story, from the dusty road to the last showdown in Mud Bug.</p><div class="credits-studio"><img src="${ASSETS.studio}" alt="CREASO·NORSE" width="444" height="90"></div><div class="credits">A CREASO·NORSE GAME<br><br>FEATURING<br>Sugar Wolf · Big Baby Chips · Dirty Sanchez<br>Raw Stank · Dusty Poot · Tank · Hack Benjamin<br><br>BASED ON BIG MONEY RUSTLAS<br>Licensed title and fictional characters.<br>Original poster styling, illustrated worlds, and character animation.<br>Sugar Wolf · Shaggy 2 Dope<br>Big Baby Chips · Violent J<br>Hack Benjamin · Jumpsteady<br>Other characters use original covered-face designs.<br>Original sound design and adaptive guitar score.<br>Rye typeface © Sorkin Type Co · SIL Open Font License.<br>48 frontier secrets, movie callbacks, and original encounters.<br><br>GAME EDITION<br>Twelve-chapter campaign · Version 3.0<br><br>Thanks for riding with us.</div><div class="button-row">${btn('Main menu','home','primary')}${btn('Replay intro','intro')}${save.beaten?btn('Chapter select','chapters'):''}</div></div></div>`,'credits');
}
function journal(){
  const all=save.secrets.length===SECRETS.length;
  show(`<div class="panel-screen">${header('THE THINGS THIS TOWN DOESN’T ADVERTISE',all?'Tumbleweed Marshal.':'The trail gets weird.',`${save.secrets.length} / ${SECRETS.length} secrets discovered. Each new discovery earns 15 gold.`,balance())}${all?'<div class="guide-note">The Tumbleweed Council has granted you its highest honor. A gold star follows your sheriff on every future ride.</div>':''}<div class="journal-grid">${SECRETS.map((s,i)=>{const found=save.secrets.includes(s.id);return `<article class="journal-entry ${found?'found':''}"><span class="eyebrow">${String(i+1).padStart(2,'0')} / CHAPTER ${s.chapter} ${found?'· DISCOVERED':''}</span><h3>${found?s.name:'Unknown business'}</h3><p>${found?s.text:s.clue}</p><small>${found?'✓ 15 GOLD CLAIMED':s.action==='slap'?'TRY A SLAP':s.action==='down'?'HOLD DOWN TO BOW':'E / INSPECT'}</small></article>`;}).join('')}</div><div class="panel-footer"><span>ORIGINAL NONSENSE, FOUND IN THE WILD.</span>${btn('Back',`back:${menuReturn}`,'primary')}</div></div>`,'journal');
}
function bountyStrip(chapter,run=null){
  return `<div class="bounty-strip">${BOUNTIES.filter(b=>b.chapter===chapter).map(b=>{
    const claimed=save.bounties.includes(b.id),p=run?bountyProgress(b,run):null;
    return `<div class="bounty-line ${claimed?'claimed':p?.met?'on-track':''}"><span aria-hidden="true">${claimed?'★':'☆'}</span><span><b>${b.name}</b><small>${b.description}</small></span><em>${claimed?'CLAIMED':p?p.label:`+${save.items.bounty?30:20} ◈`}</em></div>`;
  }).join('')}</div>`;
}
function bounties(){
  show(`<div class="panel-screen">${header('MUD BUG BOUNTY OFFICE','Make a name for yourself.',`${save.bounties.length} / ${BOUNTIES.length} bounties claimed. Earn ${save.items.bounty?30:20} gold per stamp by finishing the chapter.`,balance())}<div class="bounty-board">${CHAPTERS.map((c,i)=>`<article class="bounty-poster ${i+1>save.unlocked?'locked':''}"><span class="eyebrow">CHAPTER ${String(i+1).padStart(2,'0')} · ${i+1>save.unlocked?'TRAIL LOCKED':'WANTED'}</span><h3>${c.name}</h3>${bountyStrip(i+1,menuReturn==='paused'&&game?.chapter===i+1?game:null)}${menuReturn==='paused'?'':btn(i+1>save.unlocked?'Finish the previous trail':'Ride this trail →',`chapter:${i+1}`,'text-button',i+1>save.unlocked?'disabled':'')}</article>`).join('')}</div><div class="panel-footer"><span>GOLD STASHES · LOST BADGES · FEATS OF FRONTIER NONSENSE</span>${btn('Back',`back:${menuReturn}`,'primary')}</div></div>`,'bounties');
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
  }else if(name==='music-preview'){audio.previewMusic().then(ok=>{if($('sound-status'))$('sound-status').textContent=ok?'Playing the original game guitar score.':save.settings.music?'Music is unavailable in this browser.':'Turn Music on to hear the score.';});}else if(name==='sound-preview'){audio.preview().then(ok=>{if($('sound-status'))$('sound-status').textContent=ok?'Revolver · reload · pimp hand · ricochet · gold':save.settings.sound?'Audio is unavailable in this browser.':'Turn sound effects on to hear the preview.';});}else if(name==='ending')ending();else if(name==='credits')credits();
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
  if(set('health',`${g.hp}/${g.maxHp}`,`${'♥'.repeat(Math.max(0,g.hp))}<span class="empty">${'♡'.repeat(g.maxHp-Math.max(0,g.hp))}</span>`)){hudElements.health.setAttribute('aria-label',`${g.hp} of ${g.maxHp} health`);hudElements.health.classList.toggle('low-health',g.hp<=(g.world.def.duel?1:2));}
  set('shield',g.shield,g.shield?'◇ ARMOR READY':'');set('chapter-label',g.chapter,`CHAPTER ${String(g.chapter).padStart(2,'0')}`);set('place-label',g.chapter,g.world.def.place);
  set('gold',g.coins,String(g.coins));set('badges',g.relics,`${'★'.repeat(g.relics)}<span style="opacity:.35">${'☆'.repeat(3-g.relics)}</span>`);
  const training=g.world.def.training||g.world.def.meleeOnly;set('rounds',`${training}/${g.ammo}`,training?'':Array.from({length:g.maxAmmo},(_,i)=>`<i class="round ${i>=g.ammo?'empty':''}"></i>`).join(''));
  const label=g.world.def.duel?'TWO-HIT PISTOL DUEL':training?'THE PIMP HAND':g.reload>0?'RELOADING…':g.maxAmmo===8?'EIGHT-SHOOTER':'SIX-SHOOTER';set('weapon-label',label,label);
  hudElements['reload-track'].hidden=g.reload<=0;bar('reload-fill',1-g.reload/g.reloadDuration);
  bar('trail-fill',p.x/g.world.exit);
  for(const [ability,duration]of [['slap',g.noonTime>0?.36:.5],['roll',g.items.dodge?.62:.85]]){const ready=p[ability+'CD']<=0;set(ability+'-status',ready,ready?'READY':'WAIT');bar(ability+'-fill',1-p[ability+'CD']/duration);}
  const noonState=g.world.def.duel?'duel':g.noonTime>0?'active':g.noon>=100?'ready':'charging';
  const noonLabel=g.world.def.duel?'PISTOLS':g.noonTime>0?`${Math.ceil(g.noonTime)}s BURST`:g.noon>=100?'UNLEASH':`${Math.floor(g.noon)}%`;
  set('noon-status',noonLabel,noonLabel);bar('noon-fill',g.world.def.duel?0:g.noonTime>0?g.noonTime/(g.items.noon?7:5):g.noon/100);
  if(hudCache.noonState!==noonState){hudCache.noonState=noonState;const button=hudElements['noon-button'];button.dataset.state=noonState;button.disabled=noonState!=='ready';button.setAttribute('aria-label',noonState==='ready'?'Unleash High Noon (Q or RB)':noonState==='active'?'High Noon active':noonState==='duel'?'High Noon unavailable during the pistol duel':'High Noon charging: earn charge with combat and loot');}
  set('run-score',g.score,g.score.toLocaleString());
  set('combo-label',g.combo>1?g.combo:0,g.combo>1?`${g.combo}× QUICK JUSTICE`:'TRAIL SCORE');bar('combo-fill',g.combo>1?g.comboTimer/3:0);
  const b=g.world.boss;$('boss-hud').hidden=!b?.active||b.dead;
  if(b?.active&&!b.dead){set('boss-name',b.enraged?'rage':b.name,b.enraged?'Big Money Chips':b.name);bar('boss-fill',b.hp/b.maxHp);const state=b.phase==='tell'?({charge:'DODGE!',slam:'GET READY TO JUMP',crossfire:'DODGE THE CROSSFIRE',quickdraw:'MOVE! AIM LOCKED',double:'TWO SHOTS — MOVE',fan:'FAN FIRE — DODGE',volley:'JUMP THE VOLLEY',high:'STAY LOW'})[b.attack]:b.phase==='recover'?(g.world.def.duel?'SHOOT! RELOADING':training?'SLAP NOW':'STRIKE NOW'):b.phase==='rage'?'ALL THAT GLITTERS…':'';set('boss-state',state,state);}
}
function processEvents(){
  for(const e of game.events){
    audio.sfx(e.type,e);
    if(e.type==='checkpoint'){saveRun();toast(e.message);}
    if(e.type==='hint'&&!game.secretPrompt)$('hint').textContent=hintText(e.text);
    if(e.type==='secret-prompt')$('hint').textContent=hintText(e.text||game.lastSign);
    if(e.type==='secret'){if(!save.secrets.includes(e.id)){save.secrets.push(e.id);save.coins+=15;persist();}toast(`${e.name} · +15 gold. ${e.text}`,7000);}
    if(e.type==='noon-ready')toast('HIGH NOON READY · Q / RB / tap the gold button');
    if(e.type==='high-noon')toast(`HIGH NOON · ${game.items.noon?'Seven':'Five'} seconds. Make them count.`,2000);
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
  const w=g.world;const row=g.world.def.training?2:w.def.bg==='bg_saloon'?1:w.def.bg==='bg_hideout'?3:w.def.bg==='bg_town'?1:0;
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
function drawWell(x,y,active){shadow(x,y,53);sprite(active?'prop_well_lit':'prop_well',x,y+4,166);}

function drawWorld(g){
  const w=g.world,t=g.time,bg=scenery.backgrounds[w.def.bg],motion=effectsEnabled();ctx.fillStyle='#19120e';ctx.fillRect(0,0,WIDTH,HEIGHT);
  if(bg){const bh=HEIGHT,bw=bg.width/bg.height*bh,off=-(g.cam*.23)%bw;for(let x=off-bw;x<WIDTH;x+=bw)ctx.drawImage(bg,x,0,bw,bh);}
  if(g.world.def.training){ctx.fillStyle='#57738626';ctx.fillRect(0,0,WIDTH,HEIGHT);}if(g.world.def.bg==='bg_hideout'){ctx.fillStyle='#20162050';ctx.fillRect(0,0,WIDTH,HEIGHT);}
  ctx.fillStyle=w.def.duel?'#190e24aa':w.def.bg==='bg_saloon'?'#140c2355':w.def.bg==='bg_town'?'#10172777':'#17203644';ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.fillStyle=atmosphere;ctx.fillRect(0,0,WIDTH,HEIGHT);
  const shake=motion&&g.shake>0?(Math.random()-.5)*g.shake*32:0;ctx.save();ctx.translate(shake,FLOOR*(1-WORLD_ZOOM)-g.camY*WORLD_ZOOM+shake*.4);ctx.scale(WORLD_ZOOM,WORLD_ZOOM);ctx.translate(-Math.round(g.cam),0);
  drawPlatforms(g);
  drawLivingTrail(g,motion);
  drawSecrets(g);
  drawStashes(g,motion);
  for(const c of w.checkpoints){
    if(c.x<g.cam-90||c.x>g.cam+WIDTH+90)continue;
    drawWell(c.x+25,FLOOR,c.hit);
    text(c.hit?'CHECKPOINT SAVED':'REST & SAVE',c.x+25,FLOOR-185,10,c.hit?'#f8db93':'#e8d8ba');
    if(c.hit){ctx.globalAlpha=.2+.1*Math.sin(t*3);ctx.strokeStyle='#eac777';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(c.x+25,FLOOR-3,58,12,0,0,7);ctx.stroke();ctx.globalAlpha=1;}
  }
  const exit=w.exit,locked=w.boss&&!w.boss.dead;
  sprite(locked?'prop_exit_locked':'prop_exit',exit+20,FLOOR+3,194);
  text(locked?'SHOWDOWN':'RIDE ON',exit+20,FLOOR-133,12,'#ffe2a7','center','Rye');
  for(const c of w.pickups){if(c.got||c.x<g.cam-50||c.x>g.cam+g.viewWidth+50)continue;const bob=motion?Math.sin(t*3+c.x)*4:0;
    sprite(c.type==='coin'?'prop_coin':c.type==='relic'?'prop_badge':'prop_medicine',c.x,c.y+bob+15,c.type==='relic'?37:c.type==='heart'?35:26);
  }
  for(const e of w.enemies){if(e.dead||e.x<g.cam-130||e.x>g.cam+WIDTH+130)continue;shadow(e.x+e.w/2,surfaceBelow(g,e.x+e.w/2,e.y+e.h),25);const bob=e.attack==='walk'?Math.sin(e.t*10)*2:0;
    ctx.save();const ex=e.x+e.w/2,ey=e.y+e.h+bob;ctx.translate(ex,ey);if(motion&&e.stagger>0)ctx.rotate(Math.sign(e.knock)*e.stagger*.55);sprite(e.kind==='foot'?(e.phase==='dash'?'foot_kick':e.phase==='aim'?'foot_windup':e.phase==='recover'?'foot_recover':Math.abs(e.vx)>0?'foot_step'+(1+Math.floor(e.t*7)%2):'foot_idle'):e.kind==='pie'?(e.phase==='aim'?'raider_throw':'raider_idle'):e.img,0,0,e.h+24,e.dir<0,e.flash>0?.68:1);ctx.restore();
    if(e.phase==='aim'){text('!',e.x+e.w/2,e.y-37,27,'#ffcb65');ctx.strokeStyle='#ffc96f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x+e.w/2,e.y-47,17,0,7);ctx.stroke();}
    if(e.hp<e.maxHp){ctx.fillStyle='#33251b';ctx.fillRect(e.x,e.y-20,e.w,3);ctx.fillStyle='#e0a667';ctx.fillRect(e.x,e.y-20,e.w*e.hp/e.maxHp,3);}
  }
  for(const d of g.defeats){ctx.save();ctx.translate(d.x,d.y);if(motion)ctx.rotate((.38-d.life)*Math.sign(d.vx)*2);sprite(d.img,0,0,d.h,d.dir<0,d.life/.38);ctx.restore();}
  const b=w.boss;
  if(b&&!b.dead){
    shadow(b.x+b.w/2,FLOOR,b.w*.6);
    if(b.phase==='tell'){
      ctx.save();ctx.globalAlpha=motion?.45+.15*Math.sin(t*22):.6;ctx.fillStyle='#f9bb58';
      if(g.world.def.duel){ctx.strokeStyle='#ffdf97';ctx.lineWidth=2;ctx.setLineDash([12,9]);ctx.beginPath();ctx.moveTo(b.x+b.w/2,b.y+42);ctx.lineTo(b.targetX,b.targetY);ctx.stroke();ctx.setLineDash([]);}
      else if(b.attack==='slam'){ctx.beginPath();ctx.ellipse(b.targetX+21,FLOOR-5,88,13,0,0,7);ctx.fill();}
      else if(b.attack==='volley'||b.attack==='high'){ctx.fillRect(b.arena-100,FLOOR-(b.attack==='high'?130:37),w.def.length-b.arena+80,5);}
      else if(b.attack==='charge'){ctx.fillRect(Math.min(b.x,b.targetX),FLOOR-5,Math.abs(b.x-b.targetX)+30,5);}
      ctx.restore();text('!',b.x+b.w/2,b.y-38,35,'#ffcf79');
    }
    let frame=b.phase==='tell'?5:b.phase==='attack'?7:1+Math.floor(t*5)%3;
    const name=b.kind==='chips'?(b.phase==='attack'?'chips_fire':'chips_idle'):b.kind==='poot'?(b.phase==='attack'?'poot_fire':'poot_idle'):b.enraged?`${b.prefix}gold${1+Math.floor(t*6)%5}`:`${b.prefix}${frame}`;
    sprite(images[name]?name:`${b.prefix}1`,b.x+b.w/2,b.y+b.h,b.h+20,b.dir<0,b.flash>0?(motion&&Math.floor(t*30)%2?.55:.8):1);
  }
  for(const s of g.shots){
    const color=s.friendly?(s.kind==='return'?'#bbf0c0':s.charged?'#fff3b6':'#ffe1a3'):'#ff9d76';ctx.fillStyle=color;ctx.strokeStyle=color;
    if(s.kind==='axe'){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(t*9);sprite('prop_axe',0,15,30);ctx.restore();}
    else if(s.kind==='wave'){ctx.lineWidth=4;ctx.beginPath();ctx.arc(s.x,s.y,14,Math.PI,0);ctx.stroke();}
    else {ctx.save();ctx.shadowColor=color;ctx.shadowBlur=8;ctx.beginPath();ctx.ellipse(s.x,s.y,s.friendly?10:8,s.friendly?3:5,0,0,7);ctx.fill();ctx.globalAlpha=.35;ctx.fillRect(s.x-Math.sign(s.vx)*22,s.y-1,Math.sign(s.vx)*18,2);ctx.restore();}
  }
  const p=g.player,feet=p.y+p.h,ground=surfaceBelow(g,p.x+21,feet);shadow(p.x+21,ground,Math.max(10,24-(ground-feet)*.035));
  if(g.noonTime>0){ctx.save();ctx.strokeStyle='#ffe4a3';ctx.globalAlpha=.55;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x+21,feet-40,34,57,0,0,7);ctx.stroke();if(motion){for(let i=0;i<4;i++)drawStar(p.x+21+Math.cos(t*5+i*1.57)*38,feet-40+Math.sin(t*5+i*1.57)*49,4,'#ffe4a3');}ctx.restore();}
  const pimpMode=w.def.training||w.def.meleeOnly;
  let pose='idle',prefix=pimpMode?'rl_sugarwolf_slap_':'rl_sugarwolf_gun_';
  if(p.action>0)pose=p.actionKind==='slap'?'slap2':'shoot';else if(p.roll>0||p.ground&&p.duck)pose='crouch';else if(!p.ground)pose='jump';else if(Math.abs(p.vx)>35)pose=`walk${Math.floor((p.stride||0)/32)%6}`;
  let name=pose.startsWith('walk')?'sugar_'+pose:prefix+pose;
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
    if(pose==='shoot'&&p.ground&&Math.abs(p.vx)>35){
      ctx.save();ctx.beginPath();ctx.rect(-90,-42,180,46);ctx.clip();sprite('sugar_walk'+(Math.floor((p.stride||0)/32)%6),0,0,109,p.dir<0,alpha);ctx.restore();
      ctx.save();ctx.beginPath();ctx.rect(-160,-160,320,118);ctx.clip();sprite(name,0,0,playerHeight,p.dir<0,alpha);ctx.restore();
    }else sprite(name,0,0,pose.startsWith('walk')?109:playerHeight,p.dir<0,alpha);
  }ctx.restore();
  if(p.action>0&&p.actionKind==='slap'&&slapPose(p.action)==='extend'){
    const tip=p.x+p.w/2+p.dir*slapReach(p.action,g.items.slap);
    ctx.save();ctx.globalAlpha=.65;ctx.strokeStyle='#ffe1a0';ctx.lineWidth=3;
    for(const dy of [-20,0,20]){ctx.beginPath();ctx.moveTo(tip+p.dir*5,p.y+20+dy);ctx.lineTo(tip+p.dir*18,p.y+20+dy*1.35);ctx.stroke();}ctx.restore();
  }
  if(save.secrets.length===SECRETS.length){drawStar(p.x+p.w/2,p.y-41+Math.sin(t*3)*4,10,'#f8db86');}
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
  scenery=prepareScenery(images,crops);scenery.lanternGlow=prepareLanternGlow();
  assetsReady=true;$('loading').hidden=true;resize();intro();lastTime=performance.now();requestAnimationFrame(frame);
  if(!storageOK)toast('Browser storage is unavailable. Progress will last for this session.');
}
loadAssets();

function drawSecrets(g){
  for(const s of g.secrets){
    if(s.x<g.cam-80||s.x>g.cam+WIDTH+80)continue;ctx.save();ctx.translate(s.x,s.y);
    if(s.kind==='hack'){sprite(s.found?'hack_tip':'hack_idle',0,0,133,g.player.x<s.x);text('HACK BENJAMIN',0,-150,10,'#e8cf96');}
    else{const name=({paper:'sign',crate:'stash',jail:'coffin'})[s.kind]||s.kind;
      const size=({bucket:42,cactus:80,hitch:85,barrel:67,population:124,sign:89,pot:45,hat:57,piano:96,jar:40,chair:88,bell:100,chicken:45,rock:37,coffin:98,cards:40,watch:42,rope:44,shovel:90,stash:51})[name]||60;
      sprite('prop_'+name,0,2,size);
      if(s.kind==='population'){text('MUD BUG',0,-86,12,'#3d2313','center','Rye');text('POPULATION',0,-68,7,'#4c321b');text(String(Math.max(1,69-g.kills)),0,-44,17,'#3d2313');}
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
function drawStashes(g,motion){
  for(const c of g.world.stashes){if(c.x<g.cam-100||c.x>g.cam+g.viewWidth+100)continue;shadow(c.x+25,c.y+49,31);sprite(c.broken?'prop_stash_broken':'prop_stash',c.x+25,c.y+51,c.broken?36:56);if(!c.broken&&Math.abs(g.player.x-c.x)<140)text('SMASH FOR GOLD',c.x+25,c.y-18,9,'#f7dc9d');}
}
function drawLivingTrail(g,motion){
  const saloon=g.world.def.bg==='bg_saloon',woods=g.world.def.training,t=motion?g.time:0;
  if(saloon){
    const first=Math.floor(g.cam/580);
    for(let i=first;i<=first+2;i++){
      const x=i*580+290,y=215+(i%2)*20;ctx.save();ctx.translate(x,y-75);ctx.rotate(Math.sin(t*1.25+i)*.035);
      ctx.strokeStyle='#26180f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-100);ctx.lineTo(0,75);ctx.stroke();
      ctx.translate(0,75);ctx.drawImage(scenery.lanternGlow,-96,-93,192,192);
      sprite('prop_lantern',0,30,67);ctx.restore();
    }
  }else if(!woods){
    const first=Math.floor(g.cam/850);
    for(let i=first;i<=first+2;i++){
      const x=i*850+(t*23+i*157)%700,ground=surfaceBelow(g,x,FLOOR);
      if(ground!==FLOOR)continue;
      shadow(x,FLOOR,16);ctx.save();ctx.translate(x,FLOOR-16-Math.abs(Math.sin(t*2+i))*3);ctx.rotate(t*1.4+i);sprite('prop_tumbleweed',0,19,38);ctx.restore();
    }
  }
  if(woods&&motion){ctx.fillStyle='#c8ae6a88';for(let i=0;i<8;i++){const x=g.cam+(i*173+t*18)%g.viewWidth,y=110+(i*61+t*25)%380;ctx.save();ctx.translate(x,y);ctx.rotate(t+i);ctx.beginPath();ctx.ellipse(0,0,5,2,0,0,7);ctx.fill();ctx.restore();}}
}

function prepareLanternGlow(){
  const cv=document.createElement('canvas');cv.width=cv.height=192;const c=cv.getContext('2d');
  const light=c.createRadialGradient(96,96,1,96,96,96);light.addColorStop(0,'#f9bc5940');light.addColorStop(1,'#f9bc5900');c.fillStyle=light;c.fillRect(0,0,192,192);return cv;
}
