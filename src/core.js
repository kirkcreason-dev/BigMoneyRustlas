import { SECRETS } from './secrets.js';
// The simulation is independent of the browser: the same code runs in tests.
export const SLAP_DURATION=.38;
export function slapPose(action){const t=SLAP_DURATION-action;return t<.045?'windup':t<.10?'launch':t<.21?'extend':t<.29?'recoil':'recover';}
export function slapReach(action,upgraded=false){const t=SLAP_DURATION-action;if(action<=0||t<.055||t>.255)return 0;return ({launch:205,extend:445,recoil:260}[slapPose(action)]||0)*(upgraded?1.18:1);}
export const WIDTH = 1280, HEIGHT = 720, FLOOR = 594;
export const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
export const overlaps = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
export const DIFFICULTIES = {
  story: { name:'Easy rider', hearts:7, speed:0.8, damage:0.8, description:'More health. Slower enemy attacks. Enjoy the ride.' },
  outlaw: { name:'Outlaw', hearts:5, speed:1, damage:1, description:'The intended showdown. Keep moving and pick your shots.' },
  legend: { name:'Deadeye', hearts:3, speed:1.18, damage:1.15, description:'Less room for mistakes. For a sheriff with something to prove.' }
};
export const UPGRADES = [
  {id:'heart', name:'Iron constitution', cost:100, symbol:'♥', desc:'One extra heart, every chapter.'},
  {id:'reload', name:'Quick hands', cost:120, symbol:'⟳', desc:'Reload your revolver 35% faster.'},
  {id:'magnet', name:'Lucky horseshoe', cost:90, symbol:'∩', desc:'Draw nearby gold into your pockets.'},
  {id:'boots', name:'Spurred boots', cost:140, symbol:'↟', desc:'A second jump while airborne. Reach the high road.'},
  {id:'shield', name:'Tin-star armor', cost:160, symbol:'☆', desc:'Absorb one hit at every checkpoint.'},
  {id:'slap', name:'Sanchez special', cost:130, symbol:'✦', desc:'A stronger elastic slap with 18% more reach.'},
  {id:'cylinder',name:'Eight-shot conversion',cost:210,symbol:'✦',desc:'Eight rounds between reloads.'},
  {id:'trigger',name:'Hair trigger',cost:180,symbol:'✦',desc:'Fire 18% faster outside High Noon.'},
  {id:'pierce',name:'Through-and-through',cost:260,symbol:'✦',desc:'Bullets pass through one enemy into the next.'},
  {id:'powder',name:'First-round thunder',cost:230,symbol:'✦',desc:'The first round of a loaded cylinder deals double damage.'},
  {id:'spurs',name:'Roadrunner spurs',cost:170,symbol:'✦',desc:'Run 13% faster; jump farther.'},
  {id:'dodge',name:'Greased boot soles',cost:190,symbol:'✦',desc:'Dodge again 27% sooner.'},
  {id:'noon',name:'Long shadow',cost:280,symbol:'✦',desc:'High Noon lasts seven seconds.'},
  {id:'charge',name:'Mean reputation',cost:240,symbol:'✦',desc:'Earn High Noon charge 25% faster.'},
  {id:'medic',name:'Sawbones’ supplies',cost:150,symbol:'✦',desc:'Medicine restores three hearts instead of two.'},
  {id:'stash',name:'Strongbox skeleton key',cost:170,symbol:'✦',desc:'Each broken stash pays 12 gold instead of eight.'},
  {id:'bounty',name:'Deputy’s commission',cost:220,symbol:'✦',desc:'Unclaimed bounties pay 30 gold instead of 20.'},
  {id:'parry',name:'Return postage',cost:250,symbol:'✦',desc:'Returned enemy shots deal four damage.'}
];
const ORIGINAL_CHAPTERS = [
  {name:'Back to Mud Bug', place:'DUSTY PLAINS', bg:'bg_island', ground:'ground_rock', accent:'#cf9149', length:4900, par:100,
   quote:'A town without a sheriff is just a graveyard with a saloon.', story:'Sugar Wolf rides into Mud Bug with six bullets and an old badge. Big Baby Chips owns every soul in town. Time to make an introduction.', objective:'Follow the gold trail to Mud Bug.', enemies:['bandit','gambler']},
  {name:'Chips’ Welcome', place:'MUD BUG TOWN', bg:'bg_town', ground:'ground_wood', accent:'#dfab68', length:5300, par:115,
   quote:'Chips heard you were coming. He sent a welcome committee.', story:'The streets are crawling with hired guns. Take the rooftops, recover the stolen gold, and remind this town what a sheriff looks like.', objective:'Fight through the main street.', enemies:['bandit','gunhand','foot']},
  {name:'Raw Stank', place:'THE EDGE OF TOWN', bg:'bg_town', ground:'ground_wood', accent:'#cf9149', length:2500, par:65, boss:'stank',
   quote:'Big talk. Bad breath. Worse intentions.', story:'Raw Stank blocks the road to the Hatchetman Saloon. He hits like a runaway wagon. Let him commit, roll through, then make him pay.', objective:'Defeat Raw Stank. Dodge his charge.', enemies:['gambler']},
  {name:'Dusty Poot', place:'HATCHETMAN SALOON', bg:'bg_saloon', ground:'ground_wood', accent:'#d3a155', length:2600, par:80, boss:'poot',
   quote:'He deals in lead. You collect.', story:'Dusty Poot guards the saloon ledger with a loaded revolver. Dodge the crossfire and return the favor.', objective:'Defeat Dusty Poot. Dodge the crossfire.', enemies:['pie']},
  {name:'The Saloon Floor', place:'AFTER LAST CALL', bg:'bg_saloon', ground:'ground_wood', accent:'#af825b', length:5700, par:130,
   quote:'Last call came and went. The trouble stayed.', story:'Chips slips out the back while his strangest crew closes in. Ghosts haunt the rafters and hired feet patrol the floor. Find your way through.', objective:'Reach the saloon’s back exit.', enemies:['ghost','gunhand','foot']},
  {name:'The Assassin', place:'DEAD MAN’S STREET', bg:'bg_town', ground:'ground_wood', accent:'#bd7756', length:2800, par:90, boss:'tank',
   quote:'They said his name was Tink. They were wrong.', story:'Chips has one last hired killer. Tank’s rifle can cover the whole street. Jump the low volleys and use the platforms when he takes aim.', objective:'Defeat Tank. Read his firing line.', enemies:['gunhand']},
  {name:'Sanchez’s Lesson', place:'SANCHEZ’S WOODLAND CAMP', bg:'bg_woodland', ground:'ground_rock', accent:'#b7bbab', length:5800, par:140, training:true,
   quote:'A broken gun hand doesn’t make a broken sheriff.', story:'Tank has destroyed Sugar’s shooting hand. Deep in the woods, Dirty Sanchez teaches him to fight with the other. Slap bullets back, cross the creek beds, and earn your return.', objective:'Master the slap. Reach Sanchez’s camp.', enemies:['bruiser','ghost','bandit']},
  {name:'Big Baby Chips', place:'THE LAST HAND IN MUD BUG', bg:'bg_town', ground:'ground_wood', accent:'#eabf62', length:3000, par:120, boss:'chips',meleeOnly:true,
   quote:'One town. One badge. One last hand to play.', story:'Sanchez’s lesson is learned. Sugar returns to Mud Bug with his other hand ready. Chips waits in the street with a fortune and a secret. Finish what you started.', objective:'Defeat Chips and free Mud Bug.', enemies:['bruiser']}
];
export const LEGACY_CHAPTER_MAP=[0,1,2,4,6,7,9,10,12];
const old=ORIGINAL_CHAPTERS.map((c,i)=>({...c,route:i+1,baseLength:c.length,length:c.boss?c.length:c.length+2200,par:c.par+(c.boss?0:65)}));
old[3]={...old[3],quote:'He deals in lead. You collect.',story:'Dusty Poot is guarding the saloon ledger with a loaded revolver. Force him to fire, cross his line, and strike while he reloads.',objective:'Defeat Poot. Dodge his crossfire.',enemies:['pie','gunhand']};
old[7]={...old[7],meleeOnly:false,duel:true,quote:'Two hits. One street. No excuses.',story:'Sanchez taught Sugar to trust his other hand. Now it holds a borrowed six-shooter. Chips clears the street for a brutally fast pistol duel. Read his aim, move before the shot, and fire during his reload.',objective:'Win the pistol duel. Two hits kill you. Gear and High Noon are suspended.',par:180};
const side=(route,name,place,bg,enemies,story,objective)=>({route,name,place,bg,enemies,story,objective,quote:'Mud Bug keeps its receipts in shallow graves.',ground:bg==='bg_hideout'?'ground_rock':'ground_wood',accent:'#bd8653',length:6400,par:170});
export const CHAPTERS=[old[0],old[1],
  side(9,'The Gold Road','CHIPS’ TOLL DEPOT','bg_hideout',['gunhand','foot','bandit'],'Every road into Mud Bug pays Chips. Sugar follows the stolen gold into a shuttered toll depot. The receipts name Raw Stank as the collector. Find a way out before his crew seals the road.','Break through the toll depot and find Stank.'),
  old[2],side(10,'Under the Hatchetman','THE SALOON CELLAR','bg_saloon',['pie','foot','gambler'],'Stank falls, but the saloon doors are barred. An unpaid bartender points Sugar toward the cellar. Poot’s men are moving the town ledger upstairs. Cut through the barrels and intercept it.','Reach the saloon floor through the cellar.'),
  old[3],old[4],side(11,'The Dead Man’s Road','MUD BUG BURIAL GROUND','bg_town',['ghost','gunhand','bruiser'],'The ledger exposes Chips’ last hired killer. Tank has turned the cemetery road into a shooting gallery. Sugar follows the fresh boot tracks. The undertaker has already measured him.','Cross the burial road and confront Tank.'),
  old[5],old[6],side(12,'The Other Hand','THE ROAD BACK TO MUD BUG','bg_town',['foot','bandit','gunhand'],'Sanchez’s lesson is done. Sugar takes a spare revolver in his trained hand and rides back through Chips’ last patrols. Practice the draw. The final street allows exactly two mistakes.','Return to Mud Bug with the other hand ready.'),old[7]
].map((c,i)=>({...c,act:i<4?'I · A BADGE IN THE DUST':i<9?'II · CHIPS OWNS THE NIGHT':'III · THE OTHER HAND',after:[
'Mud Bug is ahead. Its welcome committee has loaded up.',
'A stolen receipt points to Chips’ toll depot.',
'You found the collector. Raw Stank is waiting at the town line.',
'Stank is down. The saloon’s cellar is the way inside.',
'The cellar opens onto Poot’s floor. Keep your revolver loaded.',
'Poot drops the ledger. Chips is fleeing through the back rooms.',
'The back door leads to the burial road and Tank’s ambush.',
'The assassin has stopped hiding. Read his firing line.',
'Tank is beaten, but Sugar’s gun hand is ruined. Find Sanchez.',
'Sanchez teaches Sugar to fight and draw with the other hand.',
'The town falls silent. Chips waits with a loaded pistol.',
'Chips falls. Beneath the gold is Grizzly Wolf. Mud Bug is free.'
][i]}));
export const ENEMIES = {
  bandit:{img:'e_shadow',hp:2,w:43,h:75,speed:65,attack:'shot'},
  gambler:{img:'e_gambler',hp:2,w:44,h:72,speed:80,attack:'walk'},
  gunhand:{img:'e_shadow_aim',hp:2,w:43,h:74,speed:0,attack:'shot'},
  foot:{img:'foot_idle',hp:3,w:56,h:66,speed:85,attack:'charge'},
  pie:{img:'raider_idle',hp:2,w:44,h:70,speed:0,attack:'lob'},
  ghost:{img:'e_ghost',hp:2,w:45,h:72,speed:35,attack:'ghost'},
  bruiser:{img:'e_tank',hp:4,w:50,h:80,speed:70,attack:'walk'}
};
export const BOSSES = {
  stank:{name:'Raw Stank',prefix:'bstank_',hp:26,w:78,h:112,tip:'ROLL THROUGH THE CHARGE'},
  poot:{name:'Dusty Poot',prefix:'bpoot_',hp:30,w:76,h:112,tip:'DODGE THE CROSSFIRE. SHOOT THE RELOAD.'},
  tank:{name:'Tank',prefix:'btank_',hp:34,w:72,h:108,tip:'JUMP THE FIRING LINE'},
  chips:{name:'Big Baby Chips',prefix:'bchips_',hp:18,w:76,h:102,tip:'TWO HITS KILL. MOVE ON THE AIM LINE. SHOOT THE RELOAD.'}
};
// Three optional contracts per trail, paid once after a completed chapter.
export const BOUNTIES=CHAPTERS.flatMap((c,i)=>{
  const chapter=i+1,skill=c.duel?['time','Fastest hand in Mud Bug','Win the duel in 90 seconds.',90]:c.training?['parries','Hands of the law','Return 3 enemy shots.',3]:c.boss?['noon','Sun at your back','Unleash High Noon.',1]:i%2?['clean','Keep the hat','Finish without dying.',1]:['streak','Quick justice','Finish with a 3-kill streak.',3];
  return [{id:`${chapter}-stashes`,chapter,name:'Chips’ loose change',description:'Break all 3 gold stashes.',kind:'stashes',target:3},
    {id:`${chapter}-badges`,chapter,name:'Badge business',description:'Recover all 3 lost badges.',kind:'badges',target:3},
    {id:`${chapter}-${skill[0]}`,chapter,name:skill[1],description:skill[2],kind:skill[0],target:skill[3]}].map(b=>({...b,reward:20}));
});
export function bountyProgress(b,g){
  const value=({stashes:g.smashed.size,badges:g.relics,streak:g.bestCombo,parries:g.parries,noon:g.noonUses,clean:g.deaths===0?1:0,time:Math.ceil(g.time)})[b.kind];
  const met=b.kind==='time'?value<=b.target:value>=b.target;
  return {value,met,earned:g.complete&&met,label:b.kind==='time'?`${value}s / ${b.target}s`:b.kind==='clean'?(met?'HAT INTACT':'TRY NEXT RUN'):`${Math.min(value,b.target)} / ${b.target}`};
}
export function defaultSave() { return {version:3,unlocked:1,coins:0,items:{},best:{},secrets:[],bounties:[],settings:{difficulty:'outlaw',sound:true,music:true,soundVolume:80,musicVolume:55,motion:true,touch:false},run:null,beaten:false}; }
export function sanitizeSave(raw) {
  const s=defaultSave(); if (!raw || typeof raw!=='object') return s;
  const int=(n,max=1e7)=>Number.isFinite(n)?clamp(Math.floor(n),0,max):0;
  const legacy=raw.version===2,map=n=>legacy?(LEGACY_CHAPTER_MAP[n]||n):n;
  s.secrets=Array.isArray(raw.secrets)?[...new Set(raw.secrets.filter(id=>SECRETS.some(s=>s.id===id)))]:[];
  s.bounties=Array.isArray(raw.bounties)?[...new Set(raw.bounties.map(id=>typeof id==='string'&&legacy?id.replace(/^([1-8])-/,(_,n)=>map(+n)+'-'):id).filter(id=>BOUNTIES.some(b=>b.id===id)))]:[];
  s.unlocked=clamp(map(int(raw.unlocked,CHAPTERS.length)),1,CHAPTERS.length); s.coins=int(raw.coins); s.beaten=!!(raw.beaten||raw.gameBeaten);
  for(const it of UPGRADES) s.items[it.id]=!!raw.items?.[it.id];
  if(!raw.version||raw.version<2) { s.items.boots=!!raw.items?.djump; s.items.reload=false; }
  if(raw.best && typeof raw.best==='object') for(let i=1;i<=CHAPTERS.length;i++) {
    const b=raw.best[i]; if(b && typeof b==='object') s.best[map(i)]={score:int(b.score),time:int(b.time),relics:int(b.relics,3),clean:!!b.clean,clears:int(b.clears)};
  }
  if(raw.settings && typeof raw.settings==='object') {
    if(DIFFICULTIES[raw.settings.difficulty]) s.settings.difficulty=raw.settings.difficulty;
    for(const k of ['soundVolume','musicVolume'])if(Number.isFinite(raw.settings[k]))s.settings[k]=clamp(raw.settings[k],0,100);
    for(const k of ['sound','music','motion','touch']) if(typeof raw.settings[k]==='boolean') s.settings[k]=raw.settings[k];
  }
  const r=raw.run?{...raw.run,chapter:map(raw.run.chapter)}:null;
  if(r && Number.isInteger(r.chapter) && r.chapter>=1 && r.chapter<=s.unlocked && Number.isFinite(r.checkpoint)) {
    const world=buildLevel(r.chapter), cp=world.checkpoints.find(c=>c.x===r.checkpoint);
    if(cp || r.checkpoint===100) {
      const validPickups=new Set(world.pickups.map(p=>p.id)), validEnemies=new Set(world.enemies.map(e=>e.id));
      s.run={chapter:r.chapter,checkpoint:r.checkpoint,time:int(r.time,86400),deaths:int(r.deaths,9999),hits:int(r.hits,99999),
        collected:Array.isArray(r.collected)?[...new Set(r.collected.filter(id=>validPickups.has(id)))]:[],
        killed:Array.isArray(r.killed)?[...new Set(r.killed.filter(id=>validEnemies.has(id)))]:[], difficulty:DIFFICULTIES[r.difficulty]?r.difficulty:s.settings.difficulty,
        smashed:Array.isArray(r.smashed)?[...new Set(r.smashed.filter(id=>world.stashes.some(c=>c.id===id)))]:[],noon:int(r.noon,100),noonUses:int(r.noonUses,9999),
        coins:Number.isFinite(r.coins)?int(r.coins):null,score:Number.isFinite(r.score)?int(r.score):null,bestCombo:int(r.bestCombo,world.enemies.length),parries:int(r.parries,99999),bossDefeated:!!(world.boss&&r.bossDefeated)};
    }
  }
  return s;
}
// Deliberately authored chunks guarantee every route is traversable without upgrades.
export function buildLevel(chapterIndex) {
  const def=CHAPTERS[chapterIndex-1];const chapter=def?.route; if(!def) throw new RangeError('Unknown chapter');
  const platforms=[],pickups=[],enemies=[],checkpoints=[],signs=[],stashes=[];
  const stash=(x,y)=>stashes.push({id:`stash${stashes.length+1}`,x:x-25,y:y-49,w:50,h:49,broken:false});
  let pid=0,eid=0;
  const plat=(x,y,w,oneWay=false)=>platforms.push({x,y,w,h:oneWay?22:HEIGHT-y+240,oneWay,ground:!oneWay});
  const pickup=(type,x,y,value=1)=>pickups.push({id:`p${pid++}`,type,x,y,value,got:false});
  const gold=(x,y,n=5)=>{for(let i=0;i<n;i++) pickup('coin',x+i*38,y-Math.sin(i/(n-1)*Math.PI)*30);};
  const foe=(kind,x,y=FLOOR,left=x-70,right=x+150)=>{const d=ENEMIES[kind];enemies.push({...d,kind,id:`e${eid++}`,x,y:y-d.h,baseY:y-d.h,vx:d.speed,vy:0,minX:left,maxX:right,hp:d.hp,maxHp:d.hp,dir:-1,timer:1.2+(eid%3)*0.3,phase:'walk',t:0,flash:0,dead:false});};
  if(def.boss) {
    plat(-200,FLOOR,def.length+600);
    gold(280,FLOOR-60,6); gold(700,FLOOR-60,5);
    plat(600,450,160,true); pickup('relic',680,402);
    foe(def.enemies[0],890); checkpoints.push({x:1100,y:FLOOR,hit:false});
    stash(430,FLOOR);stash(1540,450);stash(def.length-240,FLOOR);
    const arena=1320;
    plat(arena+180,450,170,true); plat(arena+610,450,170,true);
    pickup('relic',arena+250,402); pickup('relic',def.length-110,FLOOR-70);
    const d=BOSSES[def.boss];
    const boss={...d,kind:def.boss,x:def.length-480,y:FLOOR-d.h,dir:-1,vx:0,vy:0,maxHp:d.hp,active:false,dead:false,phase:'idle',timer:1.4,t:0,flash:0,attackCount:0,enraged:false,arena,cycle:0};
    signs.push({x:150,text:def.meleeOnly?'Sanchez taught you well. Your pimp hand finishes this.':'Keep your revolver loaded. The road ends in a duel.'});
    signs.push({x:1120,text:d.tip});
    return {def,chapter:chapterIndex,platforms,pickups,enemies,checkpoints,signs,stashes,boss,exit:def.length+120,length:def.length+420};
  }
  const layouts={
    1:[[0,1050],[1200,2200],[2380,3550],[3740,5320]],
    2:[[0,1000],[1150,2350],[2540,3550],[3720,5720]],
    5:[[0,900],[1060,2150],[2330,3430],[3620,6120]],
    7:[[0,900],[1080,2160],[2350,3420],[3630,6220]],
    9:[[0,950],[1110,2230],[2400,3510],[3690,4860],[5030,6820]],
    10:[[0,920],[1090,2210],[2390,3550],[3740,4800],[4980,6820]],
    11:[[0,1000],[1170,2210],[2380,3560],[3750,4840],[5010,6820]],
    12:[[0,970],[1140,2200],[2370,3570],[3740,4860],[5050,6820]]
  };
  for(const [a,b] of layouts[chapter]) plat(a===0?-200:a,FLOOR,b-a+(a===0?200:0));
  // Rooftops and canyon shelves provide optional routes, while the floor stays clear.
  const shelves = chapter===1 ? [[550,450,230],[1470,450,210],[1740,320,210],[2670,450,230],[3990,450,250],[4290,320,220]] :
    chapter===2 ? [[470,455,220],[740,320,220],[1390,450,240],[1700,315,230],[2700,455,210],[2980,320,260],[4010,455,220],[4300,320,220]] :
    chapter===5 ? [[460,450,210],[1260,450,240],[1550,315,240],[2580,450,240],[2850,315,260],[3860,450,220],[4170,320,240],[4570,450,240]] :
    [[470,450,240],[1300,450,220],[1580,315,240],[2630,450,240],[2910,315,250],[3920,450,240],[4210,315,250],[4760,450,220]];
  if(chapter>8){shelves.splice(0,shelves.length,[510,450,240],[1330,450,240],[1620,315,240],[2730,450,250],[3000,315,260],[4000,450,250],[4300,315,250],[5440,450,240],[5750,315,250]);}
  shelves.forEach(([x,y,w])=>{plat(x,y,w,true);gold(x+30,y-50,4);});
  for(const [a,b] of layouts[chapter]) { gold(Math.max(280,a+100),FLOOR-57,6); if(b-a>1050) gold(b-360,FLOOR-60,6); }
  stash(440,FLOOR);
  const stashShelf=shelves[2];stash(stashShelf[0]+stashShelf[2]-45,stashShelf[1]);
  const lastShelf=shelves[shelves.length-1];stash(lastShelf[0]+38,lastShelf[1]);
  const relicShelves=[shelves[1],shelves[Math.floor(shelves.length/2)],shelves[shelves.length-1]];
  relicShelves.forEach(([x,y,w])=>pickup('relic',x+w/2,y-56));
  for(const x of [1450,3900]) checkpoints.push({x,y:FLOOR,hit:false});
  [2000,4100].forEach(x=>pickup('heart',x,FLOOR-70));
  const positions=chapter===1?[850,1580,2100,2770,3330,4040,4520]:chapter===2?[810,1490,2050,2810,3330,4010,4630,5000]:chapter===5?[720,1320,2010,2670,3160,3900,4440,4970,5400]:[740,1380,2020,2740,3230,3980,4500,5030,5500];
  positions.forEach((x,i)=>foe(def.enemies[i%def.enemies.length],x));
  if(chapter===1) {
    signs.push({x:100,text:'A / D to move · SPACE to jump. Follow the gold.'},{x:570,text:'Break gold stashes with J / K. Charge High Noon, then press Q.'},{x:940,text:'Hold jump a little longer to clear the gap.'},{x:1480,text:'Wells refill your health and save your place.'},{x:2590,text:'SHIFT to dodge through danger. K returns enemy bullets.'});
  } else if(chapter===7) signs.push({x:100,text:'Your gun hand needs rest. K / slap is your weapon.'},{x:600,text:'Slap just before a bullet hits to return it.'});
  else signs.push({x:100,text:def.objective});
  // Extra patrols and two new road sections retain earlier pickup/enemy IDs.
  for(const x of [510,1820,3070,4330])foe(def.enemies[(eid+1)%def.enemies.length],x);
  if(def.baseLength){
    const end=def.baseLength;plat(end+600,FLOOR,850);plat(end+1630,FLOOR,990);
    plat(end+780,450,240,true);plat(end+1850,450,240,true);plat(end+2110,320,210,true);
    for(const x of [end+760,end+1220,end+1800,end+2290])foe(def.enemies[eid%def.enemies.length],x);
    gold(end+750,FLOOR-60,6);gold(end+1800,FLOOR-60,6);pickup('heart',end+1780,FLOOR-70);
    checkpoints.push({x:end+700,y:FLOOR,hit:false});
  }else{for(const x of [5750,6200])foe(def.enemies[eid%def.enemies.length],x);}

  // Keep every ground patrol on a real platform, including the extended roads.
  for(const e of enemies){
    const floors=platforms.filter(p=>p.ground);
    const floor=floors.find(p=>e.x>=p.x&&e.x+e.w<=p.x+p.w)||floors.reduce((a,b)=>Math.abs(b.x-e.x)<Math.abs(a.x-e.x)?b:a);
    e.x=clamp(e.x,floor.x+10,floor.x+floor.w-e.w-10);
    e.minX=Math.max(floor.x+8,Math.min(e.minX,e.x));e.maxX=Math.min(floor.x+floor.w-8,Math.max(e.maxX,e.x+e.w));
  }
  return {def,chapter:chapterIndex,platforms,pickups,enemies,checkpoints,signs,stashes,boss:null,exit:def.length+100,length:def.length+420};
}
export class Game {
  constructor(chapter,settings={},items={},saved=null) {
    this.secrets=SECRETS.filter(s=>s.chapter===chapter).map(s=>({...s,found:false,hold:0,fx:0}));this.secretPrompt='';
    this.world=buildLevel(chapter); this.chapter=chapter; this.settings={difficulty:'outlaw',...settings};
    if(saved) this.settings.difficulty=saved.difficulty;
    if(this.world.def.duel)items={};
    this.difficulty=DIFFICULTIES[this.settings.difficulty]||DIFFICULTIES.outlaw; this.items={...items};
    this.maxHp=this.world.def.duel?2:this.difficulty.hearts+(items.heart?1:0); this.hp=this.maxHp; this.shield=!!items.shield;
    this.player={x:100,y:FLOOR-78,w:42,h:78,vx:0,vy:0,dir:1,ground:false,coyote:0,jumpBuffer:0,rollBuffer:0,slapBuffer:0,fireBuffer:0,jumps:0,invuln:0,roll:0,rollCD:0,fireCD:0,slapCD:0,action:0,anim:0};
    this.noon=0;this.noonTime=0;this.noonUses=0;this.smashed=new Set();this.defeats=[];this.viewWidth=WIDTH;
    this.maxAmmo=items.cylinder?8:6;this.ammo=this.maxAmmo;this.reload=0;this.reloadDuration=this.world.def.duel?.65:items.reload?.78:1.2;this.shots=[];this.particles=[];this.events=[];this.texts=[];
    this.time=0;this.deaths=0;this.hits=0;this.coins=0;this.relics=0;this.kills=0;this.checkpoint=100;this.complete=false;this.dead=false;this.deathTimer=0;this.shake=0;this.hurtFlash=0;this.impacts=[];this.cam=0;this.camY=0;this.lastSign='';this.combo=0;this.bestCombo=0;this.parries=0;this.comboTimer=0;this.score=0;this.collected=new Set();this.killed=new Set();
    if(saved) this.restore(saved);
  }
  emit(type,data={}) { this.events.push({type,...data}); }
  restore(s) {
    this.time=s.time||0;this.deaths=s.deaths||0;this.hits=s.hits||0;this.checkpoint=s.checkpoint||100;
    this.collected=new Set(s.collected||[]);this.killed=new Set(s.killed||[]);
    for(const p of this.world.pickups) if(this.collected.has(p.id)){p.got=true;if(p.type==='coin')this.coins+=p.value;if(p.type==='relic')this.relics++;}
    for(const e of this.world.enemies) if(this.killed.has(e.id)){e.dead=true;this.kills++;}
    this.smashed=new Set(s.smashed||[]);this.noon=s.noon||0;this.noonUses=s.noonUses||0;
    for(const c of this.world.stashes)if(this.smashed.has(c.id)){c.broken=true;this.coins+=8;}
    if(Number.isFinite(s.coins))this.coins=Math.max(0,s.coins);
    this.score=this.coins*10+this.relics*250+this.kills*100;
    if(s.bossDefeated&&this.world.boss){this.world.boss.dead=true;this.score+=1500;}
    if(Number.isFinite(s.score))this.score=Math.max(this.score,s.score);
    this.bestCombo=s.bestCombo||0;this.parries=s.parries||0;
    for(const c of this.world.checkpoints)c.hit=c.x<=this.checkpoint;
    this.player.x=this.checkpoint;this.player.y=FLOOR-this.player.h;this.cam=Math.max(0,this.player.x-400);
  }
  snapshot() { return {chapter:this.chapter,checkpoint:this.checkpoint,time:Math.floor(this.time),deaths:this.deaths,hits:this.hits,collected:[...this.collected],killed:[...this.killed],difficulty:this.settings.difficulty,coins:this.coins,smashed:[...this.smashed],noon:this.noon,noonUses:this.noonUses,score:this.score,bestCombo:this.bestCombo,parries:this.parries,bossDefeated:!!this.world.boss?.dead}; }
  chargeNoon(amount){
    if(this.world.def.duel||this.noonTime>0||this.dead||this.complete)return;
    const old=this.noon;this.noon=clamp(this.noon+amount*(this.items.charge?1.25:1),0,100);
    if(old<100&&this.noon===100)this.emit('noon-ready');
  }
  unleashNoon(){
    if(this.world.def.duel||this.noon<100||this.dead||this.complete||this.noonTime>0)return false;
    this.noon=0;this.noonTime=this.items.noon?7:5;this.noonUses++;this.ammo=this.maxAmmo;this.reload=0;
    this.player.fireCD=0;this.player.slapCD=0;this.player.invuln=Math.max(this.player.invuln,.4);
    this.effect(this.player.x+21,this.player.y+35,'#ffdf83',28);this.emit('high-noon');return true;
  }
  breakStash(c){
    if(c.broken||this.dead||this.complete)return false;
    c.broken=true;this.smashed.add(c.id);const gold=this.items.stash?12:8;this.coins+=gold;this.score+=gold*10;this.chargeNoon(18);
    this.effect(c.x+25,c.y+25,'#efc46a',20);this.impact(c.x+25,c.y+25,'stash');this.float(`+${gold} GOLD`,c.x+25,c.y-10);this.emit('stash',{x:c.x});return true;
  }
  reloadGun() {if(this.reload>0||this.ammo===this.maxAmmo||this.world.def.training||this.world.def.meleeOnly||this.dead)return;this.reload=this.reloadDuration;this.emit('reload');}
  effect(x,y,color,count=10) {
    for(let i=0;i<count && this.particles.length<220;i++)this.particles.push({x,y,vx:(Math.random()-.5)*290,vy:-Math.random()*270,life:.3+Math.random()*.25,max:.55,color,r:2+Math.random()*3});
  }
  float(text,x,y,color='#f4cf87'){this.texts.push({text,x,y,life:1,color});}
  impact(x,y,kind='slap'){if(this.impacts.length<16)this.impacts.push({x,y,kind,life:.22});}
  hurt(sourceX,fall=false) {
    const p=this.player;if(this.dead||this.complete||(!fall&&(p.invuln>0||p.roll>0)))return;
    if(this.shield&&!fall){this.shield=false;p.invuln=1;this.emit('shield');this.effect(p.x,p.y,'#a9dddf');return;}
    this.hp--;this.hits++;this.combo=0;p.invuln=this.world.def.duel?.24:1.1;this.shake=.22;this.hurtFlash=.3;this.emit('hurt');this.effect(p.x+20,p.y+35,'#e56a50');
    if(this.hp<=0){this.dead=true;this.deathTimer=.9;this.deaths++;this.emit('death');return;}
    if(fall)this.resetPosition();else{p.vx=(p.x<sourceX?-1:1)*260;p.vy=-250;}
  }
  resetPosition() {
    const p=this.player;p.x=this.checkpoint;p.y=FLOOR-p.h;p.vx=0;p.vy=0;p.invuln=1.5;p.roll=0;p.action=0;p.slapCD=0;p.slapHits=new Set();p.jumps=0;p.ground=false;p.coyote=0;p.jumpBuffer=0;p.rollBuffer=0;p.slapBuffer=0;p.fireBuffer=0;this.shots=[];
    const b=this.world.boss;if(b&&!b.dead){const fresh=buildLevel(this.chapter).boss;Object.assign(b,fresh);}
    this.noonTime=0;this.camY=0;this.ammo=this.maxAmmo;this.reload=0;this.cam=Math.max(0,p.x-400);
  }
  retry() {this.hp=this.maxHp;this.shield=!!this.items.shield;this.dead=false;this.resetPosition();this.emit('checkpoint',{message:'Back in the saddle. Your gold is safe.'});}
  damageEnemy(e,amount=1,weapon='bullet') {
    if(e.dead)return;e.hp-=amount;e.flash=.12;e.stagger=weapon==='bullet'?.10:.18;e.knock=(e.x<this.player.x?-1:1)*(weapon==='bullet'?100:240);this.chargeNoon(8);this.effect(e.x+e.w/2,e.y+e.h/2,'#f5c15b',6);this.emit('impact',{x:e.x+e.w/2,weapon});
    if(weapon==='slap'||weapon==='stomp')this.impact(e.x+e.w/2,e.y+e.h/2,weapon);
    if(e.hp<=0){this.chargeNoon(18);if(this.defeats.length<12)this.defeats.push({img:e.img,x:e.x+e.w/2,y:e.y+e.h,h:e.h+24,dir:e.dir,vx:e.knock,vy:-180,life:.38});e.dead=true;this.killed.add(e.id);this.kills++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.comboTimer=3;const points=100*Math.min(this.combo,5);this.score+=points;this.float(`+${points}`,e.x,e.y);this.effect(e.x,e.y,'#ce9470',14);}
  }
  damageBoss(amount=1,weapon='bullet') {
    const b=this.world.boss;if(!b||b.dead||!b.active||b.flash>.15)return;
    if(this.world.def.duel){if(weapon!=='bullet'||!['attack','recover'].includes(b.phase))return;amount=1;}
    b.hp-=amount;this.chargeNoon(7);b.flash=.1;this.emit('impact',{x:b.x+b.w/2,weapon});this.effect(b.x+b.w/2,b.y+b.h/2,'#efc16a',8);this.shake=.08;
    if(weapon==='slap')this.impact(b.x+b.w/2,b.y+b.h/2);
    if(b.hp>0)return;
    if(b.kind==='chips'&&!b.enraged){b.enraged=true;b.hp=14;b.maxHp=14;b.phase='rage';b.timer=1.8;b.flash=1.5;this.shots=[];this.shake=.5;this.emit('rage');return;}
    b.dead=true;this.shots=[];this.score+=1500;this.effect(b.x,b.y,'#eaba55',40);this.emit('boss-defeated',{name:b.name});
  }
  fire() {
    const p=this.player;if(p.fireCD>0||p.roll>0||this.reload>0||(this.world.def.training||this.world.def.meleeOnly))return;
    if(this.ammo<=0){this.reloadGun();return;}
    this.ammo--;p.fireCD=this.noonTime>0?.13:this.items.trigger?.18:.22;if(!(p.action>0&&p.actionKind==='slap')){p.action=.16;p.actionKind='fire';}
    this.shots.push({x:p.x+p.w/2+p.dir*28,y:p.y+34,vx:p.dir*950,vy:0,r:4,friendly:true,life:1.15,kind:'bullet',damage:this.items.powder&&this.ammo===this.maxAmmo-1?2:1,pierce:this.items.pierce?1:0,hitIds:new Set(),charged:this.noonTime>0});
    p.recoil=.12;this.effect(p.x+p.w/2+p.dir*30,p.y+34,'#ffe9ad',3);this.emit('shoot');
    if(this.ammo===0)this.reloadGun();return true;
  }
  slap() {
    const p=this.player;if(p.slapCD>0||p.roll>0)return;
    p.slapCD=this.noonTime>0?.36:.5;p.action=SLAP_DURATION;p.actionKind='slap';p.slapHits=new Set();p.slapExtended=false;p.slapRecoiled=false;this.emit('slap');return true;
  }
  updateSlap(){
    const p=this.player;if(p.actionKind!=='slap'||p.roll>0)return;
    const elapsed=SLAP_DURATION-p.action;
    if(p.action<=0)return;
    if(elapsed>=.10&&!p.slapExtended){p.slapExtended=true;this.emit('slap-extend');}
    if(elapsed>=.21&&!p.slapRecoiled){p.slapRecoiled=true;this.emit('slap-recoil');}
    const range=slapReach(p.action,this.items.slap);if(!range)return;
    const hit={x:p.dir>0?p.x+p.w/2:p.x+p.w/2-range,y:p.y-55,w:range,h:p.h+34};
    for(const e of this.world.enemies)if(!e.dead&&!p.slapHits.has(e)&&overlaps(hit,e)){p.slapHits.add(e);this.damageEnemy(e,(this.items.slap?3:2)+(this.noonTime>0?1:0),'slap');}
    const b=this.world.boss;if(b&&!b.dead&&b.active&&b.flash<=.15&&!p.slapHits.has(b)&&overlaps(hit,b)){p.slapHits.add(b);this.damageBoss((this.items.slap?3:2)+(this.noonTime>0?1:0),'slap');}
    for(const c of this.world.stashes)if(!c.broken&&overlaps(hit,c))this.breakStash(c);
    for(const s of this.shots)if(!s.gone&&!s.friendly&&overlaps(hit,{x:s.x-s.r,y:s.y-s.r,w:s.r*2,h:s.r*2})){
      s.friendly=true;s.vx=p.dir*650;s.vy=0;s.gravity=0;s.kind='return';s.life=2;s.damage=this.items.parry?4:3;this.parries++;this.chargeNoon(22);this.impact(s.x,s.y,'parry');this.float('RETURN TO SENDER',p.x,p.y-40,'#b6e3c3');this.emit('parry');this.effect(s.x,s.y,'#b6e3c3',12);
    }
  }
  move(dt,input) {
    const p=this.player,wasGround=p.ground,previousX=p.x;
    for(const k of ['invuln','roll','rollCD','fireCD','slapCD','action','coyote','jumpBuffer','rollBuffer','slapBuffer','fireBuffer'])p[k]=Math.max(0,p[k]-dt);
    p.landing=Math.max(0,(p.landing||0)-dt);p.recoil=Math.max(0,(p.recoil||0)-dt);
    p.anim+=dt;p.duck=!!input.down;if(p.ground)p.coyote=.11;
    if(input.jump)p.jumpBuffer=.13;
    for(const action of ['roll','slap','fire'])if(input[action])p[action+'Buffer']=.12;
    const dir=clamp(input.move||0,-1,1);if(dir&&p.roll<=0)p.dir=Math.sign(dir);
    if(p.rollBuffer>0&&p.rollCD<=0){p.rollBuffer=0;p.action=0;p.roll=.26;p.rollCD=this.items.dodge?.62:.85;p.invuln=Math.max(p.invuln,.28);this.emit('roll');}
    if(p.jumpBuffer>0&&(p.coyote>0||(this.items.boots&&p.jumps<2&&p.jumps>0))){p.vy=p.coyote>0?-720:-660;p.jumps=p.coyote>0?1:2;p.coyote=0;p.ground=false;p.jumpBuffer=0;this.emit('jump');}
    if(p.roll>0)p.vx=p.dir*680;else p.vx+=(dir*(this.items.spurs?385:340)-p.vx)*Math.min(1,dt*19);
    if(input.down&&p.ground)p.vx*=.55;
    p.vy+=1900*dt*(input.jumpHeld&&p.vy<0?.54:1);p.vy=Math.min(p.vy,1200);
    p.x+=p.vx*dt;p.stride=(p.stride||0)+Math.abs(p.vx*dt);
    for(const q of this.world.platforms)if(!q.oneWay&&overlaps(p,q)){if(p.vx>0)p.x=q.x-p.w;else if(p.vx<0)p.x=q.x+q.w;}
    const oldY=p.y,fallSpeed=p.vy;p.y+=p.vy*dt;p.ground=false;
    const bowing=input.down&&this.secrets.some(s=>!s.found&&s.action==='down'&&Math.abs(p.x+p.w/2-s.x)<76&&Math.abs(oldY+p.h-s.y)<42);
    for(const q of this.world.platforms){
      if(p.x+p.w<=q.x||p.x>=q.x+q.w)continue;
      if(q.oneWay&&input.down&&!bowing)continue;
      if(p.vy>=0&&oldY+p.h<=q.y+3&&p.y+p.h>=q.y){p.y=q.y-p.h;p.vy=0;p.ground=true;p.jumps=0;}
    }
    const surface=['bg_town','bg_saloon'].includes(this.world.def.bg)?'wood':'dirt';
    if(p.ground&&!wasGround&&fallSpeed>240){p.landing=.16;this.emit('land',{surface});this.effect(p.x+21,p.y+p.h,'#bfa078',7);}
    if(p.ground&&p.roll<=0){p.stepDistance=(p.stepDistance||0)+Math.abs(p.x-previousX);if(p.stepDistance>82){p.stepDistance%=82;p.stepCount=(p.stepCount||0)+1;this.emit('footstep',{surface,variant:p.stepCount%3});this.effect(p.x+21,p.y+p.h,'#bfa07888',2);}}
    const b=this.world.boss;
    p.x=clamp(p.x,b?.active&&!b.dead?b.arena-100:0,this.world.length-p.w);
    if(p.y>HEIGHT+150)this.hurt(p.x,true);
    if(this.reload>0){this.reload=Math.max(0,this.reload-dt);if(this.reload===0){this.ammo=this.maxAmmo;this.emit('loaded');}}
    if(this.dead)return;
    if(input.reload)this.reloadGun();if(p.slapBuffer>0&&this.slap())p.slapBuffer=0;if(p.fireBuffer>0&&this.fire())p.fireBuffer=0;
  }
  enemyShot(e,kind='bullet',vy=0) {
    const speed=(kind==='axe'?260:310)*this.difficulty.speed;
    this.shots.push({x:e.x+e.w/2,y:e.y+26,vx:e.dir*speed,vy,r:kind==='axe'?12:7,friendly:false,kind,life:4,gravity:kind==='axe'?650:0,damage:1});this.emit('enemy-shot',{x:e.x,kind});
  }
  updateEnemy(e,dt) {
    if(e.dead)return;const p=this.player;const dx=p.x-e.x;e.t+=dt;e.flash=Math.max(0,e.flash-dt);
    if(Math.abs(dx)>1050)return;
    if(e.stagger>0){e.stagger=Math.max(0,e.stagger-dt);e.x=clamp(e.x+e.knock*dt,e.attack==='ghost'?0:e.minX,e.attack==='ghost'?this.world.length-e.w:e.maxX-e.w);e.knock*=Math.max(0,1-dt*9);return;}
    e.dir=dx>=0?1:-1;
    if(e.attack==='walk'){e.x+=e.vx*dt;if(e.x<e.minX||e.x>e.maxX-e.w){e.x=clamp(e.x,e.minX,e.maxX-e.w);e.vx*=-1;}}
    if(e.attack==='ghost'){e.y=e.baseY-65+Math.sin(e.t*2)*68;e.x+=Math.sign(dx)*e.speed*dt;}
    e.timer-=dt*this.difficulty.speed;
    if(e.attack==='shot'||e.attack==='lob'||e.attack==='ghost'){
      if(e.timer<=.5&&e.phase!=='aim'&&Math.abs(dx)<640){e.phase='aim';e.timer=.5;}
      if(e.phase==='aim'&&e.timer<=0){this.enemyShot(e,e.attack==='lob'?'axe':e.attack==='ghost'?'ghost':'bullet',e.attack==='lob'?-360:0);e.timer=2.4;e.phase='walk';}
    }
    if(e.attack==='charge'){
      if(e.phase==='dash'){e.x+=e.vx*dt;if(e.timer<=0||e.x<e.minX||e.x>e.maxX){e.phase='recover';e.timer=.45;e.x=clamp(e.x,e.minX,e.maxX-e.w);}}
      else if(e.phase==='recover'){if(e.timer<=0){e.phase='walk';e.timer=.8;}}
      else if(e.phase==='aim'&&e.timer<=0){e.phase='dash';e.timer=.65;e.vx=e.dir*420;}
      else if(e.timer>0&&e.phase==='walk'){e.x=clamp(e.x+e.dir*55*dt,e.minX,e.maxX-e.w);}
      else if(e.timer<=0&&Math.abs(dx)<500){e.phase='aim';e.timer=.65;}
    }
    if(e.kind==='foot'&&e.phase==='dash'&&overlaps(p,{x:e.dir<0?e.x-110:e.x+e.w,y:e.y+18,w:110,h:48}))this.hurt(e.x);
    if(overlaps(p,e)&&p.invuln<=0&&p.roll<=0){
      if(p.vy>120&&p.y+p.h-e.y<25&&e.kind!=='bruiser'){p.vy=-520;this.damageEnemy(e,2,'stomp');this.emit('jump');}else this.hurt(e.x);
    }
  }
  chooseBossAttack(b) {
    const patterns={stank:['charge','slam','charge'],poot:['crossfire','volley','charge'],tank:['volley','high','volley'],chips:b.enraged?['slam','volley','charge','pies']:['pies','charge','slam']};
    b.attack=patterns[b.kind][b.attackCount++%patterns[b.kind].length];b.phase='tell';b.timer=b.enraged?.42:.62;b.dir=this.player.x>b.x?1:-1;b.targetX=this.player.x;
    this.emit('boss-tell',{attack:b.attack,x:b.x});
  }
  updateBoss(dt) {
    const b=this.world.boss,p=this.player;if(!b||b.dead)return;
    if(this.world.def.duel){this.updateDuel(dt);return;}
    b.t+=dt;b.flash=Math.max(0,b.flash-dt);
    if(!b.active){if(p.x>b.arena-80){b.active=true;this.emit('boss-start',{name:b.name});}else return;}
    b.timer-=dt*this.difficulty.speed;
    if(b.phase==='idle'&&b.timer<=0)this.chooseBossAttack(b);
    else if(b.phase==='tell'&&b.timer<=0){
      b.phase='attack';b.timer=b.attack==='charge'?.8:b.attack==='slam'?1.3:.6;b.fired=false;
      if(b.attack==='charge')b.vx=b.dir*(b.enraged?650:560);
      if(b.attack==='slam'){b.vy=-820;b.vx=clamp((b.targetX-b.x)*1.05,-360,360);}
    }else if(b.phase==='attack'){
      if(b.attack==='charge'){b.x+=b.vx*dt;this.effect(b.x+b.w/2,FLOOR,'#b99b71',1);}
      else if(b.attack==='slam'){
        b.vy+=2000*dt;b.y+=b.vy*dt;b.x+=b.vx*dt;
        if(b.y>=FLOOR-b.h&&b.vy>0){b.y=FLOOR-b.h;b.timer=0;this.shake=.28;this.emit('slam');
          for(const dir of [-1,1])this.shots.push({x:b.x+b.w/2,y:FLOOR-16,vx:dir*350,vy:0,r:15,life:2,kind:'wave',friendly:false});
        }
      }else if(!b.fired){
        b.fired=true;
        if(b.attack==='crossfire')for(let i=0;i<3;i++)this.shots.push({x:b.x+b.w/2-b.dir*i*75,y:FLOOR-35-i*38,vx:b.dir*540,vy:0,r:6,life:3,kind:'bullet',friendly:false});
        else for(let i=0;i<(b.enraged?5:3);i++)this.shots.push({x:b.x+b.w/2-b.dir*i*88,y:FLOOR-(b.attack==='high'?127:34),vx:b.dir*450*this.difficulty.speed,vy:0,r:7,life:3,kind:'bullet',friendly:false});
        this.emit('enemy-shot',{x:b.x,kind:'bullet'});
      }
      if(b.timer<=0){b.phase='recover';b.timer=b.enraged?.45:.72;}
    }else if((b.phase==='recover'||b.phase==='rage')&&b.timer<=0){b.phase='idle';b.timer=.45;b.dir=p.x>b.x?1:-1;}
    b.x=clamp(b.x,b.arena,this.world.def.length-80-b.w);
    if(overlaps(p,b)&&p.invuln<=0&&p.roll<=0){if(p.vy>100&&p.y+p.h-b.y<24){p.vy=-570;this.damageBoss(2);}else this.hurt(b.x);}
  }
  updateDuel(dt){
    const b=this.world.boss,p=this.player;b.t+=dt;b.flash=Math.max(0,b.flash-dt);
    if(!b.active){if(p.x<b.arena-80)return;b.active=true;b.x=b.arena+780;b.timer=.55;this.emit('boss-start',{name:b.name});}
    b.dir=p.x>b.x?1:-1;b.timer-=dt;
    if(b.phase==='rage'){if(b.timer<=0){b.phase='idle';b.timer=.25;}return;}
    if(b.phase==='idle'&&b.timer<=0){b.phase='tell';b.attack=['quickdraw','double','fan'][b.attackCount++%3];b.timer=b.enraged?.22:.34;b.targetX=p.x+21;b.targetY=p.y+35;b.fired=0;b.shotTimer=0;this.emit('boss-tell',{attack:'high',x:b.x});}
    else if(b.phase==='tell'&&b.timer<=0){b.phase='attack';b.timer=b.attack==='quickdraw'?.08:.3;}
    else if(b.phase==='attack'){
      b.shotTimer-=dt;const count=b.attack==='quickdraw'?1:b.attack==='double'?2:3;
      if(b.shotTimer<=0&&b.fired<count){const angle=Math.atan2(b.targetY-(b.y+42),b.targetX-(b.x+b.w/2))+(b.attack==='fan'?(b.fired-1)*.075:0),speed=b.enraged?1120:960;
        this.shots.push({x:b.x+b.w/2,y:b.y+42,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:5,life:2,friendly:false,kind:'bullet'});b.fired++;b.shotTimer=.085;this.emit('enemy-shot',{x:b.x,kind:'bullet'});}
      if(b.timer<=0){b.phase='recover';b.timer=b.enraged?.30:.42;}
    }else if(b.phase==='recover'&&b.timer<=0){b.phase='dash';b.timer=.22;b.vx=(b.x>b.arena+480?-1:1)*820;}
    else if(b.phase==='dash'){b.x=clamp(b.x+b.vx*dt,b.arena+180,b.arena+950);if(b.timer<=0){b.phase='idle';b.timer=b.enraged?.12:.20;}}
    if(overlaps(p,b)&&p.invuln<=0&&p.roll<=0)this.hurt(b.x);
  }
  updateShots(dt) {
    for(const s of this.shots){
      if(s.gone)continue;s.life-=dt;s.vy+=(s.gravity||0)*dt;
      // Small segments prevent fast bullets from tunneling through narrow targets.
      const steps=Math.max(1,Math.ceil(Math.hypot(s.vx*dt,s.vy*dt)/10));
      for(let i=0;i<steps&&!s.gone;i++){
        s.x+=s.vx*dt/steps;s.y+=s.vy*dt/steps;
        const box={x:s.x-s.r,y:s.y-s.r,w:s.r*2,h:s.r*2};
        if(s.friendly){
          for(const e of this.world.enemies)if(!e.dead&&!s.hitIds?.has(e.id)&&overlaps(box,e)){this.damageEnemy(e,s.damage||1);s.hitIds??=new Set();s.hitIds.add(e.id);if(s.pierce>0)s.pierce--;else s.gone=true;break;}
          for(const c of this.world.stashes)if(!s.gone&&!c.broken&&overlaps(box,c)){this.breakStash(c);s.gone=true;}
          const b=this.world.boss;if(!s.gone&&b?.active&&!b.dead&&overlaps(box,b)){this.damageBoss(s.damage||1);s.gone=true;}
        }else if(overlaps(box,this.player)){this.hurt(s.x);s.gone=true;}
        if(s.kind!=='wave'&&this.world.platforms.some(q=>q.ground&&overlaps(box,q))){s.gone=true;this.effect(s.x,s.y,'#b9a387',4);}
      }
      if(s.life<=0||s.y>HEIGHT+100)s.gone=true;
    }
    this.shots=this.shots.filter(s=>!s.gone);
  }
  updatePickups(dt) {
    const p=this.player;
    for(const c of this.world.pickups){
      if(c.got||c.type==='heart'&&this.hp>=this.maxHp)continue;const dx=p.x+p.w/2-c.x,dy=p.y+p.h/2-c.y,d=Math.hypot(dx,dy);
      if(this.items.magnet&&c.type==='coin'&&d<165&&d>1){c.x+=dx/d*430*dt;c.y+=dy/d*430*dt;}
      if(d>42)continue;c.got=true;this.collected.add(c.id);
      if(c.type==='coin'){this.coins+=c.value;this.score+=10;this.emit('coin');}
      if(c.type==='relic'){this.relics++;this.score+=250;this.chargeNoon(15);this.float('LOST BADGE +250',c.x,c.y);this.emit('relic');}
      if(c.type==='heart'){const healed=Math.min(this.items.medic?3:2,this.maxHp-this.hp);this.hp+=healed;this.float(`+${healed} HEALTH`,c.x,c.y,'#b8d5a4');this.emit('heal');}
      this.effect(c.x,c.y,c.type==='heart'?'#b8d5a4':'#efc46a',7);
    }
    for(const c of this.world.checkpoints)if(!c.hit&&Math.abs(p.x-c.x)<65&&p.y>FLOOR-170){c.hit=true;this.checkpoint=c.x;this.hp=this.maxHp;this.ammo=this.maxAmmo;this.reload=0;this.shield=!!this.items.shield;this.emit('checkpoint',{message:'Checkpoint · health & ammunition restored'});this.effect(c.x,FLOOR-70,'#efc46a',20);}
    if(p.x>this.world.exit+25&&(!this.world.boss||this.world.boss.dead)){
      this.complete=true;this.score+=Math.max(0,Math.floor((this.world.def.par-this.time)*20));this.emit('complete');
    }
    let sign='';for(const s of this.world.signs)if(Math.abs(p.x-s.x)<250)sign=s.text;
    if(sign!==this.lastSign){this.lastSign=sign;this.emit('hint',{text:sign});}
  }
  updateSecrets(dt,input) {
    const p=this.player;let prompt='';
    for(const s of this.secrets){
      s.fx=Math.max(0,s.fx-dt);if(s.found)continue;
      const near=Math.abs(p.x+p.w/2-s.x)<76&&Math.abs(p.y+p.h-s.y)<42;
      if(!near){s.hold=0;continue;}
      prompt=s.action==='slap'?'K · SLAP SOMETHING SUSPICIOUS':s.action==='down'?'HOLD DOWN · PAY YOUR RESPECTS':'E · INSPECT';
      const act=s.action==='interact'?input.interact:s.action==='slap'?input.slap:input.down;
      if(act)s.hold+=dt;else s.hold=0;
      if(s.hold>=(s.action==='down'?1.2:dt)){
        s.found=true;s.fx=4;this.score+=150;this.effect(s.x,s.y-35,'#e4c777',24);
        this.emit('secret',{id:s.id,name:s.name,text:s.text});prompt='';
      }
    }
    if(prompt!==this.secretPrompt){this.secretPrompt=prompt;this.emit('secret-prompt',{text:prompt});}
  }
  step(dt,input={}) {
    dt=clamp(dt,0,1/30);
    for(const d of this.defeats){d.life-=dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=800*dt;}this.defeats=this.defeats.filter(d=>d.life>0);
    for(const v of this.particles){v.x+=v.vx*dt;v.y+=v.vy*dt;v.vy+=650*dt;v.life-=dt;}this.particles=this.particles.filter(v=>v.life>0);
    for(const v of this.texts){v.y-=35*dt;v.life-=dt;}this.texts=this.texts.filter(v=>v.life>0);
    for(const v of this.impacts)v.life-=dt;this.impacts=this.impacts.filter(v=>v.life>0);this.hurtFlash=Math.max(0,this.hurtFlash-dt);
    this.shake=Math.max(0,this.shake-dt);if(this.complete)return;
    if(this.dead){this.deathTimer-=dt;if(this.deathTimer<=0)this.retry();return;}
    this.noonTime=Math.max(0,this.noonTime-dt);if(input.special)this.unleashNoon();
    this.time+=dt;this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0;
    this.move(dt,input);if(this.dead)return;
    for(const e of this.world.enemies)this.updateEnemy(e,dt);
    if(this.dead)return;this.updateBoss(dt);if(this.dead)return;this.updateSlap();this.updateShots(dt);if(this.dead)return;this.updatePickups(dt);this.updateSecrets(dt,input);
    this.camY+=(clamp(this.player.y-165,-180,0)-this.camY)*Math.min(1,dt*4);
    this.cam+=(clamp(this.player.x-this.viewWidth*.35+this.player.vx*.18,0,this.world.length-this.viewWidth)-this.cam)*Math.min(1,dt*5);
  }
}
export function settleRun(save,game) {
  if(!game.complete||game.settled)return null;game.settled=true;
  const old=save.best[game.chapter],first=!old;
  save.bounties??=[];
  const earned=BOUNTIES.filter(b=>b.chapter===game.chapter&&!save.bounties.includes(b.id)&&bountyProgress(b,game).earned);
  for(const b of earned)save.bounties.push(b.id);
  const bountyGold=earned.reduce((n,b)=>n+b.reward+(save.items.bounty?10:0),0);
  const reward=bountyGold+game.coins+game.relics*20+(first?60:20)+(game.world.boss?40:0);
  save.coins+=reward;save.unlocked=Math.max(save.unlocked,Math.min(CHAPTERS.length,game.chapter+1));save.run=null;
  if(game.chapter===CHAPTERS.length)save.beaten=true;
  save.best[game.chapter]={score:Math.max(old?.score||0,game.score),time:Math.min(old?.time||Infinity,Math.ceil(game.time)),relics:Math.max(old?.relics||0,game.relics),clean:!!old?.clean||game.deaths===0,clears:(old?.clears||0)+1};
  return {reward,first,bounties:earned.map(b=>b.id),bountyGold,stashes:game.smashed.size,noonUses:game.noonUses,score:game.score,relics:game.relics,time:Math.ceil(game.time),deaths:game.deaths,bestCombo:game.bestCombo,parries:game.parries};
}
export function purchase(save,id){const item=UPGRADES.find(i=>i.id===id);if(!item||save.items[id]||save.coins<item.cost)return false;save.coins-=item.cost;save.items[id]=true;return true;}
