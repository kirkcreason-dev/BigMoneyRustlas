import { SOUND_ASSETS } from './sound-bank.js';
import { THEME_ASSET } from './music.js?v=3.1.2';

const limit=(n,a,b)=>Math.max(a,Math.min(b,n));
export function soundScene(game){return game?.world.def.training?'woodland':game?.world.def.bg==='bg_saloon'?'saloon':game?.world.def.bg==='bg_town'?'town':'desert';}
export function soundCue(type,data={}){
  if(type==='impact')return data.weapon==='slap'?'slap_hit':data.weapon==='stomp'?'land':'bullet_hit';
  if(type==='footstep')return `step_${data.surface==='wood'?'wood':'dirt'}${data.variant%3||0}`;
  if(type==='enemy-shot')return data.kind==='axe'?'pie_throw':'enemy_shot';
  if(type==='boss-tell')return data.attack==='high'?'warning_high':data.attack==='charge'?'warning_charge':'warning_low';
  return {'noon-ready':'relic','high-noon':'shield',stash:'bullet_hit',shoot:'revolver',slap:'stretch','slap-extend':'hand_snap','slap-recoil':'recoil',parry:'ricochet',reload:'reload_open',loaded:'reload_close',jump:'jump',land:'land',roll:'roll',hurt:'hurt',death:'death',coin:'coin',relic:'relic',secret:'secret',checkpoint:'checkpoint',heal:'heal',shield:'shield',slam:'slam',rage:'rage','boss-start':'warning_charge','boss-defeated':'victory',complete:'victory',buy:'coin',click:'click'}[type]||null;
}

