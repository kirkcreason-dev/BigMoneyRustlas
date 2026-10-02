import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,CHAPTERS,FLOOR,defaultSave,purchase,settleRun} from '../src/core.js';

// An input-only player exercises the entire campaign. It cannot change health,
// teleport, grant gold, unlock chapters, or damage an enemy directly.
test('the twelve-chapter campaign can be completed using earned upgrades and normal inputs',()=>{
  const save=defaultSave();
  for(let chapter=1;chapter<=CHAPTERS.length;chapter++){
    assert.ok(chapter<=save.unlocked);
    for(const id of ['slap','heart','shield','reload'])purchase(save,id);
    const g=new Game(chapter,{difficulty:'outlaw'},save.items);
    for(let n=0;n<60*240&&!g.complete;n++){
      const p=g.player,b=g.world.boss;
      const input={move:1,fire:true,slap:true,jumpHeld:true};
      const floor=g.world.platforms.find(q=>q.ground&&p.x+p.w/2>=q.x&&p.x+p.w/2<=q.x+q.w);
      if(p.ground&&floor&&floor.x+floor.w-p.x<110&&floor.x+floor.w<g.world.exit)input.jump=true;
      if(b?.active&&!b.dead){
        const dx=b.x-p.x;input.move=Math.abs(dx)>350?Math.sign(dx):0;
        if(input.move===0&&p.dir!==Math.sign(dx))input.move=Math.sign(dx);
        input.roll=Math.abs(dx)<150&&b.phase==='attack';
        input.down=p.y+p.h<FLOOR-5;
        input.jump=p.ground&&((b.phase==='tell'&&b.attack==='charge')||g.shots.some(s=>!s.friendly&&s.kind==='wave'&&Math.abs(s.x-p.x)<100));
        if(g.world.def.duel){
          input.slap=false;
          input.move=Math.abs(dx)>800?Math.sign(dx):Math.abs(dx)<210?-Math.sign(dx):0;
          if(!input.move&&p.dir!==Math.sign(dx))input.move=Math.sign(dx);
          const incoming=g.shots.some(s=>!s.friendly&&Math.abs(s.x-p.x)<190&&Math.abs(s.y-(p.y+39))<85&&s.vx*(p.x-s.x)>0);
          input.roll=incoming&&p.rollCD<=.10;
          input.jump=b.phase==='tell'&&b.timer<.15&&p.roll<=0&&p.ground;
        }
      }
      g.step(1/60,input);g.events=[];
    }
    assert.ok(g.complete,`Chapter ${chapter}: ${g.world.def.name}; ${g.deaths} deaths`);
    assert.ok(settleRun(save,g));assert.ok(save.coins>=0);
  }
  assert.ok(save.beaten);assert.equal(save.unlocked,CHAPTERS.length);
});
