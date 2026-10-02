import test from 'node:test';
import assert from 'node:assert/strict';
import {Game, CHAPTERS, FLOOR, buildLevel, defaultSave, sanitizeSave, settleRun, purchase} from '../src/core.js';
import {SECRETS} from '../src/secrets.js';

const tick=(g,input={},count=1)=>{for(let i=0;i<count;i++)g.step(1/60,input);};
const quiet=g=>{g.world.enemies=[];if(g.world.boss)g.world.boss.dead=true;return g;};

test('every authored floor gap can be crossed without buying boots',()=>{
  for(const chapter of CHAPTERS.map((_,i)=>i+1)){
    const floor=buildLevel(chapter).platforms.filter(p=>p.ground);
    for(let i=0;i<floor.length-1;i++){
      const g=quiet(new Game(chapter)); const edge=floor[i].x+floor[i].w;
      Object.assign(g.player,{x:edge-105,y:FLOOR-78,vx:340,ground:true});
      tick(g,{move:1,jump:true,jumpHeld:true});
      for(let n=0;n<110&&!g.player.ground;n++)tick(g,{move:1,jumpHeld:true});
      assert.equal(g.hits,0,`Chapter ${chapter}, gap ${i}: no fall damage`);
      assert.ok(g.player.x>floor[i+1].x,`Chapter ${chapter}, gap ${i}: land on far side`);
      assert.ok(g.player.ground);
    }
  }
});

test('each optional shelf has a reachable jump from a lower platform',()=>{
  for(let chapter=1;chapter<=CHAPTERS.length;chapter++){
    const platforms=buildLevel(chapter).platforms;
    for(const target of platforms.filter(p=>p.oneWay)){
      const sources=platforms.filter(p=>p.y>target.y&&p.y-target.y<245&&p.x<target.x+target.w+150&&p.x+p.w>target.x-150);
      let reached=false;
      for(const source of sources){
        for(const start of [target.x-90,target.x+target.w/2,target.x+target.w+50]){
          const x=Math.max(source.x+10,Math.min(source.x+source.w-52,start));
          const g=quiet(new Game(chapter));Object.assign(g.player,{x,y:source.y-78,ground:true});
          tick(g,{jump:true,jumpHeld:true});
          for(let n=0;n<85;n++){
            const delta=target.x+target.w/2-(g.player.x+21);
            tick(g,{move:Math.abs(delta)>20?Math.sign(delta):0,jumpHeld:true});
            if(g.player.ground&&g.player.y+78===target.y){reached=true;break;}
          }
          if(reached)break;
        }
        if(reached)break;
      }
      assert.ok(reached,`Chapter ${chapter} shelf at ${target.x}, ${target.y}`);
    }
  }
});

test('all 48 secrets have a standing surface, trigger once, and award score once',()=>{
  assert.equal(SECRETS.length,48);assert.equal(new Set(SECRETS.map(s=>s.id)).size,48);
  for(const secret of SECRETS){
    const g=quiet(new Game(secret.chapter));
    assert.ok(g.world.platforms.some(p=>p.y===secret.y&&secret.x>p.x&&secret.x<p.x+p.w),secret.id);
    Object.assign(g.player,{x:secret.x-21,y:secret.y-78,ground:true});
    const input={[secret.action==='interact'?'interact':secret.action]:true};
    tick(g,input,secret.action==='down'?74:1);
    assert.ok(g.secrets.find(s=>s.id===secret.id).found,secret.id);
    assert.equal(g.events.filter(e=>e.type==='secret').length,1,secret.id);
    tick(g,input,90);
    assert.equal(g.events.filter(e=>e.type==='secret').length,1,secret.id);
  }
});

test('six-shot cylinder reloads automatically and firing can continue',()=>{
  const g=quiet(new Game(1));tick(g,{fire:true},160);
  assert.ok(g.events.filter(e=>e.type==='shoot').length>6);
  assert.ok(g.events.some(e=>e.type==='loaded'));
  assert.ok(g.ammo>=0&&g.ammo<=6);
  for(const chapter of [10]){const training=quiet(new Game(chapter));tick(training,{fire:true},160);
    assert.equal(training.events.filter(e=>e.type==='shoot').length,0);}
});

test('slap parries a nearby projectile and cannot hit far above the sheriff',()=>{
  const g=quiet(new Game(1)),p=g.player;
  const near={x:p.x+70,y:p.y+30,r:7,vx:-310,vy:0,friendly:false,life:3};
  const high={...near,y:p.y-150};g.shots=[near,high];g.slap();tick(g,{},5);
  assert.equal(near.friendly,true);assert.equal(near.damage,3);assert.ok(near.vx>0);
  assert.equal(high.friendly,false);
});

