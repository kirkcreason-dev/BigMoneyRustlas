
'use strict';

const SAVE_KEY = 'rustlas_save_v1';
const Save = {
  data: { unlocked: 1, coins: 0, items: {}, best: {} },
  load() {
    try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (d) this.data = Object.assign(this.data, d); } catch (e) {}
  },
  write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) {} }
};
Save.load();

const Audio = {
  ctx: null, master: null, musicGain: null,
  on: true, started: false, loop: null, world: 0,
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.16; this.musicGain.connect(this.master);
      this.on = (localStorage.getItem('rustlas_audio') !== 'off');
      this.apply();
    } catch (e) { this.ctx = null; }
  },
  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    this.started = true;
    this.playMusic();
  },
  apply() {
    if (this.music) this.music.volume = this.on ? 0.55 : 0;
    if (!this.ctx) return;
    this.master.gain.value = this.on ? 0.9 : 0;
  },
  toggle() {
    this.on = !this.on;
    try { localStorage.setItem('rustlas_audio', this.on ? 'on' : 'off'); } catch (e) {}
    this.apply();
    if (this.on) this.playMusic(); else this.stopMusic();
    return this.on;
  },
  note(freq, t, dur, type, gain, dest) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },
  sfx(name) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime;
    if (name === 'jump')      { this.note(420, t, 0.12, 'square', 0.18); this.note(680, t+0.06, 0.1, 'square', 0.14); }
    else if (name === 'coin') { this.note(990, t, 0.07, 'square', 0.16); this.note(1480, t+0.05, 0.09, 'square', 0.14); }
    else if (name === 'stomp'){ this.note(200, t, 0.12, 'sawtooth', 0.2); this.note(120, t+0.04, 0.12, 'square', 0.16); }
    else if (name === 'hurt') { this.note(300, t, 0.2, 'sawtooth', 0.22); this.note(150, t+0.08, 0.22, 'sawtooth', 0.2); }
    else if (name === 'save') { [523,659,784,1047].forEach((f,i)=>this.note(f, t+i*0.07, 0.18, 'triangle', 0.16)); }
    else if (name === 'win')  { [523,659,784,1047,1319].forEach((f,i)=>this.note(f, t+i*0.1, 0.26, 'square', 0.18)); }
    else if (name === 'power'){ [392,523,659,784].forEach((f,i)=>this.note(f, t+i*0.06, 0.16, 'triangle', 0.16)); }
    else if (name === 'switch'){ this.note(700, t, 0.08,'triangle',0.16); this.note(900,t+0.05,0.1,'triangle',0.14); }
  },

  music: null,
  ensureMusic() {
    if (this.music || !window.Audio) return;
    try {
      this.music = new window.Audio('audio/theme.m4a');
      this.music.loop = true;
      this.music.preload = 'auto';
      this.music.volume = this.on ? 0.55 : 0;
    } catch (e) { this.music = null; }
  },
  playMusic() {
    this.ensureMusic();
    if (!this.music) return;
    this.music.volume = this.on ? 0.55 : 0;
    const p = this.music.play();
    if (p && p.catch) p.catch(() => {});
  },
  startMusic(world) { this.playMusic(); },
  stopMusic() { if (this.music) { try { this.music.pause(); } catch (e) {} } },
};

const SHOP = [
  { id:'heart',  ic:'❤️', nm:'Extra Heart',  ds:'Start every level with 4 hearts instead of 3.', cost:150 },
  { id:'shield', ic:'🛡️', nm:'Bubble Shield', ds:'Absorbs the first hit in each level.',          cost:120 },
  { id:'boots',  ic:'👟', nm:'Speed Boots',  ds:'Run 20% faster. Zoom zoom.',                    cost:100 },
  { id:'djump',  ic:'🪽', nm:'Double Jump',  ds:'Jump again in mid-air (human only).',           cost:200 },
  { id:'magnet', ic:'🧲', nm:'Coin Magnet',  ds:'Nearby coins fly toward you.',                  cost:140 },
  { id:'jetpack',ic:'🚀', nm:'Jetpack',      ds:'Hold ▲ to fly slowly — burns 1 coin at a time as fuel.', cost:250 },
];

const cv = document.getElementById('game');
const cx = cv.getContext('2d');
const VIEW_H = 720;
let viewW = 1280, scale = 1;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  cv.width  = Math.floor(innerWidth * dpr);
  cv.height = Math.floor(innerHeight * dpr);
  scale = cv.height / VIEW_H;
  viewW = cv.width / scale;
}
addEventListener('resize', resize); resize();

const IMG = {};
const SHEETS = [];
const SINGLE = [

  'rl_sugarwolf_gun_idle','rl_sugarwolf_gun_walk1','rl_sugarwolf_gun_walk2','rl_sugarwolf_gun_walk3','rl_sugarwolf_gun_jump','rl_sugarwolf_gun_crouch','rl_sugarwolf_gun_shoot','rl_sugarwolf_gun_shoot_alt','rl_sugarwolf_gun_shotgun_ready',

  'rl_sanchez_idle','rl_sanchez_walk1','rl_sanchez_walk2','rl_sanchez_walk3','rl_sanchez_jump','rl_sanchez_crouch','rl_sanchez_punch','rl_sanchez_arms_crossed','rl_sanchez_taunt',

  'rl_gunslinger_idle','rl_gunslinger_walk1','rl_gunslinger_walk2','rl_gunslinger_walk3','rl_gunslinger_jump','rl_gunslinger_crouch','rl_gunslinger_aim','rl_gunslinger_shoot','rl_gunslinger_taunt',

  'rl_hj_hannah_idle','rl_hj_hannah_walk1','rl_hj_hannah_walk2','rl_hj_hannah_walk3','rl_hj_hannah_jump','rl_hj_hannah_crouch','rl_hj_hannah_sit','rl_hj_hannah_taunt','rl_hj_hannah_gesture',

  'rl_sugarwolf_slap_idle','rl_sugarwolf_slap_walk1','rl_sugarwolf_slap_walk2','rl_sugarwolf_slap_walk3','rl_sugarwolf_slap_jump','rl_sugarwolf_slap_crouch','rl_sugarwolf_slap_slap1','rl_sugarwolf_slap_slap2','rl_sugarwolf_slap_slap_ready',

  'rl_bucky_idle','rl_bucky_walk1','rl_bucky_walk2','rl_bucky_walk3','rl_bucky_jump','rl_bucky_crouch','rl_bucky_aim','rl_bucky_shoot','rl_bucky_taunt',

  'coin','coin_shine','coin_stack','coin_pile','coin_spin1','coin_spin2','coin_spin3','coin_spin4',
  'chip_tan','chip_red','chip_black','chip_gold','chips_stack','chips_stack_mixed','chips_pile',
  'medallion','gold_nuggets','gold_bar','gold_bars','gold_chest',

  'well1','well2','well3','well4',

  'ch1','ch2','ch3','ch4','ch5','ch6','ch7','ch8','bullet','muzzleflash','hit1','hit2','hit3','hit4','hit5','hit6','portal1','portal2','portal3'];
const ENEMY_IMGS = ['e_shadow','e_shadow_aim','e_ghost','e_gambler','e_pie','e_tank','e_foot'];
const BOSS_IMGS = [
  'bstank_1','bstank_2','bstank_3','bstank_4','bstank_5','bstank_6','bstank_7','bstank_8','bstank_9',
  'bstank_gold1','bstank_gold2','bstank_gold3','bstank_gold4','bstank_gold5',
  'bpoot_1','bpoot_2','bpoot_3','bpoot_4','bpoot_5','bpoot_6','bpoot_7','bpoot_8','bpoot_9',
  'bpoot_gold1','bpoot_gold2','bpoot_gold3','bpoot_gold4','bpoot_gold5',
  'btank_1','btank_2','btank_3','btank_4','btank_5','btank_6','btank_7','btank_8','btank_9',
  'bchips_1','bchips_2','bchips_3','bchips_4','bchips_5','bchips_6','bchips_7','bchips_8','bchips_9',
  'bchips_gold1','bchips_gold2','bchips_gold3','bchips_gold4','bchips_gold5'];
const BGS = ['bg_island','bg_town','bg_saloon','bg_hideout'];
const GROUND_IMGS = ['ground_grass','ground_wood','ground_rock'];
let assetsReady = false;

function loadAssets(cb) {
  const names = SHEETS.concat(BGS).concat(ENEMY_IMGS).concat(GROUND_IMGS).concat(SINGLE).concat(BOSS_IMGS);
  let left = names.length;
  names.forEach(n => {
    const im = new Image();
    im.onload = im.onerror = () => { if (--left === 0) { assetsReady = true; cb(); } };
    im.src = 'img/' + n + '.png';
    IMG[n] = im;
  });
}

function drawFrame(name, frame, x, y, w, h, flip) {
  const im = IMG[name];
  if (!im || !im.width) return;
  const cw = im.width / 3, ch = im.height / 2;
  const sx = (frame % 3) * cw, sy = Math.floor(frame / 3) * ch;
  cx.save();
  if (flip) { cx.translate(x + w / 2, 0); cx.scale(-1, 1); cx.translate(-(x + w / 2), 0); }
  cx.drawImage(im, sx, sy, cw, ch, x, y, w, h);
  cx.restore();
}

