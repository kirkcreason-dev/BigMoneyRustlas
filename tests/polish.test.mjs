import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,FLOOR,defaultSave,sanitizeSave} from '../src/core.js';
import {canvasSize,trimFrame} from '../src/presentation.js';

const tick=(g,input={},n=1)=>{for(let i=0;i<n;i++)g.step(1/60,input);};
const quiet=()=>{const g=new Game(1);g.world.enemies=[];return g;};

test('a short early attack or dodge tap survives the last frames of its cooldown',()=>{
  for(const action of ['slap','fire','roll']){
    const g=quiet();g.player[action==='fire'?'fireCD':action+'CD']=.07;
    tick(g,{[action]:true});tick(g,{},7);
    assert.equal(g.events.filter(e=>e.type===(action==='fire'?'shoot':action)).length,1,action);
    tick(g,{},65);
    assert.equal(g.events.filter(e=>e.type===(action==='fire'?'shoot':action)).length,1,'released input never repeats');
  }
});

test('expired buffered inputs do not fire later, and rolling keeps its committed direction',()=>{
  const g=quiet();g.player.slapCD=.4;tick(g,{slap:true});tick(g,{},40);
  assert.equal(g.events.filter(e=>e.type==='slap').length,0);
  g.player.x=500;tick(g,{move:-1,roll:true});assert.equal(g.player.dir,-1);assert.ok(g.player.vx<0);
  tick(g,{move:1},5);assert.equal(g.player.dir,-1);assert.ok(g.player.vx<0);
  tick(g,{move:1},25);assert.equal(g.player.dir,1);assert.ok(g.player.vx>0);
});

test('health packs remain available at full health and report the actual healing',()=>{
  const g=quiet(),pack=g.world.pickups.find(p=>p.type==='heart');
  Object.assign(g.player,{x:pack.x-21,y:pack.y-39});g.updatePickups(1/60);
  assert.equal(pack.got,false);assert.ok(!g.collected.has(pack.id));
  g.hp--;g.updatePickups(1/60);
  assert.equal(g.hp,g.maxHp);assert.equal(pack.got,true);assert.equal(g.texts.at(-1).text,'+1 HEALTH');
});

test('save and resume retain earned combo score, parry count, and defeated bosses',()=>{
  const streak=new Game(1);for(const enemy of streak.world.enemies.slice(0,3))streak.damageEnemy(enemy,10);
  const savedStreak=defaultSave();savedStreak.run=streak.snapshot();
  const resumedStreak=new Game(1,{}, {},sanitizeSave(savedStreak).run);
  assert.equal(resumedStreak.score,600);assert.equal(resumedStreak.bestCombo,3);
  const g=new Game(4);g.damageEnemy(g.world.enemies[0],10);g.score+=150; // Secret reward.
  g.world.boss.active=true;g.damageBoss(100);g.parries=3;g.checkpoint=1100;
  const save=defaultSave();save.unlocked=4;save.run=g.snapshot();
  const restored=new Game(4,{}, {},sanitizeSave(save).run);
  assert.equal(restored.score,g.score);assert.equal(restored.bestCombo,1);assert.equal(restored.parries,3);
  assert.equal(restored.world.boss.dead,true);assert.equal(restored.kills,1);
  assert.equal(restored.player.x,1100);
});

test('old checkpoints recover base scores and invalid score fields cannot poison a run',()=>{
  const save={version:2,unlocked:1,run:{chapter:1,checkpoint:100,collected:['p0'],killed:['e0']}};
  const legacy=new Game(1,{}, {},sanitizeSave(save).run);assert.equal(legacy.score,110);
  save.run.score=NaN;save.run.parries=Infinity;save.run.bossDefeated=true;
  const clean=sanitizeSave(save).run;assert.equal(clean.score,null);assert.equal(clean.parries,0);assert.equal(clean.bossDefeated,false);
});

test('fatal damage cannot collect loot, heal at a checkpoint, or complete a chapter in that frame',()=>{
  for(const location of ['checkpoint','exit']){
    const g=quiet();g.hp=1;
    Object.assign(g.player,{x:location==='checkpoint'?1450:g.world.exit,y:FLOOR-78,ground:true});
    const p=g.player;g.world.pickups=[{id:'fatal-coin',type:'coin',value:1,x:p.x+21,y:p.y+39}];
    g.shots=[{x:p.x+21,y:p.y+39,vx:0,vy:0,r:7,friendly:false,life:1}];
    tick(g);
    assert.equal(g.dead,true);assert.equal(g.hp,0);assert.equal(g.coins,0);assert.equal(g.complete,false);assert.equal(g.checkpoint,100);
  }
});

test('Sanchez training suppresses manual reload and firing',()=>{
  for(const chapter of [10]){const g=new Game(chapter);g.ammo=2;tick(g,{reload:true,fire:true});assert.equal(g.reload,0);assert.ok(!g.events.some(e=>e.type==='reload'||e.type==='shoot'));}

});

test('respawn discards buffered actions and stale grounded state',()=>{
  const g=quiet();Object.assign(g.player,{ground:true,coyote:.1,jumpBuffer:.1,rollBuffer:.1,slapBuffer:.1,fireBuffer:.1});
  g.resetPosition();tick(g);
  assert.equal(g.player.vy,0);assert.equal(g.player.y,FLOOR-g.player.h);
  assert.ok(!g.events.some(e=>['jump','roll','slap','shoot'].includes(e.type)));
});

test('canvas backing resolution stays sharp on phones and bounded on 4K/retina displays',()=>{
  assert.deepEqual(canvasSize(1280,720,1),{width:1280,height:720});
  assert.deepEqual(canvasSize(3840,2160,2),{width:1920,height:1080});
  const phone=canvasSize(390,844,3);assert.equal(phone.height,1080);assert.ok(Math.abs(phone.width/phone.height-390/844)<.001);
  assert.ok(canvasSize(0,0).width>0);
});

test('playfield backing follows control-dock, portrait, and rotated dimensions without letterboxing',()=>{
  for(const [w,h] of [[769,623],[390,462],[320,206],[844,288],[667,223],[1920,1080]]){
    const size=canvasSize(w,h,2);
    assert.ok(size.width<=1920&&size.height<=1080);
    assert.ok(Math.abs(size.width/size.height-w/h)<.005,`${w}x${h} aspect ratio`);
    const logicalWidth=720*size.width/size.height,scale=size.height/720;
    assert.ok(Math.abs(logicalWidth*scale-size.width)<1e-6,'uniform scale fills the screen');
  }
});

test('sprite trimming retains alpha edges, honors excluded neighbors, and handles transparent cells',()=>{
  const pixels=new Uint8ClampedArray(8*8*4);const alpha=(x,y,a)=>pixels[(y*8+x)*4+3]=a;
  alpha(2,2,255);alpha(4,5,81);alpha(1,1,80);alpha(6,6,255);
  assert.deepEqual(trimFrame(pixels,8,8,{x:0,y:0,w:8,h:8,omit:[{x:6,y:6,w:1,h:1}]}),{x:2,y:2,w:3,h:4});
  assert.deepEqual(trimFrame(new Uint8ClampedArray(256),8,8,{x:1,y:1,w:3,h:3}),{x:1,y:1,w:3,h:3});
});
