"""The pose guides of 2026-11-20, packaged for the art desk (the pose seat). Griz to the lanes desk: "fable poses with plate help for every
strip we've already sent to art desk, then the new ones". Plain Python.

    python tools/guide-pack.py [outbox] [move ...]   the guides below (all, or the moves named) -> <outbox>/GUIDE-<date>-<move>/ and its .zip
                                             (outbox: deep16/_src/outbox of THIS tree unless given -- a worktree passes the shared checkout's)

Reads what tools/twinmace-blend.py rendered and tools/twinmace-sheet.py laid: deep16/art-src/<name>/ (the strips: the striker ALONE -- his
"no target mannequins in what's sent to art dept") and deep16/_src/<name>[-dwarf]/render/ (meta.json for the size, <name>-poses.json the
positions). A guide already sent goes again under a NEW name; the text says which it replaces and which frames changed.
"""
import json, os, shutil, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'deep16', '_src', 'outbox')
ONLY = sys.argv[2:]          # (a guide once carried to the art desk is not packed again under its old name: name the moves to pack)
VIEWS = ['S', 'SE', 'E', 'NE', 'N']
DATE = '2026-11-20'

READ = """How to read a strip:
- BLUE limbs are the RIGHT arm and leg, ORANGE the LEFT; grey is the body; the nose shows the face.
- The YELLOW balls mark the WRISTS and the ANKLES: the joints the hand and the foot turn on.
- %s
- Six frames, numbered under the feet line. Frame 4, in gold, is %s.
- No target figure is in any strip (Griz, 11-12: "no target mannequins in what's sent to art dept")."""

LAW = """The rig's law, in Griz's words (11-12): "wrists essentially lock at position 1" -- the elbows, the shoulders, the hips and the knees do
the work. Since 11-19 the lock is let go on the HIT frame only: there the weapon comes into one line with the forearm, as every landed blow
does on the period fight-manual plates these poses were checked against (Fiore dei Liberi, about 1409; de Gheyn, 1607; MS I.33, about 1300)."""