function RNG(seed) {
  let s = seed >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const THEMES = [
  { bg:'bg_island',  ground:'ground_grass', fill:'#6e4a2a', edge:'#caa15a', name:'Dusty Plains'      },
  { bg:'bg_town',    ground:'ground_wood',  fill:'#5a4530', edge:'#caa15a', name:'Mud Bug Town'      },
  { bg:'bg_saloon',  ground:'ground_wood',  fill:'#3a2a1c', edge:'#8a6a3a', name:'Hatchetman Saloon' },
  { bg:'bg_island',  ground:'ground_rock',  fill:'#6e4a2a', edge:'#caa15a', name:'Coyote Canyon'     },
  { bg:'bg_hideout', ground:'ground_wood',  fill:'#2a2420', edge:'#6a5a48', name:"Chips' Hideout"   },
];

const ENEMY_TYPES = [
  { id:'bandit',    img:'e_shadow',     c:'#2b2b2b', w:60, h:84, speed:60,  hp:1, behavior:'spit',  baseFacing:1 },
  { id:'gunhand',   img:'e_shadow_aim', c:'#2b2b2b', w:64, h:80, speed:0,   hp:1, behavior:'spit',  baseFacing:1 },
  { id:'ghost',     img:'e_ghost',      c:'#9fd0ff', w:60, h:84, speed:95,  hp:1, behavior:'bob',   baseFacing:1 },
  { id:'thug',   img:'e_gambler',    c:'#caa15a', w:62, h:84, speed:70,  hp:1, behavior:'walk',  baseFacing:1 },
  { id:'pieslinger',img:'e_pie',        c:'#caa15a', w:60, h:72, speed:70,  hp:1, behavior:'spit',  baseFacing:1 },
  { id:'bruiser',   img:'e_tank',       c:'#cbb89a', w:56, h:58, speed:55,  hp:3, behavior:'walk',  baseFacing:1, noStomp:true },
  { id:'foot',      img:'e_foot',       c:'#8a7a4a', w:78, h:70, speed:120, hp:2, behavior:'charge',baseFacing:1 },
];

const BOSS_DEFS = {
  stank: { name:'RAW STANK',        prefix:'bstank_', w:96,  h:122, hp:5 },
  poot:  { name:'DUSTY POOT',       prefix:'bpoot_',  w:90,  h:120, hp:5 },
  tank:  { name:'TANK',             prefix:'btank_',  w:80,  h:90,  hp:7 },
  chips: { name:'BIG BABY CHIPS',   prefix:'bchips_', w:124, h:142, hp:9, enrage:true },
};

const LEVELS = [
  { name:'Back to Mud Bug',         theme:0, enemies:['bandit','thug'],           boss:null,
    story:'Sheriff Sugar Wolf rides back into Mud Bug \u2014 dusty, broke, and choked under Big Baby Chips. Time to clean house.' },
  { name:'Chips\u2019 Welcome',     theme:1, enemies:['bandit','thug'],           boss:null,
    story:'Word travels fast. Chips sends his weirdos to run the new sheriff out of town.' },
  { name:'Raw Stank',               theme:1, enemies:['thug'],                    boss:'stank',
    story:'Raw Stank \u2014 one of Chips\u2019 thugs \u2014 blocks the road. Put him down.' },
  { name:'Dusty Poot',              theme:2, enemies:['pieslinger'],              boss:'poot',
    story:'Inside the Hatchetman Saloon, Dusty Poot is waiting with a pie and a grudge.' },
  { name:'The Saloon Floor',        theme:2, enemies:['ghost','gunhand','foot'],  boss:null,
    story:'Chips is close now. Fight through the saloon to reach the back rooms.' },
  { name:'The Assassin',            theme:1, enemies:['gunhand'],                 boss:'tank',
    story:'Chips calls his deadliest killer. \u201cTink\u201d is really TANK \u2014 and he\u2019s coming for you.' },
  { name:'Sanchez\u2019s Lesson',   theme:3, enemies:['bruiser','ghost'],         boss:null, hero:'gun',
    story:'Dirty Sanchez takes Sugar to the high country and teaches him to shoot. Time to put some lead behind that badge.' },
  { name:'Showdown: Big Baby Chips',theme:4, enemies:[],                          boss:'chips', hero:'gun',
    story:'The final duel. Face Big Baby Chips in his hideout and take Mud Bug back for good.' },
];
const LAST_LEVEL = LEVELS.length;

const DEV_UNLOCK_ALL = false;

const CHARACTERS = [
  { id:'sugarwolf', name:'Sugar Wolf', single:true, baseFacing:1, run:1.06, jumpV:1.04, spriteH:120, color:'#7a5a32', desc:'The sheriff', shotKind:'bullet', canSlap:true,
    imgIdle:'rl_sugarwolf_gun_idle',
    walkImgs:['rl_sugarwolf_gun_walk1','rl_sugarwolf_gun_walk2','rl_sugarwolf_gun_walk3','rl_sugarwolf_gun_walk2'],
    imgJump:'rl_sugarwolf_gun_jump', imgCrouch:'rl_sugarwolf_gun_crouch',
    imgThrow:'rl_sugarwolf_gun_shoot', imgThrowAlt:'rl_sugarwolf_gun_shoot_alt', imgCheer:'rl_sugarwolf_gun_shotgun_ready',
    imgSlap:'rl_sugarwolf_slap_slap2', imgSlapReady:'rl_sugarwolf_slap_slap1' },
  { id:'bucky', name:'Bucky', single:true, baseFacing:1, run:1.04, jumpV:1.04, spriteH:120, color:'#2f5a8c', desc:'Quick-draw gun for hire', shotKind:'bullet', canSlap:false,
    imgIdle:'rl_bucky_idle',
    walkImgs:['rl_bucky_walk1','rl_bucky_walk2','rl_bucky_walk3','rl_bucky_walk2'],
    imgJump:'rl_bucky_jump', imgCrouch:'rl_bucky_crouch',
    imgThrow:'rl_bucky_shoot', imgThrowAlt:'rl_bucky_aim', imgCheer:'rl_bucky_taunt' },
];

const SUGARWOLF_GUN = { id:'sugarwolf_gun', name:'Sugar Wolf', single:true, baseFacing:1, run:1.06, jumpV:1.02, spriteH:120, color:'#7a5a32', desc:'The sheriff — fast guns', shotKind:'bullet',
  imgIdle:'rl_sugarwolf_gun_idle', walkImgs:['rl_sugarwolf_gun_walk1','rl_sugarwolf_gun_walk2','rl_sugarwolf_gun_walk3','rl_sugarwolf_gun_walk2'], imgJump:'rl_sugarwolf_gun_jump', imgCrouch:'rl_sugarwolf_gun_crouch', imgThrow:'rl_sugarwolf_gun_shoot', imgCheer:'rl_sugarwolf_gun_shotgun_ready' };
function charById(id) { return CHARACTERS.find(c => c.id === id) || CHARACTERS[0]; }
function isUnlocked(ch) { return !ch.locked || DEV_UNLOCK_ALL; }

const DOG_FRAMES = { idle:'k2_dog_idle', walk:['k2_dog_walk1','k2_dog_walk2'], jump:'k2_dog_jump', leap:'k2_dog_leap', bark:'k2_dog_bark', spriteH:64 };

const G = {
  mode: 'title',
  level: 1,
  char: CHARACTERS[0], baseChar: CHARACTERS[0],
  t: 0,
  cam: { x:0, y:0 },
  world: null,
  player: null, dog: null,
  controlling: 'human',
  enemies: [], coins: [], shots: [], parts: [], plates: [], gates: [], levers: [], checkpoints: [],
  portal: null, boss: null,
  hearts: 3, maxHearts: 3, shieldUp: false,
  coinsRun: 0,
  checkpointX: 120, checkpointY: 0,
  shakeT: 0, msgT: 0,
  shopReturn: 'title',
  jumpBufferT: 0, jumpSustain: false,
  flying: false, goldT: 0, flyThrust: false, dogCarried: false,
  crouchHeld: false, ammo: 8, hitEffects: [], ammoRun: 0, jetFuelT: 0,
};
if (DEV_UNLOCK_ALL) Save.data.unlocked = Math.max(Save.data.unlocked, 20);
if (Save.data.gameBeaten === undefined) Save.data.gameBeaten = false;
if (DEV_UNLOCK_ALL) Save.data.gameBeaten = true;

function makeActor(x, y, w, h) {
  return { x, y, w, h, vx:0, vy:0, onGround:false, facing:1, anim:0, animT:0,
           invuln:0, dead:false, jumpHeld:false, jumpT:0, jumps:0, coyote:0 };
}

function newPlayer(x, y) { const a = makeActor(x, y, 52, 74); a.kind='human'; a.throwCD=0; a.throwT=0; a.slapT=0; a.slapCD=0; a.shootFlip=false; return a; }
function newDog(x, y)    { const a = makeActor(x, y, 62, 48); a.kind='dog'; a.waiting=false; return a; }

function themeOf(lvl) { const L = LEVELS[lvl - 1]; return THEMES[L ? L.theme : 0]; }
function bossKindOf(lvl) { const L = LEVELS[lvl - 1]; return L ? L.boss : null; }

function genLevel(lvl) {
  const rnd = RNG(lvl * 7919 + 13);
  const theme = themeOf(lvl);
  const bossKind = bossKindOf(lvl);
  const isBoss = !!bossKind;
  const isMini = false;
  const len = isBoss ? 2600 : 3000 + lvl * 260;
  const groundBase = VIEW_H - 110;

  const plats = [];
  const coins = [];
  const candies = [];
  const enemies = [];
  const checkpoints = [];
  const gates = [], plates = [], levers = [];

  let x = -200, gy = groundBase;
  const gapChance = Math.min(0.16 + lvl * 0.012, 0.4);
  while (x < len) {
    const segW = 360 + rnd() * 480;
    plats.push({ x, y: gy, w: segW, h: 400, solid: true, ground: true });

    if (x > 350 && !isBoss) {
      if (rnd() < 0.75) {

        const n = 3 + Math.floor(rnd() * 4);
        const cxs = x + 60 + rnd() * (segW - 160);
        for (let i = 0; i < n; i++) coins.push({ x: cxs + i * 44, y: gy - 70 - Math.sin(i / (n - 1) * Math.PI) * 60, t: rnd() * 6 });
      }
      if (rnd() < 0.45) {

        candies.push({ x: x + 80 + rnd() * (segW - 160), y: gy - 60 - rnd() * 70, t: rnd() * 6, hue: ['#ff5fa2','#ff8a3d','#7c5cff','#36d39a'][Math.floor(rnd()*4)] });
      }
      if (rnd() < 0.6 && segW > 420) {

        const pw = 150 + rnd() * 130;
        const px = x + 80 + rnd() * (segW - pw - 160);
        const py = gy - 150 - rnd() * 130;
        plats.push({ x: px, y: py, w: pw, h: 26, oneWay: true });
        for (let i = 0; i < 3; i++) coins.push({ x: px + 24 + i * 44, y: py - 44, t: rnd() * 6 });
        if (rnd() < 0.4) enemies.push(spawnEnemy(pickEnemy(lvl, rnd), px + pw / 2, py - 10, px, px + pw));
      }

      const eChance = Math.min(0.6 + lvl * 0.03, 0.92);
      const eCount = rnd() < eChance ? (1 + (rnd() < Math.min(0.15 + lvl / 20, 0.7) ? 1 : 0)) : 0;
      for (let i = 0; i < eCount; i++) {
        enemies.push(spawnEnemy(pickEnemy(lvl, rnd), x + 120 + rnd() * (segW - 240), gy - 10, x + 40, x + segW - 40));
      }

      if (rnd() < 0.35) {
        const bw = 120 + rnd() * 90, bh = 64 + Math.floor(rnd() * 2) * 64;
        plats.push({ x: x + segW - bw - 30, y: gy - bh, w: bw, h: bh, solid: true });
      }
    }

    x += segW;
    if (x < len - 600 && rnd() < gapChance) {
      const gap = 110 + rnd() * (90 + lvl * 5);

      if (gap > 190) plats.push({ x: x + gap / 2 - 60, y: gy - 60 - rnd() * 60, w: 120, h: 24, oneWay: true });
      x += gap;
      if (rnd() < 0.4) gy = clamp(gy + (rnd() < 0.5 ? -1 : 1) * 70, groundBase - 180, groundBase);
    }
  }

  plats.push({ x: len - 60, y: groundBase, w: 900, h: 400, solid: true, ground: true });

  if (!isBoss) {
    checkpoints.push({ x: len * 0.38, y: 0, hit: false });
    checkpoints.push({ x: len * 0.72, y: 0, hit: false });
  } else {
    checkpoints.push({ x: 420, y: 0, hit: false });
  }

  let portal = { x: len + 320, y: 0, open: !isBoss };
  let boss = null;
  if (isBoss) {
    const def = BOSS_DEFS[bossKind];
    boss = { x: len - 500, y: groundBase - def.h, w: def.w, h: def.h, vx: 0, vy: 0, hp: def.hp, maxHp: def.hp,
             t: 0, phase: 'walk', phaseT: 2, facing: -1, flashT: 0, isBoss: true,
             kind: bossKind, name: def.name, prefix: def.prefix, canEnrage: !!def.enrage,
             stage: ({ stank:1, poot:1, tank:2, chips:3 })[bossKind] || 1,
             onGround: true, anim: 0, minX: 900, maxX: len + 200 };

    plats.push({ x: len - 900, y: groundBase - 170, w: 200, h: 24, oneWay: true });
    plats.push({ x: len - 300, y: groundBase - 170, w: 200, h: 24, oneWay: true });
    portal.x = len + 260; portal.open = false;
  }

  return { lvl, theme, len, groundBase, plats, coins, candies, enemies, checkpoints, gates, plates, levers, portal, boss, isBoss, isMini };
}

function groundFind(plats, x) {
  let best = VIEW_H - 110;
  for (const p of plats) if (p.ground && x >= p.x && x <= p.x + p.w) best = Math.min(best, p.y);
  return best;
}

function enemyById(id) { return ENEMY_TYPES.find(e => e.id === id) || ENEMY_TYPES[0]; }
function pickEnemy(lvl, rnd) {
  const L = LEVELS[lvl - 1];
  const list = (L && L.enemies && L.enemies.length) ? L.enemies : ['bandit'];
  return enemyById(list[Math.floor(rnd() * list.length)]);
}

function spawnEnemy(type, x, y, minX, maxX) {
  return {
    type, x, y: y - type.h, w: type.w, h: type.h,
    vx: (Math.random() < 0.5 ? -1 : 1) * type.speed, vy: 0,
    hp: type.hp, maxHp: type.hp, t: Math.random() * 6, minX, maxX,
    baseY: y - type.h, dead: false, deadT: 0, flashT: 0, shotT: 1 + Math.random() * 2,
    onGround: false, facing: 1,
  };
}

const Input = { left:false, right:false, up:false, down:false, jump:false, moveDir:0, attackQueued:false, slapQueued:false };
const COYOTE = 0.10;
const JUMP_BUFFER = 0.12;

function activeActor() { return G.controlling === 'human' ? G.player : G.dog; }

function requestJump() { G.jumpBufferT = JUMP_BUFFER; }
function queueThrow() { Input.attackQueued = true; }
function queueSlap() { Input.slapQueued = true; }

function bindButton(el, onPress, onRelease) {
  if (!el) return;
  const press = (e) => { Audio.resume(); el.classList.add('pressed'); if (onPress) onPress(); if (e.cancelable) e.preventDefault(); };
  const release = (e) => { el.classList.remove('pressed'); if (onRelease) onRelease(); if (e && e.cancelable) e.preventDefault(); };
  el.addEventListener('touchstart', press, { passive:false });
  el.addEventListener('touchend', release, { passive:false });
  el.addEventListener('touchcancel', release, { passive:false });
  el.addEventListener('mousedown', press);
  el.addEventListener('mouseup', release);
  el.addEventListener('mouseleave', release);
}
function setupGamepad() {
  bindButton(document.getElementById('btnL'),  () => Input.left = true,  () => Input.left = false);
  bindButton(document.getElementById('btnR'),  () => Input.right = true, () => Input.right = false);
  bindButton(document.getElementById('btnU'),  () => Input.up = true,    () => Input.up = false);
  bindButton(document.getElementById('btnD'),  () => Input.down = true,  () => Input.down = false);
  bindButton(document.getElementById('btnA'),  () => { Input.jump = true; requestJump(); }, () => Input.jump = false);
  bindButton(document.getElementById('btnB'),  () => queueThrow());
  bindButton(document.getElementById('btnY'),  () => queueSlap());
}

function pollInput() {
  let dir = 0;
  if (Input.left || keys['ArrowLeft'] || keys['a']) dir -= 1;
  if (Input.right || keys['ArrowRight'] || keys['d']) dir += 1;
  Input.moveDir = clamp(dir, -1, 1);

  G.jumpSustain = Input.jump || keys[' '] || keys['w'];

  G.flyThrust = Input.up || keys['ArrowUp'];

  G.crouchHeld = Input.down || keys['ArrowDown'] || keys['s'];
}

const keys = {};
addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === ' ' || e.key === 'w') requestJump();
  if (e.key === 'x' || e.key === 'k') queueThrow();
  if (e.key === 'c' || e.key === 'j') queueSlap();
});
addEventListener('keyup', e => { keys[e.key] = false; });

const GRAV = 2300;
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

function solidAt(actor) {
  const W = G.world;
  const list = [];
  for (const p of W.plats) list.push(p);
  for (const g of W.gates) if (!g.open) {
    const gy = groundFind(W.plats, g.x);
    list.push({ x: g.x, y: gy - 240, w: g.w, h: 240, solid: true, gate: true });
  }
  return list;
}

function moveActor(a, dt, opts) {
  opts = opts || {};
  a.vy += GRAV * dt * (opts.gravMul != null ? opts.gravMul : 1);
  a.vy = Math.min(a.vy, 1400);
  if (a.squashT > 0) a.squashT -= dt;

  const plats = solidAt(a);

  a.x += a.vx * dt;
  for (const p of plats) {
    if (p.oneWay) continue;
    if (overlap(a, p)) {
      if (a.vx > 0) a.x = p.x - a.w; else if (a.vx < 0) a.x = p.x + p.w;
      else { if (a.x + a.w/2 < p.x + p.w/2) a.x = p.x - a.w; else a.x = p.x + p.w; }
      a.blockedX = true;
    }
  }

  const wasAir = !a.onGround;
  const fallV = a.vy;
  a.onGround = false;
  const prevY = a.y;
  a.y += a.vy * dt;
  for (const p of plats) {
    if (!overlap(a, p)) continue;
    if (p.oneWay) {

      if (opts.dropThrough) continue;
      if (a.vy > 0 && prevY + a.h <= p.y + 14) { a.y = p.y - a.h; a.vy = 0; a.onGround = true; a.jumps = 0; }
      continue;
    }
    if (a.vy > 0 && prevY + a.h <= p.y + 20) { a.y = p.y - a.h; a.vy = 0; a.onGround = true; a.jumps = 0; }
    else if (a.vy < 0 && prevY >= p.y + p.h - 20) { a.y = p.y + p.h; a.vy = 0; }
    else { if (a.x + a.w/2 < p.x + p.w/2) a.x = p.x - a.w; else a.x = p.x + p.w; }
  }

  if (a.onGround && wasAir && fallV > 430) {
    a.squashT = 0.16;
    if (a.kind !== 'enemy') dust(a.x + a.w/2, a.y + a.h, Math.min(8, Math.floor(fallV / 130)));
  }
  a.x = clamp(a.x, -150, G.world.len + 520);
}

