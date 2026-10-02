import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,CHAPTERS,BOUNTIES,bountyProgress,buildLevel,defaultSave,sanitizeSave,settleRun,FLOOR} from '../src/core.js';

const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
test('all 36 gold stashes have a standing surface and are distinct from saved pickups',()=>{
  for(let ch=1;ch<=CHAPTERS.length;ch++){
    const w=buildLevel(ch);assert.equal(w.stashes.length,3);
    for(const c of w.stashes){assert.ok(w.platforms.some(p=>c.x>=p.x&&c.x+c.w<=p.x+p.w&&c.y+c.h===p.y));assert.ok(!w.pickups.some(p=>p.id===c.id));}
  }
});
test('slaps and bullets break stashes once; checkpoint reload cannot duplicate their gold',()=>{
  for(const weapon of ['slap','fire']){
    const g=new Game(1);g.world.enemies=[];tick(g,30,{[weapon]:true});
    assert.equal(g.smashed.size,1);assert.equal(g.coins,8);assert.equal(g.score,80);assert.equal(g.noon,18);
    const save=defaultSave();save.run=g.snapshot();save.run.smashed.push('stash1','invented');
    const loaded=sanitizeSave(save);assert.deepEqual(loaded.run.smashed,['stash1']);
    const restored=new Game(1,{}, {},loaded.run);restored.world.enemies=[];tick(restored,30,{[weapon]:true});
    assert.equal(restored.coins,8);assert.equal(restored.score,80);assert.equal(restored.noon,18);assert.equal(restored.smashed.size,1);
  }
});
test('High Noon requires a full earned meter and ends after five seconds without refilling itself',()=>{
  const g=new Game(1);assert.equal(g.unleashNoon(),false);g.chargeNoon(99);assert.equal(g.unleashNoon(),false);
  g.chargeNoon(12);g.chargeNoon(20);assert.equal(g.events.filter(e=>e.type==='noon-ready').length,1);
  g.ammo=0;g.reload=1;assert.equal(g.unleashNoon(),true);assert.equal(g.ammo,6);assert.equal(g.reload,0);assert.equal(g.noonUses,1);
  g.chargeNoon(100);assert.equal(g.noon,0);assert.equal(g.unleashNoon(),false);
  g.fire();assert.equal(g.player.fireCD,.13);g.slap();assert.equal(g.player.slapCD,.36);
  const snapshot=g.snapshot(),restored=new Game(1,{}, {},snapshot);assert.equal(restored.noonTime,0);assert.equal(restored.noon,0);assert.equal(restored.noonUses,1);
  tick(g,301);assert.equal(g.noonTime,0);g.player.fireCD=0;g.fire();assert.equal(g.player.fireCD,.22);
  g.dead=true;g.noon=100;assert.equal(g.unleashNoon(),false);
});
test('High Noon strengthens melee without restoring Sugar’s injured gun hand',()=>{
  for(const chapter of [10]){
    const g=new Game(chapter);g.chargeNoon(100);g.step(1/60,{special:true,fire:true,slap:true});
    assert.equal(g.noonUses,1);assert.equal(g.ammo,6);assert.equal(g.shots.length,0);assert.equal(g.player.slapCD,.36);
    const foe=g.world.enemies[0];foe.x=g.player.x+180;foe.y=FLOOR-foe.h;foe.hp=4;foe.minX=foe.x-10;foe.maxX=foe.x+200;
    tick(g,10);assert.equal(foe.hp,1);
  }
});
test('combat and exploration both charge the burst; parries retain their stronger returned shot',()=>{
  const g=new Game(1);const e=g.world.enemies[0];g.damageEnemy(e,1);assert.equal(g.noon,8);g.damageEnemy(e,1);assert.equal(g.noon,34);
  g.shots.push({x:g.player.x+130,y:g.player.y+30,vx:-100,vy:0,r:7,life:4,kind:'bullet',friendly:false});
  tick(g,10,{slap:true});assert.equal(g.parries,1);assert.ok(g.noon>=56);assert.equal(g.shots.find(s=>s.kind==='return').damage,3);
});
test('enemy hit stagger delays attacks and pushes within the patrol without duplicating defeat effects',()=>{
  const g=new Game(10),e=g.world.enemies[0];e.x=e.maxX-e.w-1;e.phase='aim';e.timer=0;
  g.damageEnemy(e,1,'slap');const x=e.x;g.updateEnemy(e,1/60);assert.ok(e.x>=x);assert.ok(e.x<=e.maxX-e.w);assert.equal(g.shots.length,0);
  g.damageEnemy(e,99);g.damageEnemy(e,99);assert.equal(g.defeats.length,1);tick(g,30);assert.equal(g.defeats.length,0);
});
test('bounties pay once on completion, survive save migration, and require their actual goals',()=>{
  assert.equal(BOUNTIES.length,36);assert.equal(new Set(BOUNTIES.map(b=>b.id)).size,36);
  const save=defaultSave(),g=new Game(1);g.world.stashes.forEach(c=>g.breakStash(c));g.relics=3;g.bestCombo=3;
  assert.equal(settleRun(save,g),null);assert.equal(save.bounties.length,0);
  g.complete=true;const r=settleRun(save,g);assert.equal(r.bountyGold,60);assert.equal(r.bounties.length,3);assert.equal(settleRun(save,g),null);
  const next=new Game(1);next.world.stashes.forEach(c=>next.breakStash(c));next.relics=3;next.bestCombo=3;next.complete=true;
  assert.equal(settleRun(save,next).bountyGold,0);save.bounties.push('fake','1-stashes');assert.equal(sanitizeSave(save).bounties.length,3);
  const clean=BOUNTIES.find(b=>b.kind==='clean'),cleanRun=new Game(clean.chapter);cleanRun.complete=true;cleanRun.deaths=1;assert.equal(bountyProgress(clean,cleanRun).earned,false);
  const timed=BOUNTIES.find(b=>b.kind==='time'),timedRun=new Game(timed.chapter);timedRun.complete=true;timedRun.time=CHAPTERS[timed.chapter-1].par+.1;assert.equal(bountyProgress(timed,timedRun).earned,false);
});
test('new checkpoint fields reject invalid charge and unknown loot without breaking older runs',()=>{
  const save=defaultSave();save.run={chapter:1,checkpoint:100,noon:Infinity,noonUses:-6,smashed:['stash1','stash1','stash9']};
  const s=sanitizeSave(save);assert.equal(s.run.noon,0);assert.equal(s.run.noonUses,0);assert.deepEqual(s.run.smashed,['stash1']);
  delete save.run.noon;delete save.run.noonUses;delete save.run.smashed;
  const old=sanitizeSave(save);const g=new Game(1,{}, {},old.run);assert.equal(g.noon,0);assert.equal(g.smashed.size,0);assert.equal(g.coins,0);
});