# each set: (folder in the package, the strips' prefix, deep16/art-src folder, the laid strips' stem, deep16/_src work folder, who it is sized to)
G = [
    dict(move='spear-keep-back', title='Spear KEEP BACK, the point out (human)', replaces='the guide strips inside ASK-2026-11-19b-guard-spear-keep-back-point-out',
         sets=[('spear-keep-back-human', 'SPEAR-KEEP-BACK-HUMAN', 'spearpush', 'spearpush-alone-%s', 'spearpush-alone-all', 'spearpush', "the Line Guard's fight figure (`guard_p2`)")],
         weapon="The thin brown bar is the SPEAR's shaft, MAGENTA at its head: 1.85 m, a little taller than he is. His RIGHT fist holds the BUTT; his LEFT is ahead of it on the shaft.",
         hit='THE POINT (the second jab)',
         words='Griz, 11-19, of the feat Keep Back: "I see it point-end out, but like extend on 2, point on 3, point in a different spot on 4, quick return on 5 - like they\'re stabbing empty space to keep the foe out of that space". And on the review of the first guide against the plates, 11-19: "mark the spear one as separate or short, but the hand at the butt".',
         changed="""WHAT CHANGED from the guide of 11-19 (every frame): the REAR hand is now at the BUTT of the spear with only a stub behind it -- it held a
third of the way up, and the butt trailed behind him. The hands are a forearm and a half apart (they were a forearm). The point reaches
about 0.45 m further on every frame: reach is what the move is for. On frame 2 the rear arm stays LONG AND LOW and drives the butt forward
past the hip; before, the extend was made by lifting the rear hand to the chest. He stands more side-on. The six beats and the feet are the same.""",
         frames=["THE GUARD -- side-on, the left side and the left foot forward. The rear (right) hand holds the butt behind the right hip; the left hand is ahead on the shaft at chest height; the point forward and up at an enemy's face.",
                 "EXTEND -- the rear arm drives the butt forward past the hip, long and low; the spear runs out level; the knees bend.",
                 "THE POINT, high -- a short jab at the height of a chest, on his left of the middle; both arms long.",
                 "THE POINT AGAIN, somewhere else -- the butt lifted, the point dipped to a thigh's height on his right of the middle. He is stabbing the space, not a body.",
                 "The quick return -- snatched back, nearly the guard.",
                 "The guard again. The feet never move."]),
    dict(move='greataxe-chop', title='Greataxe OVERHAND CHOP, two hands, the sliding hand (human)', replaces='the guide strips inside ASK-2026-11-19-talmok-greataxe (GUIDE-GREATAXE-CHOP-HUMAN-*)',
         sets=[('greataxe-chop-human', 'GREATAXE-CHOP-HUMAN', 'greataxe', 'greataxe-alone-%s', 'greataxe-alone-all', 'greataxe', "Talmok's fight figure (`talmok_p2`)")],
         weapon="The brown bar is the HAFT and the MAGENTA plate at its end the BLADE, a pale block behind it the back of the head: about 1.3 m butt to top. The LEFT fist is the lower hand, near the butt, and never moves on the haft; the RIGHT fist is the upper hand and SLIDES.",
         hit='THE CHOP',
         words='Griz, 11-19, on the review of the first guide against Fiore\'s axe plates: "fix the hand spacing, apart and sliding together".',
         changed="""WHAT CHANGED from the guide of 11-19: THE HANDS. Before, the two fists sat a fixed 34 cm apart at the bottom of the haft on every frame.
Now they are WIDE apart in the guard and the lift (frames 1, 2 and 6: about half a metre, the right hand up at the chest), a forearm apart
at the top (frame 3), and on frames 4 and 5 the right hand has SLID DOWN the haft to the left so the two fists are TOGETHER by the butt as
the blow lands. Frame 4's arms are thrown a little further out. The body, the feet and the six beats are as they were.""",
         frames=["THE GUARD -- the axe at port across his chest, its head up by the right shoulder. The hands WIDE on the haft: the left low at the belt, the right up at the chest.",
                 "THE LIFT -- the hands up his right side, still wide; the weight back; the head of the axe going up and back.",
                 "THE TOP -- the hands over his brow, a forearm apart; the axe laid back over his head; the left foot off the floor and going forward.",
                 "THE CHOP -- the foot down, the knees dropped. The right hand has slid down to the left: both fists together by the butt, the arms thrown out level, the blade straight down in front.",
                 "THROUGH -- the hands still together, the blade down by the floor in front, the knees deep, his back over it.",
                 "The foot drawn back; the right hand slides back up the haft as the axe comes up to the guard."]),
    dict(move='one-handed-slash', title='One-handed SLASH, right hand (human and dwarf)', replaces='GUIDE-2026-11-12-one-handed-slash',
         sets=[('one-handed-slash-human', 'ONE-HANDED-SLASH-HUMAN', 'slash1h', 'slash1h-alone-%s', 'slash1h-alone-all', 'slash1h', "a grown human hero's fight figure (`barley_p3`)"),
               ('one-handed-slash-dwarf', 'ONE-HANDED-SLASH-DWARF', 'slash1h', 'slash1h-dwarf-%s', 'slash1h-dwarf-all', 'slash1h-dwarf', "a dwarf hero's fight figure (`pyro_p0`)")],
         weapon="The MAGENTA bar is the BLADE, its last part pale, a ring at the guard: draw the character's own one-handed weapon along it (a sword, a mace, a hammer), the grip in the RIGHT fist. The LEFT hand is empty.",
         hit='THE CUT',
         words='Griz, 11-12: "the right arm should be doing about the same as with the mace, but the hip turns putting the left side forward with the left arm extending forward / on 3, knees dropped about 3 inches, waist twisted back forward as the arm extends the slash".',
         changed="""WHAT CHANGED from the guide of 11-12: FRAME 4 ONLY, in both sets. Before, the forearm pointed down at the cut and the blade stood up off it
(71 degrees on the human; on the dwarf 115, the sword upright over a lowered fist, so no cut was on screen until frame 5). Now the forearm
RISES behind the blade and the two are nearly one line as the cut lands (about 20 degrees between them): the arm is out long, the fist at
the height of the chest, the blade running on from it. Frames 1, 2, 3, 5 and 6 are as they were.""",
         frames=["POSITION ONE -- the blade up in front of him.",
                 "The draw -- the hips turn to put his LEFT side forward, the left arm out ahead; the right hand to the ear, the blade back over the shoulder.",
                 "Between the draw and the cut -- the hips coming round, the knees going down, the arm unfolding.",
                 "THE CUT -- the knees down three inches, the waist back to the front, the arm out LONG and the blade one line with the forearm. The human's lands on a man's neck at his left shoulder; the dwarf's comes in under a man's left arm at the ribs (on a foe of his own height, the neck).",
                 "Through -- the hips past the middle the other way, the blade down by the foe's far ankle, the knees starting up.",
                 "Nearly back to position one."]),
    dict(move='shortsword-stab', title='Shortsword STAB, right hand (dwarf)', replaces='GUIDE-2026-11-12-shortsword-stab',
         sets=[('shortsword-stab-dwarf', 'SHORTSWORD-STAB-DWARF', 'stab', 'stab-dwarf-%s', 'stab-dwarf-all', 'stab-dwarf', "the gate watch's fight figure (`gatewatch_p2`)")],
         weapon="The MAGENTA bar is the shortsword's BLADE, its last part pale, a ring at the guard; the grip in the RIGHT fist. The LEFT hand is empty. The thin brown curve behind him is a longbow slung on his back (the road patrol's): leave it off a character who has none.",
         hit='THE STAB',
         words='Griz, 11-12, to the lanes desk: "do a dwarf with a longbow and a short-sword stab (with shield if applicable)".',
         changed="""WHAT CHANGED from the guide of 11-12: FRAME 4 ONLY. Before, the blade rose 46 degrees off a lowered forearm at the stab, a rising poke. Now
the forearm is brought up behind the point and the blade and the forearm are ONE LINE: a straight thrust, level, at the height of a dwarf's
chest (a grown man's belly). Frames 1, 2, 3, 5 and 6 are as they were.""",
         frames=["POSITION ONE -- the blade up in front, the left hand free.",
                 "Chambered -- the hips turn his LEFT side forward, the left hand out ahead; the right fist drawn back to the right hip, the point at the target.",
                 "The drive -- the knees going down, the hips coming round, the fist passing the hip.",
                 "THE STAB -- the right hip and shoulder driven through, the arm out, the blade and the forearm one straight line: the point goes straight in. The left hand pulled back to his side.",
                 "The withdrawal -- the fist straight back to the hip along the same line.",
                 "Nearly back to position one. The feet never leave their places."]),
    dict(move='greataxe-jumping-chop', title="Greataxe JUMPING CHOP, two hands (dwarf) -- Brann's", replaces=None,
         sets=[('greataxe-jumping-chop-dwarf', 'GREATAXE-JUMPING-CHOP-DWARF', 'greataxe', 'greataxe-dwarf-%s', 'greataxe-dwarf-all', 'greataxe-dwarf', "the gate watch's fight figure (`gatewatch_p2`), the garrison trooper's size")],
         weapon="The brown bar is the HAFT and the MAGENTA plate the BLADE, a pale block behind it the back of the head: a battleaxe held in BOTH hands. The LEFT fist is the lower hand, near the butt; the RIGHT fist is the upper hand and SLIDES.",
         hit='THE CHOP, coming down',
         words='Griz, 11-19, to the lanes desk: "have him jump and really really chop"; of the strip, "that\'s a good brann strip"; and of the hands, "fix the hand spacing, apart and sliding together".',
         changed="""NEW as a guide (the strip he approved on 11-19 was not sent). Since then only THE HANDS changed, as on the human greataxe guide: wide on
the haft in the guard and the coil, together by the butt on frames 4 and 5.""",
         frames=["THE GUARD -- the axe at port across his chest, the knees already bent; the hands wide on the haft.",
                 "THE COIL -- sunk deep on both legs, the axe going up his right side, the hands still wide.",
                 "THE TOP OF THE JUMP -- both feet off the floor and drawn up, his back arched, the axe laid back over his head.",
                 "THE CHOP, coming down -- still in the air, the left foot reaching for the floor. The right hand has slid down to the left: the fists together by the butt, the arms thrown out, the blade down through the foe's collar.",
                 "LANDED -- both feet down ahead of where he stood, the knees deep, the blade driven to the floor, the hands still together.",
                 "Stepping back; the right hand slides back up the haft as the axe comes up to the guard."]),
    dict(move='warhammer-and-shield', title='Warhammer BLOW over a round shield (dwarf)', replaces=None,
         sets=[('warhammer-and-shield-dwarf', 'WARHAMMER-AND-SHIELD-DWARF', 'hammershield', 'hammershield-dwarf-%s', 'hammershield-dwarf-all', 'hammershield-dwarf', "the gate watch's fight figure (`gatewatch_p2`), the garrison trooper's size")],
         weapon="The brown bar is the hammer's HAFT, the MAGENTA block its square HEAD, the pale spike behind it the back spike; the grip in the RIGHT fist. The TEAL disc is the round SHIELD on the LEFT forearm, its boss darker.",
         hit='THE BLOW',
         words='For Captain Halldor Silversands and Hedda Greyseam (warhammer and shield). The beats are the battleaxe-and-shield guide\'s of 11-12.',
         changed="""NEW. It takes the place of GUIDE-2026-11-12-battleaxe-and-shield for the two who carry a WARHAMMER. One thing differs from that guide beyond
the weapon: on frame 4 the arm is out long and the hammer is one line with the forearm, its head down on the mark (the axe guide had the
axe still cocked up off a level arm at the cut).""",
         frames=["POSITION ONE -- the hammer up in front of the right shoulder, the shield across the front.",
                 "The draw -- the hips turned, the LEFT side and the shield forward; the right hand to the ear, the hammer's head back over the shoulder.",
                 "Coming round -- the hips turning back, the knees going down, the elbow leading, the head of the hammer still high.",
                 "THE BLOW -- over the shield's rim: the knees down three inches, the arm out long, the hammer one line with the forearm, its head on the mark (a grown man's hip; a dwarf's shoulder).",
                 "The finish -- the hips past the middle, the hammer down and across by the left knee, the shield still forward.",
                 "Nearly back to position one."]),
    dict(move='two-shortswords-thrust', title='Shortsword THRUST, a blade in each hand (dwarf)', replaces=None,
         sets=[('two-shortswords-thrust-dwarf', 'TWO-SHORTSWORDS-THRUST-DWARF', 'twinshort', 'twinshort-dwarf-%s', 'twinshort-dwarf-all', 'twinshort-dwarf', "the gate watch's fight figure (`gatewatch_p2`)")],
         weapon="The two MAGENTA bars are the BLADES, a ring at each guard: a shortsword in EACH fist. The RIGHT one thrusts; for the left-hand attack mirror the strip.",
         hit='THE STAB',
         words="For the sect's blade (two short swords): Attack is this strip; Attack 2 is the same beats mirrored, the LEFT blade thrusting.",
         changed="NEW. The right arm's beats are the shortsword stab guide's of this date (the thrust level, the blade one line with the forearm on frame 4); the left hand carries a second blade.",
         frames=["Crouched a little, both blades low and forward.",
                 "Chambered -- the right fist drawn back to the right hip, its point at the target; the LEFT side forward and the left blade out ahead, covering.",
                 "The drive -- the knees going down, the hips coming round, the right fist passing the hip.",
                 "THE STAB -- the right hip and shoulder driven through, the arm and the blade one straight line; the left blade drawn back to the left hip.",
                 "The withdrawal -- the right fist straight back along the same line.",
                 "Both blades low and forward again."]),
    dict(move='bar-and-knife', title='One-handed BAR SWING and left-hand KNIFE STAB (human)', replaces=None,
         sets=[('bar-swing-human', 'BAR-SWING-HUMAN', 'barknife', 'barknife-alone-%s', 'barknife-alone-all', 'barknife', "the crew boss's fight figure (`crewboss_p1`)"),
               ('knife-stab-human', 'KNIFE-STAB-HUMAN', 'knifestab', 'knifestab-alone-%s', 'knifestab-alone-all', 'knifestab', "the crew boss's fight figure (`crewboss_p1`)")],
         weapon="The long MAGENTA bar with the hooked end is the PRY-BAR, in the RIGHT fist; the short magenta bar is the long KNIFE, in the LEFT fist.",
         hit='THE BLOW (the bar) / THE STAB (the knife)',
         words='For Hask (pry-bar and knife). Two rows: `bar-swing-human/` is his Attack, `knife-stab-human/` his Attack 2.',
         changed="""NEW. The bar swing is the one-handed slash guide's beats of this date with a knife in the left hand. The knife stab is its own row: a jab
with the LEFT hand off the leading (left) foot.""",
         frames=["THE BAR SWING -- 1 the bar up in front, the knife low in the left hand. 2 the hips turned, the LEFT side forward and the knife out ahead at the enemy; the bar hand to the ear. 3 the hips coming round, the knees going down, the arm unfolding. 4 THE BLOW: the arm out long, the bar one line with the forearm, on the foe's neck at the shoulder. 5 through: the hips past the middle, the bar down and across, the knife hand back at the left hip. 6 nearly back.",
                 "THE KNIFE STAB -- 1 the same guard. 2 the knife fist drawn back to the LEFT hip, its point at the target; the right side and the bar turned forward, covering. 3 the drive: the knees going down, the hips coming round the other way. 4 THE STAB: the left hip and shoulder driven through, the left arm and the knife one straight line at the belly; the bar drawn back by the right shoulder. 5 straight back along the same line. 6 nearly back."]),
    dict(move='pike-thrust', date='2026-11-20b', title='PIKE THRUST, two hands, along the hip (dwarf)', replaces='GUIDE-2026-11-20-pike-thrust (sent 11-20)',
         sets=[('pike-thrust-dwarf', 'PIKE-THRUST-DWARF', 'pike', 'pike-dwarf-%s', 'pike-dwarf-all', 'pike-dwarf', "the gate watch's fight figure (`gatewatch_p2`), the garrison trooper's size")],
         weapon="The long thin brown bar is the PIKE's shaft, MAGENTA at its head: 2.7 m, twice his height. His RIGHT fist holds the BUTT on every frame; his LEFT hand is ahead on the shaft, and the shaft SLIDES through it on the thrust.",
         hit='THE THRUST',
         words='For the pike trooper of the garrison\'s pike wall. Griz, 11-20, asked whether the pike lifts to the shoulder or stays along the hip: "hip".',
         changed="""WHAT CHANGED from the guide sent earlier on 11-20: FRAMES 2, 3 and 4. That guide lifted the pike to the shoulder on frame 2 and thrust
from there. Now the pike stays ALONG THE HIP on every frame: drawn back at the hip, the step, and the thrust driven forward along the hip.
Frames 1, 5 and 6 are as they were.""",
         frames=["THE GUARD -- side-on, the left side and the left foot forward; the pike level at the hip, the butt in the right fist behind the right hip, the left hand ahead on the shaft; the weight back.",
                 "DRAWN BACK along the hip -- the rear arm long behind him, the butt well back, the weight on the rear leg. The pike does not rise.",
                 "THE STEP -- the weight going forward, the left foot off the floor; the pike still drawn back at the hip.",
                 "THE THRUST -- the foot down; the right hand driven forward along the hip till it meets the left, the shaft run out through the left hand to its farthest reach; both arms driving, the point level at the height of his hip.",
                 "Drawn back -- the shaft pulled back through the left hand; the foot coming back.",
                 "The guard at the hip again."]),
    dict(move='shield-wall-push', title="SHIELD WALL: shields set, and THE PUSH (dwarf) -- the Soldiering feat's row", replaces=None,
         sets=[('shield-wall-push-dwarf', 'SHIELD-WALL-PUSH-DWARF', 'shieldpush', 'shieldpush-dwarf-%s', 'shieldpush-dwarf-all', 'shieldpush-dwarf', "the gate watch's fight figure (`gatewatch_p2`), the garrison trooper's size")],
         weapon="The TEAL disc is the round SHIELD, its boss darker: it is strapped on the LEFT forearm (the mannequin carries it a little ahead of the fist so its face can be seen: draw it on the forearm, its face square to the enemy on every frame). The brown bar with the MAGENTA block is the weapon in the RIGHT fist, a warhammer here: draw the character's own. It never strikes in this row: it is carried cocked at the right shoulder throughout.",
         hit='THE SHOVE',
         words='Griz, 11-20, to the lanes desk: "yeah, start the pose seat on the predicted rows for the dwarves the soldiering feat would add please". Of the wall, to the feats seat: "does a +2 AC and 1d6 blunt damage shove each round, pushing back what\'s in front of the shield wall 5 ft and moving the wall into the square they just cleared".',
         changed="""NEW. For every dwarf who bears a shield in the wall (Halldor and Hedda with warhammers; a trooper with a battleaxe makes the same move).
FRAME 1 is also the stance a soldier stands in while shields are set: the row can be held on it. Posed on MS I.33 (1r, the shield led out
to the full length of the arm with the weapon laid back over the right shoulder); I.33's shield is a buckler in the fist, ours is on the forearm.""",
         frames=["SHIELDS SET -- the knees bent, the left side and the shield forward, the rim up at the chin; the weapon cocked at the right shoulder. The wall's standing pose.",
                 "THE COIL -- sunk on both legs, the weight back, the shield drawn in tight to the left shoulder.",
                 "THE DRIVE -- off the rear leg, the rear heel up, the left foot leaving the floor, the shoulder going in behind the shield.",
                 "THE SHOVE -- the left foot down ahead; the shield punched out to the arm's length with the whole body behind it, the head down behind the rim. The enemy is thrown back a pace.",
                 "THE STEP -- upright again over the forward foot, into the square the shove cleared, the shield coming back to the set. (The game moves him one square here; draw him in place.)",
                 "SHIELDS SET again."]),
    dict(move='pike-rank', title="PIKE RANK: the thrust through the wall, the feet planted (dwarf) -- the Soldiering feat's row", replaces=None,
         sets=[('pike-rank-dwarf', 'PIKE-RANK-DWARF', 'pikerank', 'pikerank-dwarf-%s', 'pikerank-dwarf-all', 'pikerank-dwarf', "the gate watch's fight figure (`gatewatch_p2`), the garrison trooper's size")],
         weapon="The long thin brown bar is the PIKE's shaft, MAGENTA at its head: 2.7 m. His RIGHT fist holds the BUTT on every frame; his LEFT hand is ahead on the shaft, and the shaft SLIDES through it.",
         hit='THE THRUST',
         words='Griz, 11-20, to the lanes desk: "yeah, start the pose seat on the predicted rows for the dwarves the soldiering feat would add please"; and of the pike, "hip". The rule: a soldier with a pike, standing in the square behind a shield-bearer, strikes through the wall.',
         changed="""NEW. It is the pike thrust guide (GUIDE-2026-11-20b-pike-thrust) with ONE difference: a mate stands in the square ahead of him, so NEITHER
FOOT LEAVES ITS PLACE. The reach comes from the arms, the hips and the lean. Frame 1 is the hold: the pike levelled along the hip and
already out past the mate in front, the pose he stands in behind the wall.""",
         frames=["THE HOLD -- side-on in a long planted stance, the left foot ahead; the pike levelled along the hip and out past the mate in front; the butt in the right fist behind the hip.",
                 "DRAWN BACK through the left hand -- the rear arm long behind him, the weight on the rear leg. The feet do not move.",
                 "THE COIL -- the knees sinking, the weight coming to the middle.",
                 "THE THRUST -- the right hand driven forward along the hip to the left hand, the shaft run out through it; the hips turn and the body leans in behind it; the rear heel lifts, but neither foot leaves its place.",
                 "Drawn back through the left hand.",
                 "The hold again."]),
]