function dust(x, y, n) {
  for (let i = 0; i < n; i++) {
    const ang = Math.PI + (Math.random() - 0.5) * Math.PI * 0.9;
    const sp = 40 + Math.random() * 90;
    G.parts.push({ x, y, vx: Math.cos(ang) * sp * (Math.random() < 0.5 ? 1 : -1), vy: -Math.random() * 60, life: 0.35, max: 0.35, c: 'rgba(220,210,190,0.9)', r: 2 + Math.random() * 2 });
  }
}

function startLevel(lvl) {
  G.level = lvl;
  const L = LEVELS[lvl - 1];

  G.char = G.baseChar || CHARACTERS[0];
  G.world = genLevel(lvl);
  G.maxHearts = Save.data.items.heart ? 4 : 3;
  G.hearts = G.maxHearts;
  G.shieldUp = !!Save.data.items.shield;
  G.coinsRun = 0;
  G.controlling = 'human';
  G.checkpointX = 120; G.checkpointY = groundFind(G.world.plats, 120) - 80;
  G.player = newPlayer(120, G.checkpointY);
  G.dog = null;
  G.enemies = G.world.enemies;
  G.boss = G.world.boss;
  G.shots = []; G.parts = [];
  G.cam.x = 0; G.cam.y = 0; G.hitPause = 0;
  G.mode = 'playing';
  G.ammo = 12; G.ammoRun = 0; G.hitEffects = []; G.jetFuelT = 0;
  G.player.frame = G.char.idle; G.player.frameKey = 'idle';
  G.flying = false; G.goldT = 0; G.flyThrust = false; G.dogCarried = false;
  showScreen(null);
  document.getElementById('btnSwitch').style.display = 'none';
  document.getElementById('btnPause').style.display = 'block';
  document.getElementById('btnMute').style.display = 'block';
  document.getElementById('btnMute').textContent = Audio.on ? '🔊' : '🔇';
  const pad = document.getElementById('gamepad'); if (pad) pad.style.display = 'block';
  const hint = document.getElementById('hint');
  hint.style.display = 'none';
  G.jumpBufferT = 0; G.jumpSustain = false;
  Input.left=Input.right=Input.up=Input.down=Input.jump=false; Input.attackQueued=false;
  Audio.startMusic(Math.min(4, L ? L.theme : 0));
  toast(themeOf(lvl).name + ' — ' + (L ? L.name : ('Level ' + lvl)) + (G.world.isBoss ? '  •  ⚔ ' + (BOSS_DEFS[L.boss] ? BOSS_DEFS[L.boss].name : 'BOSS') : ''));
}

function respawn() {
  G.hearts = G.maxHearts;
  G.shieldUp = !!Save.data.items.shield;
  G.player.x = G.checkpointX; G.player.y = G.checkpointY; G.player.vx = G.player.vy = 0; G.player.invuln = 1.5;
  if (G.dog) { G.dog.x = G.checkpointX - 70; G.dog.y = G.checkpointY; G.dog.vx = G.dog.vy = 0; G.dog.waiting = false; }
  G.controlling = 'human';

}

function hurt(who) {
  const a = G.player;
  if (G.char.invincible) return;
  if (a.invuln > 0) return;
  if (G.shieldUp) { G.shieldUp = false; a.invuln = 1.2; toast('Shield broke!'); burst(who.x, who.y, '#4fc3f7'); Audio.sfx('hurt'); return; }
  G.hearts--;
  a.invuln = 1.4;
  G.shakeT = 0.3;
  Audio.sfx('hurt');
  burst(who.x + who.w / 2, who.y, '#ff5252');
  if (G.hearts <= 0) { toast('Back to the checkpoint!'); respawn(); }
}

function tryJump(a) {
  const isDog = a.kind === 'dog';
  const jv = isDog ? 1 : G.char.jumpV;
  if (a.onGround || a.coyote > 0) {
    a.vy = (isDog ? -740 : -810) * jv;
    a.jumps = 1; a.coyote = 0;
    Audio.sfx('jump');
    return true;
  } else if (!isDog && Save.data.items.djump && a.jumps === 1) {
    a.vy = -720 * jv; a.jumps = 2; burst(a.x + a.w/2, a.y + a.h, '#fff59d');
    Audio.sfx('jump');
    return true;
  }
  return false;
}

function updatePlayerControlled(a, dt) {
  const ch = G.char;
  const boots = a.kind === 'human' && Save.data.items.boots ? 1.2 : 1;
  const runMul = a.kind === 'human' ? ch.run : 1;
  const speedBase = (a.kind === 'dog' ? 365 : 330) * boots * runMul;

  let dir = Input.moveDir;
  if (keys['ArrowLeft'] || keys['a']) dir = -1;
  if (keys['ArrowRight'] || keys['d']) dir = 1;

  const th = G.world.theme;
  const water = !!th.water;
  const swim = water ? 0.72 : 1;
  const accelRate = water ? 8 : 18;
  const target = dir * speedBase * swim;
  a.vx += (target - a.vx) * Math.min(1, dt * accelRate);
  if (dir !== 0) a.facing = dir;

  const holding = G.jumpSustain || keys[' '] || keys['ArrowUp'] || keys['w'];


  G.flying = false; G.goldT = 0; G.dogCarried = false;

  if (a.onGround) a.coyote = COYOTE; else a.coyote = Math.max(0, a.coyote - dt);

  if (G.jumpBufferT > 0) {
    if (tryJump(a)) G.jumpBufferT = 0;
    else G.jumpBufferT -= dt;
  }

  let jetting = false;
  if (Save.data.items.jetpack && !water && G.flyThrust && Save.data.coins > 0) {
    a.vy -= 1700 * dt;
    a.vy = Math.max(a.vy, -300);
    jetting = true;
    G.jetFuelT = (G.jetFuelT || 0) + dt;
    if (G.jetFuelT >= 0.28) { G.jetFuelT = 0; Save.data.coins = Math.max(0, Save.data.coins - 1); Save.write(); }

    if (Math.random() < 0.8) G.parts.push({ x: a.x + a.w/2 + (Math.random()-0.5)*10, y: a.y + a.h - 4, vx:(Math.random()-0.5)*40, vy: 120 + Math.random()*90, life:0.3, max:0.3, c: Math.random()<0.5 ? 'rgba(255,170,40,0.95)' : 'rgba(255,90,40,0.9)', r:3+Math.random()*2 });
  }

  const dropThrough = G.crouchHeld && a.onGround;
  if (water) {

    if (holding || G.flyThrust) a.vy -= 1150 * dt;
    a.vy += GRAV * 0.16 * dt;
    a.vy *= 0.96;
    a.vy = clamp(a.vy, -250, 230);
    moveActor(a, dt, { gravMul: 0, dropThrough });
    if (Math.random() < 0.22) G.parts.push({ x: a.x + a.w/2 + (Math.random()-0.5)*22, y: a.y + 8, vx:(Math.random()-0.5)*18, vy:-55-Math.random()*45, life:0.85, max:0.85, c:'rgba(190,235,255,0.55)', r:2+Math.random()*3 });
  } else {
    const gravMul = jetting ? 0.5 : (holding && a.vy < 0 ? 0.5 : 1);
    moveActor(a, dt, { gravMul, dropThrough });
  }

  if (a.throwCD > 0) a.throwCD -= dt;
  if (a.throwT > 0) a.throwT -= dt;
  if (a.slapT > 0) a.slapT -= dt;
  if (a.slapCD > 0) a.slapCD -= dt;

  if (Input.slapQueued) {
    Input.slapQueued = false;
    if ((a.slapCD || 0) <= 0 && G.char.canSlap) {
      doSlap(a);
      a.slapCD = 0.28; a.slapT = 0.2;
      Audio.sfx('stomp');
    }
  }

  if (Input.attackQueued) {
    Input.attackQueued = false;
    if ((a.throwCD || 0) <= 0 && G.ammo > 0) {
      throwShot(a);
      G.ammo--; updateAmmoHUD();
      a.throwCD = 0.3; a.throwT = 0.2;
      a.shootFlip = !a.shootFlip;
      Audio.sfx('power');
    } else if (G.ammo <= 0) {
      toast('Out of bullets! Slap (Y) or find more ammo');
    }
  }

  a.animT += dt;
  if (a.kind === 'dog') {
    if (!a.onGround) a.dogKey = 'jump';
    else if (Math.abs(a.vx) > 200) a.dogKey = 'leap';
    else if (Math.abs(a.vx) > 25) a.dogKey = 'walk';
    else a.dogKey = 'idle';
  } else if (ch.single) {

    const down = G.crouchHeld;
    const spd = Math.abs(a.vx);
    if (a.slapT > 0 && ch.imgSlap) a.frameKey = 'slap';
    else if (a.throwT > 0 && ch.imgThrow) a.frameKey = 'throw';
    else if (!a.onGround) a.frameKey = 'jump';
    else if (down && ch.imgCrouch) a.frameKey = 'crouch';
    else if (spd > 250 && ch.runImgs) a.frameKey = 'run';
    else if (spd > 25) a.frameKey = 'walk';
    else a.frameKey = 'idle';
    a.glitchFX = ch.glitch && Math.random() < 0.18 ? (Math.random() - 0.5) * 12 : 0;
  } else {

    if (a.throwT > 0 && ch.throw !== undefined) a.frame = ch.throw;
    else if (!a.onGround) a.frame = ch.jump;
    else if (G.crouchHeld && ch.crouch !== undefined) a.frame = ch.crouch;
    else if (Math.abs(a.vx) > 25) a.frame = ch.walk[Math.floor(a.animT * 7) % ch.walk.length];
    else a.frame = ch.idle;
  }
}

function doSlap(a) {
  const dir = a.facing >= 0 ? 1 : -1;
  const reach = 150, cx0 = a.x + a.w/2 + dir * 60, cy0 = a.y + a.h * 0.5;
  // record slap so we can draw the stretched-arm whoosh
  G.slapFX = { x: a.x + a.w/2, y: cy0, dir, reach, t: 0 };
  // impact bursts along the whole reach
  spawnHit(a.x + a.w/2 + dir * reach, cy0, 100);
  for (let i = 0; i < 14; i++) {
    const along = Math.random();
    G.parts.push({ x: a.x + a.w/2 + dir * reach * along, y: cy0 + (Math.random()-0.5)*30, vx: dir*(140+Math.random()*260), vy: (Math.random()-0.5)*180, life: 0.28, c: '#ffe28a', r: 2+Math.random()*3 });
  }
  // hit enemies in front
  for (const e of G.enemies) {
    if (e.dead) continue;
    const ex = e.x + e.w/2, ey = e.y + e.h/2;
    if (Math.abs(ex - cx0) < reach && Math.abs(ey - cy0) < 70 && Math.sign(ex - (a.x+a.w/2)) === dir) {
      const tp = enemyById(e.id);
      e.hp = (e.hp || 1) - 2;
      e.flashT = 0.2; e.vx = dir * 320; e.vy = -180;
      spawnHit(ex, ey, e.w * 1.4);
      G.shakeT = 0.18; G.hitPause = 0.04;
      if (e.hp <= 0) { e.dead = true; burst(ex, ey, tp.c || '#fff'); G.coinsRun += 2; Save.data.coins += 2; Save.write(); }
    }
  }
  // slap the boss
  const b = G.boss;
  if (b && !b.dead && G.world.isBoss) {
    const bx = b.x + b.w/2;
    if (Math.abs(bx - cx0) < reach + 20 && Math.sign(bx - (a.x+a.w/2)) === dir) {
      b.hp--; b.flashT = 0.2; spawnHit(bx, b.y + b.h/2, b.w*1.1); G.shakeT = 0.2;
      if (b.hp <= 0) defeatBoss(b);
    }
  }
  // deflect enemy bullets
  for (const s of G.shots) {
    if (s.friendly || s.gone) continue;
    if (Math.abs(s.x - cx0) < reach && Math.abs(s.y - cy0) < 60) {
      s.vx = Math.abs(s.vx) * dir * 1.2; s.friendly = true; s.hue = '#ffd24a';
      spawnHit(s.x, s.y, 50);
    }
  }
}

function throwShot(a) {
  const dir = a.facing >= 0 ? 1 : -1;
  const kind = (G.char && G.char.shotKind) || 'bullet';
  if (kind === 'beam') {

    G.shots.push({
      x: a.x + a.w/2 + dir * 22, y: a.y + a.h * 0.42,
      vx: dir * 760, vy: -30, r: 14, rot: 0, life: 1.4, friendly: true,
      kind: 'beam', hue: '#c060ff'
    });
  } else if (kind === 'bullet') {

    const mx = a.x + a.w/2 + dir * 44, my = a.y + a.h * 0.42;
    G.shots.push({
      x: mx, y: my,
      vx: dir * 920, vy: 0, r: 6, rot: 0, life: 1.0, friendly: true, dmg: 1,
      kind: 'bullet', hue: '#ffd24a'
    });

    const fimg = IMG['muzzleflash'];
    G.muzzle = { x: mx, y: my, dir, t: 0 };
    for (let i=0;i<4;i++) G.parts.push({ x: mx, y: my, vx: dir*(220+Math.random()*200), vy:(Math.random()-0.5)*70, life:0.12, c:'#fff2b0', r:2 });
  } else if (kind === 'laser') {

    G.shots.push({
      x: a.x + a.w/2 + dir * 26, y: a.y + a.h * 0.42,
      vx: dir * 1000, vy: 0, r: 13, rot: 0, life: 1.1, friendly: true,
      kind: 'laser', dmg: 3, hue: '#ff3b3b'
    });
  } else {
    G.shots.push({
      x: a.x + a.w/2 + dir * 18, y: a.y + a.h * 0.5,
      vx: dir * 600, vy: -70, r: 12, rot: 0, life: 1.6, friendly: true,
      kind: 'bullet', hue: ['#ff5fa2', '#ff8a3d', '#7c5cff', '#36d39a'][Math.floor(Math.random()*4)]
    });
  }
}

