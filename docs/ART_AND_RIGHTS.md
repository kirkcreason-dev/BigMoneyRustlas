# Art, references, and authorization record

## Scope provided by the project owner

The owner described this as the first official Big Money Rustlas video game and authorized the title and fictional characters. They excluded Twiztid and other performers' likenesses, then explicitly permitted J, Shaggy, and Hack Benjamin's likenesses. These are the owner's statements; this project does not represent an independent contract or legal clearance review.

The release uses newly illustrated Sugar Wolf (Shaggy 2 Dope), Big Baby Chips (Violent J), and Hack Benjamin (Jumpsteady in his covered-face Rustlas costume). Raw Stank, Dusty Poot, Tank, the other enemies, and Sanchez use original designs without recognizable performer faces. No unlicensed voice imitation, film audio, dialogue recording, soundtrack, lyrics, or third-party logo is used. The gray-beard ending callback is a prop/text gag, not a Ron Jeremy portrait.

The old supplied `img/` and `audio/` folders remain in repository history; the explicit export allowlist excludes them. The two authorized supplied sprites of Sugar and Chips were used only as appearance references when generating new art.

## Film research

Selected frames and rendered English captions were reviewed from the authorized [Tubi stream](https://tubitv.com/movies/696975/big-money-rustlas): opening town/poker scenes, roughly 47–49 minutes, 71–78 minutes, and 82–85 minutes. This was sampled research, **not a continuous full viewing**. The changing population sign, Chips' purple/gold clothing, the woodland setting, Sugar's injured shooting hand, and the ending informed corrections. The final showdown now returns to Mud Bug instead of inventing a subterranean finale; Sugar fights with the other hand instead of a magically healed gun hand.

[Apple TV's distributor synopsis](https://tv.apple.com/us/movie/big-money-rustlas/umc.cmc.77lwesiny8zkmbaefxd2r9q6t) confirms the principal roles, including Hack Benjamin as Chips' lurking gunman. A labeled [film still on IMFDB](https://www.imfdb.org/wiki/Big_Money_Rustlas#Mossberg_500_Cruiser) was visually inspected for Hack's black cloth face covering, broad hat, leather coat, and embroidered shoulder cape. No stills or stream media were downloaded into the game.

## Generated assets

The 14 original game raster assets in `art/` were generated using the built-in ImageGen tool. `creaso-norse.png` is the exact logo PNG supplied by the owner on September 28, 2026, copied without pixel changes; it is used in the studio intro, loading screen, title footer and credits. Version 2.2 restyles every asset to the owner-supplied original movie posters: red/gold lettering, cyan sky, orange earth, brown corduroy, gold suits, and coarse printed illustration. Exact current prompts and saved files are in `OG_STYLE.md`. Asset revision modes and prompt directions are recorded below. Exact frame rectangles and any drawing exclusions are in `src/assets.js`; the original PNGs remain intact.

| File | Use | Mode and prompt direction |
|---|---|---|
| `title-wordmark.png` | Title lettering | Original poster-inspired red BIG MONEY / gold RUSTLAS, skull and sheriff star, true transparency. |
| `title-frontier.png` | Title backdrop | Authorized J in gold and Shaggy in brown frame a bright Western street with clear title space. |
| `desert.png` | Dusty Plains | Generate: layered mesas, cactus, distant town, clear foreground. Edit: remove poles and wires. |
| `town.png` | Mud Bug and final showdown | Generate: illustrated frontier street and timber storefronts, no people, empty gameplay space. |
| `saloon.png` | Interior chapters | Generate: wooden bar, lamps, balcony/rafters, warm light, no people, clear foreground. |
| `hideout.png` | Additional environment asset | Generate: original timber/stone outlaw vault, gold, warm lamps, no people. Included for future level use. |
| `woodland.png` | Sanchez's training | Generate: California oak woodland, creek bed, distant shack, exaggerated wooden training arm, olive/honey palette, no people or modern utilities. |
| `terrain.png` | Eight ground/platform pieces | Generate: 2 columns × 4 rows; sandstone, boardwalk timber, gray bedrock, reinforced stone; transparent isolated pieces with flat traversable tops. |
| `sugar-wolf.png` | Eight movement/gun poses | Generate original atlas, then edit against authorized supplied Sugar sprite: Shaggy's Sugar Wolf face/paint, brown hat, smooth brown corduroy coat, brick-red shirt, cream paisley tie, yellow gloves. Idle, three walks, jump, shooting, slap, crouch. |
| `pimp-hand.png` | Eight slap poses | Edit/new animation derived from Sugar atlas: ready, wind-up, swing, impact, follow-through, recovery, airborne slap, low slap; exaggerated active palm, same Shaggy likeness and outfit; transparent 4 × 2 atlas. |
| `pimp-hand-elastic.png` | Three supernatural slap poses | Edit from pimp-hand atlas: preserve Sugar’s appearance; three horizontal rows showing long launch, maximum arm extension to three body heights, and S-curved elastic recoil. Continuous sleeve ending in oversized open palm, right-facing, full body, transparent. |
| `bosses.png` | Four bosses, two poses each | Generate, then edit into comic frontier costumes: covered-face red-suited Stank; covered-face blue dollar waistcoat Poot; covered-face stove-shield Tank; authorized J likeness for Chips with gold suit, black shirt and concho hat in both idle and action poses. |
| `outlaws.png` | Seven enemy types and Sanchez | Generate: original concealed-face bandit, rifleman, supernatural outlaw, gambler, pie thrower, bruiser, oversized boot enemy, and original mentor silhouette. No performer likeness references. |
| `hack-benjamin.png` | Two cameo poses | Generate from observed Rustlas costume description: black cloth face covering, broad flat black hat, glossy coat, silver floral shoulder embroidery, black gloves; idle and hat-tip poses. |

The star icon, coins, wells, discovery props, interface, and effects are original vector/canvas drawings. The 46 audio assets in `sound/` are original digital synthesis from `scripts/design-sounds.py`; the guitar score and mixer are in `src/audio.js`. See `SOUND_DESIGN.md`. Generated character art is stylized interpretation, not a guarantee of exact likeness or costume continuity.

## Font

Rye by Sorkin Type Co (2011), distributed under SIL Open Font License 1.1. The font and full license are in `fonts/`; the license is also embedded in the self-contained HTML. Official source: https://github.com/google/fonts/tree/main/ofl/rye

## New game material

The 24 secret dialogues are original writing. References stay within the authorized fictional world; no lyrics, copied movie quotations, outside franchise jokes, or third-party band branding are included. Pie attacks, projectile-return damage, the stove shield, platforming routes, and humorous secret rewards are game inventions.
