// Sprite frames are source rectangles in original transparent atlases.
// J and Shaggy references were authorized by the project owner; other likenesses are excluded.
export const ASSETS={
  logo:'art/title-wordmark.png',studio:'art/creaso-norse.png',
  title:'art/title-frontier.png',bg_island:'art/desert.png',bg_town:'art/town.png',bg_saloon:'art/saloon.png',bg_hideout:'art/hideout.png',bg_woodland:'art/woodland.png',
  hero:'art/sugar-wolf.png',outlaws:'art/outlaws.png',bosses:'art/bosses.png',terrain:'art/terrain.png',hack:'art/hack-benjamin.png',pimp:'art/pimp-hand.png',elastic:'art/pimp-hand-elastic.png',props:'art/frontier-props.png',secretProps:'art/frontier-secrets.png',details:'art/frontier-details.png',walk:'art/sugar-walk.png',foot:'art/the-foot.png',gunslingers:'art/gunslingers.png'
};
export const FRAMES={};
function frame(name,sheet,x,y,w,h,baseFacing=1){FRAMES[name]={sheet,x,y,w,h,baseFacing};}
const heroFrames={idle:[0,0,360,510],walk1:[364,0,388,510],walk2:[758,0,350,510],walk3:[1135,0,401,510],jump:[0,515,362,500],shoot:[363,513,443,500],slap2:[763,513,431,500],crouch:[1200,654,336,360]};
for(const prefix of ['rl_sugarwolf_gun_','rl_sugarwolf_slap_'])for(const [pose,r]of Object.entries(heroFrames))frame(prefix+pose,'hero',...r);
for(const prefix of ['rl_sugarwolf_gun_','rl_sugarwolf_slap_'])FRAMES[prefix+'slap2'].omit={x:763,y:513,w:92,h:120};
for(const prefix of ['rl_sugarwolf_gun_','rl_sugarwolf_slap_'])FRAMES[prefix+'shoot'].omit=[{x:758,y:670,w:50,h:345},{x:363,y:690,w:5,h:40}];
frame('hack_idle','hack',0,0,626,1254,1);
frame('hack_tip','hack',627,0,627,1254,1);
const pimpFrames={ready:[0,0,389,510],windup:[367,0,373,510],swing:[739,0,429,510],impact:[1121,0,415,510],follow:[0,513,408,490],recover:[409,513,390,490],air:[753,513,440,350],low:[1120,640,416,358]};
for(const [pose,r]of Object.entries(pimpFrames))frame('pimp_'+pose,'pimp',...r);
FRAMES.pimp_windup.omit={x:367,y:0,w:35,h:233};
FRAMES.pimp_swing.omit={x:1114,y:262,w:54,h:248};
FRAMES.pimp_ready.omit={x:365,y:240,w:24,h:220};
FRAMES.pimp_impact.omit=[{x:1121,y:0,w:61,h:230},{x:1121,y:460,w:6,h:30}];
FRAMES.pimp_recover.omit={x:742,y:513,w:61,h:392};
FRAMES.pimp_air.omit=[{x:753,y:825,w:70,h:80},{x:1100,y:700,w:94,h:170}];
FRAMES.pimp_low.omit={x:1120,y:640,w:75,h:84};
// Feet pivots keep Sugar planted while the long sleeve occupies most of the frame.
frame('pimp_launch','elastic',0,0,1000,392);
frame('pimp_extend','elastic',0,320,1536,390);
frame('pimp_recoil','elastic',0,700,1040,324);
Object.assign(FRAMES.pimp_launch,{anchorX:275,baseY:382,bodyHeight:338});
Object.assign(FRAMES.pimp_extend,{anchorX:275,baseY:706,bodyHeight:300,omit:[{x:0,y:320,w:1100,h:78},{x:850,y:700,w:200,h:10}]});
Object.assign(FRAMES.pimp_recoil,{anchorX:275,baseY:1008,bodyHeight:300,omit:[{x:0,y:700,w:450,h:9},{x:0,y:709,w:235,h:10}]});
const enemyFrames={e_shadow:[0,18,441,462],e_shadow_aim:[443,10,351,466],e_ghost:[858,10,405,470],e_gambler:[1266,10,269,472],e_pie:[0,519,410,477],e_tank:[417,486,387,515],e_foot:[830,516,449,484],rl_sanchez_arms_crossed:[1280,490,256,510]};
for(const [name,r]of Object.entries(enemyFrames))frame(name,'outlaws',...r,-1);
FRAMES.e_shadow.omit={x:349,y:88,w:100,h:58};
Object.assign(FRAMES.e_shadow_aim,{x:349,w:462,omit:{x:349,y:175,w:94,h:301}});
const bossFrames={bstank_:[[0,10,360,503],[0,555,368,440]],bpoot_:[[365,10,351,503],[360,520,405,470]],btank_:[[727,10,397,503],[708,550,453,440]],bchips_:[[1135,10,401,503],[1120,529,416,461]]};
for(const [prefix,poses]of Object.entries(bossFrames)){
  for(let i=1;i<=9;i++)frame(prefix+i,'bosses',...poses[i>=5?1:0],-1);
  for(let i=1;i<=5;i++)frame(prefix+'gold'+i,'bosses',...poses[1],-1);
}
for(const [name,r]of Object.entries(FRAMES)){
  if(name.startsWith('bstank_')&&r.y>510)r.omit={x:357,y:540,w:20,h:184};
  if(name.startsWith('bpoot_')&&r.y>510)r.omit=[{x:706,y:530,w:65,h:183},{x:360,y:724,w:27,h:91}];
  if(name.startsWith('btank_')&&r.y>510)r.omit=[{x:708,y:700,w:65,h:282},{x:1117,y:550,w:44,h:280}];
  if(name.startsWith('bchips_')&&r.y>510)r.omit={x:1120,y:805,w:66,h:202};
  if(r.omit&&!Array.isArray(r.omit))r.omit=[r.omit];
}
const terrainRects=[[30,53,713,176],[795,52,713,191],[30,301,713,160],[795,300,713,157],[30,536,713,177],[795,535,713,200],[30,777,713,188],[795,777,713,190]];
terrainRects.forEach((r,i)=>frame('terrain'+i,'terrain',...r));
export function backgroundUrl(name){return ASSETS[name];}