function throwKai(a) {
  const dir = a.facing >= 0 ? 1 : -1;
  G.shots.push({
    x: a.x + a.w/2 + dir * 24, y: a.y + a.h * 0.45,
    vx: dir * 920, vy: 0, r: 16, rot: 0, life: 1.3, friendly: true,
    kind: 'laser', dmg: 3, hue: '#ff3b3b'
  });
}


function updateCompanion(a, leader, dt) {

  const targetX = leader.x - leader.facing * 85;
  const dx = targetX - a.x;
  const speed = a.kind === 'dog' ? 370 : 330;
  if (a.waiting) { a.vx = 0; }
  else if (Math.abs(dx) > 26) { a.vx = clamp(dx * 3, -speed, speed); a.facing = dx > 0 ? 1 : -1; }
  else a.vx = 0;

  a.blockedX = false;
  const wasX = a.x;
  const water = !!(G.world.theme && G.world.theme.water);
  if (water) {
    a.vy += GRAV * 0.16 * dt; a.vy *= 0.96; a.vy = clamp(a.vy, -250, 230);
    moveActor(a, dt, { gravMul: 0 });
  } else {
    moveActor(a, dt);
  }
  if (a.onGround && !a.waiting) {
    const blocked = Math.abs(a.x - wasX) < 1 && Math.abs(a.vx) > 50;
    if (blocked || (leader.y < a.y - 90 && Math.abs(dx) < 240)) a.vy = a.kind === 'dog' ? (water ? -360 : -740) : -780;
  }

  if (Math.abs(leader.x - a.x) > viewW * 0.9 && !gateBetween(a.x, leader.x)) {
    a.x = leader.x - leader.facing * 90; a.y = leader.y - 40; a.vy = 0;
  }
  a.waiting = gateBetween(a.x, leader.x);

  a.animT += dt;
  if (a.kind === 'dog') {
    if (!a.onGround) a.dogKey = 'jump';
    else if (Math.abs(a.vx) > 200) a.dogKey = 'leap';
    else if (Math.abs(a.vx) > 30) a.dogKey = 'walk';
    else a.dogKey = 'idle';
  } else {
    const ch = G.char;
    if (ch.single) {
      if (!a.onGround) a.frameKey = 'jump';
      else if (Math.abs(a.vx) > 30) a.frameKey = 'walk';
      else a.frameKey = 'idle';
    } else {
      if (!a.onGround) a.frame = ch.jump;
      else if (Math.abs(a.vx) > 30) a.frame = ch.walk[Math.floor(a.animT*7)%ch.walk.length];
      else a.frame = ch.idle;
    }
  }
}

function gateBetween(x1, x2) {
  for (const g of G.world.gates) if (!g.open) {
    if ((x1 - g.x) * (x2 - g.x) < 0) return true;
  }
  return false;
}

function updateEnemy(e, dt) {
  if (e.dead) { e.deadT += dt; return; }
  e.t += dt;
  const tp = e.type;
  const target = activeActor();
  const distX = target.x - e.x, dist = Math.hypot(distX, target.y - e.y);

  switch (tp.behavior) {
    case 'walk':
      e.vy += GRAV * dt; e.x += e.vx * dt; e.y += e.vy * dt;
      groundClampEnemy(e);
      if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
      if (e.x > e.maxX - e.w) { e.x = e.maxX - e.w; e.vx = -Math.abs(e.vx); }
      e.facing = e.vx >= 0 ? 1 : -1;
      break;
    case 'hop':
      e.vy += GRAV * dt; e.y += e.vy * dt;
      if (groundClampEnemy(e)) { e.vy = -560; e.vx = (Math.random() < 0.5 ? -1 : 1) * tp.speed * (Math.abs(distX) < 400 ? Math.sign(distX) || 1 : 1); }
      e.x += e.vx * dt;
      e.x = clamp(e.x, e.minX, e.maxX - e.w);
      e.facing = e.vx >= 0 ? 1 : -1;
      break;
    case 'fly':
      e.x += Math.cos(e.t * 1.4) * tp.speed * dt * 2;
      e.y = e.baseY - 120 + Math.sin(e.t * 2.2) * 70;
      break;
    case 'rain':
      e.x += Math.cos(e.t * 1.2) * tp.speed * dt * 2;
      e.y = e.baseY - 150 + Math.sin(e.t * 1.8) * 50;
      e.facing = Math.cos(e.t * 1.2) >= 0 ? 1 : -1;
      e.shotT -= dt;
      if (e.shotT <= 0 && Math.abs(distX) < 520) {
        e.shotT = 1.8 + Math.random();
        G.shots.push({ x: e.x + e.w/2, y: e.y + e.h, vx: 0, vy: 140, r: 8, c: '#4fc3f7', from: 'enemy' });
      }
      break;
    case 'spit':
      e.shotT -= dt;
      e.facing = distX > 0 ? 1 : -1;
      if (e.shotT <= 0 && Math.abs(distX) < 620 && Math.abs(target.y - e.y) < 220) {
        e.shotT = 2.2;
        G.shots.push({ x: e.x + e.w/2, y: e.y + 14, vx: Math.sign(distX) * 320, vy: -60, r: 10, c: '#b0bec5', from: 'enemy' });
      }
      break;
    case 'chase':
      if (dist < 520) { e.x += Math.sign(distX) * tp.speed * dt; e.y += Math.sign(target.y - e.y) * 40 * dt; }
      e.y += Math.sin(e.t * 3) * 18 * dt;
      e.facing = distX >= 0 ? 1 : -1;
      break;
    case 'charge':
      e.vy += GRAV * dt; e.y += e.vy * dt; groundClampEnemy(e);
      if (e.charging) { e.x += e.vx * dt; e.facing = e.vx >= 0 ? 1 : -1; if (e.x < e.minX || e.x > e.maxX - e.w) e.charging = false; }
      else if (Math.abs(distX) < 420 && Math.abs(target.y - e.y) < 120) { e.charging = true; e.vx = Math.sign(distX) * 360; }
      else e.facing = distX >= 0 ? 1 : -1;
      break;
    case 'bob':
      e.y = e.baseY - 80 + Math.sin(e.t * 1.8) * 90;
      e.facing = distX >= 0 ? 1 : -1;
      break;
    case 'rival': {
      e.vy += GRAV * dt; e.y += e.vy * dt;
      const landed = groundClampEnemy(e);
      e.facing = distX > 0 ? 1 : -1;
      e.x += Math.sign(distX) * tp.speed * dt * (Math.abs(distX) > 60 ? 1 : 0);
      if (landed && Math.abs(distX) < 360 && Math.random() < 0.02) e.vy = -760;
      e.x = clamp(e.x, e.minX, e.maxX);
      break;
    }
  }
  if (e.flashT > 0) e.flashT -= dt;

  for (const a of [G.player, G.dog]) {
    if (!a || a.invuln > 0) continue;
    if (!overlap(a, e)) continue;
    const stomp = a.vy > 120 && a.y + a.h - e.y < 38;
    if (stomp && !tp.noStomp) {
      a.vy = -600;
      a.squashT = 0.14;
      e.hp--;
      e.flashT = 0.15; e.squashT = 0.18; spawnHit(e.x+e.w/2, e.y+e.h/2, e.w*1.6);
      G.hitPause = 0.05;
      if (e.hp <= 0) { e.dead = true; burst(e.x + e.w/2, e.y, tp.c || '#fff'); dust(e.x + e.w/2, e.y + e.h, 6); G.coinsRun += 2; Save.data.coins += 2; Save.write(); G.shakeT = 0.12; Audio.sfx('stomp'); }
      else { G.shakeT = 0.1; Audio.sfx('stomp'); }
    } else if (a === activeActor() || a.kind === 'dog') {
      hurt(e);
    }
  }
}

function groundClampEnemy(e) {
  const gy = groundFind(G.world.plats, e.x + e.w / 2);

  let floor = gy;
  for (const p of G.world.plats) {
    if (!p.oneWay && !p.ground) {
      if (e.x + e.w/2 >= p.x && e.x + e.w/2 <= p.x + p.w && p.y >= e.y + e.h - 30) floor = Math.min(floor, p.y);
    }
    if (p.oneWay && e.x + e.w/2 >= p.x && e.x + e.w/2 <= p.x + p.w && Math.abs(e.baseY + e.h - p.y) < 40) floor = Math.min(floor, p.y);
  }
  if (e.y + e.h >= floor) { e.y = floor - e.h; e.vy = 0; return true; }
  return false;
}

function updateBoss(b, dt) {
  if (!b || b.dead) return;
  b.t += dt; b.anim += dt; b.phaseT -= dt;
  if (b.flashT > 0) b.flashT -= dt;
  const beast = b.stage >= 3;
  const target = activeActor();
  const distX = target.x - b.x;
  b.facing = distX > 0 ? 1 : -1;
  b.vy += GRAV * dt;

  if (b.phase === 'walk') {
    const sp = b.stage === 5 ? 230 : (60 + b.stage * 28);
    b.x += Math.sign(distX) * sp * dt;
    b.y = Math.min(b.y + b.vy * dt, groundFind(G.world.plats, b.x + b.w/2) - b.h);
    if (b.y >= groundFind(G.world.plats, b.x + b.w/2) - b.h) b.vy = 0;
    if (b.phaseT <= 0) {

      if (beast && Math.random() < (b.stage === 5 ? 0.6 : 0.5)) { b.phase = 'leap'; b.phaseT = 1.1; b.vy = b.stage === 5 ? -880 : -780; b.act = 'slam'; }
      else { b.phase = 'throw'; b.phaseT = b.stage === 5 ? 0.5 : 0.7; b.act = 'throw'; b.shotDone = false; }
    }
  } else if (b.phase === 'throw') {
    if (!b.shotDone && b.phaseT < (b.stage === 5 ? 0.3 : 0.4)) {
      b.shotDone = true;

      const n = b.stage === 5 ? 3 : (b.stage >= 2 ? 2 : 1);
      for (let i = 0; i < n; i++)
        G.shots.push({ x: b.x + b.w/2, y: b.y + b.h*0.3, vx: b.facing * (300 + i*70), vy: -180 - i*60, r: b.stage === 5 ? 18 : 15, c: '#8d5a2b', from:'enemy', log:true, rot:0, t2:0 });
    }
    if (b.phaseT <= 0) { b.phase = 'walk'; b.phaseT = (b.stage === 5 ? 0.8 : 1.2) + Math.random(); b.act = null; }
  } else if (b.phase === 'leap') {
    b.x += Math.sign(distX) * 180 * dt;
    b.y += b.vy * dt;
    const gy = groundFind(G.world.plats, b.x + b.w/2) - b.h;
    if (b.vy > 0 && b.y >= gy) {

      b.y = gy; b.vy = 0; b.phase = 'walk'; b.phaseT = 1.0 + Math.random(); b.act = null;
      G.shakeT = 0.35;
      for (let i = 0; i < 16; i++) burst(b.x + b.w/2 + (Math.random()-0.5)*b.w, b.y + b.h, '#9e7b4f');

      for (const a of [G.player, G.dog]) {
        if (a && a.invuln <= 0 && a.onGround && Math.abs((a.x+a.w/2)-(b.x+b.w/2)) < 220) hurt({x:a.x,y:a.y,w:0,h:0});
      }
    }
  }
  b.x = clamp(b.x, b.minX, b.maxX);

  for (const a of [G.player, G.dog]) {
    if (!a || a.invuln > 0 || !overlap(a, b)) continue;
    const stomp = a.vy > 120 && a.y + a.h - b.y < 46;
    if (stomp) {
      a.vy = -620; b.hp--; b.flashT = 0.2; spawnHit(b.x+b.w/2, b.y+b.h/2, b.w*1.2); G.shakeT = 0.2; Audio.sfx('stomp');
      burst(b.x + b.w/2, b.y, '#cdb38b');
      if (b.hp <= 0) defeatBoss(b);
    } else hurt(b);
  }
}

function defeatBoss(b) {

  if (b.canEnrage && !b.superDone) {
    b.stage = 5; b.superDone = true;
    b.hp = 16; b.maxHp = 16;
    b.w = 150; b.h = 150;
    b.y = groundFind(G.world.plats, b.x + b.w/2) - b.h;
    b.phase = 'walk'; b.phaseT = 1.0; b.act = null; b.flashT = 0.6;
    G.shakeT = 0.6;
    for (let i = 0; i < 40; i++) burst(b.x + Math.random()*b.w, b.y + Math.random()*b.h, ['#ffd54a','#fff176','#ffa000'][Math.floor(Math.random()*3)]);
    toast('⚡ BIG BABY CHIPS! He goes FULL RAGE! (16 HP)');
    Audio.sfx('power');
    return;
  }
  b.dead = true;
  G.world.portal.open = true;
  const burstHue = b.stage === 5 ? '#ffe082' : '#ffd54a';
  for (let i = 0; i < 30; i++) burst(b.x + Math.random()*b.w, b.y + Math.random()*b.h, burstHue);
  toast((b.name || 'BOSS') + ' is down!');
  const reward = b.stage === 5 ? 120 : 50;
  G.coinsRun += reward; Save.data.coins += reward; Save.write(); Audio.sfx('win');
}

