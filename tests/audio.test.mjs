import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SOUND_ASSETS} from '../src/sound-bank.js';
import {SoundEngine,soundCue,soundScene} from '../src/audio.js';
import {THEME_ASSET} from '../src/music.js';
import {Game,defaultSave,sanitizeSave} from '../src/core.js';

test('all sound assets are valid, non-silent PCM with headroom and smooth boundaries',()=>{
  assert.equal(Object.keys(SOUND_ASSETS).length,46);
  for(const [name,file]of Object.entries(SOUND_ASSETS)){
    const data=fs.readFileSync(new URL('../'+file,import.meta.url));
    assert.equal(data.toString('ascii',0,4),'RIFF',name);assert.equal(data.toString('ascii',8,12),'WAVE',name);
    assert.equal(data.readUInt16LE(20),1,name);assert.equal(data.readUInt16LE(22),1,name);
    assert.equal(data.readUInt32LE(24),24000,name);assert.equal(data.readUInt16LE(34),16,name);
    assert.equal(data.readUInt32LE(40),data.length-44,name);
    let peak=0,energy=0;
    for(let i=44;i<data.length;i+=2){const v=data.readInt16LE(i)/32768;peak=Math.max(peak,Math.abs(v));energy+=v*v;}
    assert.ok(peak>.15&&peak<.9,name);assert.ok(energy>1,name);
    assert.ok(Math.abs(data.readInt16LE(44))<40,name+' start');assert.ok(Math.abs(data.readInt16LE(data.length-2))<300,name+' tail');
  }
});

test('unknown UI notifications stay silent; important cues and locations differ',()=>{
  for(const type of ['hint','secret-prompt','anything-else'])assert.equal(soundCue(type),null);
  for(const type of ['shoot','slap','slap-extend','slap-recoil','impact','parry','reload','loaded','footstep','boss-tell','coin','death','complete'])assert.ok(SOUND_ASSETS[soundCue(type)],type);
  assert.notEqual(soundCue('boss-tell',{attack:'high'}),soundCue('boss-tell',{attack:'volley'}));
  assert.notEqual(soundCue('impact',{weapon:'slap'}),soundCue('impact',{weapon:'bullet'}));
  assert.notEqual(soundCue('footstep',{surface:'wood'}),soundCue('footstep',{surface:'dirt'}));
  assert.deepEqual([1,2,6,10].map(n=>soundScene(new Game(n))),['desert','town','saloon','woodland']);
});

test('slap sounds follow animation phases once, and dodging cancels future cues',()=>{
  const g=new Game(1);g.world.enemies=[];
  g.step(1/60,{slap:true});assert.equal(g.events.filter(e=>e.type==='slap').length,1);
  assert.ok(!g.events.some(e=>e.type==='slap-extend'));
  for(let i=0;i<24;i++)g.step(1/60,{});
  assert.equal(g.events.filter(e=>e.type==='slap-extend').length,1);
  assert.equal(g.events.filter(e=>e.type==='slap-recoil').length,1);
  const cancelled=new Game(1);cancelled.world.enemies=[];
  cancelled.step(1/60,{slap:true});cancelled.step(1/60,{roll:true});
  for(let i=0;i<30;i++)cancelled.step(1/60,{});
  assert.ok(!cancelled.events.some(e=>e.type==='slap-extend'||e.type==='slap-recoil'));
});

test('footsteps need movement on a surface; volume settings preserve silence and validate old saves',()=>{
  const g=new Game(2);g.world.enemies=[];
  for(let i=0;i<100;i++)g.step(1/60,{});
  assert.equal(g.events.filter(e=>e.type==='footstep').length,0);
  for(let i=0;i<50;i++)g.step(1/60,{move:1});
  const steps=g.events.filter(e=>e.type==='footstep');assert.ok(steps.length>=2&&steps.length<6);assert.ok(steps.every(e=>e.surface==='wood'));
  g.events=[];g.step(1/60,{jump:true,jumpHeld:true});for(let i=0;i<10;i++)g.step(1/60,{move:1,jumpHeld:true});
  assert.equal(g.events.filter(e=>e.type==='footstep').length,0);
  assert.equal(sanitizeSave({settings:{soundVolume:0,musicVolume:0}}).settings.soundVolume,0);
  assert.equal(sanitizeSave({settings:{soundVolume:Infinity}}).settings.soundVolume,defaultSave().settings.soundVolume);
  assert.equal(sanitizeSave({settings:{soundVolume:900,musicVolume:-5}}).settings.soundVolume,100);
  assert.equal(sanitizeSave({settings:{soundVolume:900,musicVolume:-5}}).settings.musicVolume,0);
});


test('the selected theme is the supplied M4A recording',()=>{
  assert.equal(THEME_ASSET,'audio/theme.m4a');
  const data=fs.readFileSync(new URL('../'+THEME_ASSET,import.meta.url));
  assert.equal(data.toString('ascii',4,8),'ftyp');
  assert.ok(data.length>1_000_000,'full recording is present');
});

test('theme loops alone, resumes from its paused position, and obeys music volume',()=>{
  const settings=defaultSave().settings,sources=[];
  const param=()=>({value:0,cancelScheduledValues(){},setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;}});
  const node=()=>({gain:param(),pan:param(),connect(){},disconnect(){}});
  const ctx={currentTime:0,createGain:node,createStereoPanner:node,createBufferSource(){
    const source={...node(),playbackRate:param(),start(...args){this.started=args;},stop(){this.stopped=true;}};sources.push(source);return source;
  }};
  const e=Object.assign(Object.create(SoundEngine.prototype),{ctx,buffers:{theme:{duration:125}},voices:new Set(),state:'ready',musicTimer:null,musicBeat:0,chapter:0,ambient:null,themeVoice:null,themeOffset:0,sfxBus:node(),musicBus:node(),musicVolume:node(),getSettings:()=>settings,getGame:()=>new Game(1),isPlaying:()=>true});
  let syntheticNotes=0;e.score=()=>syntheticNotes++;
  try{
    e.musicPlay();e.musicPlay();
    assert.equal(sources.length,1,'no duplicate music loop');assert.equal(syntheticNotes,0,'no guitar score over the theme');
    assert.equal(sources[0].buffer,e.buffers.theme);assert.equal(sources[0].loop,true);assert.equal(sources[0].playbackRate.value,1);
    ctx.currentTime=17;e.pause(true);assert.equal(e.themeOffset,17);assert.ok(sources[0].stopped);
    e.musicPlay();assert.equal(sources[1].started[1],17,'resume from saved music position');
    settings.music=false;e.applySettings();assert.equal(e.musicVolume.gain.value,0);assert.ok(e.sfxBus.gain.value>0,'effects remain available');
    settings.music=true;settings.musicVolume=0;e.applySettings();assert.equal(e.musicVolume.gain.value,0);
    settings.musicVolume=55;e.applySettings();assert.ok(e.musicVolume.gain.value>0);
    ctx.currentTime=142;e.pause(true);assert.equal(e.themeOffset,17,'playhead wraps cleanly after a full loop');
  }finally{e.pause(true);}
});