// Fresh illustrated props and genuinely different animation poses.

const propNames=['well','well_lit','exit','exit_locked','stash','stash_broken','coin','badge','medicine','lantern','tumbleweed','axe'];
propNames.forEach((name,i)=>{const row=Math.floor(i/4),ys=[0,364,690],heights=[364,326,334];frame('prop_'+name,'props',i%4*384,ys[row],384,heights[row]);});
const secretNames=['bucket','cactus','hitch','barrel','population','sign','pot','hat','piano','jar','chair','bell'];
secretNames.forEach((name,i)=>{const row=Math.floor(i/4),ys=[0,328,647],heights=[328,319,377];frame('prop_'+name,'secretProps',i%4*384,ys[row],384,heights[row]);});
Object.assign(FRAMES.prop_hitch,{x:755,w:410});Object.assign(FRAMES.prop_piano,{w:426});
const detailNames=['chicken','rock','coffin','shovel','cards','watch','rope','ammo','revolver','horseshoe','spurs','glove'];
detailNames.forEach((name,i)=>{const row=Math.floor(i/4),ys=[0,375,673],heights=[375,298,351];frame('prop_'+name,'details',i%4*384,ys[row],384,heights[row]);});
Object.assign(FRAMES.prop_rock,{x:392,w:419});Object.assign(FRAMES.prop_revolver,{w:446});Object.assign(FRAMES.prop_spurs,{x:772,w:442});
for(let i=0;i<6;i++)frame('sugar_walk'+i,'walk',i%3*512,Math.floor(i/3)*512,512,512);
const footRects=[[0,0,505,510],[512,0,500,510],[1024,0,512,510],[0,512,490,512],[486,512,619,512],[1090,550,446,474]];
['idle','step1','step2','windup','kick','recover'].forEach((name,i)=>frame('foot_'+name,'foot',...footRects[i],-1));
frame('poot_idle','gunslingers',0,0,500,512,-1);frame('poot_fire','gunslingers',0,514,548,510,-1);
FRAMES.poot_fire.omit=[{x:490,y:570,w:58,h:87}];
frame('chips_idle','gunslingers',512,0,512,512,-1);frame('chips_fire','gunslingers',490,514,570,510,-1);
FRAMES.chips_fire.omit=[{x:490,y:657,w:65,h:155},{x:1000,y:530,w:60,h:138}];
frame('raider_idle','gunslingers',1024,0,512,512,-1);frame('raider_throw','gunslingers',1000,514,536,510,-1);
FRAMES.raider_throw.omit=[{x:1000,y:669,w:70,h:355}];

for(const [prefix,idle,fire]of [['bpoot_','poot_idle','poot_fire'],['bchips_','chips_idle','chips_fire']]){
  for(let i=1;i<=9;i++)FRAMES[prefix+i]={...FRAMES[i>=5?fire:idle]};
  for(let i=1;i<=5;i++)FRAMES[prefix+'gold'+i]={...FRAMES[fire]};
}

// Atlas isolation: neighboring objects can extend across nominal cell edges.
Object.assign(FRAMES.prop_barrel,{x:1230,w:290});
Object.assign(FRAMES.prop_jar,{x:470,w:250});
Object.assign(FRAMES.prop_coffin,{x:850,w:260});
Object.assign(FRAMES.prop_horseshoe,{x:456,w:300});
Object.assign(FRAMES.prop_glove,{x:1220,w:310});
Object.assign(FRAMES.prop_coin,{x:805,w:330});