function drawCandy(x, y, r, rot, hue) {
  hue = hue || '#ff5fa2';
  cx.save();
  cx.translate(x, y); cx.rotate(rot || 0);

  cx.fillStyle = hue;
  cx.beginPath(); cx.moveTo(-r*1.4, 0); cx.lineTo(-r*0.7, -r*0.55); cx.lineTo(-r*0.7, r*0.55); cx.closePath(); cx.fill();
  cx.beginPath(); cx.moveTo(r*1.4, 0); cx.lineTo(r*0.7, -r*0.55); cx.lineTo(r*0.7, r*0.55); cx.closePath(); cx.fill();

  cx.beginPath(); cx.ellipse(0, 0, r, r*0.82, 0, 0, 7); cx.fill();

  cx.fillStyle = 'rgba(255,255,255,0.55)';
  cx.beginPath(); cx.ellipse(-r*0.28, -r*0.28, r*0.32, r*0.2, -0.6, 0, 7); cx.fill();
  cx.restore();
}

function drawBullet(x, y, r, rot, hue) {
  hue = hue || '#e8b73a';
  cx.save();
  cx.translate(x, y); cx.rotate(rot || 0);
  const L = r * 2.4, H = r * 1.15;

  cx.fillStyle = hue;
  roundRect(-L / 2, -H / 2, L * 0.6, H, H * 0.32); cx.fill();

  cx.fillStyle = '#a9801a'; cx.fillRect(-L / 2, -H / 2, H * 0.2, H);

  cx.fillStyle = '#c07a32';
  cx.beginPath(); cx.moveTo(L * 0.1, -H / 2); cx.lineTo(L / 2, 0); cx.lineTo(L * 0.1, H / 2); cx.closePath(); cx.fill();

  cx.fillStyle = 'rgba(255,255,255,.5)'; cx.fillRect(-L * 0.3, -H * 0.32, L * 0.34, H * 0.18);
  cx.restore();
}

function burst(x, y, c) {
  for (let i = 0; i < 10; i++) {
    G.parts.push({ x, y, vx: (Math.random()-0.5)*420, vy: -Math.random()*420, life: 0.5 + Math.random()*0.3, c });
  }
}

function spawnHit(x, y, size) {
  G.hitEffects.push({ x, y, size: (size || 80) * 1.5, t: 0, dur: 0.55 });
}

function updateHitEffects(dt) {
  for (let i = G.hitEffects.length - 1; i >= 0; i--) {
    G.hitEffects[i].t += dt;
    if (G.hitEffects[i].t >= G.hitEffects[i].dur) G.hitEffects.splice(i, 1);
  }
}

function drawHitEffects() {
  for (const h of G.hitEffects) {
    const frame = Math.min(5, Math.floor(h.t / h.dur * 6));
    const img = IMG['hit' + (frame + 1)];
    if (img && img.width) {
      const s = h.size * (0.6 + h.t / h.dur * 0.6);
      const ar = img.width / img.height;
      cx.save();
      cx.globalAlpha = 1 - (h.t / h.dur) * 0.4;
      cx.drawImage(img, h.x - s*ar/2, h.y - s/2, s*ar, s);
      cx.restore();
    }
  }
}

function updateWorldBits(dt) {

  for (const s of G.shots) {
    if (s.life !== undefined) { s.life -= dt; if (s.life <= 0) s.gone = true; }
    s.vy += (s.kind === 'bullet' ? 0 : (s.friendly ? 60 : 600)) * dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.friendly) {
      s.rot += dt * 14;
      const dmg = s.dmg || 1;
      const m = s.r;

      for (const e of G.enemies) {
        if (e.dead) continue;
        if (s.x > e.x - m && s.x < e.x + e.w + m && s.y > e.y - m && s.y < e.y + e.h + m) {
          e.hp = (e.hp || 1) - dmg; e.flashT = 0.15; spawnHit(e.x+e.w/2, e.y+e.h/2, e.w*1.2); s.gone = true;
          burst(s.x, s.y, s.hue);
          if (e.hp <= 0) { e.dead = true; burst(e.x+e.w/2, e.y, '#fff'); G.coinsRun += 1; Save.data.coins += 1; Save.write(); }
          Audio.sfx('stomp');
          break;
        }
      }

      const bz = G.boss;
      if (!s.gone && bz && !bz.dead && s.x > bz.x - m && s.x < bz.x + bz.w + m && s.y > bz.y - m && s.y < bz.y + bz.h + m) {
        bz.hp -= dmg; bz.flashT = 0.2; spawnHit(s.x, s.y, 90); s.gone = true; G.shakeT = 0.12; burst(s.x, s.y, s.hue); Audio.sfx('stomp');
        if (bz.hp <= 0) { if (bz.isBoss) defeatBoss(bz); else { bz.dead = true; G.world.portal.open = true; } }
      }

      const gy = groundFind(G.world.plats, s.x);
      if (!s.gone && (s.y > gy || s.x < -50 || s.x > G.world.len + 80)) { burst(s.x, s.y, s.hue); s.gone = true; }
    } else {
      if (s.log) { s.rot = (s.rot || 0) + dt * 9 * (s.vx < 0 ? -1 : 1); s.t2 = (s.t2 || 0) + dt; }
      for (const a of [G.player, G.dog]) {
        if (a && a.invuln <= 0 && s.x > a.x && s.x < a.x + a.w && s.y > a.y && s.y < a.y + a.h) { hurt({x:s.x,y:s.y,w:0,h:0}); s.gone = true; }
      }
      if (s.y > VIEW_H + 200) s.gone = true;
    }
  }
  G.shots = G.shots.filter(s => !s.gone);

  for (const p of G.parts) { p.vy += 900*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt; }
  G.parts = G.parts.filter(p => p.life > 0);

  const magnet = Save.data.items.magnet;
  for (const c of G.world.coins) {
    if (c.got) continue;
    c.t += dt;
    for (const a of [G.player, G.dog]) {
      if (!a) continue;
      const dx = a.x + a.w/2 - c.x, dy = a.y + a.h/2 - c.y;
      const d = Math.hypot(dx, dy);
      if (magnet && d < 190) { c.x += dx/d * 480 * dt; c.y += dy/d * 480 * dt; }
      if (d < 46) { c.got = true; G.coinsRun++; Save.data.coins++; Save.write(); updateCoinHUD(); burst(c.x, c.y, '#ffd54a'); Audio.sfx('coin'); break; }
    }
  }

  for (const c of G.world.candies) {
    if (c.got) continue;
    c.t += dt;
    for (const a of [G.player, G.dog]) {
      if (!a) continue;
      const dx = a.x + a.w/2 - c.x, dy = a.y + a.h/2 - c.y;
      const d = Math.hypot(dx, dy);
      if (d < 46) { c.got = true; G.ammo += 3; G.ammoRun += 3; updateAmmoHUD(); burst(c.x, c.y, c.hue || '#ff5fa2'); Audio.sfx('coin'); break; }
    }
  }

  for (const g of G.world.gates) if (g.open && (g.openT || 0) < 1) g.openT = (g.openT || 0) + dt;

  for (const pl of G.world.plates) {
    const gy = groundFind(G.world.plats, pl.x);
    const zone = { x: pl.x - 30, y: gy - 30, w: 90, h: 34 };
    pl.pressed = [G.player, G.dog].some(a => a && overlap(a, zone));
    const gate = G.world.gates.find(g => g.id === pl.opens);
    if (gate && pl.pressed && !gate.open) { gate.open = true; toast(pl.crawl ? 'Good dog! The door opens! 🐶🚪' : 'Gate opened! 🐾'); burst(gate.x, gy - 100, '#80cbc4'); Audio.sfx('save'); }
  }

  for (const lv of G.world.levers) {
    if (lv.pulled) continue;
    const zone = { x: lv.x - 26, y: lv.y - 70, w: 70, h: 74 };
    if ([G.player, G.dog].some(a => a && overlap(a, zone))) {
      lv.pulled = true;
      const gate = G.world.gates.find(g => g.id === lv.opens);
      if (gate) { gate.open = true; toast('Lever pulled — gate opened!'); }
    }
  }

  for (const cp of G.world.checkpoints) {
    const gy = groundFind(G.world.plats, cp.x);
    const zone = { x: cp.x - 40, y: gy - 160, w: 110, h: 170 };
    if (!cp.hit && overlap(G.player, zone)) {
      cp.hit = true;
      G.checkpointX = cp.x; G.checkpointY = gy - 90;
      G.hearts = G.maxHearts;
      toast('💾 Checkpoint reached — progress saved!'); Audio.sfx('save');
      burst(cp.x, gy - 120, '#ffd54a');
      Save.write();
    }
  }

  for (const a of [G.player, G.dog]) {
    if (a && a.y > VIEW_H + 260) {
      if (a === activeActor() && !G.char.invincible) { G.hearts--; G.shakeT = 0.3; spawnHit(a.x+a.w/2, a.y+a.h/2, 100); if (G.hearts <= 0) { respawn(); toast('Back to the checkpoint!'); return; } }
      a.x = G.checkpointX + (a.kind === 'dog' ? -70 : 0); a.y = G.checkpointY; a.vx = a.vy = 0; a.invuln = 1.2;
    }
  }

  const po = G.world.portal;
  if (po.open) {
    const gy = groundFind(G.world.plats, po.x);
    const zone = { x: po.x - 40, y: gy - 170, w: 120, h: 180 };
    if (overlap(G.player, zone)) levelComplete();
  }

  if (G.world.isMini && G.boss && G.boss.dead && !G.world.portal.open) {
    G.world.portal.open = true;
    toast('Rival defeated! The portal is open!');
  }
}

function levelComplete() {
  if (G.mode !== 'playing') return;
  G.mode = 'win';

  if (window.Android && window.Android.showGameCompletionAd) {
    try { window.Android.showGameCompletionAd(); } catch(e) {}
  }
  if (G.level >= Save.data.unlocked && G.level < LAST_LEVEL) Save.data.unlocked = G.level + 1;
  if (DEV_UNLOCK_ALL) Save.data.unlocked = Math.max(Save.data.unlocked, LAST_LEVEL);
  Save.data.best[G.level] = Math.max(Save.data.best[G.level] || 0, G.coinsRun);
  Save.write();
  Audio.stopMusic(); Audio.sfx('win');
  document.getElementById('btnSwitch').style.display = 'none';
  document.getElementById('btnPause').style.display = 'none';
  document.getElementById('btnMute').style.display = 'none';
  document.getElementById('hint').style.display = 'none';
  if (G.level === LAST_LEVEL) {
    Save.data.gameBeaten = true;
    Save.data.unlocked = LAST_LEVEL;
    Save.write();
    document.getElementById('endExtra').style.display = 'none';
    showScreen('scrEnd');
  }
  else {
    document.getElementById('winStats').textContent = '🪙 ' + G.coinsRun + ' coins collected  •  Total: ' + Save.data.coins;
    const wl = document.getElementById('btnWinLevels'); if (wl) wl.textContent = Save.data.gameBeaten ? 'LEVEL SELECT' : 'QUIT TO MENU';
    showScreen('scrWin');
  }
}

let lastT = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min((now - lastT) / 1000, 0.04);
  lastT = now;
  if (G.mode === 'playing') {
    pollInput();

    if (G.hitPause > 0) { G.hitPause -= dt; render(); return; }
    G.t += dt;
    const lead = activeActor();
    const follow = lead === G.player ? G.dog : G.player;
    if (G.player.invuln > 0) G.player.invuln -= dt;
    if (G.dog && G.dog.invuln > 0) G.dog.invuln -= dt;
    updatePlayerControlled(lead, dt);
    if (follow) updateCompanion(follow, lead, dt);
    for (const e of G.enemies) if (Math.abs(e.x - lead.x) < viewW * 1.2) updateEnemy(e, dt);
    if (G.world.isMini && G.boss) updateEnemy(G.boss, dt);
    if (G.world.isBoss) updateBoss(G.boss, dt);
    updateWorldBits(dt);
    updateHitEffects(dt);

    const targetCam = lead.x + lead.w/2 - viewW * 0.42;
    G.cam.x += (targetCam - G.cam.x) * Math.min(1, dt * 6);
    G.cam.x = clamp(G.cam.x, -160, G.world.len + 520 - viewW);
    const groundY = groundFind(G.world.plats, lead.x + lead.w/2);
    const camYTarget = clamp((lead.y + lead.h) - groundY, -230, 60) * 0.55;
    G.cam.y += (camYTarget - G.cam.y) * Math.min(1, dt * 4);
    if (G.shakeT > 0) G.shakeT -= dt;
  }
  render();
}

