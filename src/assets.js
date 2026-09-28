// Sprite frames are source rectangles in original transparent atlases.
// J and Shaggy references were authorized by the project owner; other likenesses are excluded.
export const ASSETS={
  title:'art/title-frontier.png',bg_island:'art/desert.png',bg_town:'art/town.png',bg_saloon:'art/saloon.png',bg_hideout:'art/hideout.png',bg_woodland:'art/woodland.png',
  hero:'art/sugar-wolf.png',outlaws:'art/outlaws.png',bosses:'art/bosses.png',terrain:'art/terrain.png',hack:'art/hack-benjamin.png',pimp:'art/pimp-hand.png',elastic:'art/pimp-hand-elastic.png'
};
export const FRAMES={};
function frame(name,sheet,x,y,w,h,baseFacing=1){FRAMES[name]={sheet,x,y,w,h,baseFacing};}
const heroFrames={idle:[0,0,360,510],walk1:[364,0,388,510],walk2:[758,0,395,510],walk3:[1165,0,371,510],jump:[0,515,362,500],shoot:[363,513,443,500],slap2:[763,513,431,500],crouch:[1200,654,336,360]};
for(const prefix of ['rl_sugarwolf_gun_','rl_sugarwolf_slap_'])for(const [pose,r]of Object.entries(heroFrames))frame(prefix+pose,'hero',...r);
for(const prefix of ['rl_sugarwolf_gun_','rl_sugarwolf_slap_'])FRAMES[prefix+'slap2'].omit={x:763,y:513,w:92,h:120};
for(const prefix of ['rl_sugarwolf_gun_','rl_sugarwolf_slap_'])FRAMES[prefix+'shoot'].omit={x:758,y:670,w:50,h:345};
frame('hack_idle','hack',0,0,626,1254,1);
frame('hack_tip','hack',627,0,627,1254,1);
const pimpFrames={ready:[0,0,389,510],windup:[367,0,373,510],swing:[739,0,429,510],impact:[1121,0,415,510],follow:[0,513,408,490],recover:[409,513,390,490],air:[753,513,440,350],low:[1120,640,416,358]};
for(const [pose,r]of Object.entries(pimpFrames))frame('pimp_'+pose,'pimp',...r);
FRAMES.pimp_windup.omit={x:367,y:0,w:35,h:233};
FRAMES.pimp_swing.omit={x:1114,y:262,w:54,h:248};
FRAMES.pimp_ready.omit={x:365,y:240,w:24,h:220};
FRAMES.pimp_impact.omit={x:1121,y:0,w:61,h:230};
FRAMES.pimp_recover.omit={x:746,y:513,w:53,h:392};
FRAMES.pimp_air.omit=[{x:753,y:825,w:70,h:80},{x:1100,y:700,w:94,h:170}];
FRAMES.pimp_low.omit={x:1120,y:640,w:75,h:84};
// Feet pivots keep Sugar planted while the long sleeve occupies most of the frame.
frame('pimp_launch','elastic',0,0,1000,392);
frame('pimp_extend','elastic',0,320,1536,390);
frame('pimp_recoil','elastic',0,700,1040,324);
Object.assign(FRAMES.pimp_launch,{anchorX:275,baseY:382,bodyHeight:338});
Object.assign(FRAMES.pimp_extend,{anchorX:275,baseY:706,bodyHeight:300,omit:[{x:0,y:320,w:450,h:74},{x:850,y:700,w:200,h:10}]});
Object.assign(FRAMES.pimp_recoil,{anchorX:275,baseY:1008,bodyHeight:300,omit:[{x:0,y:700,w:450,h:9}]});
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
  if(name.startsWith('bpoot_')&&r.y>510)r.omit={x:706,y:530,w:60,h:183};
  if(name.startsWith('btank_')&&r.y>510)r.omit=[{x:708,y:719,w:59,h:263},{x:1117,y:550,w:44,h:280}];
  if(name.startsWith('bchips_')&&r.y>510)r.omit={x:1120,y:805,w:66,h:202};
  if(r.omit&&!Array.isArray(r.omit))r.omit=[r.omit];
}
const terrainRects=[[30,53,713,176],[795,52,713,191],[30,301,713,160],[795,300,713,157],[30,536,713,177],[795,535,713,200],[30,777,713,188],[795,777,713,190]];
terrainRects.forEach((r,i)=>frame('terrain'+i,'terrain',...r));
export function backgroundUrl(name){return ASSETS[name];}
