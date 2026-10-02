// Original dialogue, plus callbacks to authorized fictional characters and film props.
// No borrowed lyrics, recording samples, third-party band logos, or other franchises.
export const SECRETS = [
  {id:'deputy-bucket',chapter:1,x:340,y:594,kind:'bucket',action:'interact',name:'Deputy Bucket',clue:'Somebody left the smallest deputy beside the road.',text:'You deputize a bucket. Its first official act is holding dirt. Outstanding work.',effect:'badge'},
  {id:'cactus-complaint',chapter:1,x:680,y:450,kind:'cactus',action:'slap',name:'A Prickly Complaint',clue:'One cactus has a real attitude. Get on its level.',text:'The cactus files a formal complaint: “Your hand has too many soft parts.”',effect:'petals'},
  {id:'invisible-horse',chapter:1,x:4390,y:320,kind:'hitch',action:'down',name:'Your Horse Is Here',clue:'Rest your legs at the highest hitching post.',text:'You mount an invisible horse. It refuses to move until you pay for invisible oats.',effect:'horse'},
  {id:'barrel-union',chapter:2,x:570,y:455,kind:'barrel',action:'interact',name:'The Barrel Union',clue:'The rooftop barrels would like a word.',text:'LOCAL 006: BARRELS AGAINST BEING SHOT. Their demands include lids, shade, and dental.',effect:'coins'},
  {id:'tiny-jail',chapter:2,x:1860,y:594,kind:'population',action:'interact',name:'A Full-Time Counting Job',clue:'Mud Bug’s population keeps its sign painter busy.',text:'The population clerk quits. His replacement is a chalk eraser. It demands hazard pay.',effect:'paper'},
  {id:'roof-dentist',chapter:2,x:4400,y:320,kind:'sign',action:'slap',name:'Open Wide, Partner',clue:'The rooftop dentist takes walk-ins and flying fists.',text:'DENTIST / BLACKSMITH. Same pliers. Different appointment book.',effect:'tooth'},
  {id:'stank-review',chapter:3,x:370,y:594,kind:'sign',action:'interact',name:'One-Star Hospitality',clue:'Read the reviews before the showdown.',text:'“Lovely town. Air has a texture.” — Anonymous traveler, immediately leaving.',effect:'badge'},
  {id:'boot-soup',chapter:3,x:680,y:450,kind:'pot',action:'slap',name:'Soup of the Day',clue:'Give the suspicious pot a taste of frontier justice.',text:'The chef retrieves a boot. “That’s our vegetarian option. Cow already left it.”',effect:'boot'},
  {id:'stank-hat',chapter:3,x:2020,y:450,kind:'hat',action:'down',name:'A Moment of Silence',clue:'Bow beneath the hat that nobody claims.',text:'A respectful silence for everyone downwind. The hat drifts three feet farther away.',effect:'hat'},
  {id:'piano-license',chapter:4,x:470,y:594,kind:'piano',action:'interact',name:'Licensed to Honk',clue:'That piano has only one working key.',text:'You play one note. The piano hands you a diploma. “Best we’ve heard all week.”',effect:'notes'},
  {id:'pie-insurance',chapter:4,x:680,y:450,kind:'sign',action:'interact',name:'Acts of Lead',clue:'Read the fine print above the saloon floor.',text:'POLICY EXCLUSIONS: bullets, boots, and customers who shoot the exclusions.',effect:'paper'},
  {id:'poot-tip',chapter:4,x:2060,y:594,kind:'jar',action:'slap',name:'Generous Gratuity',clue:'That tip jar needs a firm suggestion.',text:'You leave a tip: “Maybe stop shooting the customers.” Five-star service follows.',effect:'coins'},
  {id:'ghost-lease',chapter:5,x:1380,y:450,kind:'paper',action:'interact',name:'Haunted, Utilities Extra',clue:'Even the ghosts have paperwork up in the rafters.',text:'The ghost’s lease says “no haunting after ten.” It sighs and gets a second job.',effect:'ghost'},
  {id:'chair-sheriff',chapter:5,x:2950,y:315,kind:'chair',action:'down',name:'Acting Sheriff',clue:'The highest chair has been waiting for someone.',text:'While you sit, the chair becomes acting sheriff. Crime drops. Morale is complicated.',effect:'badge'},
  {id:'last-call',chapter:5,x:4760,y:450,kind:'bell',action:'slap',name:'Last Call for Last Call',clue:'The bell above the back room needs convincing.',text:'You ring last call. A smaller bell rings last call for the first bell. Nobody leaves.',effect:'notes'},
  {id:'tank-manual',chapter:6,x:420,y:594,kind:'paper',action:'interact',name:'Some Assembly Required',clue:'The assassin left his instructions lying around.',text:'TANK ASSEMBLY: attach boots, add menace. WARNING: do not install the personality backwards.',effect:'paper'},
  {id:'spare-bullet',chapter:6,x:680,y:450,kind:'jar',action:'down',name:'Retirement Plan',clue:'Bow to a bullet with big plans.',text:'This bullet is saving up to become a doorbell. You wish it a quieter future.',effect:'notes'},
  {id:'chicken-draft',chapter:6,x:2020,y:450,kind:'chicken',action:'interact',name:'The Poultry Draft',clue:'There’s a volunteer on the high ground.',text:'A chicken volunteers for the cavalry. It brings three references. All eggs.',effect:'chickens'},
  {id:'sanchez-school',chapter:7,x:560,y:450,kind:'sign',action:'slap',name:'Higher Education',clue:'Sanchez’s school sign needs a practical exam.',text:'CLASS DISMISSED. The sign awards your palm an honorary doctorate in applied nonsense.',effect:'paper'},
  {id:'rock-concert',chapter:7,x:3000,y:315,kind:'rock',action:'interact',name:'Sold-Out Rock Show',clue:'The woodland’s highest rock is taking requests.',text:'The rock performs its entire album: forty minutes of sitting there. The crowd goes sedimentary.',effect:'notes'},
  {id:'canyon-echo',chapter:7,x:4860,y:450,kind:'hitch',action:'down',name:'Customer Support Echo',clue:'Take a knee at the lonely woodland post.',text:'Your echo replies: “Your holler is very important to us.” You are caller number seventeen.',effect:'ghost'},
  {id:'chips-accountant',chapter:8,x:360,y:594,kind:'hack',action:'interact',name:'Hack’s Lunch Break',clue:'A silent gunman waits at the start of the final street.',text:'Hack Benjamin points at a pocket watch, then a lunch sack. Even lurking henchmen get a break. You leave him to his sandwich.',effect:'paper'},
  {id:'emergency-mustache',chapter:8,x:680,y:450,kind:'crate',action:'slap',name:'In Case of Identity',clue:'Break the small emergency crate before the last duel.',text:'Inside: a spare gray beard. The receipt is signed “Definitely Not Grizzly.” You file that under deeply suspicious.',effect:'mustache'},
  {id:'tumbleweed-council',chapter:8,x:2060,y:594,kind:'rock',action:'down',name:'The Tumbleweed Council',clue:'Bow to the last street’s least threatening resident.',text:'The tumbleweeds vote unanimously to make you honorary marshal. Their meeting immediately rolls out of town.',effect:'tumbleweeds'}
];
export const secretById=id=>SECRETS.find(s=>s.id===id);