function render() {
  cx.setTransform(scale, 0, 0, scale, 0, 0);
  cx.clearRect(0, 0, viewW, VIEW_H);
  if (!assetsReady) return;

  if (G.mode === 'title' || G.mode === 'levels' || G.mode === 'shop' || G.mode === 'select') { renderTitleBG(); return; }
  if (!G.world) return;

  const W = G.world, th = W.theme;
  const shake = G.shakeT > 0 ? (Math.random()-0.5) * 14 : 0;

  const bg = IMG[th.bg];
  if (bg && bg.width) {
    const bw = VIEW_H / bg.height * bg.width;
    let off = -((G.cam.x * 0.35) % bw);
    for (let x = off - bw; x < viewW + bw; x += bw) cx.drawImage(bg, x, 0, bw, VIEW_H);
  }

  if (th.water) {
    const wg = cx.createLinearGradient(0, 0, 0, VIEW_H);
    wg.addColorStop(0, 'rgba(20,120,160,0.18)'); wg.addColorStop(1, 'rgba(6,30,70,0.42)');
    cx.fillStyle = wg; cx.fillRect(0, 0, viewW, VIEW_H);
  }

  cx.save();
  cx.translate(-G.cam.x + shake, (G.cam.y || 0) + shake * 0.6);

  const gimg = IMG[th.ground];
  for (const p of W.plats) {
    if (p.x + p.w < G.cam.x - 100 || p.x > G.cam.x + viewW + 100) continue;
    if (p.oneWay) {

      const surfH = 56;
      cx.fillStyle = th.fill;
      roundRect(p.x + 4, p.y + 6, p.w - 8, surfH + 18, 10); cx.fill();
      drawGroundStrip(gimg, p.x, p.y, p.w, surfH);
    } else {
      const bottom = Math.max(p.y + p.h, VIEW_H + 200);
      const surfH = 78;

      cx.fillStyle = th.fill;
      cx.fillRect(p.x, p.y + surfH * 0.45, p.w, bottom - (p.y + surfH * 0.45));

      cx.fillStyle = 'rgba(0,0,0,.12)';
      cx.fillRect(p.x, p.y + surfH, p.w, bottom - (p.y + surfH));

      drawGroundStrip(gimg, p.x, p.y, p.w, surfH);
    }
  }

  for (const g of W.gates) {
    const gy = groundFind(W.plats, g.x);
    const H = 232;
    if (g.door) {

      const lift = (g.open ? Math.min(1, (g.openT || 0) / 0.5) : 0) * (H - 16);
      const dy = gy - H + lift;
      cx.save();

      cx.fillStyle = '#4e342e'; cx.fillRect(g.x - 8, gy - H, 8, H); cx.fillRect(g.x + g.w, gy - H, 8, H);
      cx.fillStyle = '#5d4037'; cx.fillRect(g.x - 10, gy - H - 8, g.w + 20, 12);
      if (lift < H - 18) {

        const grad = cx.createLinearGradient(g.x, 0, g.x + g.w, 0);
        grad.addColorStop(0, '#a1672f'); grad.addColorStop(0.5, '#c8853d'); grad.addColorStop(1, '#8a561f');
        cx.fillStyle = grad; cx.fillRect(g.x, dy, g.w, H);
        cx.strokeStyle = '#6d4422'; cx.lineWidth = 2;
        for (let px2 = g.x + 8; px2 < g.x + g.w; px2 += 12) { cx.beginPath(); cx.moveTo(px2, dy); cx.lineTo(px2, dy + H); cx.stroke(); }
        cx.fillStyle = '#5a5048'; cx.fillRect(g.x, dy + 26, g.w, 9); cx.fillRect(g.x, dy + H - 40, g.w, 9);
        cx.strokeStyle = '#3a332c'; cx.lineWidth = 3;
        cx.beginPath(); cx.arc(g.x + g.w/2, dy + H*0.5, 8, 0, 7); cx.stroke();
      }
      cx.restore();
    } else if (g.open) {
      cx.fillStyle = 'rgba(120,200,160,.35)'; cx.fillRect(g.x, gy - 240, g.w, 30);
    } else {
      const grad = cx.createLinearGradient(g.x, 0, g.x + g.w, 0);
      grad.addColorStop(0, '#90a4ae'); grad.addColorStop(1, '#546e7a');
      cx.fillStyle = grad; cx.fillRect(g.x, gy - 240, g.w, 240);
      cx.fillStyle = '#37474f';
      for (let yy = gy - 220; yy < gy; yy += 44) cx.fillRect(g.x + 4, yy, g.w - 8, 10);
    }
  }

  for (const pl of W.plates) {
    const gy = groundFind(W.plats, pl.x);
    if (pl.crawl && !pl.pressed) {

      cx.fillStyle = 'rgba(255,255,255,.9)'; cx.font = '900 15px sans-serif'; cx.textAlign = 'center';
      cx.fillText('🐶➜', pl.x + 15, gy - 64 + Math.sin(G.t*4)*3);
    }
    cx.fillStyle = pl.pressed ? '#80cbc4' : '#ef9a9a';
    roundRect(pl.x - 30, gy - (pl.pressed ? 8 : 16), 90, pl.pressed ? 8 : 16, 5); cx.fill();
    cx.fillStyle = '#fff'; cx.font = '900 17px sans-serif'; cx.textAlign = 'center';
    cx.fillText('🐾', pl.x + 15, gy - 24);
  }

  for (const lv of W.levers) {
    cx.strokeStyle = '#5d4037'; cx.lineWidth = 8; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(lv.x + 10, lv.y);
    cx.lineTo(lv.x + 10 + (lv.pulled ? 26 : -26), lv.y - 46); cx.stroke();
    cx.fillStyle = lv.pulled ? '#66bb6a' : '#ef5350';
    cx.beginPath(); cx.arc(lv.x + 10 + (lv.pulled ? 26 : -26), lv.y - 46, 12, 0, 7); cx.fill();
    cx.fillStyle = '#8d6e63'; roundRect(lv.x - 6, lv.y - 8, 34, 12, 4); cx.fill();
  }

  for (const c of W.coins) {
    if (c.got || c.x < G.cam.x - 60 || c.x > G.cam.x + viewW + 60) continue;
    const fi = 1 + (Math.floor(c.t * 7) % 4);
    const img = IMG['coin_spin' + fi] || IMG['coin'];
    const bob = Math.sin(c.t * 4 + G.t * 3) * 3;
    if (img && img.width) {
      const ih = 40, iw = ih * (img.width / img.height);
      cx.drawImage(img, c.x - iw/2, c.y - ih/2 + bob, iw, ih);
    } else {
      const s = 1 + Math.sin(c.t * 5 + G.t * 5) * 0.12;
      cx.fillStyle = '#ffca28'; cx.beginPath(); cx.ellipse(c.x, c.y, 15 * s, 17, 0, 0, 7); cx.fill();
    }
  }

  for (const c of W.candies) {
    if (c.got || c.x < G.cam.x - 60 || c.x > G.cam.x + viewW + 60) continue;
    { const bi=IMG['bullet']; if(bi&&bi.width){ const bh=28,bw=bh*(bi.width/bi.height); cx.save(); cx.translate(c.x,c.y+Math.sin(c.t*4+G.t*4)*3); cx.rotate(c.t*1.2); cx.drawImage(bi,-bw/2,-bh/2,bw,bh); cx.restore(); } }
  }

  for (const s of G.shots) {
    if (!s.friendly) continue;
    if (s.kind === 'kai' && IMG['kai1'] && IMG['kai1'].width) {

      const fi = 1 + (Math.floor(G.t * 18) % 5);
      const img = IMG['kai' + fi];
      if (img && img.width) {
        const h = s.r * 3.2, w = h * (img.width / img.height);
        cx.save();
        cx.translate(s.x, s.y);
        if (s.vx < 0) cx.scale(-1, 1);
        cx.drawImage(img, -w/2, -h/2, w, h);
        cx.restore();
      }
    } else if (s.kind === 'bullet') {
      const bimg = IMG['bullet'];
      if (bimg && bimg.width) {
        const bh = s.r * 1.4, bw = bh * (bimg.width / bimg.height);
        cx.save(); cx.translate(s.x, s.y);
        if (s.vx < 0) cx.scale(-1, 1);
        cx.drawImage(bimg, -bw * 0.3, -bh / 2, bw, bh);
        cx.restore();
      }
    } else if (s.kind === 'beam' || s.kind === 'kai' || s.kind === 'laser') {
      const core = s.kind === 'kai' ? '#fff7cc' : s.kind === 'bullet' ? '#fff2c0' : s.kind === 'laser' ? '#ffe0e0' : '#f3d9ff';
      const glow = s.hue;

      cx.save();
      const rg = cx.createRadialGradient(s.x, s.y, 1, s.x, s.y, s.r * 2.4);
      rg.addColorStop(0, glow);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      cx.globalAlpha = 0.85; cx.fillStyle = rg;
      cx.beginPath(); cx.arc(s.x, s.y, s.r * 2.4, 0, 7); cx.fill();

      const dir = s.vx >= 0 ? -1 : 1;
      cx.globalAlpha = 0.5; cx.fillStyle = glow;
      cx.beginPath(); cx.ellipse(s.x + dir * s.r * 1.4, s.y, s.r * 1.8, s.r * 0.6, 0, 0, 7); cx.fill();

      cx.globalAlpha = 1; cx.fillStyle = core;
      cx.beginPath(); cx.arc(s.x, s.y, s.r * 0.7, 0, 7); cx.fill();
      cx.restore();
    } else {
      drawCandy(s.x, s.y, s.r, s.rot, s.hue);
    }
  }

  for (const cp of W.checkpoints) {
    const gy = groundFind(W.plats, cp.x);

    let wkey = 'well1';
    if (cp.hit) wkey = (Math.floor(G.t * 3) % 2) ? 'well4' : 'well3';
    const wimg = IMG[wkey] || IMG['well1'];
    if (wimg && wimg.width) {
      const dh = 184, dw = dh * (wimg.width / wimg.height);
      cx.drawImage(wimg, cp.x + 50 - dw / 2, gy - dh + 14, dw, dh);
    } else {
      cx.fillStyle = cp.hit ? '#ffd54a' : '#8d8d8d';
      roundRect(cp.x + 30, gy - 70, 40, 70, 8); cx.fill();
    }
  }

  const po = W.portal;
  {
    const gy = groundFind(W.plats, po.x);
    const pkey = po.open ? 'portal3' : 'portal1';
    const pimg = IMG[pkey] || IMG['portal1'];
    if (pimg && pimg.width) {
      const dh = 200, dw = dh * (pimg.width / pimg.height);
      cx.save();
      if (!po.open) cx.globalAlpha = 0.6;
      cx.drawImage(pimg, po.x + 20 - dw/2, gy - dh + 10, dw, dh);
      if (po.open) {
        cx.globalAlpha = 0.3 + Math.sin(G.t * 3) * 0.15;
        const grd = cx.createRadialGradient(po.x+20, gy-dh*0.45, 10, po.x+20, gy-dh*0.45, dw*0.6);
        grd.addColorStop(0, 'rgba(255,200,60,.6)'); grd.addColorStop(1, 'rgba(255,160,0,0)');
        cx.fillStyle = grd;
        cx.beginPath(); cx.ellipse(po.x+20, gy-dh*0.45, dw*0.5, dh*0.4, 0, 0, 7); cx.fill();
      }
      cx.restore();
    }
  }

  for (const e of G.enemies) drawEnemy(e);
  if (G.boss && W.isMini) drawEnemy(G.boss);
  if (G.boss && W.isBoss) drawBoss(G.boss);
  drawHitEffects();

  if (G.slapFX) {
    G.slapFX.t += 1/60;
    const sf = G.slapFX;
    if (sf.t < 0.18) {
      const prog = sf.t / 0.18;
      cx.save();
      cx.globalAlpha = (1 - prog) * 0.8;
      cx.strokeStyle = '#fff2b0'; cx.lineWidth = 10 * (1 - prog * 0.5);
      cx.lineCap = 'round';
      cx.beginPath();
      cx.moveTo(sf.x + sf.dir * 30, sf.y);
      cx.lineTo(sf.x + sf.dir * sf.reach * (0.5 + prog * 0.5), sf.y - 8);
      cx.stroke();
      cx.globalAlpha = (1 - prog) * 0.5;
      cx.strokeStyle = '#ffaa28'; cx.lineWidth = 18 * (1 - prog * 0.5);
      cx.beginPath();
      cx.moveTo(sf.x + sf.dir * 30, sf.y + 4);
      cx.lineTo(sf.x + sf.dir * sf.reach * (0.4 + prog * 0.6), sf.y + 6);
      cx.stroke();
      cx.restore();
    } else { G.slapFX = null; }
  }

  if (G.muzzle) {
    G.muzzle.t += 1/60;
    const fimg = IMG['muzzleflash'];
    if (fimg && fimg.width && G.muzzle.t < 0.08) {
      const fh = 40, fw = fh * (fimg.width / fimg.height);
      cx.save();
      cx.translate(G.muzzle.x, G.muzzle.y);
      if (G.muzzle.dir < 0) cx.scale(-1, 1);
      cx.globalAlpha = 1 - G.muzzle.t / 0.08;
      cx.drawImage(fimg, 0, -fh/2, fw, fh);
      cx.restore();
    } else if (G.muzzle.t >= 0.08) { G.muzzle = null; }
  }

  for (const s of G.shots) {
    if (s.friendly) continue;
    if (s.log) {
      // boss projectile renders as a bullet (previously reused the boss body frames -> mini clones)
      const bimg = IMG['bullet'];
      if (bimg && bimg.width) {
        const bh = s.r * 2.0, bw = bh * (bimg.width / bimg.height);
        cx.save();
        cx.translate(s.x, s.y);
        cx.rotate((s.rot || 0));
        if (s.vx < 0) cx.scale(-1, 1);
        cx.drawImage(bimg, -bw/2, -bh/2, bw, bh);
        cx.restore();
      } else {
        cx.fillStyle = s.c; cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 7); cx.fill();
      }
    } else {
      cx.fillStyle = s.c;
      cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 7); cx.fill();
      if (s.glow) { cx.fillStyle = 'rgba(171,71,188,.35)'; cx.beginPath(); cx.arc(s.x, s.y, s.r*1.9, 0, 7); cx.fill(); }
    }
  }

  if (!G.dogCarried) drawActor(G.dog);
  drawActor(G.player);
  if (G.dog && G.dog.waiting && !G.dogCarried) {
    cx.fillStyle = '#fff'; cx.font = '900 22px sans-serif'; cx.textAlign = 'center';
    cx.fillText('💤', G.dog.x + G.dog.w/2, G.dog.y - 14);
  }

  for (const p of G.parts) {
    cx.globalAlpha = Math.max(0, p.life * 2);
    cx.fillStyle = p.c; cx.fillRect(p.x - 4, p.y - 4, 8, 8);
    cx.globalAlpha = 1;
  }

  cx.restore();

  renderHUD();
  renderTouchFeedback();
}

function renderTouchFeedback() {}