export class SoundEngine {
  constructor(getSettings,getGame,isPlaying,createContext=null){
    this.createContext=createContext;this.getSettings=getSettings;this.getGame=getGame;this.isPlaying=isPlaying;
    this.ctx=null;this.buffers={};this.voices=new Set();this.lastCue=new Map();this.musicTimer=null;this.musicBeat=0;this.chapter=0;this.ambient=null;this.state='loading';this.failed=[];this.themeVoice=null;this.themeOffset=0;
    // Fetch before the first gesture, then decode only once an AudioContext is allowed.
    this.bytes=Promise.all(Object.entries({...SOUND_ASSETS,theme:THEME_ASSET}).map(async([key,url])=>{
      try{const r=await fetch(url);if(!r.ok)throw Error('Missing sound');return [key,await r.arrayBuffer()];}
      catch{this.failed.push(key);return [key,null];}
    }));
  }
  init(){
    try{
      if(!this.ctx){
        const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC&&!this.createContext){this.state='unavailable';return Promise.resolve();}
        this.ctx=this.createContext?this.createContext():new AC();const c=this.ctx;
        this.master=c.createGain();this.master.gain.value=.85;
        const lowCut=c.createBiquadFilter();lowCut.type='highpass';lowCut.frequency.value=28;
        const compressor=c.createDynamicsCompressor();compressor.threshold.value=-9;compressor.knee.value=12;compressor.ratio.value=6;compressor.attack.value=.003;compressor.release.value=.15;
        this.master.connect(lowCut);lowCut.connect(compressor);compressor.connect(c.destination);
        this.sfxBus=c.createGain();this.sfxBus.gain.value=0;this.sfxBus.connect(this.master);
        this.musicBus=c.createGain();this.musicVolume=c.createGain();this.musicVolume.gain.value=0;this.duck=c.createGain();
        this.musicBus.connect(this.musicVolume);this.musicVolume.connect(this.duck);this.duck.connect(this.master);
        const room=c.createConvolver(),wet=c.createGain(),ir=c.createBuffer(2,Math.floor(c.sampleRate*.75),c.sampleRate);
        let seed=7301;for(let ch=0;ch<2;ch++){const a=ir.getChannelData(ch);for(let i=0;i<a.length;i++){seed=(seed*1664525+1013904223)>>>0;a[i]=(seed/2147483648-1)*Math.pow(1-i/a.length,3)*.22;}}
        room.buffer=ir;wet.gain.value=.11;this.musicBus.connect(room);room.connect(wet);wet.connect(this.musicVolume);
        this.applySettings();
        this.ready=this.bytes.then(async entries=>{
          await Promise.all(entries.map(async([key,data])=>{if(data)try{this.buffers[key]=await c.decodeAudioData(data);}catch{this.failed.push(key);}}));
          this.state=this.failed.length?'partial':'ready';if(this.isPlaying())this.musicPlay();
        });
      }
      if(this.ctx.state==='suspended'&&!this.ctx.startRendering)this.ctx.resume().catch(()=>{this.state='suspended';});
      return this.ready;
    }catch{this.state='unavailable';return Promise.resolve();}
  }
  applySettings(){
    if(!this.ctx)return;const s=this.getSettings(),t=this.ctx.currentTime;
    this.sfxBus.gain.setTargetAtTime(s.sound?Math.pow((s.soundVolume??80)/100,1.5):0,t,.025);
    this.musicVolume.gain.setTargetAtTime(s.music?Math.pow((s.musicVolume??55)/100,1.5)*.46:0,t,.035);
  }
  play(name,{at,gain=.7,rate=1,pan=0,bus='sfx',loop=false,duration,offset=0,dry=false}={}){
    const c=this.ctx,buffer=this.buffers[name];if(!c||!buffer)return null;
    // Keep rapid volleys bounded, without stealing warning cues for quiet footsteps.
    if(this.voices.size>=48){const old=[...this.voices].find(v=>!v.loop&&v.bus===bus);if(old){this.stopVoice(old);this.voices.delete(old);}else return null;}
    const source=c.createBufferSource(),level=c.createGain(),position=c.createStereoPanner();
    source.buffer=buffer;source.playbackRate.value=rate;source.loop=loop;level.gain.value=gain;position.pan.value=limit(pan,-.85,.85);
    source.connect(level);level.connect(position);position.connect(bus==='music'?(dry?this.musicVolume:this.musicBus):this.sfxBus);
    const start=Math.max(c.currentTime,at??c.currentTime),voice={source,level,position,bus,loop,start,offset};this.voices.add(voice);
    source.onended=()=>{this.voices.delete(voice);source.disconnect();level.disconnect();position.disconnect();};
    source.start(start,offset);if(duration){level.gain.setValueAtTime(gain,start+duration);level.gain.linearRampToValueAtTime(0,start+duration+.08);source.stop(start+duration+.09);}
    return voice;
  }
  stopVoice(v,immediate=false){if(!v||v.stopped)return;v.stopped=true;const t=this.ctx.currentTime;v.level.gain.cancelScheduledValues(t);v.level.gain.setTargetAtTime(0,t,.012);try{v.source.stop(t+(immediate?0:.06));}catch{}}
  pause(hard=false){
    clearInterval(this.musicTimer);this.musicTimer=null;
    if(this.themeVoice&&this.buffers.theme){
      this.themeOffset=(this.themeVoice.offset+Math.max(0,this.ctx.currentTime-this.themeVoice.start))%this.buffers.theme.duration;
      this.themeVoice=null;
    }
    for(const v of this.voices)if(hard||v.bus==='music'||v.loop)this.stopVoice(v,hard);
    this.ambient=null;this.previewMusicUntil=0;this.previewUntil=0;
  }
  startTheme(){
    if(this.themeVoice||!this.buffers.theme)return;
    // Play the supplied recording at its original speed, without the guitar-score reverb.
    this.themeVoice=this.play('theme',{bus:'music',dry:true,loop:true,gain:.85,offset:this.themeOffset});
  }
  duckMusic(amount=.62,duration=.20){
    if(!this.ctx)return;const t=this.ctx.currentTime,p=this.duck.gain;p.cancelScheduledValues(t);p.setTargetAtTime(amount,t,.012);p.setTargetAtTime(1,t+duration,.16);
  }
  sfx(type,data={}){
    const cue=soundCue(type,data);if(!cue||!this.ctx||!this.getSettings().sound)return;
    const t=this.ctx.currentTime,throttle={coin:.045,impact:.035,parry:.07,'enemy-shot':.045,footstep:.07}[type]||0;
    if(t-(this.lastCue.get(type)??-10)<throttle)return;this.lastCue.set(type,t);
    const g=this.getGame(),pan=Number.isFinite(data.x)?(data.x-(g?.cam||0)-640)/640*.8:0;
    const distant=Number.isFinite(data.x)&&g?limit(1-Math.abs(data.x-g.player.x)/1800,.3,1):1;
    const gains={shoot:.83,slap:.48,'slap-extend':.78,'slap-recoil':.55,impact:.80,footstep:.27,land:.46,jump:.4,roll:.43,coin:.50,'enemy-shot':.59,'boss-tell':.83,hurt:.77,death:.65,click:.48};
    const rate=['shoot','enemy-shot','footstep','impact','coin','land'].includes(type)?1+(Math.random()-.5)*.09:1;
    this.play(cue,{gain:(gains[type]??.65)*distant,rate,pan});
    if(type==='stash')this.play('coin',{at:t+.09,gain:.65,pan});
    if(type==='high-noon'){this.play('hand_snap',{at:t+.06,gain:.7});this.duckMusic(.4,.6);}
    if(type==='reload')this.play('reload_turn',{at:t+.14,gain:.4,rate:g?.items.reload?1.3:1});
    if(['shoot','slap-extend','hurt','boss-tell','slam','rage','secret'].includes(type))this.duckMusic(type==='boss-tell'?.42:.65,type==='rage'?.8:.20);
  }
  musicPlay(){
    if(!this.ctx||this.state!=='ready'&&this.state!=='partial'||this.musicTimer||!this.isPlaying())return;
    this.applySettings();this.startTheme();this.nextBeat=this.ctx.currentTime+.04;
    const tick=()=>{
      if(!this.isPlaying()){this.pause();return;}
      const g=this.getGame(),scene=soundScene(g),boss=!!(g?.world.boss?.active&&!g.world.boss.dead);
      if(this.chapter!==g?.chapter){this.chapter=g?.chapter;this.musicBeat=0;}
      if(this.ambient?.name!==scene){if(this.ambient)this.stopVoice(this.ambient.voice);this.ambient={name:scene,voice:this.play('amb_'+scene,{gain:scene==='saloon'?.11:.13,loop:true})};}
      const tempo=g?.world.def.duel?156:boss?(g.world.boss.enraged?132:118):scene==='saloon'?103:scene==='woodland'?84:92;
      if(this.nextBeat<this.ctx.currentTime-.15)this.nextBeat=this.ctx.currentTime+.02;
      while(this.nextBeat<this.ctx.currentTime+.13){if(!this.buffers.theme&&this.getSettings().music)this.score(this.musicBeat,this.nextBeat,boss,scene);this.musicBeat++;this.nextBeat+=30/tempo;}
    };
    tick();this.musicTimer=setInterval(tick,45);
  }
  score(beat,at,boss,scene){
    const step=beat%16,bar=Math.floor(beat/16)%8,root=[0,-4,3,-2,0,-4,-2,0][bar],minor=root===0;
    const note=(sample,semitones,gain,offset=0,pan=0,duration)=>this.play(sample,{at:at+offset,gain,rate:2**(semitones/12),pan,bus:'music',duration});
    if(step%4===0)note('bass',root+(step===8?7:0),boss?.36:.26,0,-.10,.38);
    // Original eight-bar fingerpicked progression. Small timing offsets make the strings breathe.
    const pick=[0,7,12,minor?15:16,7,12,minor?3:4,7];
    if(step%2===0||boss)note('guitar',root+pick[Math.floor(step/2)%8]-(scene==='woodland'?12:0),step%4===0?.23:.15,.006*(step%3),step%4===0?-.28:.28,boss?.22:.52);
    if([0,6,10,14].includes(step)&&bar%2===1){const lead=[12,7,10,3][[0,6,10,14].indexOf(step)];note('harmonic',root+lead-12,.10,.022,.12,.45);}
    if(step%4===0)note('kick',0,boss?.32:.16);
    if(step%4===2)note(scene==='saloon'||boss?'rim':'brush',0,boss?.19:.10,0,.22);
    if(boss&&step%2===1)note('brush',0,.09,0,-.22);
  }
  async previewMusic(){
    await this.init();if(!this.getSettings().music||!this.ctx||!this.buffers.theme)return false;
    if(this.previewMusicUntil>this.ctx.currentTime)return true;
    const t=this.ctx.currentTime+.04;this.previewMusicUntil=t+12.2;
    return !!this.play('theme',{at:t,bus:'music',dry:true,gain:.85,duration:12});
  }
  async preview(){
    await this.init();if(!this.getSettings().sound||!this.ctx||!['revolver','hand_snap','ricochet','coin'].every(k=>this.buffers[k]))return false;
    if(this.previewUntil>this.ctx.currentTime)return true;this.previewUntil=this.ctx.currentTime+3.6;
    const t=this.ctx.currentTime+.025;
    for(const [name,offset,gain]of [['revolver',0,.75],['reload_open',.65,.55],['reload_turn',.81,.4],['reload_close',1.3,.55],['stretch',1.75,.48],['hand_snap',1.85,.72],['slap_hit',1.86,.45],['recoil',1.96,.5],['ricochet',2.5,.58],['coin',3.15,.5]])this.play(name,{at:t+offset,gain});
    return true;
  }
}
