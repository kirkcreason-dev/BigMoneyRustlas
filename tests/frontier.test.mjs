import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,CHAPTERS,UPGRADES,LEGACY_CHAPTER_MAP,buildLevel,defaultSave,sanitizeSave,settleRun,FLOOR} from '../src/core.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
const quiet=items=>{const g=new Game(1,{},items);g.world.enemies=[];g.world.pickups=[];return g;};

test('old chapter records, unlocked routes, bounties and boss checkpoints migrate together',()=>{
  for(let chapter=1;chapter<=8;chapter++){
    const old={version:2,unlocked:chapter,coins:220,items:{shield:true},best:{[chapter]:{score:400,relics:2}},bounties:[chapter+'-badges'],run:{chapter,checkpoint:[3,4,6,8].includes(chapter)?1100:1450,collected:['p0'],killed:['e0'],smashed:['stash1'],score:900}};
    const save=sanitizeSave(old),mapped=LEGACY_CHAPTER_MAP[chapter];
    assert.equal(save.version,3);assert.equal(save.unlocked,mapped);assert.equal(save.run.chapter,mapped);assert.equal(save.best[mapped].score,400);assert.equal(save.coins,220);assert.ok(save.items.shield);assert.ok(save.bounties.includes(mapped+'-badges'));
    const resumed=new Game(mapped,{},save.items,save.run);assert.equal(resumed.world.def.route,chapter);assert.equal(resumed.kills,1);assert.equal(resumed.coins,9);assert.equal(resumed.score,900);
    assert.deepEqual(sanitizeSave(save),save,'migration is idempotent');
  }
});

test('every ground patrol starts and stays within its authored floor',()=>{
  for(let ch=1;ch<=CHAPTERS.length;ch++){
    const g=new Game(ch);
    for(const e of g.world.enemies.filter(e=>e.attack!=='ghost')){
      assert.ok(g.world.platforms.some(p=>p.ground&&e.minX>=p.x&&e.maxX<=p.x+p.w),`${ch} ${e.id}`);
      g.player.x=e.x;g.player.y=-300;
      for(let n=0;n<240;n++)g.updateEnemy(e,1/60);
      assert.ok(e.x>=e.minX&&e.x+e.w<=e.maxX,`${ch} ${e.id} patrol`);
    }
  }
});

test('the new gun upgrades change live ammunition, cadence and multi-target damage',()=>{
  assert.equal(UPGRADES.length,18);assert.equal(new Set(UPGRADES.map(i=>i.id)).size,18);
  const g=quiet({cylinder:true,trigger:true,pierce:true,powder:true});assert.equal(g.maxAmmo,8);g.fire();assert.equal(g.ammo,7);assert.equal(g.player.fireCD,.18);assert.equal(g.shots[0].damage,2);
  g.world.enemies=[{id:'a',x:180,y:510,w:40,h:80,hp:4,maxHp:4},{id:'b',x:270,y:510,w:40,h:80,hp:4,maxHp:4},{id:'c',x:360,y:510,w:40,h:80,hp:4,maxHp:4}];
  for(let n=0;n<30;n++)g.updateShots(1/60);assert.deepEqual(g.world.enemies.map(e=>e.hp),[2,2,4]);
  g.player.fireCD=0;g.fire();assert.equal(g.shots[0].damage,1);g.ammo=0;g.reloadGun();tick(g,74);assert.equal(g.ammo,8);
});

test('new movement, healing, High Noon and parry upgrades affect actual actions',()=>{
  const g=quiet({spurs:true,dodge:true,noon:true,charge:true,medic:true,parry:true});tick(g,45,{move:1});assert.ok(g.player.vx>380);g.step(1/60,{roll:true});assert.equal(g.player.rollCD,.62);
  g.chargeNoon(40);assert.equal(g.noon,50);g.chargeNoon(40);g.unleashNoon();assert.equal(g.noonTime,7);tick(g,301);assert.ok(g.noonTime>1.9);
  g.hp=1;const p=g.player;g.world.pickups=[{id:'pack',x:p.x+21,y:p.y+39,type:'heart'}];g.updatePickups(1/60);assert.equal(g.hp,4);
  g.player.roll=0;g.player.slapCD=0;g.shots=[{x:p.x+150,y:p.y+30,vx:-100,vy:0,r:7,life:2,friendly:false}];g.slap();tick(g,8);assert.equal(g.shots.find(s=>s.friendly)?.damage,4);
});

test('upgraded stash and bounty rewards survive checkpoint restore without duplication',()=>{
  const g=quiet({stash:true});g.breakStash(g.world.stashes[0]);assert.equal(g.coins,12);
  const s=defaultSave();s.run=g.snapshot();const r=new Game(1,{},g.items,sanitizeSave(s).run);assert.equal(r.coins,12);assert.equal(r.breakStash(r.world.stashes[0]),false);
  s.items.bounty=true;g.world.stashes.forEach(c=>g.breakStash(c));g.complete=true;assert.equal(settleRun(s,g).bountyGold,30);assert.equal(settleRun(s,g),null);
});

test('Chips always takes exactly two unblocked hits to kill Sugar; gear and Noon cannot bypass it',()=>{
  for(const difficulty of ['story','outlaw','legend']){
    const g=new Game(12,{difficulty},Object.fromEntries(UPGRADES.map(i=>[i.id,true])));assert.equal(g.maxHp,2);assert.equal(g.shield,false);assert.deepEqual(g.items,{});assert.equal(g.maxAmmo,6);
    g.chargeNoon(1000);assert.equal(g.noon,0);assert.equal(g.unleashNoon(),false);
    g.hurt(900);assert.equal(g.hp,1);assert.equal(g.dead,false);tick(g,16);g.hurt(900);assert.equal(g.hp,0);assert.equal(g.dead,true);
  }
});

test('Chips telegraphs locked aim, fires fast rounds, and only exposes his reload/shot window',()=>{
  const g=new Game(12),b=g.world.boss;g.player.x=b.arena;g.updateBoss(.02);
  for(let i=0;i<40&&b.phase!=='tell';i++)g.updateBoss(1/60);
  assert.equal(b.phase,'tell');const aim=b.targetX;g.player.x+=100;g.updateBoss(1/60);assert.equal(b.targetX,aim);
  g.damageBoss(20);assert.equal(b.hp,18);b.phase='recover';g.damageBoss(20,'slap');assert.equal(b.hp,18);g.damageBoss(20);assert.equal(b.hp,17,'each bullet deals one duel hit');
  b.phase='tell';b.timer=0;g.updateBoss(1/60);g.updateBoss(1/60);assert.ok(g.shots.some(s=>!s.friendly&&Math.hypot(s.vx,s.vy)>=959));
});