# SOLDIERING ON THE HUMAN BUILD (11-21, the pose seat pose-1121). Griz, 11-20: "we'll need soldiering posings for non-dwarfs"; 11-21, to the
# lanes desk, "Go on 1-5". HELD: which human troops get the feat is his to say, so these wait in the art desk folder and go with no ask.
_HUMAN = "the Line Guard's fight figure (`guard_p2`), the human trooper the art desk drew"
_HELD = 'For the troops Griz named on 2026-11-21 ("Dominion still needs it, and the Silverton fighters from the stable that isn\'t Bloodtusk\'s"): it travels with the asks that name it (ASK-2026-11-21-line-guard-soldiering, ASK-2026-11-21-dominion-troops).'      # (posed HELD till his word; released on "you can outbox any ask you want", 11-21)
G += [
    dict(move='shield-wall-push-human', date='2026-11-21', held=_HELD, title="SHIELD WALL: shields set, and THE PUSH (human) -- the Soldiering feat's row", replaces=None,
         sets=[('shield-wall-push-human', 'SHIELD-WALL-PUSH-HUMAN', 'shieldpush', 'shieldpush-alone-%s', 'shieldpush-alone-all', 'shieldpush', _HUMAN)],
         weapon="The TEAL disc is the round SHIELD, its boss darker: it is strapped on the LEFT forearm (the mannequin carries it a little ahead of the fist so its face can be seen: draw it on the forearm, its face square to the enemy on every frame). It is a man's shield, about 0.6 m across, covering him from the shoulder to the hip. The brown bar with the MAGENTA block is the weapon in the RIGHT fist, a warhammer here: draw the character's own. It never strikes in this row: it is carried cocked at the right shoulder throughout.",
         hit='THE SHOVE',
         words='Griz, 11-20: "we\'ll need soldiering posings for non-dwarfs". The dwarf\'s row is GUIDE-2026-11-20-shield-wall-push; his rulings on it hold here: ONE strip for every shield-bearer, whatever the weapon.',
         changed="""NEW: the dwarf's shield-wall push (GUIDE-2026-11-20-shield-wall-push) on a man. The beats are the dwarf's. Two things differ, both
for a man's proportions: his shield is bigger (the dwarf's 0.43 m disc on a man reads as a buckler), and on frame 4 his shield arm is
punched out a little LOWER -- a dwarf's arm out level lands the shield on a grown man's chest, a man's would land it at the foe's face.
FRAME 1 is also the stance a soldier stands in while shields are set: the row can be held on it.""",
         frames=["SHIELDS SET -- the knees bent, the left side and the shield forward, the rim up at the chin; the weapon cocked at the right shoulder. The wall's standing pose.",
                 "THE COIL -- sunk on both legs, the weight back, the shield drawn in tight to the left shoulder.",
                 "THE DRIVE -- off the rear leg, the rear heel up, the left foot leaving the floor, the shoulder going in behind the shield.",
                 "THE SHOVE -- the left foot down ahead; the shield punched out at the height of the foe's chest with the whole body behind it, the head down behind the rim. The enemy is thrown back a pace.",
                 "THE STEP -- upright again over the forward foot, into the square the shove cleared, the shield coming back to the set. (The game moves him one square here; draw him in place.)",
                 "SHIELDS SET again."]),
    dict(move='pike-rank-human', date='2026-11-21', held=_HELD, title="PIKE RANK: the thrust through the wall, the feet planted (human) -- the Soldiering feat's row", replaces=None,
         sets=[('pike-rank-human', 'PIKE-RANK-HUMAN', 'pikerank', 'pikerank-alone-%s', 'pikerank-alone-all', 'pikerank', _HUMAN)],
         weapon="The long thin brown bar is the PIKE's shaft, MAGENTA at its head: 2.7 m. His RIGHT fist holds the BUTT on every frame; his LEFT hand is ahead on the shaft, and the shaft SLIDES through it.",
         hit='THE THRUST',
         words='Griz, 11-20: "we\'ll need soldiering posings for non-dwarfs"; and of the pike, "hip". The dwarf\'s row is GUIDE-2026-11-20-pike-rank; it keeps its own strip beside the thrust (his ruling).',
         changed="""NEW: the dwarf's pike rank (GUIDE-2026-11-20-pike-rank) on a man: the pike thrust with NEITHER FOOT LEAVING ITS PLACE (a mate stands
in the square ahead). One thing differs, for a man's longer arm: on the hold, the coil and the return the butt sits further back behind
his hip, so the rear arm is LONG behind him (at the dwarf's places a man's elbow folded up behind him). The left hand is where the
dwarf's is; the thrust (frame 4) is the dwarf's.""",
         frames=["THE HOLD -- side-on in a long planted stance, the left foot ahead; the pike levelled along the hip and out past the mate in front; the butt in the right fist behind the hip, the rear arm long.",
                 "DRAWN BACK through the left hand -- the rear arm long behind him, the weight on the rear leg. The feet do not move.",
                 "THE COIL -- the knees sinking, the weight coming to the middle.",
                 "THE THRUST -- the right hand driven forward along the hip to the left hand, the shaft run out through it; the hips turn and the body leans in behind it; the rear heel lifts, but neither foot leaves its place.",
                 "Drawn back through the left hand.",
                 "The hold again."]),
    dict(move='pike-thrust-human', date='2026-11-21', held=_HELD, title='PIKE THRUST, two hands, along the hip (human)', replaces=None,
         sets=[('pike-thrust-human', 'PIKE-THRUST-HUMAN', 'pike', 'pike-alone-%s', 'pike-alone-all', 'pike', _HUMAN)],
         weapon="The long thin brown bar is the PIKE's shaft, MAGENTA at its head: 2.7 m. His RIGHT fist holds the BUTT on every frame; his LEFT hand is ahead on the shaft, and the shaft SLIDES through it on the thrust.",
         hit='THE THRUST',
         words='Griz, 11-20: "we\'ll need soldiering posings for non-dwarfs"; and, asked whether the pike lifts to the shoulder or stays along the hip: "hip". The dwarf\'s row is GUIDE-2026-11-20b-pike-thrust.',
         changed="""NEW: the dwarf's pike thrust (GUIDE-2026-11-20b-pike-thrust) on a man, the pike along the hip on every frame. One thing differs, for a
man's longer arm: on the guard, the step and the return the butt sits further back behind his hip, so the rear arm is LONG behind him (at
the dwarf's places a man's elbow folded up behind him). The left hand is where the dwarf's is; the thrust (frame 4) is the dwarf's.""",
         frames=["THE GUARD -- side-on, the left side and the left foot forward; the pike level at the hip, the butt in the right fist behind the right hip, the rear arm long; the left hand ahead on the shaft; the weight back.",
                 "DRAWN BACK along the hip -- the rear arm long behind him, the butt well back, the weight on the rear leg. The pike does not rise.",
                 "THE STEP -- the weight going forward, the left foot off the floor; the pike still drawn back at the hip.",
                 "THE THRUST -- the foot down; the right hand driven forward along the hip till it meets the left, the shaft run out through the left hand to its farthest reach; both arms driving, the point level at the height of his hip.",
                 "Drawn back -- the shaft pulled back through the left hand; the foot coming back.",
                 "The guard at the hip again."]),
]