function drawActor(a) {
  if (!a) return;
  if (a.invuln > 0 && Math.floor(a.invuln * 12) % 2 === 0) cx.globalAlpha = 0.35;
  if (a.kind === 'dog') {
    const dk = a.dogKey || 'idle';
    let key = DOG_FRAMES.idle;
    if (dk === 'jump') key = DOG_FRAMES.jump;
    else if (dk === 'leap') key = DOG_FRAMES.leap;
    else if (dk === 'walk') key = DOG_FRAMES.walk[Math.floor(a.animT * 8) % DOG_FRAMES.walk.length];
    const img = IMG[key];
    const ref = IMG[DOG_FRAMES.idle];
    if (img && img.width && ref && ref.height) {
      const dh = DOG_FRAMES.spriteH * (img.height / ref.height);
      const dw = dh * (img.width / img.height);
      const cxp = a.x + a.w/2, cyp = a.y + a.h + 8;
      cx.save();
      cx.translate(cxp, cyp);
      if (a.facing < 0) cx.scale(-1, 1);
      cx.drawImage(img, -dw/2, -dh, dw, dh);
      cx.restore();
    }
  } else {
    const ch = G.char;
    const flip = a.facing !== ch.baseFacing;
    if (ch.single) {

      const fk = a.frameKey || 'idle';
      let key = ch.imgIdle;
      if (fk === 'fly' && ch.imgFly) key = ch.imgFly;
      else if (fk === 'run' && ch.runImgs) key = ch.runImgs[Math.floor(a.animT * 11) % ch.runImgs.length];
      else if (fk === 'walk') key = ch.walkImgs[Math.floor(a.animT * 8) % ch.walkImgs.length];
      else if (fk === 'jump' && ch.imgJump) key = ch.imgJump;
      else if (fk === 'crouch' && ch.imgCrouch) key = ch.imgCrouch;
      else if (fk === 'slap' && ch.imgSlap) key = (a.slapT > 0.1 ? ch.imgSlapReady : ch.imgSlap);
      else if (fk === 'throw' && ch.imgThrow) key = (a.shootFlip && ch.imgThrowAlt ? ch.imgThrowAlt : ch.imgThrow);
      else if (fk === 'cheer' && ch.imgCheer) key = ch.imgCheer;
      const img = IMG[key];
      const ref = IMG[ch.imgIdle];
      if (img && img.width && ref && ref.height) {

        if (G.goldT > 0 && ch.canFly) {
          cx.save();
          cx.globalAlpha = 0.55 * G.goldT;
          const grd = cx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, 6, a.x + a.w/2, a.y + a.h/2, a.w * 1.7);
          grd.addColorStop(0, 'rgba(255,238,120,.95)'); grd.addColorStop(1, 'rgba(255,200,0,0)');
          cx.fillStyle = grd;
          cx.beginPath(); cx.arc(a.x + a.w/2, a.y + a.h/2, a.w * 1.7, 0, 7); cx.fill();
          cx.restore();
        }
        const gx = a.glitchFX || 0;

        const sh = ch.spriteH || (a.h + 24);
        let dh = sh * (img.height / ref.height);
        let dw = dh * (img.width / img.height);

        if (a.squashT > 0) { const k = a.squashT / 0.16; dh *= (1 - 0.18 * k); dw *= (1 + 0.12 * k); }

        const isWalking = a.frameKey === 'walk' && a.onGround;
        const walkRate = 8;
        const walkPhase = a.animT * walkRate;
        const walkBob = isWalking ? -Math.abs(Math.sin(walkPhase * Math.PI)) * 8 : 0;
        const walkTilt = isWalking ? Math.sin(walkPhase * Math.PI) * 0.06 * (a.facing || 1) : 0;
        const cxp = a.x + a.w/2 + gx, cyp = a.y + a.h + 6 + walkBob;

        if (isWalking && Math.random() < 0.3) {
          G.parts.push({ x: a.x + a.w/2 + (Math.random()-0.5)*20, y: a.y + a.h + 4,
            vx: -a.vx * 0.08 + (Math.random()-0.5)*30, vy: -Math.random()*40,
            life: 0.25, c: 'rgba(180,160,120,0.5)', r: 2+Math.random()*2 });
        }

        if (ch.glitch && gx !== 0) {
          cx.save(); cx.globalAlpha = 0.3;
          cx.translate(cxp - gx*2.5, cyp); if (flip) cx.scale(-1,1);
          cx.drawImage(img, -dw/2, -dh, dw, dh); cx.restore();
        }
        cx.save();
        cx.translate(cxp, cyp);
        if (flip) cx.scale(-1, 1);
        if (walkTilt) cx.rotate(walkTilt);
        cx.drawImage(img, -dw/2, -dh, dw, dh);
        cx.restore();
      }
    } else {
      const gx = a.glitchFX || 0;
      drawFrame(ch.sheet, a.frame !== undefined ? a.frame : ch.idle, a.x - 10 + gx, a.y - 4, a.w + 20, a.h + 6, flip);

      if (ch.glitch && gx !== 0) {
        cx.save(); cx.globalAlpha = 0.3;
        drawFrame(ch.sheet, a.frame, a.x - 10 - gx*1.5, a.y - 4, a.w + 20, a.h + 6, flip);
        cx.restore();
      }
    }
  }
  cx.globalAlpha = 1;

}

function drawEnemy(e) {
  if (e.dead && e.deadT > 0.4) return;
  const tp = e.type;
  cx.save();
  if (e.dead) { cx.globalAlpha = 1 - e.deadT * 2.5; cx.translate(0, e.deadT * 90); }
  if (e.flashT > 0) cx.filter = 'brightness(2)';

  if (tp.sprite) {

    const fr = e.onGround === false ? 4 : [1,2][Math.floor(e.t*6)%2];
    drawFrame(tp.sprite, fr, e.x - 8, e.y - 6, e.w + 16, e.h + 8, e.facing > 0);

    for (let i = 0; i < e.hp; i++) { cx.fillStyle = '#ff5252'; cx.beginPath(); cx.arc(e.x + 12 + i*18, e.y - 16, 6, 0, 7); cx.fill(); }
  } else if (tp.img) {
    const im = IMG[tp.img];
    if (im && im.width) {

      let sxm = 1, sym = 1, rot = 0, alpha = 1, yoff = 0;
      switch (tp.behavior) {
        case 'walk':   rot = Math.sin(e.t * 9) * 0.12; yoff = -Math.abs(Math.sin(e.t * 9 * Math.PI)) * 6;
                       if (Math.random() < 0.2) G.parts.push({ x:e.x+e.w/2+(Math.random()-.5)*16, y:e.y+e.h+2, vx:(Math.random()-.5)*20, vy:-Math.random()*25, life:.2, c:'rgba(160,140,100,.4)', r:2 });
                       break;
        case 'hop':    { const k = clamp(-e.vy / 900, -0.25, 0.3); sym = 1 + k; sxm = 1 - k * 0.7; break; }
        case 'rain':   sym = 1 + Math.sin(e.t * 2.5) * 0.04; break;
        case 'spit':   sxm = 1 + (e.shotT < 0.25 ? (0.25 - e.shotT) : 0); rot = Math.sin(e.t * 3) * 0.03; break;
        case 'chase':  alpha = 0.82 + Math.sin(e.t * 5) * 0.14; sym = 1 + Math.sin(e.t * 4) * 0.05; break;
        case 'charge': rot = e.charging ? e.facing * 0.18 : Math.sin(e.t * 8) * 0.05; break;
        case 'bob':    sym = 1 + Math.sin(e.t * 3.5) * 0.08; sxm = 1 - Math.sin(e.t * 3.5) * 0.05; break;
      }
      const cxp = e.x + e.w / 2, cyp = e.y + e.h + yoff;
      cx.save();
      cx.globalAlpha *= alpha;
      cx.translate(cxp, cyp);
      cx.rotate(rot);
      if (e.facing !== (tp.baseFacing || 1)) cx.scale(-1, 1);

      const ar = im.width / im.height;
      let dw = e.w * 1.18, dh = dw / ar;
      if (dh < e.h * 1.05) { dh = e.h * 1.05; dw = dh * ar; }
      cx.drawImage(im, -dw / 2 * sxm, -dh * sym, dw * sxm, dh * sym);
      cx.restore();

      if (tp.hp === 2 && e.hp === 1) {
        cx.strokeStyle = 'rgba(40,40,40,.7)'; cx.lineWidth = 3;
        cx.beginPath(); cx.moveTo(e.x + 16, e.y + 8); cx.lineTo(e.x + e.w/2, e.y + e.h/2); cx.lineTo(e.x + e.w - 18, e.y + 14); cx.stroke();
      }

      if (e.isMini && e.maxHp > 1) {
        const bw = 280, bx = (viewW - bw)/2 + G.cam.x, by = 30;
        cx.fillStyle = 'rgba(0,0,0,.5)'; roundRect(bx, by, bw, 20, 10); cx.fill();
        cx.fillStyle = '#e53935'; roundRect(bx+3, by+3, (bw-6)*e.hp/e.maxHp, 14, 7); cx.fill();
        cx.fillStyle = '#fff'; cx.font = '900 13px sans-serif'; cx.textAlign = 'center';
        cx.fillText(tp.id.toUpperCase(), bx+bw/2, by+15);
      }
    }
  }
  cx.restore();
}

function drawBoss(b) {
  if (b.dead) return;
  cx.save();
  if (b.flashT > 0) cx.filter = 'brightness(1.8)';

  let n = 1, goldKey = null;
  const px = b.prefix || 'bchips_';
  if (b.stage === 5) {
    if (b.phase === 'leap') goldKey = px + 'gold5';
    else if (b.phase === 'throw') goldKey = (Math.floor(b.anim*8)%2 ? px+'gold3' : px+'gold2');
    else goldKey = (Math.floor(b.anim*7)%2 ? px+'gold4' : px+'gold1');
  } else if (b.phase === 'leap') {
    n = 5;
  } else if (b.phase === 'throw') {
    n = 8;
  } else if (b.phase === 'walk') {
    n = 2 + (Math.floor(b.anim * 7) % 3);
  } else {
    n = 1;
  }
  const img = IMG[goldKey || (px + n)] || IMG[px + '1'];
  if (img && img.width) {
    const ar = img.width / img.height;
    let dh = b.h + 30, dw = dh * ar;
    cx.translate(b.x + b.w/2, b.y + b.h + 6);
    if (b.facing < 0) cx.scale(-1, 1);
    if (b.stage === 5) {
      const pr = dw * (0.62 + Math.sin(G.t*8)*0.05);
      const ag = cx.createRadialGradient(0, -dh*0.5, 8, 0, -dh*0.5, pr);
      ag.addColorStop(0, 'rgba(255,224,130,0.55)'); ag.addColorStop(1, 'rgba(255,193,7,0)');
      cx.fillStyle = ag; cx.beginPath(); cx.arc(0, -dh*0.5, pr, 0, 7); cx.fill();
    }
    cx.drawImage(img, -dw/2, -dh, dw, dh);
  }
  cx.restore();

  const bw = 420, bx = (viewW - bw)/2 + G.cam.x, by = 26;
  cx.fillStyle = 'rgba(0,0,0,.5)'; roundRect(bx, by, bw, 22, 11); cx.fill();
  cx.fillStyle = b.stage === 5 ? '#ffc107' : '#a1672f'; roundRect(bx + 3, by + 3, (bw - 6) * Math.max(0,b.hp) / b.maxHp, 16, 8); cx.fill();
  cx.fillStyle = '#fff'; cx.font = '900 14px sans-serif'; cx.textAlign = 'center';
  const label = b.stage === 5 ? ('⚡ BIG BABY CHIPS ⚡') : (b.name || 'BOSS');
  cx.fillText(label, bx + bw/2, by + 16);
}

function renderHUD() {


  cx.textAlign = 'left';
  cx.font = '26px sans-serif';
  if (G.char.invincible) {
    cx.fillText('🛡️∞', 18, 40);
  } else {
    let hs = '';
    for (let i = 0; i < G.maxHearts; i++) hs += i < G.hearts ? '❤️' : '🖤';
    if (G.shieldUp) hs += ' 🛡️';
    cx.fillText(hs, 18, 40);
  }

  cx.font = '900 24px sans-serif';
  cx.fillStyle = '#ffd54a';
  cx.strokeStyle = 'rgba(0,0,0,.6)'; cx.lineWidth = 5;
  let coinX = 18;
  const coinIc = IMG['coin'];
  if (coinIc && coinIc.width) {
    const ich = 30, icw = ich * (coinIc.width / coinIc.height);
    cx.drawImage(coinIc, coinX, 52, icw, ich);
    coinX += icw + 6;
  }
  const ct = '' + Save.data.coins;
  cx.strokeText(ct, coinX, 76); cx.fillText(ct, coinX, 76);

  const cox = coinX + cx.measureText(ct).width + 30;
  if (G.char.invincible) {

    cx.save();
    const kg = cx.createRadialGradient(cox + 2, 68, 1, cox + 2, 68, 14);
    kg.addColorStop(0, '#fff7cc'); kg.addColorStop(0.6, '#ffd54a'); kg.addColorStop(1, 'rgba(255,213,74,0)');
    cx.fillStyle = kg; cx.beginPath(); cx.arc(cox + 2, 68, 14, 0, 7); cx.fill();
    cx.restore();
    cx.font = '900 24px sans-serif'; cx.fillStyle = '#ffe082';
    const kdt = '×∞';
    cx.strokeText(kdt, cox + 18, 76); cx.fillText(kdt, cox + 18, 76);
  } else {
    { const bi=IMG['bullet']; if(bi&&bi.width){ const bh=22,bw=bh*(bi.width/bi.height); cx.drawImage(bi,cox-2,58,bw,bh); } }
    cx.font = '900 24px sans-serif'; cx.fillStyle = '#ff8fc0';
    const cdt = '×' + G.ammo;
    cx.strokeText(cdt, cox + 18, 76); cx.fillText(cdt, cox + 18, 76);
  }

  cx.font = '800 16px sans-serif'; cx.fillStyle = 'rgba(255,255,255,.85)';
  cx.fillText('LV ' + G.level + ' • ' + G.world.theme.name, 18, 104);

  if (G.world.isBoss) {
    cx.font = '800 15px sans-serif'; cx.fillStyle = '#a5d6a7';
  }
}

function updateCoinHUD() {}
function updateAmmoHUD() {}

function renderTitleBG() {
  const bg = IMG['bg_grass'];
  if (bg && bg.width) {
    const bw = VIEW_H / bg.height * bg.width;
    const off = -(performance.now() * 0.02 % bw);
    for (let x = off - bw; x < viewW + bw; x += bw) cx.drawImage(bg, x, 0, bw, VIEW_H);
  }
  if (G.mode === 'title') {
    const cxm = viewW / 2, gy = VIEW_H - 90;

  }
}

