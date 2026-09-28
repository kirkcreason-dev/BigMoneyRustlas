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
  {id:'slap', name:'Sanchez special', cost:130, symbol:'✦', desc:'A stronger elastic slap with 18% more reach.'}
];
export const CHAPTERS = [
  {name:'Back to Mud Bug', place:'DUSTY PLAINS', bg:'bg_island', ground:'ground_rock', accent:'#cf9149', length:4900, par:100,
   quote:'A town without a sheriff is just a graveyard with a saloon.', story:'Sugar Wolf rides into Mud Bug with six bullets and an old badge. Big Baby Chips owns every soul in town. Time to make an introduction.', objective:'Follow the gold trail to Mud Bug.', enemies:['bandit','gambler']},
  {name:'Chips’ Welcome', place:'MUD BUG TOWN', bg:'bg_town', ground:'ground_wood', accent:'#dfab68', length:5300, par:115,
   quote:'Chips heard you were coming. He sent a welcome committee.', story:'The streets are crawling with hired guns. Take the rooftops, recover the stolen gold, and remind this town what a sheriff looks like.', objective:'Fight through the main street.', enemies:['bandit','gunhand','foot']},
  {name:'Raw Stank', place:'THE EDGE OF TOWN', bg:'bg_town', ground:'ground_wood', accent:'#cf9149', length:2500, par:65, boss:'stank',
   quote:'Big talk. Bad breath. Worse intentions.', story:'Raw Stank blocks the road to the Hatchetman Saloon. He hits like a runaway wagon. Let him commit, roll through, then make him pay.', objective:'Defeat Raw Stank. Dodge his charge.', enemies:['gambler']},
  {name:'Dusty Poot', place:'HATCHETMAN SALOON', bg:'bg_saloon', ground:'ground_wood', accent:'#d3a155', length:2600, par:80, boss:'poot',
   quote:'Never trust a man who brings a pie to a gunfight.', story:'Dusty Poot has cleared the dance floor for you. Watch where his pies will land. A well-timed slap can send one straight back.', objective:'Defeat Dusty Poot. Return his pies.', enemies:['pie']},
  {name:'The Saloon Floor', place:'AFTER LAST CALL', bg:'bg_saloon', ground:'ground_wood', accent:'#af825b', length:5700, par:130,
   quote:'Last call came and went. The trouble stayed.', story:'Chips slips out the back while his strangest crew closes in. Ghosts haunt the rafters and hired feet patrol the floor. Find your way through.', objective:'Reach the saloon’s back exit.', enemies:['ghost','gunhand','foot']},
  {name:'The Assassin', place:'DEAD MAN’S STREET', bg:'bg_town', ground:'ground_wood', accent:'#bd7756', length:2800, par:90, boss:'tank',
   quote:'They said his name was Tink. They were wrong.', story:'Chips has one last hired killer. Tank’s rifle can cover the whole street. Jump the low volleys and use the platforms when he takes aim.', objective:'Defeat Tank. Read his firing line.', enemies:['gunhand']},
  {name:'Sanchez’s Lesson', place:'SANCHEZ’S WOODLAND CAMP', bg:'bg_woodland', ground:'ground_rock', accent:'#b7bbab', length:5800, par:140, training:true,
   quote:'A broken gun hand doesn’t make a broken sheriff.', story:'Tank has destroyed Sugar’s shooting hand. Deep in the woods, Dirty Sanchez teaches him to fight with the other. Slap bullets back, cross the creek beds, and earn your return.', objective:'Master the slap. Reach Sanchez’s camp.', enemies:['bruiser','ghost','bandit']},
  {name:'Big Baby Chips', place:'THE LAST HAND IN MUD BUG', bg:'bg_town', ground:'ground_wood', accent:'#eabf62', length:3000, par:120, boss:'chips',meleeOnly:true,
   quote:'One town. One badge. One last hand to play.', story:'Sanchez’s lesson is learned. Sugar returns to Mud Bug with his other hand ready. Chips waits in the street with a fortune and a secret. Finish what you started.', objective:'Defeat Chips and free Mud Bug.', enemies:['bruiser']}
];
export const ENEMIES = {
  bandit:{img:'e_shadow',hp:2,w:43,h:75,speed:65,attack:'shot'},
  gambler:{img:'e_gambler',hp:2,w:44,h:72,speed:80,attack:'walk'},
  gunhand:{img:'e_shadow_aim',hp:2,w:43,h:74,speed:0,attack:'shot'},
  foot:{img:'e_foot',hp:3,w:56,h:66,speed:85,attack:'charge'},
  pie:{img:'e_pie',hp:2,w:44,h:70,speed:0,attack:'lob'},
  ghost:{img:'e_ghost',hp:2,w:45,h:72,speed:35,attack:'ghost'},
  bruiser:{img:'e_tank',hp:4,w:50,h:80,speed:70,attack:'walk'}
};
export const BOSSES = {
  stank:{name:'Raw Stank',prefix:'bstank_',hp:18,w:78,h:112,tip:'ROLL THROUGH THE CHARGE'},
  poot:{name:'Dusty Poot',prefix:'bpoot_',hp:22,w:76,h:112,tip:'SLAP THE PIES BACK'},
  tank:{name:'Tank',prefix:'btank_',hp:26,w:72,h:108,tip:'JUMP THE FIRING LINE'},
  chips:{name:'Big Baby Chips',prefix:'bchips_',hp:30,w:94,h:128,tip:'WATCH THE TELL. TAKE YOUR SHOT.'}
};
export function defaultSave() { return {version:2,unlocked:1,coins:0,items:{},best:{},secrets:[],settings:{difficulty:'outlaw',sound:true,music:true,soundVolume:80,musicVolume:55,motion:true,touch:false},run:null,beaten:false}; }
export function sanitizeSave(raw) {
  const s=defaultSave(); if (!raw || typeof raw!=='object') return s;
  const int=(n,max=1e7)=>Number.isFinite(n)?clamp(Math.floor(n),0,max):0;
  s.secrets=Array.isArray(raw.secrets)?[...new Set(raw.secrets.filter(id=>SECRETS.some(s=>s.id===id)))]:[];
  s.unlocked=clamp(int(raw.unlocked,8),1,8); s.coins=int(raw.coins); s.beaten=!!(raw.beaten||raw.gameBeaten);
  for(const it of UPGRADES) s.items[it.id]=!!raw.items?.[it.id];
  if(raw.version!==2) { s.items.boots=!!raw.items?.djump; s.items.reload=false; }
  if(raw.best && typeof raw.best==='object') for(let i=1;i<=8;i++) {
    const b=raw.best[i]; if(b && typeof b==='object') s.best[i]={score:int(b.score),time:int(b.time),relics:int(b.relics,3),clean:!!b.clean,clears:int(b.clears)};
  }
  if(raw.settings && typeof raw.settings==='object') {
    if(DIFFICULTIES[raw.settings.difficulty]) s.settings.difficulty=raw.settings.difficulty;
    for(const k of ['soundVolume','musicVolume'])if(Number.isFinite(raw.settings[k]))s.settings[k]=clamp(raw.settings[k],0,100);
    for(const k of ['sound','music','motion','touch']) if(typeof raw.settings[k]==='boolean') s.settings[k]=raw.settings[k];
  }
  const r=raw.run;
  if(r && Number.isInteger(r.chapter) && r.chapter>=1 && r.chapter<=s.unlocked && Number.isFinite(r.checkpoint)) {
    const world=buildLevel(r.chapter), cp=world.checkpoints.find(c=>c.x===r.checkpoint);
    if(cp || r.checkpoint===100) {
      const validPickups=new Set(world.pickups.map(p=>p.id)), validEnemies=new Set(world.enemies.map(e=>e.id));
      s.run={chapter:r.chapter,checkpoint:r.checkpoint,time:int(r.time,86400),deaths:int(r.deaths,9999),hits:int(r.hits,99999),
        collected:Array.isArray(r.collected)?[...new Set(r.collected.filter(id=>validPickups.has(id)))]:[],
        killed:Array.isArray(r.killed)?[...new Set(r.killed.filter(id=>validEnemies.has(id)))]:[], difficulty:DIFFICULTIES[r.difficulty]?r.difficulty:s.settings.difficulty};
    }
  }
  return s;
}
// Deliberately authored chunks guarantee every route is traversable without upgrades.
export function buildLevel(chapter) {
  const def=CHAPTERS[chapter-1]; if(!def) throw new RangeError('Unknown chapter');
  const platforms=[],pickups=[],enemies=[],checkpoints=[],signs=[];
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
    const arena=1320;
    plat(arena+180,450,170,true); plat(arena+610,450,170,true);
    pickup('relic',arena+250,402); pickup('relic',def.length-110,FLOOR-70);
    const d=BOSSES[def.boss];
    const boss={...d,kind:def.boss,x:def.length-480,y:FLOOR-d.h,dir:-1,vx:0,vy:0,maxHp:d.hp,active:false,dead:false,phase:'idle',timer:1.4,t:0,flash:0,attackCount:0,enraged:false,arena,cycle:0};
    signs.push({x:150,text:'Keep your revolver loaded. The road ends in a duel.'});
    signs.push({x:1120,text:d.tip});
    return {def,chapter,platforms,pickups,enemies,checkpoints,signs,boss,exit:def.length+120,length:def.length+420};
  }
  const layouts={
    1:[[0,1050],[1200,2200],[2380,3550],[3740,5320]],
    2:[[0,1000],[1150,2350],[2540,3550],[3720,5720]],
    5:[[0,900],[1060,2150],[2330,3430],[3620,6120]],
    7:[[0,900],[1080,2160],[2350,3420],[3630,6220]]
  };
  for(const [a,b] of layouts[chapter]) plat(a===0?-200:a,FLOOR,b-a+(a===0?200:0));
  // Rooftops and canyon shelves provide optional routes, while the floor stays clear.
  const shelves = chapter===1 ? [[550,450,230],[1470,450,210],[1740,320,210],[2670,450,230],[3990,450,250],[4290,320,220]] :
    chapter===2 ? [[470,455,220],[740,320,220],[1390,450,240],[1700,315,230],[2700,455,210],[2980,320,260],[4010,455,220],[4300,320,220]] :
    chapter===5 ? [[460,450,210],[1260,450,240],[1550,315,240],[2580,450,240],[2850,315,260],[3860,450,220],[4170,320,240],[4570,450,240]] :
    [[470,450,240],[1300,450,220],[1580,315,240],[2630,450,240],[2910,315,250],[3920,450,240],[4210,315,250],[4760,450,220]];
  shelves.forEach(([x,y,w])=>{plat(x,y,w,true);gold(x+30,y-50,4);});
  for(const [a,b] of layouts[chapter]) { gold(Math.max(280,a+100),FLOOR-57,6); if(b-a>1050) gold(b-360,FLOOR-60,6); }
  const relicShelves=[shelves[1],shelves[Math.floor(shelves.length/2)],shelves[shelves.length-1]];
  relicShelves.forEach(([x,y,w])=>pickup('relic',x+w/2,y-56));
  for(const x of [1450,3900]) checkpoints.push({x,y:FLOOR,hit:false});
  [2000,4100].forEach(x=>pickup('heart',x,FLOOR-70));
  const positions=chapter===1?[850,1580,2100,2770,3330,4040,4520]:chapter===2?[810,1490,2050,2810,3330,4010,4630,5000]:chapter===5?[720,1320,2010,2670,3160,3900,4440,4970,5400]:[740,1380,2020,2740,3230,3980,4500,5030,5500];
  positions.forEach((x,i)=>foe(def.enemies[i%def.enemies.length],x));
  if(chapter===1) {
    signs.push({x:100,text:'A / D to move · SPACE to jump. Follow the gold.'},{x:570,text:'Hold J to fire · R to reload · K to slap.'},{x:940,text:'Hold jump a little longer to clear the gap.'},{x:1480,text:'Wells refill your health and save your place.'},{x:2590,text:'SHIFT to dodge through danger. K returns enemy bullets.'});
  } else if(chapter===7) signs.push({x:100,text:'Your gun hand needs rest. K / slap is your weapon.'},{x:600,text:'Slap just before a bullet hits to return it.'});
  else signs.push({x:100,text:def.objective});
  return {def,chapter,platforms,pickups,enemies,checkpoints,signs,boss:null,exit:def.length+100,length:def.length+420};
}
export class Game {
  constructor(chapter,settings={},items={},saved=null) {
    this.secrets=SECRETS.filter(s=>s.chapter===chapter).map(s=>({...s,found:false,hold:0,fx:0}));this.secretPrompt='';
    this.world=buildLevel(chapter); this.chapter=chapter; this.settings={difficulty:'outlaw',...settings};
    if(saved) this.settings.difficulty=saved.difficulty;
    this.difficulty=DIFFICULTIES[this.settings.difficulty]||DIFFICULTIES.outlaw; this.items={...items};
    this.maxHp=this.difficulty.hearts+(items.heart?1:0); this.hp=this.maxHp; this.shield=!!items.shield;
    this.player={x:100,y:FLOOR-78,w:42,h:78,vx:0,vy:0,dir:1,ground:false,coyote:0,jumpBuffer:0,jumps:0,invuln:0,roll:0,rollCD:0,fireCD:0,slapCD:0,action:0,anim:0};
    this.ammo=6;this.reload=0;this.reloadDuration=items.reload?0.78:1.2;this.shots=[];this.particles=[];this.events=[];this.texts=[];
    this.time=0;this.deaths=0;this.hits=0;this.coins=0;this.relics=0;this.kills=0;this.checkpoint=100;this.complete=false;this.dead=false;this.deathTimer=0;this.shake=0;this.hitstop=0;this.cam=0;this.lastSign='';this.combo=0;this.comboTimer=0;this.score=0;this.collected=new Set();this.killed=new Set();
    if(saved) this.restore(saved);
  }
  emit(type,data={}) { this.events.push({type,...data}); }
  restore(s) {
    this.time=s.time||0;this.deaths=s.deaths||0;this.hits=s.hits||0;this.checkpoint=s.checkpoint||100;
    this.collected=new Set(s.collected||[]);this.killed=new Set(s.killed||[]);
    for(const p of this.world.pickups) if(this.collected.has(p.id)){p.got=true;if(p.type==='coin')this.coins+=p.value;if(p.type==='relic')this.relics++;}
    for(const e of this.world.enemies) if(this.killed.has(e.id)){e.dead=true;this.kills++;}
    this.score=this.coins*10+this.relics*250+this.kills*100;
    for(const c of this.world.checkpoints)c.hit=c.x<=this.checkpoint;
    this.player.x=this.checkpoint;this.player.y=FLOOR-this.player.h;this.cam=Math.max(0,this.player.x-400);
  }
  snapshot() { return {chapter:this.chapter,checkpoint:this.checkpoint,time:Math.floor(this.time),deaths:this.deaths,hits:this.hits,collected:[...this.collected],killed:[...this.killed],difficulty:this.settings.difficulty}; }
  reloadGun() {if(this.reload>0||this.ammo===6||this.world.def.training||this.dead)return;this.reload=this.reloadDuration;this.emit('reload');}
  effect(x,y,color,count=10) {
    for(let i=0;i<count && this.particles.length<220;i++)this.particles.push({x,y,vx:(Math.random()-.5)*290,vy:-Math.random()*270,life:.3+Math.random()*.25,max:.55,color,r:2+Math.random()*3});
  }
  float(text,x,y,color='#f4cf87'){this.texts.push({text,x,y,life:1,color});}
  hurt(sourceX,fall=false) {
    const p=this.player;if(this.dead||this.complete||(!fall&&(p.invuln>0||p.roll>0)))return;
    if(this.shield&&!fall){this.shield=false;p.invuln=1;this.emit('shield');this.effect(p.x,p.y,'#a9dddf');return;}
    this.hp--;this.hits++;this.combo=0;p.invuln=1.35;this.shake=.22;this.emit('hurt');this.effect(p.x+20,p.y+35,'#e56a50');
    if(this.hp<=0){this.dead=true;this.deathTimer=.9;this.deaths++;this.emit('death');return;}
    if(fall)this.resetPosition();else{p.vx=(p.x<sourceX?-1:1)*260;p.vy=-250;}
  }
  resetPosition() {
    const p=this.player;p.x=this.checkpoint;p.y=FLOOR-p.h;p.vx=0;p.vy=0;p.invuln=1.5;p.roll=0;p.action=0;p.slapCD=0;p.slapHits=new Set();p.jumps=0;p.jumpBuffer=0;this.shots=[];
    const b=this.world.boss;if(b&&!b.dead){const fresh=buildLevel(this.chapter).boss;Object.assign(b,fresh);}
    this.ammo=6;this.reload=0;this.cam=Math.max(0,p.x-400);
  }
  retry() {this.hp=this.maxHp;this.shield=!!this.items.shield;this.dead=false;this.resetPosition();this.emit('checkpoint',{message:'Back in the saddle. Your gold is safe.'});}
  damageEnemy(e,amount=1,weapon='bullet') {
    if(e.dead)return;e.hp-=amount;e.flash=.12;this.effect(e.x+e.w/2,e.y+e.h/2,'#f5c15b',6);this.emit('impact',{x:e.x+e.w/2,weapon});
    if(e.hp<=0){e.dead=true;this.killed.add(e.id);this.kills++;this.combo++;this.comboTimer=3;const points=100*Math.min(this.combo,5);this.score+=points;this.float(`+${points}`,e.x,e.y);this.effect(e.x,e.y,'#ce9470',14);}
  }
  damageBoss(amount=1,weapon='bullet') {
    const b=this.world.boss;if(!b||b.dead||!b.active||b.flash>.15)return;
    b.hp-=amount;b.flash=.1;this.emit('impact',{x:b.x+b.w/2,weapon});this.effect(b.x+b.w/2,b.y+b.h/2,'#efc16a',8);this.shake=.08;
    if(b.hp>0)return;
    if(b.kind==='chips'&&!b.enraged){b.enraged=true;b.hp=24;b.maxHp=24;b.phase='rage';b.timer=1.8;b.flash=1.5;this.shots=[];this.shake=.5;this.emit('rage');return;}
    b.dead=true;this.shots=[];this.score+=1500;this.effect(b.x,b.y,'#eaba55',40);this.emit('boss-defeated',{name:b.name});
  }
  fire() {
    const p=this.player;if(p.fireCD>0||p.roll>0||this.reload>0||(this.world.def.training||this.world.def.meleeOnly))return;
    if(this.ammo<=0){this.reloadGun();return;}
    this.ammo--;p.fireCD=.22;if(!(p.action>0&&p.actionKind==='slap')){p.action=.16;p.actionKind='fire';}
    this.shots.push({x:p.x+p.w/2+p.dir*28,y:p.y+34,vx:p.dir*950,vy:0,r:4,friendly:true,life:1.15,kind:'bullet',damage:1});
    this.effect(p.x+p.w/2+p.dir*30,p.y+34,'#ffe9ad',3);this.emit('shoot');
    if(this.ammo===0)this.reloadGun();
  }
  slap() {
    const p=this.player;if(p.slapCD>0||p.roll>0)return;
    p.slapCD=.5;p.action=SLAP_DURATION;p.actionKind='slap';p.slapHits=new Set();p.slapExtended=false;p.slapRecoiled=false;this.emit('slap');
  }
  updateSlap(){
    const p=this.player;if(p.actionKind!=='slap'||p.roll>0)return;
    const elapsed=SLAP_DURATION-p.action;
    if(p.action<=0)return;
    if(elapsed>=.10&&!p.slapExtended){p.slapExtended=true;this.emit('slap-extend');}
    if(elapsed>=.21&&!p.slapRecoiled){p.slapRecoiled=true;this.emit('slap-recoil');}
    const range=slapReach(p.action,this.items.slap);if(!range)return;
    const hit={x:p.dir>0?p.x+p.w/2:p.x+p.w/2-range,y:p.y-55,w:range,h:p.h+34};
    for(const e of this.world.enemies)if(!e.dead&&!p.slapHits.has(e)&&overlaps(hit,e)){p.slapHits.add(e);this.damageEnemy(e,this.items.slap?3:2,'slap');}
    const b=this.world.boss;if(b&&!b.dead&&b.active&&b.flash<=.15&&!p.slapHits.has(b)&&overlaps(hit,b)){p.slapHits.add(b);this.damageBoss(this.items.slap?3:2,'slap');}
    for(const s of this.shots)if(!s.friendly&&overlaps(hit,{x:s.x-s.r,y:s.y-s.r,w:s.r*2,h:s.r*2})){
      s.friendly=true;s.vx=p.dir*650;s.vy=0;s.gravity=0;s.kind='return';s.life=2;s.damage=3;this.float('RETURN TO SENDER',p.x,p.y-40,'#b6e3c3');this.emit('parry');this.effect(s.x,s.y,'#b6e3c3',12);
    }
  }
  move(dt,input) {
    const p=this.player,wasGround=p.ground,previousX=p.x;
    for(const k of ['invuln','roll','rollCD','fireCD','slapCD','action','coyote','jumpBuffer'])p[k]=Math.max(0,p[k]-dt);
    p.anim+=dt;p.duck=!!input.down;if(p.ground)p.coyote=.11;
    if(input.jump)p.jumpBuffer=.13;
    if(input.roll&&p.rollCD<=0){p.action=0;p.roll=.26;p.rollCD=.85;p.invuln=Math.max(p.invuln,.28);this.emit('roll');}
    if(p.jumpBuffer>0&&(p.coyote>0||(this.items.boots&&p.jumps<2&&p.jumps>0))){p.vy=p.coyote>0?-720:-660;p.jumps=p.coyote>0?1:2;p.coyote=0;p.ground=false;p.jumpBuffer=0;this.emit('jump');}
    const dir=clamp(input.move||0,-1,1);if(dir)p.dir=Math.sign(dir);
    if(p.roll>0)p.vx=p.dir*680;else p.vx+=(dir*340-p.vx)*Math.min(1,dt*19);
    if(input.down&&p.ground)p.vx*=.55;
    p.vy+=1900*dt*(input.jumpHeld&&p.vy<0?.54:1);p.vy=Math.min(p.vy,1200);
    p.x+=p.vx*dt;
    for(const q of this.world.platforms)if(!q.oneWay&&overlaps(p,q)){if(p.vx>0)p.x=q.x-p.w;else if(p.vx<0)p.x=q.x+q.w;}
    const oldY=p.y,fallSpeed=p.vy;p.y+=p.vy*dt;p.ground=false;
    for(const q of this.world.platforms){
      if(p.x+p.w<=q.x||p.x>=q.x+q.w)continue;
      const bowing=this.secrets.some(s=>!s.found&&s.action==='down'&&Math.abs(p.x+p.w/2-s.x)<76&&Math.abs(oldY+p.h-s.y)<42);
      if(q.oneWay&&input.down&&!bowing)continue;
      if(p.vy>=0&&oldY+p.h<=q.y+3&&p.y+p.h>=q.y){p.y=q.y-p.h;p.vy=0;p.ground=true;p.jumps=0;}
    }
    const surface=['bg_town','bg_saloon'].includes(this.world.def.bg)?'wood':'dirt';
    if(p.ground&&!wasGround&&fallSpeed>240)this.emit('land',{surface});
    if(p.ground&&p.roll<=0){p.stepDistance=(p.stepDistance||0)+Math.abs(p.x-previousX);if(p.stepDistance>82){p.stepDistance%=82;p.stepCount=(p.stepCount||0)+1;this.emit('footstep',{surface,variant:p.stepCount%3});}}
    const b=this.world.boss;
    p.x=clamp(p.x,b?.active&&!b.dead?b.arena-100:0,this.world.length-p.w);
    if(p.y>HEIGHT+150)this.hurt(p.x,true);
    if(this.reload>0){this.reload=Math.max(0,this.reload-dt);if(this.reload===0){this.ammo=6;this.emit('loaded');}}
    if(input.reload)this.reloadGun();if(input.slap)this.slap();if(input.fire)this.fire();
  }
  enemyShot(e,kind='bullet',vy=0) {
    const speed=(kind==='pie'?260:310)*this.difficulty.speed;
    this.shots.push({x:e.x+e.w/2,y:e.y+26,vx:e.dir*speed,vy,r:kind==='pie'?12:7,friendly:false,kind,life:4,gravity:kind==='pie'?650:0,damage:1});this.emit('enemy-shot',{x:e.x,kind});
  }
  updateEnemy(e,dt) {
    if(e.dead)return;const p=this.player;const dx=p.x-e.x;e.t+=dt;e.flash=Math.max(0,e.flash-dt);
    if(Math.abs(dx)>1050)return;
    e.dir=dx>=0?1:-1;
    if(e.attack==='walk'){e.x+=e.vx*dt;if(e.x<e.minX||e.x>e.maxX-e.w)e.vx*=-1;}
    if(e.attack==='ghost'){e.y=e.baseY-65+Math.sin(e.t*2)*68;e.x+=Math.sign(dx)*e.speed*dt;}
    e.timer-=dt*this.difficulty.speed;
    if(e.attack==='shot'||e.attack==='lob'||e.attack==='ghost'){
      if(e.timer<=.5&&e.phase!=='aim'&&Math.abs(dx)<640){e.phase='aim';e.timer=.5;}
      if(e.phase==='aim'&&e.timer<=0){this.enemyShot(e,e.attack==='lob'?'pie':e.attack==='ghost'?'ghost':'bullet',e.attack==='lob'?-360:0);e.timer=2.4;e.phase='walk';}
    }
    if(e.attack==='charge'){
      if(e.phase==='dash'){e.x+=e.vx*dt;if(e.timer<=0||e.x<e.minX||e.x>e.maxX){e.phase='walk';e.timer=1.2;e.x=clamp(e.x,e.minX,e.maxX-e.w);}}
      else if(e.phase==='aim'&&e.timer<=0){e.phase='dash';e.timer=.65;e.vx=e.dir*420;}
      else if(e.timer<=0&&Math.abs(dx)<500){e.phase='aim';e.timer=.65;}
    }
    if(overlaps(p,e)&&p.invuln<=0&&p.roll<=0){
      if(p.vy>120&&p.y+p.h-e.y<25&&e.kind!=='bruiser'){p.vy=-520;this.damageEnemy(e,2,'stomp');this.emit('jump');}else this.hurt(e.x);
    }
  }
  chooseBossAttack(b) {
    const patterns={stank:['charge','slam','charge'],poot:['pies','pies','charge'],tank:['volley','high','volley'],chips:b.enraged?['slam','volley','charge','pies']:['pies','charge','slam']};
    b.attack=patterns[b.kind][b.attackCount++%patterns[b.kind].length];b.phase='tell';b.timer=b.enraged?.58:.85;b.dir=this.player.x>b.x?1:-1;b.targetX=this.player.x;
    this.emit('boss-tell',{attack:b.attack,x:b.x});
  }
  updateBoss(dt) {
    const b=this.world.boss,p=this.player;if(!b||b.dead)return;
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
        if(b.attack==='pies')for(let i=0;i<3;i++)this.shots.push({x:b.x+b.w/2,y:b.y+20,vx:b.dir*(180+i*100),vy:-420-i*25,r:13,life:3,kind:'pie',gravity:700,friendly:false});
        else for(let i=0;i<(b.enraged?5:3);i++)this.shots.push({x:b.x+b.w/2-b.dir*i*88,y:FLOOR-(b.attack==='high'?127:34),vx:b.dir*450*this.difficulty.speed,vy:0,r:7,life:3,kind:'bullet',friendly:false});
        this.emit('enemy-shot',{x:b.x,kind:b.attack==='pies'?'pie':'bullet'});
      }
      if(b.timer<=0){b.phase='recover';b.timer=b.enraged?.65:1.1;}
    }else if((b.phase==='recover'||b.phase==='rage')&&b.timer<=0){b.phase='idle';b.timer=.45;b.dir=p.x>b.x?1:-1;}
    b.x=clamp(b.x,b.arena,this.world.def.length-80-b.w);
    if(overlaps(p,b)&&p.invuln<=0&&p.roll<=0){if(p.vy>100&&p.y+p.h-b.y<24){p.vy=-570;this.damageBoss(2);}else this.hurt(b.x);}
  }
  updateShots(dt) {
    for(const s of this.shots){
      if(s.gone)continue;s.life-=dt;s.vy+=(s.gravity||0)*dt;
      // Small segments prevent fast bullets from tunneling through narrow targets.
      const steps=Math.max(1,Math.ceil(Math.abs(s.vx*dt)/10));
      for(let i=0;i<steps&&!s.gone;i++){
        s.x+=s.vx*dt/steps;s.y+=s.vy*dt/steps;
        const box={x:s.x-s.r,y:s.y-s.r,w:s.r*2,h:s.r*2};
        if(s.friendly){
          for(const e of this.world.enemies)if(!e.dead&&overlaps(box,e)){this.damageEnemy(e,s.damage||1);s.gone=true;break;}
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
      if(c.got)continue;const dx=p.x+p.w/2-c.x,dy=p.y+p.h/2-c.y,d=Math.hypot(dx,dy);
      if(this.items.magnet&&c.type==='coin'&&d<165&&d>1){c.x+=dx/d*430*dt;c.y+=dy/d*430*dt;}
      if(d>42)continue;c.got=true;this.collected.add(c.id);
      if(c.type==='coin'){this.coins+=c.value;this.score+=10;this.emit('coin');}
      if(c.type==='relic'){this.relics++;this.score+=250;this.float('LOST BADGE +250',c.x,c.y);this.emit('relic');}
      if(c.type==='heart'){this.hp=Math.min(this.maxHp,this.hp+2);this.float('+2 HEALTH',c.x,c.y,'#b8d5a4');this.emit('heal');}
      this.effect(c.x,c.y,c.type==='heart'?'#b8d5a4':'#efc46a',7);
    }
    for(const c of this.world.checkpoints)if(!c.hit&&Math.abs(p.x-c.x)<65&&p.y>FLOOR-170){c.hit=true;this.checkpoint=c.x;this.hp=this.maxHp;this.ammo=6;this.reload=0;this.shield=!!this.items.shield;this.emit('checkpoint',{message:'Checkpoint · health & ammunition restored'});this.effect(c.x,FLOOR-70,'#efc46a',20);}
    if(p.x>this.world.exit-35&&(!this.world.boss||this.world.boss.dead)){
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
    for(const v of this.particles){v.x+=v.vx*dt;v.y+=v.vy*dt;v.vy+=650*dt;v.life-=dt;}this.particles=this.particles.filter(v=>v.life>0);
    for(const v of this.texts){v.y-=35*dt;v.life-=dt;}this.texts=this.texts.filter(v=>v.life>0);
    this.shake=Math.max(0,this.shake-dt);if(this.complete)return;
    if(this.dead){this.deathTimer-=dt;if(this.deathTimer<=0)this.retry();return;}
    this.time+=dt;this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0;
    this.move(dt,input);if(this.dead)return;
    for(const e of this.world.enemies)this.updateEnemy(e,dt);
    this.updateBoss(dt);this.updateSlap();this.updateShots(dt);this.updatePickups(dt);if(!this.dead)this.updateSecrets(dt,input);
    this.cam+=(clamp(this.player.x-400,0,this.world.length-WIDTH)-this.cam)*Math.min(1,dt*5);
  }
}
export function settleRun(save,game) {
  if(!game.complete||game.settled)return null;game.settled=true;
  const old=save.best[game.chapter],first=!old;
  const reward=game.coins+game.relics*20+(first?60:20)+(game.world.boss?40:0);
  save.coins+=reward;save.unlocked=Math.max(save.unlocked,Math.min(8,game.chapter+1));save.run=null;
  if(game.chapter===8)save.beaten=true;
  save.best[game.chapter]={score:Math.max(old?.score||0,game.score),time:Math.min(old?.time||Infinity,Math.ceil(game.time)),relics:Math.max(old?.relics||0,game.relics),clean:!!old?.clean||game.deaths===0,clears:(old?.clears||0)+1};
  return {reward,first,score:game.score,relics:game.relics,time:Math.ceil(game.time),deaths:game.deaths};
}
export function purchase(save,id){const item=UPGRADES.find(i=>i.id===id);if(!item||save.items[id]||save.coins<item.cost)return false;save.coins-=item.cost;save.items[id]=true;return true;}