def main():
    made = []
    for g in G:
        if ONLY and g['move'] not in ONLY:
            continue
        date = g.get('date', DATE); name = 'GUIDE-%s-%s' % (date, g['move']); d = os.path.join(OUT, name)
        if os.path.isdir(d):
            shutil.rmtree(d)
        os.makedirs(d); sizes = []
        for folder, pre, art, stem, allstem, work, who in g['sets']:
            sd = os.path.join(d, folder); os.makedirs(sd)
            for v in VIEWS:
                shutil.copyfile(os.path.join(ROOT, 'deep16', 'art-src', art, (stem % v) + '.png'), os.path.join(sd, '%s-%s.png' % (pre, v)))
            shutil.copyfile(os.path.join(ROOT, 'deep16', 'art-src', art, allstem + '.png'), os.path.join(sd, pre + '-ALL-VIEWS.png'))
            shutil.copyfile(os.path.join(ROOT, 'deep16', '_src', work, 'render', work + '-poses.json'), os.path.join(sd, pre.lower() + '-poses.json'))
            m = json.load(open(os.path.join(ROOT, 'deep16', '_src', work, 'render', 'meta.json')))
            sizes.append('- `%s/`: the mannequin stands exactly as tall as %s: %d pixel rows from crown to sole at the game\'s size. In the strips it is drawn at FOUR times that. `%s-poses.json` is the positions the strips were rendered from.'
                         % (folder, who, m['hero_rows'], pre.lower()))
        T = ['# SPECIAL MOVE GUIDE -- %s, %s' % (g['title'], date), '',
             'From the engine team (DRAGONSLEEP, the second game; the pose seat, for the lanes desk). Not an ask by itself: a pose guide that travels beside the ask that names it.',
             ('**It REPLACES %s.** Use this one from here on.' % g['replaces']) if g['replaces'] else '**A new guide.**', ''] + \
            (['**' + g['held'] + '**', ''] if g.get('held') else []) + [
             g['words'], '',
             'What it is: a plain jointed mannequin posed in Blender doing the move, rendered with the game\'s own camera in the five drawn views (S, SE, E, NE, N), one scale across all five. You draw the character over it -- "skin these figures with this character". One strip a view (`...-<view>.png`) and all five on one page (`...-ALL-VIEWS.png`).', '',
             'SIZE -- crown to sole:'] + sizes + ['Draw it large; the cutter brings it down. The same scale in every frame, every view and every row. Keep the CHARACTER\'s own build from the character\'s own pages, and the mannequin\'s height, joints and timing.', '',
             READ % (g['weapon'], g['hit']), '', LAW, '', g['changed'], '', 'Frame by frame:'] + \
            (['%d. %s' % (i + 1, f) for i, f in enumerate(g['frames'])] if len(g['frames']) == 6 else ['- ' + f for f in g['frames']]) + ['',
             ('This is the pose seat\'s reading of the move against the period plates, on a man\'s proportions. Griz had not seen the strips when it was packaged; if a corrected set follows, it replaces this one under a new name.' if g.get('held') else
              'This is the pose seat\'s reading of the move against the period plates. Griz had been sent the strips and had not yet answered when it was packaged; if a corrected set follows, it replaces this one under a new name.'), '']
        open(os.path.join(d, name + '.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(T))
        z = os.path.join(OUT, name + '.zip')
        with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
            for dp, _, fs in os.walk(d):
                for f in sorted(fs):
                    p = os.path.join(dp, f); zf.write(p, os.path.join(name, os.path.relpath(p, d)))
        made.append(z)
    print('guide-pack: %d guides ->' % len(made)); [print('  ' + m) for m in made]


if __name__ == '__main__':
    main()