function drawGroundStrip(img, x, yTop, w, surfaceH) {
  if (!img || !img.width) {

    cx.fillStyle = G.world.theme.edge; cx.fillRect(x, yTop, w, 14);
    return;
  }
  const tileW = Math.ceil(surfaceH / img.height * img.width);
  const th = Math.ceil(surfaceH);

  const ck = '_tile' + th;
  let tile = img[ck];
  if (!tile) {
    try {
      tile = document.createElement('canvas');
      tile.width = tileW; tile.height = th;
      tile.getContext('2d').drawImage(img, 0, 0, tileW, th);
      img[ck] = tile;
    } catch (e) { tile = img; }
  }

  const viewL = G.cam.x - tileW, viewR = G.cam.x + viewW + tileW;
  const startTx = x + Math.max(0, Math.floor((viewL - x) / (tileW - 1))) * (tileW - 1);
  const endX = Math.min(x + w, viewR);
  cx.save();
  cx.beginPath(); cx.rect(x - 1, yTop - 2, w + 2, surfaceH + 60); cx.clip();
  for (let tx = startTx; tx < endX + tileW; tx += tileW - 1) {
    cx.drawImage(tile, tx, yTop);
  }
  cx.restore();
}

function roundRect(x, y, w, h, r) {
  cx.beginPath();
  cx.moveTo(x + r, y);
  cx.arcTo(x + w, y, x + w, y + h, r);
  cx.arcTo(x + w, y + h, x, y + h, r);
  cx.arcTo(x, y + h, x, y, r);
  cx.arcTo(x, y, x + w, y, r);
  cx.closePath();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('show'));
  if (id) document.getElementById(id).classList.add('show');

  const pad = document.getElementById('gamepad');
  if (pad) pad.style.display = id ? 'none' : pad.style.display;
}
let toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.style.opacity = 1;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.style.opacity = 0, 2200);
}

function buildLevelGrid() {
  const grid = document.getElementById('levelGrid');
  grid.innerHTML = '';
  // tap-target positions (% of screen) matching the plaques in chapterselect.png
  // top row y~38%, bottom row y~66%; 4 columns
  const cols = [16.5, 36, 60.5, 80];
  const rows = [40, 68];
  for (let i = 1; i <= LAST_LEVEL; i++) {
    const L = LEVELS[i - 1];
    const locked = i > Save.data.unlocked;
    const col = (i - 1) % 4, row = Math.floor((i - 1) / 4);
    const b = document.createElement('button');
    b.className = 'lvlhit' + (locked ? ' locked' : '');
    b.style.left = cols[col] + '%';
    b.style.top = rows[row] + '%';
    b.title = L.name;
    if (locked) {
      b.innerHTML = '<span class="lvllock">🔒</span>';
    } else if (i === Save.data.unlocked && !Save.data.gameBeaten) {
      b.innerHTML = '<span class="lvlhere">▶ PLAY</span>';
      b.onclick = () => playLevel(i);
    } else {
      b.onclick = () => playLevel(i);
    }
    grid.appendChild(b);
  }
  const line = document.getElementById('levelHeroLine');
  if (line) line.textContent = '';
}

function drawCharPreview(canvas, ch) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  if (ch.single) {
    const im = IMG[ch.imgIdle];
    if (!im || !im.width) return;
    const ar = im.width / im.height;
    let dh = canvas.height, dw = dh * ar;
    if (dw > canvas.width) { dw = canvas.width; dh = dw / ar; }
    ctx.drawImage(im, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
    return;
  }
  const im = IMG[ch.sheet];
  if (!im || !im.width) return;
  const cw = im.width / 3, chh = im.height / 2;
  const sx = (ch.idle % 3) * cw, sy = Math.floor(ch.idle / 3) * chh;
  const ar = cw / chh;
  let dw = canvas.width, dh = dw / ar;
  if (dh > canvas.height) { dh = canvas.height; dw = dh * ar; }
  ctx.save();
  if (ch.baseFacing < 0) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(im, sx, sy, cw, chh, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
  ctx.restore();
}

let charPreviewSel = G.char.id;
function buildCharSelect() {
  if (!isUnlocked(charById(charPreviewSel))) charPreviewSel = 'sugarwolf';
  const row = document.getElementById('charRow');
  row.innerHTML = '';
  for (const ch of CHARACTERS) {
    const unlocked = isUnlocked(ch);
    const card = document.createElement('div');
    card.className = 'char-card' + (ch.id === charPreviewSel ? ' selected' : '') + (!unlocked ? ' locked' : '');
    card.dataset.id = ch.id;
    const cv2 = document.createElement('canvas');
    cv2.width = 192; cv2.height = 240;
    card.appendChild(cv2);
    const nm = document.createElement('div'); nm.className = 'cname'; nm.textContent = unlocked ? ch.name : '???'; card.appendChild(nm);
    const ds = document.createElement('div'); ds.className = 'cdesc';
    ds.textContent = unlocked ? ch.desc : '🔒 Beat level 20 to unlock';
    card.appendChild(ds);
    if (unlocked) {
      card.onclick = () => {
        charPreviewSel = ch.id;
        Audio.resume(); Audio.sfx('switch');
        [...row.children].forEach(c => c.classList.toggle('selected', c.dataset.id === ch.id));
      };
    } else {
    }
    row.appendChild(card);
    if (unlocked) drawCharPreview(cv2, ch);
    else {

      const c = cv2.getContext('2d'); c.fillStyle = 'rgba(0,0,0,.35)';
      c.font = '900 90px sans-serif'; c.textAlign = 'center'; c.fillText('?', cv2.width/2, cv2.height/2 + 32);
    }
  }
}

function buildShop() {
  document.getElementById('shopCoins').textContent = Save.data.coins;
  const list = document.getElementById('shopList');
  list.innerHTML = '';

  const adDiv = document.createElement('div');
  adDiv.className = 'shop-item';
  adDiv.innerHTML = '<div class="ic">🎬</div><div class="nm">Free Coins</div><div class="ds">Watch a short ad for +50 coins.</div>';
  const adBtn = document.createElement('button');
  adBtn.textContent = '🎬 +50';
  adBtn.onclick = () => watchAdForCoins(50);
  adDiv.appendChild(adBtn);
  list.appendChild(adDiv);
  for (const it of SHOP) {
    const owned = !!Save.data.items[it.id];
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = '<div class="ic">' + it.ic + '</div><div class="nm">' + it.nm + '</div><div class="ds">' + it.ds + '</div>';
    const btn = document.createElement('button');
    btn.textContent = owned ? 'OWNED ✓' : '🪙 ' + it.cost;
    btn.disabled = owned || Save.data.coins < it.cost;
    btn.onclick = () => {
      if (Save.data.coins >= it.cost && !Save.data.items[it.id]) {
        Save.data.coins -= it.cost;
        Save.data.items[it.id] = true;
        Save.write();
        toast(it.nm + ' purchased!'); Audio.sfx('power');
        buildShop();
      }
    };
    div.appendChild(btn);
    list.appendChild(div);
  }
}

let _pendingAdReward = 0, _adInFlight = false;
function watchAdForCoins(amount) {
  if (_adInFlight) return;
  _pendingAdReward = amount || 50;
  _adInFlight = true;
  if (window.AndroidBridge && typeof AndroidBridge.showRewardedAd === 'function') {
    try { AndroidBridge.showRewardedAd(); return; } catch (e) {}
  }

  const ov = document.getElementById('adOverlay');
  const cd = document.getElementById('adCount');
  if (!ov) { grantAdReward(); return; }
  ov.style.display = 'flex';
  let n = 3; cd.textContent = n;
  const t = setInterval(() => {
    n--; cd.textContent = n > 0 ? n : '✓';
    if (n <= 0) { clearInterval(t); ov.style.display = 'none'; grantAdReward(); }
  }, 1000);
}

window.onRewardedAdComplete = function () { if (_adInFlight) grantAdReward(); };
window.onRewardedAdFailed = function () { _adInFlight = false; _pendingAdReward = 0; toast('Ad unavailable — try again later'); };
function grantAdReward() {
  const amt = _pendingAdReward || 50;
  _pendingAdReward = 0; _adInFlight = false;
  Save.data.coins += amt; Save.write();
  toast('🎬 +' + amt + ' coins!'); Audio.sfx('coin');
  const sc = document.getElementById('shopCoins'); if (sc) sc.textContent = Save.data.coins;
  if (G.mode === 'shop') buildShop();
}

const $ = id => document.getElementById(id);

function playLevel(lvl) {
  lvl = Math.max(1, Math.min(LAST_LEVEL, lvl));
  G.pendingLevel = lvl;
  const L = LEVELS[lvl - 1];
  const scr = $('scrStory');

  const artKey = 'ch' + lvl;
  if (IMG[artKey] && IMG[artKey].width) {
    scr.style.background = '#0a0616 url(img/' + artKey + '.png) center/contain no-repeat';
    $('storyTitle').style.display = 'none';
    $('storyText').style.display = 'none';
    $('btnStoryGo').style.display = 'none';
  } else {
    scr.style.background = 'rgba(8,12,24,.86)';
    const st = $('storyTitle'); st.textContent = 'Chapter ' + lvl + ' — ' + L.name; st.style.display = '';
    const sx = $('storyText'); sx.textContent = L.story; sx.style.display = '';
    $('btnStoryGo').style.display = '';
  }
  G.mode = 'story'; showScreen('scrStory');
}

$('scrStory').onclick = function() { if (G.mode === 'story') startLevel(G.pendingLevel || 1); };

function afterChooseHero() {
  if (Save.data.gameBeaten) { buildLevelGrid(); G.mode = 'levels'; showScreen('scrLevels'); }
  else { playLevel(Math.max(1, Math.min(LAST_LEVEL, Save.data.unlocked))); }
}
function exitToMenu() {
  Audio.stopMusic();
  $('btnSwitch').style.display = 'none'; $('btnPause').style.display = 'none'; $('btnMute').style.display = 'none';
  if (Save.data.gameBeaten) { G.mode = 'levels'; buildLevelGrid(); showScreen('scrLevels'); }
  else { G.mode = 'title'; showScreen('scrTitle'); }
}

function openCharSelect() { Audio.resume(); charPreviewSel = (G.char && G.char.id) || 'sugarwolf'; buildCharSelect(); G.mode = 'select'; showScreen('scrChar'); }
$('btnPlay').onclick = openCharSelect;

$('scrTitle').onclick = () => { if (G.mode === 'title') openCharSelect(); };
$('btnCharBack').onclick = () => { G.mode = 'title'; showScreen('scrTitle'); };
$('btnCharGo').onclick = () => {
  const sel = charById(charPreviewSel);
  if (!isUnlocked(sel)) { Audio.sfx('hurt'); toast('Beat the game to unlock that hero!'); return; }
  G.char = sel; G.baseChar = sel;
  try { localStorage.setItem('rustlas_hero', G.char.id); } catch (e) {}
  afterChooseHero();
};
$('btnChangeHero').onclick = () => { G.mode = 'title'; showScreen('scrTitle'); };
$('btnShopFromTitle').onclick = () => { Audio.resume(); G.shopReturn = 'scrTitle'; buildShop(); G.mode = 'shop'; showScreen('scrShop'); };
$('btnShopFromLevels').onclick = () => { G.shopReturn = 'scrLevels'; buildShop(); G.mode = 'shop'; showScreen('scrShop'); };
$('btnShopBack').onclick = () => { showScreen(G.shopReturn); G.mode = G.shopReturn === 'scrTitle' ? 'title' : 'levels'; };
$('btnPause').onclick = () => { if (G.mode === 'playing') { G.mode = 'paused'; Audio.stopMusic(); const q=$('btnQuit'); if(q) q.textContent = Save.data.gameBeaten ? 'LEVEL SELECT' : 'QUIT TO MENU'; showScreen('scrPause'); } };
$('btnResume').onclick = () => { G.mode = 'playing'; Audio.startMusic(Math.min(4, (LEVELS[G.level-1] ? LEVELS[G.level-1].theme : 0))); showScreen(null); lastT = performance.now(); };
$('btnRestart').onclick = () => startLevel(G.level);
$('btnQuit').onclick = () => exitToMenu();
$('btnNext').onclick = () => playLevel(G.level + 1);
$('btnWinLevels').onclick = () => exitToMenu();

$('scrWin').onclick = () => { $('btnNext').onclick(); };
$('btnStoryGo').onclick = () => startLevel(G.pendingLevel || 1);
$('btnEndLevels').onclick = () => exitToMenu();
$('scrEnd').onclick = () => exitToMenu();
$('btnMute').onclick = () => { const on = Audio.toggle(); $('btnMute').textContent = on ? '🔊' : '🔇'; };
$('btnSwitch').onclick = () => {
  if (G.mode !== 'playing' || !G.dog) return;
  G.controlling = G.controlling === 'human' ? 'dog' : 'human';
  Audio.sfx('switch');
  $('btnSwitch').textContent = G.controlling === 'human' ? '🐶' : '🧒';
  toast(G.controlling === 'human' ? 'Controlling ' + G.char.name : 'Controlling the pup!');
};

window.onAndroidBack = function () {
  if (G.mode === 'playing') { G.mode = 'paused'; showScreen('scrPause'); }
  else if (G.mode === 'paused') { G.mode = 'playing'; showScreen(null); lastT = performance.now(); }
  else if (G.mode === 'shop') $('btnShopBack').onclick();
  else if (G.mode === 'levels') { G.mode = 'title'; showScreen('scrTitle'); }
  else if (G.mode === 'char') { G.mode = 'title'; showScreen('scrTitle'); }
};
window.onAndroidPause = function () {
  if (G.mode === 'playing') { G.mode = 'paused'; showScreen('scrPause'); }
};

['pointerdown', 'touchstart', 'keydown'].forEach(ev =>
  window.addEventListener(ev, function once() {
    Audio.resume();
    window.removeEventListener(ev, once);
  }, { passive: true }));

loadAssets(() => {
  setupGamepad();

  try {
    const h = localStorage.getItem('rustlas_hero'); if (h) { const c = charById(h); if (isUnlocked(c)) { G.char = c; G.baseChar = c; } }
    Audio.init();
    $('btnMute').textContent = Audio.on ? '🔊' : '🔇';
  } catch (e) {}
  requestAnimationFrame(frame);
});