// Chapter numbers move, stable discovery IDs do not. These are new original jokes
// built around film characters/props, not copied dialogue or outside band branding.
const chapterMap=[0,1,2,4,6,7,9,10,12];
for(const secret of SECRETS)secret.chapter=chapterMap[secret.chapter];
const newSecrets=[
 ['sugars-badge',1,6950,594,'sign','interact','Badge Inspection','Read the notice on the late road.','The badge inspector asks for a second badge proving the first badge is a badge. You deputize the paperwork.'],
 ['chips-deck',2,7350,594,'cards','slap','House Rules','Chips keeps a spare deck past the last patrol.','Every card is an ace. Chips calls it luck. The dealer calls it mandatory.'],
 ['stanks-air',4,1010,594,'jar','interact','Bottled Hospitality','Inspect the sealed jar before the duel.','A jar labeled “Raw Stank: fresh air.” The cork has filed for emancipation.'],
 ['poot-ledger',6,1010,594,'sign','interact','A Very Short Ledger','Check the saloon bookkeeping before Poot.','INCOME: everybody. EXPENSES: ammunition. CUSTOMER RETENTION: disputed.'],
 ['hatchetman-key',7,7750,594,'rope','interact','After Hours','Look beside the saloon’s far exit.','The Hatchetman’s spare key is a rope tied to a brick. Management calls this remote access.'],
 ['tank-nameplate',9,1010,594,'coffin','slap','Spelling Costs Extra','There is a freshly delivered box before Tank.','The coffin order says TINK. Someone added an A with a bullet. The engraver bills for punctuation.'],
 ['sanchez-tuition',10,7850,594,'glove','slap','Hand Tuition','Sanchez left one final lesson near the far road.','TUITION DUE: one handshake. The school has rejected your application for distance learning.'],
 ['grizzly-receipt',12,1010,594,'watch','interact','A Family Business','Check the watch before the final street.','A repair receipt for Grizzly Wolf, charged to Big Baby Chips. You suddenly dislike the family discount.'],
 ['toll-population',3,340,594,'population','interact','A Moving Target','Read the depot population board.','The population sign has a slot for removable numbers. Mud Bug’s only growth industry is erasers.'],
 ['gold-tax',3,650,450,'cards','slap','Tax on Breathing','Find the collection papers on the first shelf.','Chips taxes breathing. Stank gets a refund for everyone who stops when he enters.'],
 ['chips-lien',3,2800,450,'sign','interact','Owner of the Owner','Look for a deed on the high route.','This deed says Chips owns the town, the paper, and your interest in reading the paper.'],
 ['toll-hack',3,6200,594,'hat','down','Lurking Allowance','Bow to the gunman’s abandoned hat.','Hack’s expense claim lists twelve hours of lurking and one suspicious sandwich. Accounting approves the sandwich.'],
 ['cellar-menu',5,340,594,'sign','interact','House Special','Check the cellar menu.','The special is whatever hit the floor most recently. The bartender recommends staying upright.'],
 ['poot-tab',5,650,450,'jar','slap','Poot’s Tab','Give the jar on the first shelf a reminder.','Poot’s unpaid tab is longer than your arm. Sanchez hears this and takes it personally.'],
 ['cellar-piano',5,2800,450,'piano','interact','One Note Too Many','Find the cellar piano.','The piano player has been paid to stop. For the first time tonight, Chips made a sound investment.'],
 ['cellar-foot',5,6200,594,'spurs','down','No Shoes, No Service','Bow beside the giant spurs.','The Foot was refused service for bringing only one shoe. He appealed. The door is still airborne.'],
 ['undertaker',8,340,594,'coffin','interact','Advance Reservation','Inspect the coffin by the road.','SUGAR WOLF — RESERVED. You cross out the name. The undertaker charges a cancellation fee.'],
 ['grave-stank',8,650,450,'shovel','slap','Digging Deep','Find the shovel on the first high path.','The gravedigger wants six feet. The Foot objects to the unit of measurement.'],
 ['grave-tank',8,2800,450,'sign','interact','Heavy Delivery','Read the notice over the burial road.','Tank ordered a bulletproof coffin. The carpenter handed him a shovel and wished him luck.'],
 ['grave-beard',8,6200,594,'hat','down','No Family Resemblance','Pay respects to the abandoned hat.','The obituary lists “absolutely no relation to Chips.” Someone has underlined absolutely seventeen times.'],
 ['return-school',11,340,594,'glove','slap','Final Exam','Slap the glove beside the returning road.','Sanchez’s final exam has one question: Which hand? You pass by not pointing with the broken one.'],
 ['return-cards',11,650,450,'cards','interact','Last Hand','Inspect the cards over the road.','Chips offers one last hand. You already have two and one has been through enough.'],
 ['return-hack',11,2800,450,'watch','interact','Union Break','Find the pocket watch on the high route.','Hack’s watch says LUNCH in every position. Precision instrument. Excellent benefits.'],
 ['return-people',11,6200,594,'population','interact','Population: Hopeful','Read Mud Bug’s last population sign.','The clerk leaves one empty slot on the sign. “For whichever idiot wins,” he says. Fair municipal policy.']
];
for(const [id,chapter,x,y,kind,action,name,clue,text]of newSecrets)SECRETS.push({id,chapter,x,y,kind,action,name,clue,text,effect:kind==='piano'?'notes':kind==='cards'?'paper':'badge'});