test('fast bullets hit narrow targets even at the slowest supported frame rate',()=>{
  const g=new Game(1),enemy=g.world.enemies[0];
  enemy.x=150;enemy.y=510;enemy.w=5;enemy.hp=1;
  g.shots=[{x:135,y:540,vx:950,vy:0,r:4,friendly:true,life:1}];g.updateShots(1/30);
  assert.equal(enemy.dead,true);assert.equal(g.kills,1);
});

test('each boss announces attacks, recovers, and can be defeated; Chips has two phases',()=>{
  for(const chapter of [4,6,9,12]){
    const g=new Game(chapter),b=g.world.boss;
    g.player.x=b.arena;g.player.y=100;g.player.invuln=1e5;
    const phases=new Set();
    for(let n=0;n<900;n++){g.updateBoss(1/60);phases.add(b.phase);}
    for(const phase of ['tell','attack','recover'])assert.ok(phases.has(phase),`${b.kind} ${phase}`);
    assert.ok(g.events.some(e=>e.type==='boss-tell'));
    if(chapter===12){
      b.phase='recover';for(let i=0;i<18;i++)g.damageBoss(1);
      assert.ok(b.enraged);assert.equal(b.dead,false);assert.equal(b.hp,14);
      b.flash=0;b.phase='recover';for(let i=0;i<14;i++)g.damageBoss(1);
    }else g.damageBoss(100);
    assert.equal(b.dead,true);assert.ok(g.events.some(e=>e.type==='boss-defeated'));
  }
});

test('death restores the checkpoint and boss without duplicating collected loot',()=>{
  const g=new Game(12);g.checkpoint=1100;g.player.x=1800;g.world.boss.active=true;
  g.world.boss.hp=2;g.coins=6;g.hp=1;g.hurt(1800);assert.ok(g.dead);
  tick(g,{},56);assert.equal(g.dead,false);assert.equal(g.hp,g.maxHp);
  assert.ok(Math.abs(g.player.x-1100)<1);assert.equal(g.world.boss.hp,18);assert.equal(g.coins,6);
});

test('save migration rejects invented loot and invalid checkpoints',()=>{
  const s=sanitizeSave({unlocked:99,coins:-500,items:{djump:true},secrets:['fake','deputy-bucket','deputy-bucket'],run:{chapter:1,checkpoint:999,collected:['fake']}});
  assert.equal(s.unlocked,12);assert.equal(s.coins,0);assert.equal(s.items.boots,true);assert.equal(s.run,null);
  assert.deepEqual(s.secrets,['deputy-bucket']);
  const real=sanitizeSave({version:2,unlocked:1,run:{chapter:1,checkpoint:1450,time:7,collected:['p0','fake','p0'],killed:['e0','fake']}});
  assert.deepEqual(real.run.collected,['p0']);assert.deepEqual(real.run.killed,['e0']);
  const restored=new Game(1,{}, {},real.run);assert.equal(restored.coins,1);assert.equal(restored.kills,1);assert.equal(restored.player.x,1450);
});

test('campaign rewards settle once, unlock the next chapter, and purchases cannot overdraw',()=>{
  const s=defaultSave();
  for(let chapter=1;chapter<=CHAPTERS.length;chapter++){
    const g=new Game(chapter);g.complete=true;g.coins=10;g.relics=3;g.time=50;
    assert.ok(settleRun(s,g));const coins=s.coins;assert.equal(settleRun(s,g),null);assert.equal(s.coins,coins);
    assert.equal(s.unlocked,Math.min(CHAPTERS.length,chapter+1));
  }
  assert.equal(s.beaten,true);assert.equal(Object.keys(s.best).length,CHAPTERS.length);
  s.coins=100;assert.equal(purchase(s,'heart'),true);assert.equal(s.coins,0);
  assert.equal(purchase(s,'heart'),false);assert.equal(purchase(s,'boots'),false);assert.equal(purchase(s,'fake'),false);
});


test('elastic slap reaches distant targets at extension, only once per swing, in either direction',()=>{
  for(const dir of [-1,1]){
    const g=quiet(new Game(1)),p=g.player;
    Object.assign(p,{x:800,dir,ground:true});
    const target={id:'reach',x:p.x+21+dir*390-(dir<0?35:0),y:p.y,w:35,h:70,hp:10};
    const distant={...target,id:'far',x:p.x+21+dir*600};
    const behind={...target,id:'behind',x:p.x+21-dir*100};
    g.world.enemies=[target,distant,behind];g.slap();
    assert.equal(target.hp,10,'wind-up cannot damage ahead of the hand');
    for(let i=0;i<25;i++){p.action=Math.max(0,p.action-1/60);g.updateSlap();}
    assert.equal(target.hp,8,'distant target takes one hit');
    assert.equal(distant.hp,10,'finite reach');assert.equal(behind.hp,10,'facing matters');
  }
});
