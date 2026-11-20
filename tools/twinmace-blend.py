"""The mannequin's TWIN STRIKE with two maces (11-12): the second family of pose references for the art desk to skin, after the one-handed
slash (tools/mannequin-blend.py, 10-31). Griz, 11-12: "pyro is going to need twin-strike for his maces. I'm thinking twin-strikes will vary by
weapon type. Pyro with two maces would draw back raising both arms while reeling in the elbows to extend a straight swing that would bash both
the left and right shoulders of a stationary humanoid mannequin - whereas a scimitar twin-strike the wrists would turn out as the arms raised
and the strike would be more like an X in front of him." And on the figure: "look at the mannequin (joint articulation, wrist and ankles would
help as I recall it)".

    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --python tools/twinmace-blend.py -- build [hero=barley_p3] [ss=8]
    ... -- poser        the same, and deep16/_src/twinmace/poser.json for tools/poser.html?fig=twinmace (gitignored)
    ... -- hit          no renders: where each mace's head is at THE HIT against the target's shoulders, and each wrist's angle
    ... -- poser kit=sword                the ONE-HANDED SLASH re-posed on this figure (below): deep16/_src/slash1h/, ?fig=slash1h
    ... -- poser build=dwarf target=0     the DWARF-proportioned striker and no target (his 11-12: "remove the mannequin target and do a set
                        with the position mannequin with dwarf proportions"): deep16/_src/twinmace-dwarf/, tools/poser.html?fig=twinmace-dwarf;
                        sized to pyro_p0's idle unless hero= says otherwise

    ... -- poser kit=axe+shield build=dwarf     THE GARRISON'S THREE (11-12, below): the battleaxe cut behind a round shield
    ... -- poser kit=handaxe build=dwarf        (deep16/_src/axeshield-dwarf/), the handaxe throw (handaxe-dwarf/) and the heavy crossbow
    ... -- poser kit=crossbow build=dwarf       shot (crossbow-dwarf/); sized to gatewatch_p2's idle; target=0 leaves the target out

Then `python tools/twinmace-sheet.py` lays the reference strips (deep16/art-src/twinmace/).

What is new on the slash's mannequin (its bones, capsules and colours are tools/mannequin-blend.py's, imported):
  - BOTH hands are fists on a wrist: each hand runs on from the wrist along the forearm to the fist, its hand bone starts at the fist and points
    along the weapon, and each mace sits LOCK degrees off its forearm on every frame (the wrists lock; his word on the first pass).
  - The wrists and the ankles are MARKED: a yellow ball at each, so the joint reads on the page and the art desk sees the hand turn on the
    forearm and the foot on the shin. The ankles work in this row: the heels come up at the top of the draw (legs' `pitch`) and drop at the hit.
  - A mace in each fist: a dark haft and a round head, his LEFT mace's head gold and his RIGHT's magenta (the sides must read: the cutter mirrors).
  - THE TARGET: a pale standing figure in front of him, facing him -- "a stationary humanoid mannequin" -- a pad on each shoulder. It rides a
    bone of its own that the hips' moves leave alone (blender_pose's `still`), so it stands where it stands in Blender and on the poser page.
    It is in the modeling renders and the poser; the sprite cells (render/<row>/) are the striker alone.

Rows (blender_pose frames: the feet placed, each wrist placed from its shoulder, each hand aimed along a world direction, the elbows' poles):
    IDLE 1      the stance, both maces lowered, heads forward and down.
    TWINMACE 6  1 POSITION ONE (both maces up in front; the wrists set here and LOCKED for the whole row), 2 hands to the ears (the elbows fold,
                the shoulders raise the arms; the heads go back over the shoulders), 3 the shoulders further up as the torso starts forward and
                the knees lower it, 4 THE STRIKE (the release frame, index 3: the elbows extend and the shoulders come down, a head on each of
                the target's shoulders, the hips and legs already pulling the torso back), 5 on the way back, 6 nearly idle. 12 fps.

THE GARRISON'S KITS (11-12, Griz to the lanes desk: "have a fable seat start the mannequin maker for the attacks we're asking for, it has a
one-handed slash already"): Solskaft's trooper re-kitted -- a one-handed battleaxe and a round shield, handaxes to throw, a heavy crossbow for
the wall. Three kits beside `maces` and `sword`, each a row of six with the hit on frame 4 (rows_garrison):
    AXECUT 6    kit=axe+shield  the one-handed slash's frames with a battleaxe in the right fist and a round shield on the left forearm, held
                between him and the target the whole way. The axe is LOCKED off its forearm on every frame, the cut included: the target is
                stood where the edge comes down.
    THROW 6     kit=handaxe     overhand, the shield still on the left arm: from the hip, back past the ear, a short step, RELEASED on 4 (the
                axe is in the fist on 1-4 and gone on 5 and 6), the follow-through, the foot drawn back.
    SHOOT 6     kit=crossbow    both hands, the shield slung on his back: low and ready, up, the stock settled to the right shoulder and
                sighted, LOOSED on 4 (the bolt gone, the string forward), the kick, lowered. The crossbow is held level.
THE ROAD PATROL'S TWO (11-12, Griz to the lanes desk: "tell the mannequin seat it can run to the limit if it has to, but to do a dwarf with a
longbow and a short-sword stab (with shield if applicable)"): the SRD Scout as a dwarf, who carries no shield.
    SHOOT 6     kit=longbow     the bow taller than he is in the LEFT fist, the shortsword sheathed at his left hip: nocked and low, raised
                and half drawn, drawn to the cheek, LOOSED on 4 (the arrow gone, the string forward, the right hand still at the cheek), the
                bow arm's follow-through, lowered.
    STAB 6      kit=stab        a shortsword in the right fist, the bow slung on his back, the left hand free: position one, the fist drawn
                back to the right hip with the point at the target, the drive, THE STAB on 4 (the point laid on the target's belly: the one
                frame it is aimed), the withdrawal, nearly idle. The wrist's lock already points the blade up and forward off a lowered
                forearm, so the thrust rises from the hip.
What they add to the figure: a hand can be ROLLED about its aim (blender_pose's `handsup`: an axe's edge and a crossbow's bow must face
somewhere; a bar and a ball did not care), and a held thing can be there on some frames and gone on others (its size keyed).

LYMEN'S SLASH (11-13, Griz to the lanes desk: "default lymen is shield and longsword, can we get a mannequin with a shield working the slash ?"):
    ... -- poser kit=sword+shield         the ONE-HANDED SLASH above, its frames as they are, with Lymen's round shield on the LEFT forearm
                        (deep16/_src/slashshield/, tools/poser.html?fig=slashshield; the human build, sized to barley_p3). The shield is
                        the one his fight sheet carries (deep16/art/lymen_p0.png: round, rimmed and bossed, shoulder to hip -- LYSHIELD_R),
                        bigger than the garrison's. RE-POSED the same day to his gist (rows_slash, the SWSH frames): the hips twist
                        and the shield goes forward as the sword arm rises; the hips swing back the other way as the sword comes down;
                        the hit opens the target's torso from its left shoulder to its right hip.

TALMOK'S GREATAXE (11-19, Griz to the lanes desk: "confirm we need the attack, then have a blender seat do a human great-axe overhand chop
attack row to send to the art desk with a talmok request"):
    ... -- build kit=greataxe             THE OVERHAND CHOP, both hands on one haft (deep16/_src/greataxe/; the human build, sized to
                        talmok_p2's idle unless hero= says otherwise). Then `python tools/twinmace-sheet.py greataxe`.
    CHOP 6      kit=greataxe    1 the guard (the axe at port across his chest, its head up by the right shoulder), 2 the lift up his right
                side, 3 THE TOP (the hands over his brow, the axe laid back over his head, the left foot coming off the floor and forward),
                4 THE CHOP (the foot down, the arms thrown out level, the blade down through the target's collar), 5 through and low (the
                blade by the floor in front, the knees deep), 6 the foot drawn back, the axe coming up to guard.
What it adds: a frame is THE HAFT -- where the right fist is (metres: across, forward, above the floor) and which way the haft points -- and
the left fist is SPACE down the haft from the right on every frame; each wrist is then walked in till its fist is on its mark (rows_greataxe).
The edge leads the swing: square to the haft, in the plane the haft swings in.

THE GUARD'S SPEAR (11-19, Griz: "do an art request for human spear users, include thrown spears"; and of the feat Long Guard's Keep Back,
"not the thrust, but do one for pushback"): two rows on the greataxe's way of posing, the human build, sized to guard_p2's idle.
    ... -- build kit=spearthrow           THROW 6: 1 the spear up to the right shoulder, 2 drawn back past the ear with the left side and
                        hand forward, 3 the left foot stepping, the elbow leading, 4 THE RELEASE (the arm out high and forward: the spear in
                        the fist on 1-4 and gone on 5 and 6), 5 the empty hand down and across, 6 the foot drawn back.
    ... -- build kit=spearpush            KEEPBACK 6, THE POINT OUT (re-posed the same day on his word: "why would a push like that keep
                        things 10 feet away / I see it point-end out, but like extend on 2, point on 3, point in a different spot on 4,
                        quick return on 5 - like they're stabbing empty space to keep the foe out of that space"; the first pose was a
                        shove with the haft held across him). Both hands, the right the rear: 1 the guard, the point forward and up,
                        2 EXTEND (the spear run out level), 3 a jab high, 4 a jab LOW and to the other side, 5 the quick return, 6 the
                        guard. The feet never move; the point stops short of the target: it stabs the space.
Then `python tools/twinmace-sheet.py spearthrow` and `... spearpush`.

THE POSES AGAINST THE PLATES (11-20, the pose seat; Griz to the lanes desk: "fable poses with plate help for every strip we've already sent
to art desk, then the new ones"; the plates are deep16/_src/pose-refs/, his rulings of 11-19 its review's section 5a):
    - KEEP BACK: the rear fist at the BUTT (SBUTT), the hands SPUSH apart, the rear arm long and low and driving (de Gheyn 14/23/29, Fiore 39r-40r).
    - THE GREATAXE, Talmok's and Brann's: THE SLIDING HAND -- wide on the haft in the guards, together by the butt as the blow lands (`sp`).
    - THE HIT FRAME OF A ONE-HANDED ROW: the wrist's lock is let go on frame 4 only, and the arm is posed so the weapon comes into line
      with the forearm there (Fiore 20v/21r: every landed blow has the blade one line with the forearm). The slash (man and dwarf) and
      the stab are re-posed so; the rows no plate bears on (the round shield, the maces, the bows, the throws) are as they were sent.
THE NEW KITS, for the held fight sheets (deep16-art-wanted.md 88, 89, 92, 93), one a distinct kit:
    ... -- build kit=hammer+shield build=dwarf     HAMMER 6: Halldor's and Hedda's, a warhammer over the round shield's rim (the axe cut's beats)
    ... -- build kit=twinshort build=dwarf         STAB 6: the sect's blade, a shortsword in each fist, the RIGHT one thrusting (Attack 2 mirrors it)
    ... -- build kit=bar                           SWING 6: Hask's pry-bar swung one-handed, a long knife in the left fist (the human build, crewboss_p1's size)
    ... -- build kit=knife                         STAB 6: Hask's knife, the left hand's jab off the leading foot, the bar held back
    ... -- build kit=pike build=dwarf              THRUST 6: the pike trooper -- 1 level at the hip, 2 drawn back and up to the charge at the
                        shoulder (de Gheyn 14: the rear arm straight back along the shaft, the left hand at the chin), 3 the step, 4 THE THRUST
                        (the rear hand driven up to the front one, the shaft run out through it), 5 drawn back, 6 the hip. The butt in the right fist.
"""
import bpy, bmesh, sys, os, math, json, importlib.util
import numpy as np
from mathutils import Vector, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, 'deep16', '_src', 'twinmace')


def _load(name, file):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'tools', file))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


MQ = _load('mannequin_blend', 'mannequin-blend.py')      # (builds nothing on import: its bones, pieces, camera and measures)
BP = MQ.BP
U, lin, FACINGS, PAD, K = MQ.U, MQ.lin, MQ.FACINGS, MQ.PAD, MQ.K
MODE, SS = MQ.MODE, MQ.SS
LOG = '[twinmace]'
KIT = MQ.OPT.get('kit', 'maces')          # maces: a mace a fist, the twin strike. sword: one blade in the right fist, the one-handed slash (11-12)
ROW = 'twinmace' if KIT == 'maces' else 'slash'
if KIT == 'sword':
    WORK = os.path.join(ROOT, 'deep16', '_src', 'slash1h'); LOG = '[slash1h]'
SWSH = KIT == 'sword+shield'              # Lymen's (11-13): the same slash, a round shield on the left forearm
if SWSH:
    WORK = os.path.join(ROOT, 'deep16', '_src', 'slashshield'); LOG = '[slashshield]'
GARR = {'axe+shield': ('axeshield', 'axecut'), 'handaxe': ('handaxe', 'throw'), 'crossbow': ('crossbow', 'shoot'), 'longbow': ('longbow', 'shoot'), 'stab': ('stab', 'stab'), 'greataxe': ('greataxe', 'chop'), 'spearthrow': ('spearthrow', 'throw'), 'spearpush': ('spearpush', 'keepback'),
        'hammer+shield': ('hammershield', 'hammer'), 'twinshort': ('twinshort', 'stab'), 'bar': ('barknife', 'swing'), 'knife': ('knifestab', 'stab'), 'pike': ('pike', 'thrust')}     # the garrison's kits (11-12): the folder and the row
if KIT in GARR:
    WORK = os.path.join(ROOT, 'deep16', '_src', GARR[KIT][0]); ROW = GARR[KIT][1]; LOG = '[%s]' % GARR[KIT][0]
DWARF = MQ.OPT.get('build', 'human') == 'dwarf'
TARGET = MQ.OPT.get('target', '1') != '0'
if DWARF:
    WORK += '-dwarf'
    if 'hero' not in MQ.OPT:
        MQ.HERO = 'gatewatch_p2' if KIT in GARR else 'pyro_p0'     # (the garrison's troopers wear the gate watch's fight figure)
elif KIT == 'greataxe' and 'hero' not in MQ.OPT:
    MQ.HERO = 'talmok_p2'              # (Talmok's: the human build, as tall as his own idle stands)
elif KIT in ('spearthrow', 'spearpush') and 'hero' not in MQ.OPT:
    MQ.HERO = 'guard_p2'               # (the Line Guard's: the spear users' own figure)
elif KIT in ('bar', 'knife') and 'hero' not in MQ.OPT:
    MQ.HERO = 'crewboss_p1'            # (Hask's: as tall as the crew boss the art desk drew, his sheet's format reference)
# a dwarf on the same bones: the legs much shorter, the trunk a little shorter and a good deal wider and deeper, the limbs thick, the head big
LEGK, TRUNK, XK, YK, RK, HEADK, HK = (0.56, 0.90, 1.24, 1.18, 1.30, 1.14, 0.74) if DWARF else (1, 1, 1, 1, 1, 1, 1)


def zmap(z):
    """a height on the slash's figure, on this build: the boot as it is (to the ankle, 0.09), the leg by LEGK to the hip (0.95), the rest by TRUNK."""
    hip = 0.09 + (0.95 - 0.09) * LEGK
    return z if z <= 0.09 else 0.09 + (z - 0.09) * LEGK if z <= 0.95 else hip + (z - 0.95) * TRUNK


def pm(v):
    return (v[0] * XK, v[1] * (YK if v[2] > 0.09 else 1), zmap(v[2]))


def piece(kind, bone, colour, a):
    k = HEADK if colour in ('head', 'nose') else 1.0 if colour.startswith('foot') else RK
    if kind == 'egg':
        return (kind, bone, colour, (pm(a[0]), tuple(r * k for r in a[1])))
    return (kind, bone, colour, (pm(a[0]), pm(a[1]), a[2] * k))

COL = dict(MQ.COL, joint='#ffe14a', haft='#a8763e', headL='#ffd23c', headR='#ff2ed2', cap='#f4f0e0', dummy='#8fa89a', pad='#e6f2ea', dnose='#5f7a6c',
           shield='#3fb9a4', boss='#1f6f66', string='#f4f0e0', bolt='#ffd23c')
HAND = MQ.HAND
LOCK = 64                # (each mace's angle off its forearm, degrees, the same on every frame: his "wrists essentially lock at position 1")
HEADC = 0.47             # (the head's middle, along the hand bone from the fist)
HEADR = 0.078
MACE = [('pommel', 'grip', -0.075, -0.055, 0.030), ('grip', 'grip', -0.055, 0.06, 0.022), ('haft', 'haft', 0.06, 0.40, 0.022),
        ('head', 'HEAD', 0.40, 0.54, HEADR), ('cap', 'cap', 0.54, 0.57, 0.034)]
BLADE = 0.95             # (the sword's tip, along the hand bone from the fist: mannequin-blend's SWORD)
SHO = (0.19, 1.42, 0.065)          # the target's shoulder: half its width, its height, the bar's radius (the striker's own numbers)

# ------------------------------------------------------------------ the bones: the slash's, with both hands a fist on a wrist, and the target's
BONES = [(n, pm(h), pm(t), par) for n, h, t, par in MQ.BONES if not n.startswith('hand.')]
GRIPS = {}
for s, x in (('L', 1), ('R', -1)):
    e, w = Vector(pm((0.21 * x, 0.02, 1.14))), Vector(pm((0.22 * x, -0.04, 0.89))); g = w + (w - e).normalized() * HAND
    GRIPS[s] = (tuple(w), tuple(g))
    BONES.append(('hand.' + s, tuple(g), (g[0], g[1] - 0.08, g[2]), 'fore.' + s))
BONES.append(('dummy', (0, 0, 0), (0, 0, 0.30), None))

PIECES = [piece(*p) for p in MQ.PIECES if 'hand' not in p[2]]
for s, x in (('L', 1), ('R', -1)):
    w, g = GRIPS[s]
    PIECES += [('cap', 'fore.' + s, 'hand' + s, (w, g, 0.04 * RK)),                         # the back of the hand, on the forearm's line
               ('egg', 'hand.' + s, 'hand' + s, (g, (0.052 * RK,) * 3)),                    # the fist round the grip
               ('egg', 'fore.' + s, 'joint', (w, (0.050 * RK,) * 3)),                       # THE WRIST, marked
               ('egg', 'calf.' + s, 'joint', (pm((0.10 * x, 0.0, 0.09)), (0.058 * RK,) * 3))]   # THE ANKLE, marked

# the garrison's round shield (11-12): a domed disc strapped on the outside of the LEFT forearm (it faces the way the forearm's back does: across
# his front when the forearm lies across him), or slung flat on his back for the crossbow. A piece of the body, on its bone.
SHIELD_R = 0.215
LYSHIELD_R = 0.30        # Lymen's: 0.60 m across (about 24 in), a third of his height, as on lymen_p0
if KIT in ('axe+shield', 'handaxe', 'hammer+shield'):
    _w, _g = (Vector(v) for v in GRIPS['L']); _e = Vector(pm((0.21, 0.02, 1.14))); _c = _e + (_g - _e) * 0.62
    PIECES += [('egg', 'hand.L', 'shield', ((_c.x + 0.085, _c.y, _c.z), (0.026, SHIELD_R, SHIELD_R))),      # (on the HAND bone since 11-13, where it sat: rigid with the forearm until a frame aims the left hand, and then the shield turns with it -- his "give that freedom of movement to the other shields we have in the poser")
               ('egg', 'hand.L', 'boss', ((_c.x + 0.108, _c.y, _c.z), (0.030, 0.062, 0.062)))]
elif SWSH:                     # Lymen's round shield (11-13): the same disc, bigger -- his sheet's covers him from the shoulder to the hip.
    # It rides the left HAND bone, not the forearm (the garrison's way): the hand is aimed where the shield FACES and rolled so the shield
    # lies back along the forearm (rows_slash, `face`), which is the forearm's own roll -- so the arm can reach out and the face still be
    # turned to the target. At rest the hand bone points forward from the fist of a hanging arm: the disc stands in front of the knuckles,
    # its middle up toward the elbow.
    _g = Vector(GRIPS['L'][1])
    PIECES += [('egg', 'hand.L', 'shield', ((_g.x, _g.y - 0.075, _g.z + 0.15), (LYSHIELD_R, 0.028, LYSHIELD_R))),
               ('egg', 'hand.L', 'boss', ((_g.x, _g.y - 0.102, _g.z + 0.15), (0.075, 0.034, 0.075)))]
elif KIT == 'crossbow':
    _c = pm((0, 0.0, 1.27))
    PIECES += [('egg', 'spine2', 'shield', ((0, _c[1] + 0.185, _c[2]), (SHIELD_R, 0.026, SHIELD_R))),
               ('egg', 'spine2', 'boss', ((0, _c[1] + 0.208, _c[2]), (0.062, 0.030, 0.062)))]

elif KIT == 'longbow':         # the road patrol's (11-12): the shortsword sheathed at his left hip while he shoots
    _h = pm((0, 0, 0.95))[2]
    PIECES += [('cap', 'hips', 'haft', ((0.215, -0.03, _h + 0.02), (0.250, 0.24, _h - 0.20), 0.027)), ('cap', 'hips', 'guard', ((0.205, -0.07, _h + 0.05), (0.195, -0.15, _h + 0.10), 0.024))]

# the garrison's weapons, in the right hand bone's frame, metres from the fist: y along the weapon, z the way its EDGE faces (an axe) or its
# TOP (the crossbow), x across. ('rod', colour, p0, p1, r) a round bar; ('slab', colour, outline [(y, z)], thickness) a flat plate.
AXE = [('rod', 'grip', (0, -0.07, 0), (0, 0.05, 0), 0.022), ('rod', 'haft', (0, 0.05, 0), (0, 0.42, 0), 0.024),
       ('slab', 'blade', [(0.245, 0.0), (0.385, 0.0), (0.455, 0.185), (0.37, 0.210), (0.25, 0.210), (0.150, 0.185), (0.230, 0.075)], 0.036),   # the bearded head: its edge 0.30 long, the beard hanging toward the fist
       ('slab', 'tip', [(0.280, -0.02), (0.350, -0.02), (0.334, -0.070), (0.296, -0.070)], 0.036)]                                           # the poll behind it
HATCHET = [('rod', 'grip', (0, -0.05, 0), (0, 0.04, 0), 0.020), ('rod', 'haft', (0, 0.04, 0), (0, 0.30, 0), 0.020),
           ('slab', 'blade', [(0.185, 0.0), (0.275, 0.0), (0.315, 0.125), (0.24, 0.135), (0.165, 0.120), (0.195, 0.045)], 0.032)]                            # a throwing axe: plainly smaller
XBOW = [('rod', 'haft', (0, -0.235, 0), (0, 0.47, 0), 0.034),                                                         # the stock, the butt behind the fist
        ('rod', 'grip', (0, -0.235, 0), (0, -0.19, 0), 0.046),                                                         # the butt's end
        ('rod', 'blade', (0, 0.43, 0.012), (0.285, 0.365, 0.012), 0.027), ('rod', 'blade', (0, 0.43, 0.012), (-0.285, 0.365, 0.012), 0.027),   # the bow, as wide as his shoulders
        ('rod', 'tip', (0.285, 0.365, 0.012), (0.300, 0.36, 0.012), 0.032), ('rod', 'tip', (-0.285, 0.365, 0.012), (-0.300, 0.36, 0.012), 0.032),
        ('rod', 'guard', (0, 0.47, 0), (0, 0.515, 0), 0.040)]                                                          # the stirrup at its nose
XSPAN = [('rod', 'string', (0.290, 0.362, 0.03), (0, 0.105, 0.045), 0.009), ('rod', 'string', (-0.290, 0.362, 0.03), (0, 0.105, 0.045), 0.009)]   # the string drawn to the nut
XBOLT = [('rod', 'bolt', (0, 0.105, 0.052), (0, 0.50, 0.052), 0.013)]
XLOOSE = [('rod', 'string', (0.290, 0.362, 0.03), (-0.290, 0.362, 0.03), 0.009)]                                       # the string gone forward
SHORT = [('rod', 'grip', (0, -0.075, 0), (0, -0.05, 0), 0.032), ('rod', 'grip', (0, -0.05, 0), (0, 0.05, 0), 0.023), ('rod', 'guard', (0, 0.05, 0), (0, 0.07, 0), 0.075),
         ('rod', 'blade', (0, 0.07, 0), (0, 0.48, 0), 0.034), ('rod', 'tip', (0, 0.48, 0), (0, 0.58, 0), 0.030)]            # a shortsword: about two thirds of the slash's blade
# the longbow, in the LEFT hand bone's frame: y up the stave, z the way the arrow flies, the grip in the fist
BOWH, BOWZ, DHALF, DFULL, ARROW = 0.70, -0.13, 0.44, 0.74, 0.80
BOW = [('rod', 'blade', (0, 0, 0), (0, sy * 0.36, -0.035), 0.021) for sy in (1, -1)] + [('rod', 'blade', (0, sy * 0.36, -0.035), (0, sy * BOWH, BOWZ), 0.019) for sy in (1, -1)] + \
      [('rod', 'tip', (0, sy * (BOWH - 0.03), BOWZ + 0.006), (0, sy * BOWH, BOWZ), 0.025) for sy in (1, -1)] + [('rod', 'grip', (0, -0.06, 0), (0, 0.06, 0), 0.026)]
_string = lambda d: [('rod', 'string', (0, sy * BOWH, BOWZ), (0, 0, -d), 0.012) for sy in (1, -1)]
_arrow = lambda d: [('rod', 'bolt', (0.014, 0.012, -d), (0.014, 0.012, ARROW - d), 0.016)]
BOWPARTS = {'srest': _string(-BOWZ), 'shalf': _string(DHALF), 'sfull': _string(DFULL), 'anock': _arrow(-BOWZ), 'ahalf': _arrow(DHALF), 'afull': _arrow(DFULL)}
# ...and the longbow slung across his back while he stabs: in the upper spine bone's frame (y up it from its head, z his front, x across). A held
# thing and not a piece of the body: it stands above his crown, and the figure is sized by the body alone.
SLUNG = [('rod', 'haft', (-0.24, -0.50, -0.185), (0.0, 0.10, -0.215), 0.020), ('rod', 'haft', (0.0, 0.10, -0.215), (0.24, 0.72, -0.185), 0.020),
         ('rod', 'string', (-0.24, -0.50, -0.185), (0.24, 0.72, -0.185), 0.010)]
# the greataxe (11-19), in the RIGHT hand bone's frame: the right fist the upper hand, the left SPACE toward the butt. A plain heavy head, one
# broad blade and a poll behind it; 1.32 m butt to top (three quarters of his height).
SPACE = 0.34             # (the left fist from the right, down the haft: the same on every frame)
GAXE = [('rod', 'grip', (0, -0.50, 0), (0, -0.455, 0), 0.034), ('rod', 'haft', (0, -0.455, 0), (0, 0.80, 0), 0.024), ('rod', 'grip', (0, 0.80, 0), (0, 0.82, 0), 0.030),
        ('slab', 'blade', [(0.560, 0.0), (0.770, 0.0), (0.850, 0.250), (0.700, 0.300), (0.540, 0.275), (0.455, 0.215), (0.575, 0.090)], 0.040),   # the blade: its edge 0.40 long, 0.30 off the haft
        ('slab', 'tip', [(0.600, -0.02), (0.730, -0.02), (0.705, -0.085), (0.625, -0.085)], 0.040)]                                           # the poll
# the guard's spear (11-19), 1.85 m, a little taller than he is (guard_p2's): for the throw, in the right fist at its balance; for the shove, the
# right fist the rear hand, a third of the way up from the butt, and the left SPUSH further toward the point
SPUSH = 0.55             # (11-20, the plates: Fiore's short spear, 39r/40r -- the hands a forearm to a shoulder's width apart; it was 0.45)
SBUTT = 0.08             # (11-20, RULED 11-19, Griz: "mark the spear one as separate or short, but the hand at the butt" -- the rear fist holds the butt, a stub behind it; it held a third of the way up, 0.50)
SPEART = [('rod', 'haft', (0, -0.90, 0), (0, 0.72, 0), 0.019), ('rod', 'blade', (0, 0.72, 0), (0, 0.88, 0), 0.034), ('rod', 'tip', (0, 0.88, 0), (0, 0.95, 0), 0.020)]
SPEARP = [('rod', 'haft', (0, -SBUTT, 0), (0, 1.62 - SBUTT, 0), 0.019), ('rod', 'blade', (0, 1.62 - SBUTT, 0), (0, 1.78 - SBUTT, 0), 0.034), ('rod', 'tip', (0, 1.78 - SBUTT, 0), (0, 1.85 - SBUTT, 0), 0.020)]
# THE SLIDING HAND (11-20, RULED 11-19, Griz: "fix the hand spacing, apart and sliding together"; Fiore 35v/36r every guard with the hands
# well apart, 37r the blow landed with both hands together by the butt): the greataxe rides the LEFT fist now, the lower hand, which never
# moves on the haft (0.16 from the butt, as it was), and a frame's `sp` is how far up the haft the RIGHT fist is from it. `fr` is still the
# haft's own mark, SPACE up from the left fist -- where the right fist was on every frame before -- so a frame's axe is where it was.
GAXE_L = [(k, c) + tuple(tuple((p[0], p[1] + SPACE, p[2]) for p in (a[0], a[1])) + (a[2],) if k == 'rod' else ([(y + SPACE, z) for y, z in a[0]], a[1])) for k, c, *a in GAXE]
HELD = {'axe+shield': AXE, 'handaxe': HATCHET, 'crossbow': XBOW, 'stab': SHORT, 'greataxe': GAXE_L, 'spearthrow': SPEART, 'spearpush': SPEARP}
# the new kits' weapons (11-20). A warhammer: a square head on a haft as long as the forearm and hand, a spike behind it. A pry-bar: a
# long iron bar with a hooked claw. A long knife. A pike: 2.70 m, twice the dwarf, the butt in the right fist.
HAMMER = [('rod', 'grip', (0, -0.07, 0), (0, 0.05, 0), 0.022), ('rod', 'haft', (0, 0.05, 0), (0, 0.40, 0), 0.023),
          ('slab', 'blade', [(0.295, -0.035), (0.415, -0.035), (0.415, 0.085), (0.295, 0.085)], 0.085),
          ('slab', 'tip', [(0.325, -0.035), (0.385, -0.035), (0.355, -0.135)], 0.034)]
BAR = [('rod', 'grip', (0, -0.10, 0), (0, 0.07, 0), 0.021), ('rod', 'blade', (0, 0.07, 0), (0, 0.62, 0), 0.027), ('rod', 'tip', (0, 0.62, 0), (0, 0.70, 0.075), 0.027)]
KNIFE = [('rod', 'grip', (0, -0.06, 0), (0, 0.05, 0), 0.021), ('rod', 'guard', (0, 0.05, 0), (0, 0.065, 0), 0.045), ('rod', 'blade', (0, 0.065, 0), (0, 0.27, 0), 0.034), ('rod', 'tip', (0, 0.27, 0), (0, 0.33, 0), 0.026)]
PIKEL = 2.70
PIKE = [('rod', 'haft', (0, -SBUTT, 0), (0, PIKEL - 0.24 - SBUTT, 0), 0.019), ('rod', 'blade', (0, PIKEL - 0.24 - SBUTT, 0), (0, PIKEL - 0.07 - SBUTT, 0), 0.032), ('rod', 'tip', (0, PIKEL - 0.07 - SBUTT, 0), (0, PIKEL - SBUTT, 0), 0.019)]
HELD.update({'hammer+shield': HAMMER, 'twinshort': SHORT, 'bar': BAR, 'knife': BAR, 'pike': PIKE})
HELDL = {'twinshort': SHORT, 'bar': KNIFE, 'knife': KNIFE}        # (a second thing, in the LEFT fist)
TIPOF = {'twinshort': {'R': 0.52, 'L': 0.52}, 'bar': {'R': 0.52, 'L': 0.30}, 'knife': {'R': 0.52, 'L': 0.30}}      # (how far along each from its fist the target is met)
HANDOF = {'greataxe': 'L'}             # (which fist a kit's held thing rides: the right unless named here)
GONE = {'handaxe': {'R': (4, 5)}, 'spearthrow': {'R': (4, 5)}, 'crossbow': {'span': (3, 4, 5), 'bolt': (3, 4, 5), 'loose': (0, 1, 2)},     # the row's frames (from 0) a held thing is NOT there on
        'longbow': {'srest': (1, 2), 'shalf': (0, 2, 3, 4, 5), 'sfull': (0, 1, 3, 4, 5), 'anock': (1, 2, 3, 4, 5), 'ahalf': (0, 2, 3, 4, 5), 'afull': (0, 1, 3, 4, 5)}}
EDGE = {'axe+shield': (0.30, 0.210), 'handaxe': (0.24, 0.135), 'crossbow': (0.50, 0.0), 'longbow': (BOWH, 0.0), 'stab': (0.50, 0.0), 'greataxe': (0.66 + SPACE, 0.27), 'spearthrow': (0.88, 0.0), 'spearpush': (1.80 - SBUTT, 0.0)}
EDGE.update({'hammer+shield': (0.355, 0.0), 'twinshort': (0.50, 0.0), 'bar': (0.62, 0.0), 'knife': (0.62, 0.0), 'pike': (PIKEL - 0.05 - SBUTT, 0.0)})
BELLY = (-0.03, 0.98)   # the stab's mark on the target: its belly, a little to its left of the middle, x and z                        # the edge's middle (y, z): what the points file calls the head
FORE = 0.27              # the crossbow's fore-stock, from the right fist: where the left hand holds it
BELT = (-0.15, 0.95)     # the battleaxe's mark on the target: its hip on its LEFT side (the striker's right), x and z -- as high as a dwarf's cut comes down on a grown man
GARRISON = {}            # (what rows_garrison works out for main: how far in front the target stands)


def target_pieces():
    """the stationary figure, at the origin and facing +Y (toward the striker): (kind, colour, args), in metres."""
    hw, hz, hr = SHO
    P = [('egg', 'dummy', ((0, 0, 0.97), (0.15, 0.10, 0.09))), ('cap', 'dummy', ((0, 0, 1.04), (0, 0, 1.22), 0.12)),
         ('egg', 'dummy', ((0, 0, 1.33), (0.17, 0.11, 0.14))), ('cap', 'dummy', ((hw - 0.03, 0, hz), (-hw + 0.03, 0, hz), hr)),
         ('cap', 'dummy', ((0, 0, 1.45), (0, 0, 1.54), 0.045)), ('egg', 'dummy', ((0, 0, 1.665), (0.12, 0.13, 0.145))),
         ('cap', 'dnose', ((0, 0.11, 1.645), (0, 0.17, 1.63), 0.034))]
    for x in (1, -1):
        P += [('cap', 'dummy', ((hw * x, 0, hz), (0.22 * x, 0.0, 1.14), 0.050)), ('cap', 'dummy', ((0.22 * x, 0, 1.14), (0.23 * x, 0.03, 0.88), 0.042)),
              ('cap', 'dummy', ((0.10 * x, 0, 0.95), (0.10 * x, 0.02, 0.51), 0.068)), ('cap', 'dummy', ((0.10 * x, 0.02, 0.51), (0.10 * x, 0, 0.09), 0.052)),
              ('cap', 'dummy', ((0.10 * x, -0.035, 0.036), (0.10 * x, 0.155, 0.036), 0.036)),
              ('egg', 'pad', ((hw * x, 0, hz + 0.01), (0.085, 0.085, 0.075)))]             # the shoulder's pad: where a head lands
    return P


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    ad = bpy.data.armatures.new('mannequin'); arm = bpy.data.objects.new('mannequin', ad); scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm; arm.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for name, h, t, p in BONES:
        eb = ad.edit_bones.new(name); eb.head = Vector(h) * U; eb.tail = Vector(t) * U; eb.roll = 0
        if p:
            eb.parent = ad.edit_bones[p]; eb.use_connect = False
    bpy.ops.object.mode_set(mode='OBJECT')
    ad.bones['dummy'].use_deform = False

    def sphere(bm, c, radii):
        res = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=1.0)
        for v in res['verts']:
            v.co = Vector((c[0] + v.co.x * radii[0], c[1] + v.co.y * radii[1], c[2] + v.co.z * radii[2])) * U
        return res['verts']

    def capsule(bm, p0, p1, r):
        p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
        rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        res = bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=16, radius1=r * U, radius2=r * U, depth=d.length * U,
                                    matrix=Matrix.Translation((p0 + p1) / 2 * U) @ rot)
        return list(res['verts']) + sphere(bm, p0, (r, r, r)) + sphere(bm, p1, (r, r, r))

    def paint(verts, mats, colour):
        if colour not in mats:
            mats.append(colour)
        for f in {f for v in verts for f in v.link_faces}:
            f.material_index = mats.index(colour)

    def finish(bm, name, mats):
        me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
        for c in mats:
            m = bpy.data.materials.new(name + '_' + c); m.diffuse_color = lin(COL[c]) + (1,); me.materials.append(m)
        ob = bpy.data.objects.new(name, me); scene.collection.objects.link(ob)
        return ob, me

    # ---- the body: one rigid piece a bone
    bm = bmesh.new(); groups = {}; mats = []
    for kind, bone, colour, a in PIECES:
        vs = sphere(bm, *a) if kind == 'egg' else capsule(bm, *a)
        paint(vs, mats, colour); groups.setdefault(bone, []).extend(vs)
    bm.verts.ensure_lookup_table(); index = {v: i for i, v in enumerate(bm.verts)}
    gi = {b: [index[v] for v in vs] for b, vs in groups.items()}
    body, me = finish(bm, 'mannequin_body', mats)
    for bone, ids in gi.items():
        g = body.vertex_groups.new(name=bone); g.add(ids, 1.0, 'REPLACE')
    vcol = np.zeros((len(me.vertices), 3))
    for p in me.polygons:
        for vi in p.vertices:
            vcol[vi] = lin(COL[mats[p.material_index]])
    body.parent = arm; body.parent_type = 'OBJECT'
    mod = body.modifiers.new('arm', 'ARMATURE'); mod.object = arm

    # ---- the weapons: its own object on the hand bone (its frame is the bone's, from the bone's tail) -- a mace a fist, or one sword in the right
    maces = {}
    for s in ('' if KIT in GARR else 'LR' if KIT == 'maces' else 'R'):
        bm = bmesh.new(); mm = []; L = ad.bones['hand.' + s].length
        for name, colour, y0, y1, r in (MACE if KIT == 'maces' else MQ.SWORD):
            colour = 'head' + s if colour == 'HEAD' else colour
            rot = Matrix.Rotation(math.radians(-90), 4, 'X')
            res = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=16, radius1=r * U, radius2=r * U, depth=(y1 - y0) * U,
                                        matrix=Matrix.Translation((0, (y0 + y1) / 2 * U - L, 0)) @ rot)
            paint(res['verts'], mm, colour)
        ob, _ = finish(bm, 'mace' + s, mm)
        ob.parent = arm; ob.parent_type = 'BONE'; ob.parent_bone = 'hand.' + s; ob.matrix_parent_inverse = Matrix.Identity(4)
        maces[s] = ob

    if KIT in GARR:        # ---- the garrison's: an axe, a throwing axe or a crossbow in the right fist (rods and plates in the hand's frame)
        def held(name, parts, bone='hand.R'):
            L = ad.bones[bone].length; off = Vector((0, L, 0))
            bm = bmesh.new(); mm = []
            for kind, colour, *a in parts:
                if kind == 'rod':
                    p0, p1, r = Vector(a[0]), Vector(a[1]), a[2]
                    rot = Vector((0, 0, 1)).rotation_difference((p1 - p0).normalized()).to_matrix().to_4x4()
                    vs = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=14, radius1=r * U, radius2=r * U, depth=(p1 - p0).length * U,
                                               matrix=Matrix.Translation((p0 + p1) / 2 * U - off) @ rot)['verts']
                else:
                    prof, t = a; n = len(prof)
                    side = [[bm.verts.new(Vector((sx * t / 2, y, z)) * U - off) for y, z in prof] for sx in (-1, 1)]
                    bm.faces.new(side[0]); bm.faces.new(side[1][::-1])
                    for i in range(n):
                        bm.faces.new((side[0][i], side[1][i], side[1][(i + 1) % n], side[0][(i + 1) % n]))
                    vs = side[0] + side[1]
                paint(vs, mm, colour)
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
            ob, _ = finish(bm, name, mm)
            ob.parent = arm; ob.parent_type = 'BONE'; ob.parent_bone = bone; ob.matrix_parent_inverse = Matrix.Identity(4)
            gone = GONE.get(KIT, {}).get(name, ())
            if gone:               # (there on some frames and gone on others: its size keyed, a frame a key)
                for i in range(6):
                    ob.scale = (1e-4,) * 3 if i in gone else (1, 1, 1); ob.keyframe_insert('scale', frame=i + 1)
            return ob
        if KIT == 'longbow':
            maces['L'] = held('L', BOW, 'hand.L')
            for nm, parts in BOWPARTS.items():
                maces[nm] = held(nm, parts, 'hand.L')
        else:
            _s = HANDOF.get(KIT, 'R'); maces[_s] = held(_s, HELD[KIT], 'hand.' + _s)
            if KIT in HELDL:
                maces['L'] = held('L', HELDL[KIT], 'hand.L')
            if KIT == 'stab':
                maces['slung'] = held('slung', SLUNG, 'spine2')
        if KIT == 'crossbow':
            for nm, parts in (('span', XSPAN), ('bolt', XBOLT), ('loose', XLOOSE)):
                maces[nm] = held(nm, parts)

    # ---- the target, on its own still bone
    bm = bmesh.new(); dm = []
    for kind, colour, a in target_pieces():
        paint(sphere(bm, *a) if kind == 'egg' else capsule(bm, *a), dm, colour)
    dummy, _ = finish(bm, 'target', dm)
    dummy.parent = arm; dummy.parent_type = 'BONE'; dummy.parent_bone = 'dummy'
    bpy.context.view_layer.update(); dummy.matrix_world = Matrix.Identity(4)
    bpy.context.view_layer.update()

    R = BP.Rig(arm, body, dict(spine=['spine1', 'spine2'], neck=['neck'], head='head',
                               arm_a=['clav.L', 'arm.L', 'fore.L', 'hand.L'], arm_b=['clav.R', 'arm.R', 'fore.R', 'hand.R'],
                               leg_a=[None, 'thigh.L', 'calf.L', 'foot.L', 'toe.L', 'toe.L'],
                               leg_b=[None, 'thigh.R', 'calf.R', 'foot.R', 'toe.R', 'toe.R'], roots=['hips'], still=['dummy']), log=LOG)
    R.ground()
    return scene, arm, body, maces, dummy, R, vcol


# ------------------------------------------------------------------ the rows
def rows_maces(R):
    """His words on the first pass (11-12), the motion's law: "wrists essentially lock at position 1 / hands to the ears is mostly elbow
    retraction while shoulders raise the arms / then shoulders further up as torso starts leaning forward as knees lower torso / then the strike
    is elbows extending and shoulders coming down while the hips and legs start pulling the torso back on the way to return to idle".
    So a frame is each arm's two angles -- `up` the upper arm and `fo` the forearm, degrees above the level, forward -- and the mace is never
    aimed: it sits LOCK degrees off its forearm in the arm's own plane (the way the elbow folds), on every frame of every row."""
    za, zb = R.ANK0['a'].z, R.ANK0['b'].z
    L1, L2 = R.BN['arm.L'].length / U, R.BN['fore.L'].length / U
    mir = lambda v: (-v[0], v[1], v[2])
    rad = math.radians

    def P(lift, shift=0.0, lean=0, head=0, up=-60, fo=20, out=0.03, heel=0, sh=0, fw=0):
        u = (0.0, -math.cos(rad(up)), math.sin(rad(up))); f = (0.0, -math.cos(rad(fo)), math.sin(rad(fo)))
        w = (out, (u[1] * L1 + f[1] * L2), (u[2] * L1 + f[2] * L2))               # the wrist from its shoulder, metres
        pole = (0.22, u[1], u[2]) if abs(fo - up) > 40 else (0.04, 0.3, -1.0)      # the elbow where the upper arm points, a little out; an arm near straight keeps its elbow under it (its fold stays fore-and-aft)
        return dict(lift=lift * U * HK, shift=shift * U * HK, lean=lean, head=head, shupa=sh, shupb=sh, shfwa=fw, shfwb=fw,
                    legs={'a': (0.13 * XK * U, -0.10 * U, za, 12, heel), 'b': (-0.13 * XK * U, 0.08 * U, zb, 20, heel)},
                    arms={'a': tuple(x * U for x in w), 'b': tuple(x * U for x in mir(w))}, epolea=pole, epoleb=mir(pole))

    TWIN = [
        P(-0.04, lean=3, up=-62, fo=18),                                               # 1 POSITION ONE: the maces up in front; the wrists as they will stay
        P(-0.04, shift=0.01, lean=0, head=-2, up=22, fo=128, sh=10, out=0.05),         # 2 hands to the ears: the elbows fold, the shoulders raise the arms
        P(-0.11, shift=-0.05, lean=11, head=3, up=27, fo=88, sh=14, fw=2, out=0.04, heel=8),   # 3 the same a few frames on toward the strike (his "3 a few frames further along on the path to frame four"): the knees down, the arms already coming over
        P(-0.125, shift=-0.035, lean=7, head=6, up=-14, fo=-10, sh=6, fw=6, out=0.02),  # 4 THE STRIKE: the elbows extend, the shoulders come down; the hips and legs already pulling the torso back (the torso "a wee bit lower", his word)
        P(-0.06, shift=-0.01, lean=4, head=2, up=-36, fo=-2, sh=2),                     # 5 on the way back
        P(-0.045, lean=3, up=-52, fo=14),                                              # 6 nearly idle
    ]
    IDLE = [P(-0.04, lean=3, up=-62, fo=18)]                                           # (the idle is position one: the strike leaves from it and comes back to it)

    def lock(P, tag):
        """each mace LOCK degrees off its forearm, turned the way its elbow folds (about the arm's own hinge: the upper arm x the forearm)."""
        d, lift, shift, sway = R.pose_d(P); M = R.solve(d, lift, shift, sway, mats=True)[1]; hands = {}
        for s_, arm_, fore in (('a', 'arm.L', 'fore.L'), ('b', 'arm.R', 'fore.R')):
            u = (M[fore].translation - M[arm_].translation).normalized()
            f = (M[fore] @ Vector((0, R.BN[fore].length, 0)) - M[fore].translation).normalized()
            n = u.cross(f)
            n = n.normalized() if n.length > 1e-4 else Vector((1 if s_ == 'a' else -1, 0, 0))
            hands[s_] = tuple(Matrix.Rotation(math.radians(LOCK), 3, n) @ f)
        return dict(P, hands=hands)
    mk = lambda name, F: (lambda i, n: (lock(dict(F[i]), '%s %d' % (name, i + 1)), 0))
    return [('idle', 1, False, mk('idle', IDLE), 'ik'), ('twinmace', 6, False, mk('twinmace', TWIN), 'ik')]


SLHIT_H, SLHIT_D = (-20, 22, -8), (-22, 16, -8)        # the sword arm at THE CUT (11-20): the upper arm's and the forearm's degrees above the level, and its turn
NECK = (-0.07, 1.50)     # the slash's first mark on the target: its neck between its LEFT shoulder and its chin (the striker's right), x and z
ANKLE = (0.10, 0.12)     # and its last: the target's RIGHT ankle (the striker's left)
LSHO = (-0.17, 1.46)     # Lymen's cut (11-13): in at the target's LEFT shoulder (the striker's right), on top of it ...
RHIP = (0.13, 0.93)      # ... and out at its RIGHT hip (the striker's left): the torso opened corner to corner
REACH = 0.70             # how far along the blade from the fist the neck is met
RIBS = (-0.15, 1.16)     # the DWARF's cut on a grown man (11-20): in under the man's LEFT arm at the ribs -- as high as a dwarf's blade lands with the arm and the blade in one line
SLASH = {}               # (what rows_slash works out for main: how far in front the target stands)


def rows_slash(R):
    """The one-handed slash, re-posed (11-12). His words: "slash (single right handed) is pretty bad as I recall. the right arm should be doing
    about the same as with the mace, but the hip turns putting the left side forward with the left arm extending forward / on 3, knees dropped
    about 3 inches, waist twisted back forward as the arm extends the slash, left to right aiming at the neck between 'attackers right'/targets
    left shoulder and chin / at 4 the hips would be twisted beyond midline the other way, with the blade approaching targets right ankle, with
    the knees starting back toward idle".
    A frame is the hips' turn (`yaw`: - puts his LEFT side forward) and the waist's on top of it (`twist`), each arm's angles (`up` the upper
    arm and `fo` the forearm, degrees above the level; `az` which way that arm points on the floor, + toward his left), and the blade: LOCK
    degrees off its forearm in the arm's own plane, as the maces are -- except at the cut and the finish, where it is laid on the target's marks
    (`at`) and the wrist's angle is printed for the eye.
    Re-ordered the same day on his look ("4 is supposed to be the cut. pull 5, make 3 4, and find an intermediate between the current 2 and 3 to be
    the new 3"): his 3 and 4 above are this row's frames 4 and 5; the old 5 is gone; a new 3 sits between the draw and the cut."""
    za, zb = R.ANK0['a'].z, R.ANK0['b'].z
    L1, L2 = R.BN['arm.L'].length / U, R.BN['fore.L'].length / U
    rad = math.radians

    def arm(sg, up, fo, az, out, faz=None):
        fw = (math.sin(rad(az)), -math.cos(rad(az)))
        u = (fw[0] * math.cos(rad(up)), fw[1] * math.cos(rad(up)), math.sin(rad(up)))
        if faz is not None:            # (the shield arm, 11-13: the forearm lies across him, pointing its own way on the floor)
            fw = (math.sin(rad(faz)), -math.cos(rad(faz)))
        f = (fw[0] * math.cos(rad(fo)), fw[1] * math.cos(rad(fo)), math.sin(rad(fo)))
        w = tuple((u[k] * L1 + f[k] * L2) * U for k in range(3)); w = (w[0] + sg * out * U, w[1], w[2])
        pole = (sg * 0.22 + u[0], u[1], u[2]) if (abs(fo - up) > 40 or faz is not None) else (sg * 0.30, 0.3, -1.0)
        return w, pole

    def P(lift, shift=0.0, lean=0, yaw=0, twist=0, head=0, hyaw=0, heel=0, sh=0, R_=(-62, 18, 0), L_=(-70, -25, 8), at=None, fw=None, face=None):
        wr, pr = arm(-1, R_[0], R_[1], R_[2], 0.02); wl, pl = arm(1, L_[0], L_[1], L_[2], 0.03, *L_[3:])
        d = dict(lift=lift * U * HK, shift=shift * U * HK, lean=lean, bodyyaw=yaw, twist=twist, head=head, hyaw=hyaw, shupb=sh,
                 legs={'a': (0.13 * XK * U, -0.12 * U, za, 10, 0), 'b': (-0.13 * XK * U, 0.10 * U, zb, 28, heel)},
                 arms={'a': wl, 'b': wr}, epolea=pl, epoleb=pr, _at=at, _face=face)
        if fw:                         # (Lymen's: each shoulder rolled forward (+) or drawn back, left then right)
            d.update(shfwa=fw[0], shfwb=fw[1])
        return d

    IN3 = 0.076                                                       # (three inches)
    SLHIT = SLHIT_D if DWARF else SLHIT_H
    SL = [
        P(-0.04, lean=3),                                                                                            # 1 POSITION ONE: the blade up in front, as the maces are held
        P(-0.04, shift=0.01, yaw=-32, twist=-14, hyaw=30, sh=10, R_=(22, 128, -18), L_=(-12, 2, -4)),                 # 2 the hips turned, his LEFT side forward and the left arm out ahead; the right hand to the ear
        P(-0.04 - IN3 * 0.5, shift=-0.015, lean=5, yaw=-18, twist=-5, hyaw=15, sh=8, R_=(-8, 56, -13), L_=(-34, -5, 5)),            # 3 between the draw and the cut (his 11-12: "find an intermediate between the current 2 and 3 to be the new 3"): the hips coming round, the knees going down, the arm unfolding
        P(-0.04 - IN3, shift=-0.04, lean=9, yaw=-4, twist=4, head=3, sh=6, R_=SLHIT, L_=(-55, -12, 14), at='neck'),      # 4 (RE-POSED 11-20, Fiore 20v/21r: the forearm RISES behind the blade so the two are one line as the cut lands; it was (-36, -20, -8), the forearm pointing down and the blade cocked 71 degrees up off it -- 115 on the dwarf)
        # 4 the knees down three inches, the waist back to the front, the arm out: THE CUT at the neck
        P(-0.04 - IN3 * 0.6, shift=-0.05, lean=14, yaw=30, twist=14, head=8, hyaw=-18, R_=(-88, -80, 30), L_=(-78, -40, 26), at='ankle'),   # 5 the hips past the middle the other way, the blade down by the target's right ankle, the knees starting up
        P(-0.04, lean=3, yaw=2, R_=(-63, 14, 3)),                                                                     # 6 nearly idle
    ]
    IDLE = [P(-0.04, lean=3)]
    if SWSH:
        # LYMEN'S, behind the shield (11-13). First built as the slash above with a shield arm; he re-posed it on the poser page and then gave
        # the gist to pose to: "There's a hip twist with the striking arm raise where you put your shield more forward and the slash is the hip
        # swinging the other way while you bring the sword down (arm and a bit of torso) - the 'hit' would be essentially trying to slice the
        # opponents torso open from target left shoulder to right hip". And of the shield arm at the finish, the same day: "the left arm needs
        # to move away from body center more than a shield raise (to the side of the arm it's in)".
        # And of the first reading of that, the same day: "in general the shield is being held too close to the body, 1-2 is basically
        # shoving the shield forward while you pull your arm back, 3-4 you're bringing your left arm down diagonally the same way you're
        # bringing the right slashing arm diagonally, the pose holds it at his chest close and that's the uncanny bit".
        # The shield arm is (up, fo, az, faz) -- the upper arm's and the forearm's degrees above the level, and which way each points on the
        # floor (+ toward his left) -- and `face` is where the shield faces (az, degrees above the level).
        ONE = dict(L_=(-45, 8, 15, -75), face=(0, 5))        # held out from the body: the elbow forward of his ribs, the forearm level across, a forearm's length of air behind the shield
        SL = [
            P(-0.04, lean=3, yaw=-8, twist=-18, hyaw=24, fw=(20, -12), **ONE),                                                            # 1 POSITION ONE, bladed: the left shoulder and the shield leading and held out, the right shoulder drawn back, the blade up in front
            P(-0.04, shift=0.015, yaw=-36, twist=-16, hyaw=42, sh=10, fw=(24, -10), R_=(22, 128, -18), L_=(-12, 6, 18, -80), face=(0, 0)),  # 2 THE SHOVE: the hips twist and the shield is shoved straight out at the target, the upper arm level, as the sword arm is pulled back to the ear
            P(-0.04 - IN3 * 0.5, shift=-0.02, lean=11, yaw=0, twist=-12, hyaw=10, sh=9, fw=(12, 0), R_=(14, 74, -10), L_=(-30, -5, 22, -65), face=(8, 0)),  # 3 THE HIPS LEAD: swung back to square, the shoulders lagging; both arms starting down, the blade high, the shield beginning its own diagonal
            P(-0.04 - IN3, shift=-0.05, lean=19, yaw=24, twist=6, head=-11, hyaw=-24, sh=4, fw=(0, 12), R_=(-24, -8, -4), L_=(-55, -30, 30, 0), face=(40, 20), at='shoulder'),   # 4 THE HIT: the right hip through, the blade on the target's LEFT shoulder; the shield arm has come down the same diagonal, low and to his left, the shield opened away
            P(-0.04 - IN3 * 0.6, shift=-0.05, lean=10, yaw=34, twist=4, head=0, hyaw=-28, fw=(0, 18), R_=(-58, -38, 34), L_=(-72, -50, 40, 30), face=(60, 5), at='hip'),          # 5 THROUGH: the blade leaving by the target's RIGHT hip; the shield arm at the bottom of its diagonal, low and out to his own left
            P(-0.04, lean=2, yaw=-6, twist=-10, hyaw=14, fw=(10, -6), R_=(-63, 14, 3), **ONE),                                              # 6 nearly back to position one, the shield coming back up in front
        ]
        IDLE = [P(-0.04, lean=3, yaw=-8, twist=-18, hyaw=24, fw=(20, -12), **ONE)]
    HITMARK = LSHO if SWSH else RIBS if DWARF else NECK

    def fist(P):
        Q = {k: v for k, v in P.items() if not k.startswith('_')}
        d, lift, shift, sway = R.pose_d(Q); M = R.solve(d, lift, shift, sway, mats=True)[1]
        return Q, M, M['hand.R'].translation.copy()

    # where the target stands: the neck REACH along the blade from the fist at THE CUT (frame 4)
    _, _, F3 = fist(SL[3]); dx, dz = HITMARK[0] * U - F3.x, HITMARK[1] * U - F3.z
    SLASH['ty'] = (F3.y - math.sqrt(max((REACH * U) ** 2 - dx * dx - dz * dz, 0.0))) / U
    MARK = {'neck': Vector((HITMARK[0], SLASH['ty'], HITMARK[1])) * U, 'ankle': Vector((ANKLE[0], SLASH['ty'], ANKLE[1])) * U,
            'shoulder': Vector((LSHO[0], SLASH['ty'], LSHO[1])) * U, 'hip': Vector((RHIP[0], SLASH['ty'], RHIP[1])) * U}

    def aim(P, tag):
        Q, M, F = fist(P)
        if P.get('_at'):
            b = (MARK[P['_at']] - F).normalized()
        else:
            u = (M['fore.R'].translation - M['arm.R'].translation).normalized()
            f = (M['fore.R'] @ Vector((0, R.BN['fore.R'].length, 0)) - M['fore.R'].translation).normalized()
            n = u.cross(f); n = n.normalized() if n.length > 1e-4 else Vector((-1, 0, 0))
            b = Matrix.Rotation(math.radians(LOCK), 3, n) @ f
        if P.get('_face'):          # the shield (Lymen's): the left hand aimed where the shield faces, rolled so it lies back along the forearm
            az, el = (math.radians(v) for v in P['_face'])
            fc = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
            back = (M['fore.L'].translation - M['hand.L'].translation).normalized()
            return dict(Q, hands={'b': tuple(b), 'a': tuple(fc)}, handsup={'a': tuple(back)})
        return dict(Q, hands={'b': tuple(b)})
    mk = lambda name, F: (lambda i, n: (aim(dict(F[i]), '%s %d' % (name, i + 1)), 0))
    return [('idle', 1, False, mk('idle', IDLE), 'ik'), ('slash', 6, False, mk('slash', SL), 'ik')]


def rows_garrison(R):
    """Solskaft's trooper (11-12): the battleaxe cut behind a shield, the handaxe throw, the heavy crossbow shot. The rig's laws are the two
    rows' above: a frame is each arm's angles, the hips' turn (`yaw`: - puts his LEFT side forward), the waist's twist on it, the lean and the
    knees' drop; the weapon sits LOCK degrees off its forearm on every frame and is never aimed -- the axe's edge turned the way the lock
    leans it (forward, away from the fold of the arm). An arm is (up, fo, az[, faz]): the upper arm's and the forearm's degrees above the level,
    which way the upper arm points on the floor (+ toward his left) and, when the forearm lies across him, which way IT points (the shield arm).
    The crossbow is the one held thing placed whole: the right wrist from its shoulder (`wR`, metres), the stock's line (`bore`: az, degrees
    above the level), its top up; the left hand goes under the fore-stock wherever that puts it."""
    za, zb = R.ANK0['a'].z, R.ANK0['b'].z
    L1, L2 = R.BN['arm.L'].length / U, R.BN['fore.L'].length / U
    rad = math.radians
    dr = lambda az, el: Vector((math.sin(rad(az)) * math.cos(rad(el)), -math.cos(rad(az)) * math.cos(rad(el)), math.sin(rad(el))))

    def arm(sg, a, out):
        up, fo, az = a[:3]; u, f = dr(az, up), dr(a[3] if len(a) > 3 else az, fo)
        w = (u * L1 + f * L2) * U; w.x += sg * out * U
        pole = (sg * 0.22 + u.x, u.y, u.z) if math.degrees(u.angle(f)) > 40 else (sg * 0.30, 0.3, -1.0)
        return tuple(w), pole

    GUARD = (-66, 4, 22, -62)          # the shield arm: the elbow down at his left side, the forearm level across his front, the shield's face to the target

    def P(lift, shift=0.0, lean=0, yaw=0, twist=0, head=0, hyaw=0, hroll=0, heel=0, sh=0, R_=(-62, 18, 0), L_=GUARD, step=(0, 0, 0), wR=None, bore=None, at=None, bow=None, draw=None, atL=None):
        wr, pr = arm(-1, R_, 0.02); wl, pl = arm(1, L_, 0.03)
        if wR:
            wr, pr = tuple(x * U for x in wR), (-1.0, 0.25, -0.75)             # (the trigger arm: the elbow out to his right and down)
        return dict(lift=lift * U * HK, shift=shift * U * HK, lean=lean, bodyyaw=yaw, twist=twist, head=head, hyaw=hyaw, hroll=hroll, shupb=sh,
                    legs={'a': (0.13 * XK * U, (-0.12 - step[0]) * U, za + step[1] * U, 10, step[2]), 'b': (-0.13 * XK * U, 0.10 * U, zb, 28, heel)},
                    arms={'a': wl, 'b': wr}, epolea=pl, epoleb=pr, _bore=bore, _at=at, _bow=bow, _draw=draw, _atL=atL)

    IN3 = 0.076                                                       # (three inches)
    STHIT = (-44, 20, 6)               # the stabbing arm at THE STAB (11-20)
    LK = (-70, -25, 8)                 # (a left arm hanging easy, its fist forward of the hip)
    if KIT == 'axe+shield':
        F = [
            P(-0.04, lean=3),                                                                                  # 1 POSITION ONE: the axe up in front of his right shoulder, the shield across his front
            P(-0.04, shift=0.01, yaw=-32, twist=-14, hyaw=30, sh=10, R_=(22, 128, -18), L_=(-58, 6, 14, -52)),  # 2 the hips turned, his LEFT side and the shield forward; the right hand to the ear, the head back over the shoulder
            P(-0.04 - IN3 * 0.5, shift=-0.015, lean=5, yaw=-18, twist=-5, hyaw=15, sh=9, R_=(28, 78, -13), L_=(-62, 5, 18, -58)),   # 3 coming round: the hips turning back, the knees going down, the elbow leading and the head still high
            P(-0.04 - IN3, shift=-0.04, lean=9, yaw=-4, twist=4, head=3, sh=6, R_=(-8, 8, 6), L_=(-64, 4, 20, -62), at=BELT),             # 4 THE CUT: the knees down three inches, the waist to the front, the arm out and the head's weight down ahead of the fist
            P(-0.04 - IN3 * 0.6, shift=-0.05, lean=13, yaw=18, twist=10, head=7, hyaw=-12, R_=(-62, -74, 24), L_=(-60, 6, 6, -76)),    # 5 the finish: the hips past the middle, the axe down and across by his left knee, the shield still forward
            P(-0.04, lean=3, yaw=2, R_=(-63, 14, 3)),                                                          # 6 nearly idle
        ]
    elif KIT == 'handaxe':
        F = [
            P(-0.04, lean=3, R_=(-74, -24, 0)),                                                                # 1 the throwing axe just out of the belt, low at his right hip
            P(-0.04, shift=0.03, yaw=-34, twist=-16, hyaw=34, sh=12, R_=(26, 126, -16), L_=(-58, 6, 14, -52)),  # 2 the draw: his left side and the shield forward, the weight back, the hand past the ear and the axe back over the shoulder
            P(-0.06, shift=-0.01, lean=4, yaw=-20, twist=-4, hyaw=18, sh=14, R_=(46, 104, -10), L_=(-62, 5, 18, -58), step=(0.07, 0.05, -8)),   # 3 the step: the left foot off the floor and going forward, the elbow coming over the top
            P(-0.10, shift=-0.08, lean=12, yaw=2, twist=8, head=4, sh=10, heel=10, R_=(34, 14, -4), L_=(-64, 4, 20, -62), step=(0.13, 0, 0)),   # 4 THE RELEASE: the foot down, the weight on it, the arm out high and forward, the axe upright at the fingers
            P(-0.10, shift=-0.09, lean=20, yaw=16, twist=14, head=8, hyaw=-12, heel=14, R_=(-46, -66, 18), L_=(-60, 6, 8, -74), step=(0.13, 0, 0)),   # 5 the follow-through: the empty hand down and across, the hips past the middle
            P(-0.05, shift=-0.02, lean=5, yaw=4, R_=(-66, 4, 2), step=(0.04, 0, 0)),                           # 6 the foot drawn back, the empty hand at the belt again
        ]
    elif KIT == 'longbow':
        FREE = (-70, -10, 0)           # (the right arm's angles when it is not on the string)
        F = [
            P(-0.04, lean=3, yaw=-48, hyaw=44, L_=(-38, -12, -6), bow=(-0.42, -0.22, 0.88), draw=-BOWZ + 0.01),                 # 1 NOCKED: side-on, the bow low in front and canted, an arrow on the string, the right hand at the string
            P(-0.04, lean=1, yaw=-66, hyaw=60, sh=4, L_=(-10, -5, -16), bow=(-0.12, -0.05, 0.99), draw=DHALF),                 # 2 the bow raised, the bow arm going out, the string half drawn
            P(-0.045, lean=-2, yaw=-80, hyaw=74, sh=8, L_=(1, 2, -20), bow=(-0.04, 0, 1.0), draw=DFULL),                       # 3 FULL DRAW: the bow arm straight at the target, the right hand at the cheek, the elbow high and back
            P(-0.045, lean=-2, yaw=-80, hyaw=74, sh=8, L_=(1, 2, -20), bow=(-0.04, 0, 1.0), draw=DFULL + 0.03),                # 4 LOOSED: nothing of him moves but the fingers; the arrow is gone and the string is forward
            P(-0.04, lean=0, yaw=-78, hyaw=72, sh=5, L_=(-9, -7, -20), bow=(-0.06, -0.34, 0.94), draw=DFULL + 0.10),           # 5 the follow-through: the bow tips forward in the hand, the right hand carries back past the ear
            P(-0.04, lean=2, yaw=-56, hyaw=50, L_=(-34, -12, -8), bow=(-0.38, -0.25, 0.89), R_=FREE),                          # 6 lowering the bow, the right hand coming down for the next arrow
        ]
    elif KIT == 'stab':
        OUT, BACK = (-34, -6, 4), (-72, -46, 12)       # the free left hand: out ahead for balance, and pulled back as the stab goes in
        F = [
            P(-0.04, lean=3, L_=(-70, -25, 8)),                                                                              # 1 POSITION ONE: the blade up in front, the left hand free
            P(-0.04, shift=0.02, yaw=-30, twist=-10, hyaw=28, R_=(-104, -27, -4), L_=OUT),                                    # 2 the fist drawn back to the right hip, the elbow behind him, the point at the target; his left side and hand forward
            P(-0.04 - IN3 * 0.6, shift=-0.02, lean=6, yaw=-12, twist=-2, hyaw=10, R_=(-80, -26, 0), L_=(-50, -20, 8)),         # 3 the drive: the knees going down, the hips coming round, the fist passing the hip
            P(-0.04 - IN3, shift=-0.07, lean=12, yaw=14, twist=8, head=4, hyaw=-10, sh=3, R_=STHIT, L_=BACK, at=BELLY),   # 4 (RE-POSED 11-20, Fiore 20v/21r and I.33: the forearm brought up behind the point, the blade and the forearm one line; it was (-30, -14, 6), the blade 46 degrees up off the forearm)
            # 4 THE STAB: the right shoulder and hip driven through, the arm out, the point in the target's belly
            P(-0.04 - IN3 * 0.5, shift=-0.03, lean=7, yaw=4, twist=2, R_=(-74, -26, 2), L_=(-60, -30, 10)),                    # 5 the withdrawal: the fist back to the hip, the knees coming up
            P(-0.04, lean=3, yaw=2, R_=(-63, 14, 3), L_=(-70, -25, 8)),                                                      # 6 nearly idle
        ]
    elif KIT == 'hammer+shield':       # HALLDOR'S AND HEDDA'S (11-20): the battleaxe cut's beats, a warhammer in the fist; posed from here on, so the hit frame's wrist is let go and the arm made to carry the hammer in its own line
        F = [
            P(-0.04, lean=3),                                                                                  # 1 POSITION ONE: the hammer up in front of the right shoulder, the shield across the front
            P(-0.04, shift=0.01, yaw=-32, twist=-14, hyaw=30, sh=10, R_=(22, 128, -18), L_=(-58, 6, 14, -52)),  # 2 the hips turned, the LEFT side and the shield forward; the right hand to the ear, the head of the hammer back over the shoulder
            P(-0.04 - IN3 * 0.5, shift=-0.015, lean=5, yaw=-18, twist=-5, hyaw=15, sh=9, R_=(28, 78, -13), L_=(-62, 5, 18, -58)),   # 3 coming round: the hips turning back, the knees going down, the elbow leading and the head still high
            P(-0.04 - IN3, shift=-0.04, lean=10, yaw=0, twist=6, head=3, sh=6, R_=(2, -6, 4), L_=(-64, 4, 20, -62), at=BELT),             # 4 THE BLOW: over the shield's rim, the arm out long and the hammer one line with the forearm, its head down on the mark
            P(-0.04 - IN3 * 0.6, shift=-0.05, lean=13, yaw=18, twist=10, head=7, hyaw=-12, R_=(-62, -74, 24), L_=(-60, 6, 6, -76)),    # 5 the finish: the hips past the middle, the hammer down and across by the left knee, the shield still forward
            P(-0.04, lean=3, yaw=2, R_=(-63, 14, 3)),                                                          # 6 nearly idle
        ]
    elif KIT == 'twinshort':           # THE SECT'S BLADE (11-20): a shortsword in each fist; the right thrusts, the left blade is carried forward as the guard and drawn back as the thrust goes in
        F = [
            P(-0.06, lean=5, R_=(-66, 4, 0), L_=(-66, 0, 6)),                                                                 # 1 crouched a little, both blades low and forward
            P(-0.06, shift=0.02, lean=4, yaw=-30, twist=-10, hyaw=28, R_=(-104, -27, -4), L_=(-34, 4, 2)),                     # 2 the right fist drawn back to the hip, the point at the target; the LEFT side forward and the left blade out ahead, covering
            P(-0.06 - IN3 * 0.6, shift=-0.02, lean=7, yaw=-12, twist=-2, hyaw=10, R_=(-76, -8, 0), L_=(-50, -6, 8)),            # 3 the drive: the knees going down, the hips coming round, the fist passing the hip
            P(-0.06 - IN3, shift=-0.07, lean=13, yaw=14, twist=8, head=4, hyaw=-10, sh=3, R_=STHIT, L_=(-74, -30, 14), at=BELLY),   # 4 THE STAB: the right hip and shoulder driven through, the arm and the blade one line, the left blade drawn back to the left hip
            P(-0.06 - IN3 * 0.5, shift=-0.03, lean=8, yaw=4, twist=2, R_=(-74, -18, 2), L_=(-62, -10, 10)),                    # 5 the withdrawal: the fist straight back along the same line
            P(-0.06, lean=5, yaw=2, R_=(-66, 4, 0), L_=(-66, 0, 6)),                                                          # 6 both blades low and forward again
        ]
    elif KIT == 'bar':                 # HASK'S PRY-BAR (11-20): the one-handed slash's beats (rows_slash), the long knife in the left fist carried out ahead on the draw
        F = [
            P(-0.04, lean=3, L_=LK),                                                                                          # 1 POSITION ONE: the bar up in front, the knife low in the left hand
            P(-0.04, shift=0.01, yaw=-32, twist=-14, hyaw=30, sh=10, R_=(22, 128, -18), L_=(-12, 2, -4)),                      # 2 the hips turned, the LEFT side forward and the knife out ahead at the enemy; the bar hand to the ear
            P(-0.04 - IN3 * 0.5, shift=-0.015, lean=5, yaw=-18, twist=-5, hyaw=15, sh=8, R_=(-8, 56, -13), L_=(-34, -5, 5)),    # 3 the hips coming round, the knees going down, the arm unfolding
            P(-0.04 - IN3, shift=-0.04, lean=9, yaw=-4, twist=4, head=3, sh=6, R_=SLHIT_H, L_=(-55, -12, 14), at=NECK),        # 4 THE BLOW: the knees down three inches, the bar and the forearm one line, laid on the target's neck at its left shoulder
            P(-0.04 - IN3 * 0.6, shift=-0.05, lean=14, yaw=30, twist=14, head=8, hyaw=-18, R_=(-88, -80, 30), L_=(-78, -40, 26)),   # 5 through: the hips past the middle, the bar down and across, the knife hand back at the left hip
            P(-0.04, lean=3, yaw=2, R_=(-63, 14, 3), L_=LK),                                                                  # 6 nearly idle
        ]
    elif KIT == 'knife':               # HASK'S KNIFE (11-20): the LEFT hand's stab off the leading (left) foot, the bar drawn back on the right as the knife goes in
        F = [
            P(-0.04, lean=3, L_=LK),                                                                                          # 1 POSITION ONE: the bar up in front, the knife low in the left hand
            P(-0.04, shift=0.02, yaw=20, twist=8, hyaw=-18, R_=(-30, 30, 8), L_=(-104, -27, 4)),                               # 2 the knife fist drawn back to the LEFT hip, the point at the target; the right side and the bar forward, covering
            P(-0.04 - IN3 * 0.6, shift=-0.02, lean=6, yaw=4, twist=0, hyaw=-4, R_=(-44, 26, 4), L_=(-76, -8, 0)),               # 3 the drive: the knees going down, the hips coming round the other way, the fist passing the hip
            P(-0.04 - IN3, shift=-0.08, lean=13, yaw=-28, twist=-10, head=4, hyaw=26, sh=0, R_=(-66, 30, -10), L_=(-46, 6, -4), atL='line'),   # 4 THE STAB: the left hip and shoulder driven through, the arm and the knife one line, the point in the belly; the bar back by the right shoulder
            P(-0.04 - IN3 * 0.5, shift=-0.03, lean=7, yaw=-8, twist=-2, hyaw=8, R_=(-58, 22, -2), L_=(-74, -18, -2)),           # 5 the withdrawal: straight back along the same line
            P(-0.04, lean=3, yaw=2, R_=(-63, 14, 3), L_=LK),                                                                  # 6 nearly idle
        ]
    else:
        LOW = (-70, -30, 10)           # (the left arm's angles are only where it starts: the hand goes to the fore-stock)
        F = [
            P(-0.04, lean=3, yaw=-20, hyaw=18, wR=(0.11, -0.09, -0.36), bore=(20, -30), L_=LOW),                # 1 low and ready: the crossbow across his body, its nose down and to his left
            P(-0.04, lean=2, yaw=-30, hyaw=27, sh=4, wR=(0.09, -0.14, -0.18), bore=(9, -12), L_=LOW),           # 2 bringing it up
            P(-0.05, lean=4, yaw=-36, hyaw=33, hroll=-8, head=3, sh=6, wR=(0.075, -0.165, -0.035), bore=(0, 0), L_=LOW),      # 3 the stock settled to the right shoulder, his cheek to it, sighting: level
            P(-0.05, lean=4, yaw=-36, hyaw=33, hroll=-8, head=3, sh=6, wR=(0.075, -0.165, -0.035), bore=(0, 0), L_=LOW),      # 4 LOOSED: nothing of him moves; the bolt is gone and the string is forward
            P(-0.045, shift=0.022, lean=-2, yaw=-38, hyaw=34, hroll=-4, sh=9, wR=(0.075, -0.150, -0.020), bore=(0, 7), L_=LOW),   # 5 the kick: back through the shoulder, the nose thrown up a little
            P(-0.04, lean=2, yaw=-25, hyaw=22, sh=2, wR=(0.10, -0.11, -0.28), bore=(14, -22), L_=LOW),          # 6 lowering it
        ]
    IDLE = [dict(F[0])]

    def fin(P, tag):
        Q = {k: v for k, v in P.items() if not k.startswith('_')}
        d, lift, shift, sway = R.pose_d(Q); M = R.solve(d, lift, shift, sway, mats=True)[1]
        if P.get('_bore'):          # the crossbow: its line and its top; then the left hand under the fore-stock
            b = dr(*P['_bore']); top = Vector((0, 0, 1)); top = (top - b * top.dot(b)).normalized()
            fist = M['hand.R'].translation; sho = M['arm.L'].translation
            pt = fist + (b * FORE - top * 0.062) * U; w = pt + (sho - pt).normalized() * HAND * U
            Q['arms'] = dict(Q['arms'], a=tuple(w - sho)); Q['epolea'] = (0.35, 0.15, -1.0)
            return dict(Q, hands={'b': tuple(b)}, handsup={'b': tuple(top)})
        if P.get('_bow'):           # the longbow: its stave and the way the arrow flies (the LEFT hand aimed and rolled); then the right hand to the string
            st = Vector(P['_bow']).normalized(); fw = Vector((0, -1, 0)); fw = (fw - st * fw.dot(st)).normalized()
            Q['hands'] = {'a': tuple(st)}; Q['handsup'] = {'a': tuple(fw)}
            if P.get('_draw') is not None:
                sho = M['arm.R'].translation; nock = M['hand.L'].translation - fw * P['_draw'] * U
                w = nock + (sho - nock).normalized() * HAND * U
                Q['arms'] = dict(Q['arms'], b=tuple(w - sho)); Q['epoleb'] = (-0.3, 1.0, 0.35)
            return Q
        if KIT in HELDL:            # (11-20) a thing in each fist: each LOCK off its own forearm, and the one that strikes laid on its mark on the hit frame
            hd = {}
            for sd, s_, key in (('R', 'b', '_at'), ('L', 'a', '_atL')):
                u = (M['fore.' + sd].translation - M['arm.' + sd].translation).normalized()
                f = (M['fore.' + sd] @ Vector((0, R.BN['fore.' + sd].length, 0)) - M['fore.' + sd].translation).normalized()
                n = u.cross(f); n = n.normalized() if n.length > 1e-4 else Vector((-1 if sd == 'R' else 1, 0, 0))
                v = Matrix.Rotation(math.radians(LOCK), 3, n) @ f
                if P.get(key):
                    fist = M['hand.' + sd].translation; r = TIPOF[KIT][sd] * U; aim_ = (fist + f * r) / U if P[key] == 'line' else (P[key][0], 0, P[key][1]); dx, dz = aim_[0] * U - fist.x, aim_[2] * U - fist.z
                    mark = Vector((aim_[0] * U, fist.y - math.sqrt(max(r * r - dx * dx - dz * dz, 0.0)), aim_[2] * U)); GARRISON['ty'] = mark.y / U - 0.08      # ('line': the mark is wherever the forearm's own line puts the point -- a thrust posed by the arm alone)
                    v = (mark - fist).normalized()
                    print('%s %s: the %s weapon %.0f off its forearm at the hit' % (LOG, tag, sd, math.degrees(f.angle(v))))
                hd[s_] = tuple(v)
            return dict(Q, hands=hd)
        u = (M['fore.R'].translation - M['arm.R'].translation).normalized()
        f = (M['fore.R'] @ Vector((0, R.BN['fore.R'].length, 0)) - M['fore.R'].translation).normalized()
        n = u.cross(f); n = n.normalized() if n.length > 1e-4 else Vector((-1, 0, 0))
        b = Matrix.Rotation(math.radians(LOCK), 3, n) @ f; e = Matrix.Rotation(math.radians(-90), 3, n) @ b
        if P.get('_at'):            # THE CUT: the edge's middle laid on the target's mark (the one frame the axe is aimed, as the sword is at its cut); the target stands where that reaches
            fist = M['hand.R'].translation; ey, ez = EDGE[KIT]; r = math.hypot(ey, ez) * U; dx, dz = P['_at'][0] * U - fist.x, P['_at'][1] * U - fist.z
            mark = Vector((P['_at'][0] * U, fist.y - math.sqrt(max(r * r - dx * dx - dz * dz, 0.0)), P['_at'][1] * U)); GARRISON['ty'] = mark.y / U - 0.08
            v = (mark - fist).normalized(); e = (e - v * e.dot(v)).normalized(); al = math.atan2(ez, ey)
            b, e = v * math.cos(al) - e * math.sin(al), v * math.sin(al) + e * math.cos(al)
            return dict(Q, hands={'b': tuple(b)}, handsup={'b': tuple(e)})
        return dict(Q, hands={'b': tuple(b)}, handsup={'b': tuple(Matrix.Rotation(math.radians(-90), 3, n) @ b)})     # (the edge: square to the haft in the arm's plane, on the side away from the fold)
    mk = lambda name, FR: (lambda i, n: (fin(dict(FR[i]), '%s %d' % (name, i + 1)), 0))
    return [('idle', 1, False, mk('idle', IDLE), 'ik'), (ROW, 6, False, mk(ROW, F), 'ik')]


def rows_greataxe(R):
    """Talmok's greataxe (11-19): THE OVERHAND CHOP, both hands on one haft. The rig's laws are the rows' above -- the hips' turn (`yaw`: - puts
    his LEFT side forward), the waist's twist, the lean, the knees' drop, the shoulders raised (`sh`) -- but the arms are not angles here: a
    frame names THE HAFT. `fr` is where the right fist is, in metres on the floor's own axes (across: + his left; forward: -; above the floor);
    `haft` is which way the haft points from the fists to the head. The left fist is SPACE down the haft from the right, on every frame; each
    wrist is walked in until its fist sits on its mark (the fist rides the forearm's line, so the wrist is found, not placed). The edge is
    square to the haft in the plane it swings in, leading the swing. Each wrist's angle to the haft and how far each fist is off its mark are
    printed: a fist more than a centimetre off is an arm that could not reach, and the frame wants moving.
    The left foot STEPS: off the floor on 3, down ahead on 4 and 5, drawn back on 6 (`step`: forward, up, the toes' pitch)."""
    za, zb = R.ANK0['a'].z, R.ANK0['b'].z
    X = Vector((1, 0, 0))
    FWK = 0.85 if DWARF else 1.0       # (how far forward a dwarf's fists go of a man's: his arms are the man's a little shortened)
    OUT_, DOWN, HIGH = (0.55, 0.45, -0.60), (0.45, 0.20, -1.0), (0.9, 0.1, 0.35)      # an elbow out and back (the guard), under the arm (the follow-through), and out and a little up (the blow: the forearms come down onto the haft)

    XS = 0.06 if DWARF else 0.0        # (the haft a little toward his left: a dwarf's chest is wider, and the left fist could not come across to its mark)

    def P(fr, haft, lift, shift=0.0, lean=0, yaw=0, twist=0, head=0, hyaw=0, sh=0, fw=0, heel=0, step=(0, 0, 0), eL=DOWN, eR=DOWN, fl=None, air=0.0, tuck=(0, 0), stepb=0.0, sp=SPACE):
        # (the dwarf build, 11-19, Brann's: the fists' heights go through zmap as the slash's do, the reach forward and the body's moves by FWK and HK; the human build's numbers are untouched, those being 1 and 0 there.
        #  THE JUMP: `air` is how far the whole of him is off the floor, in metres as they are; `tuck` is how much further each foot is drawn up under him, left then right; `stepb` is the right foot's own step forward)
        return dict(_fl=fl, _sp=sp, lift=(lift * HK + air) * U, shift=shift * U * HK, lean=lean, bodyyaw=yaw, twist=twist, head=head, hyaw=hyaw, shupa=sh, shupb=sh, shfwa=fw, shfwb=fw,
                    legs={'a': (0.13 * U, (-0.12 - step[0] * HK) * U, za + (step[1] * HK + air + tuck[0]) * U, 10, step[2]), 'b': (-0.13 * U, (0.10 - stepb * HK) * U, zb + (air + tuck[1]) * U, 28, heel)},
                    epolea=eL, epoleb=(-eR[0], eR[1], eR[2]), _fr=(fr[0] + XS, fr[1] * FWK, zmap(fr[2]) + air), _haft=haft)

    F = [
        P((-0.14, -0.20, 1.17), (-0.30, 0.10, 0.95), -0.04, lean=3, yaw=-18, hyaw=16, eL=OUT_, eR=OUT_, sp=0.52),                              # 1 THE GUARD: the axe at port across his chest, its head up by the right shoulder; the hands WIDE on the haft, the left low at the belt and the right up at his chest (Fiore's guards, 35v)
        P((-0.15, 0.0, 1.62), (-0.20, 0.40, 0.89), -0.04, shift=0.03, lean=-2, yaw=-26, twist=-8, hyaw=28, sh=8, eL=(0.3, -0.3, -1.0), eR=(0.9, 0.5, 0.1), sp=0.50),   # 2 THE LIFT: the hands up his right side, still wide, the weight back, the head of the axe going up and back
        P((-0.12, 0.12, 1.97), (0.0, 0.97, 0.25), -0.02, shift=0.01, lean=-8, yaw=-10, twist=-2, head=-4, hyaw=10, sh=16, step=(0.08, 0.06, -8), eL=(1.0, -0.4, 0.0), eR=(1.0, -0.4, 0.0), sp=0.40),   # 3 THE TOP: the hands over his brow, a forearm apart (posta di donna's spacing), the axe laid back over his head, the left foot off the floor and going forward
        P((-0.12, -0.76, 1.20), (0.0, -0.966, 0.259), -0.12, shift=-0.08, lean=16, yaw=4, twist=4, head=-8, sh=4, fw=8, heel=12, step=(0.16, 0, 0), eL=HIGH, eR=HIGH, sp=0.15),          # 4 THE CHOP: the right hand has SLID DOWN the haft to the left, the two fists together by the butt (Fiore 37r, the blow landed), the arms thrown out level and the blade straight down in front
        P((-0.10, -0.72, 0.70), (0.03, -0.99, -0.10), -0.17, shift=-0.10, lean=30, yaw=6, twist=4, head=-14, fw=10, heel=16, step=(0.16, 0, 0), sp=0.15),               # 5 THROUGH: the hands still together, the blade down by the floor in front, the knees deep, his back over it
        P((-0.13, -0.30, 1.18), (-0.20, -0.25, 0.95), -0.06, shift=-0.02, lean=6, yaw=-10, hyaw=8, step=(0.05, 0, 0), eL=OUT_, eR=OUT_, sp=0.44),                     # 6 the foot drawn back, the right hand sliding back up the haft as the axe comes up to the guard
    ]
    FEET = (0.25, -0.55, -1.0)             # (an elbow turned down and forward, at the target's feet -- his word on the first render of frame 4: "bring his elbows toward targets feet in 4, his arms are wrong, that's an ungripped axe")
    if DWARF and KIT == 'greataxe':        # BRANN'S (11-19, Griz to the lanes desk: "have him jump and really really chop"): the dwarf leaves the floor with the axe over his head and comes down on it
        F = [
            P((-0.14, -0.20, 1.22), (-0.30, 0.10, 0.95), -0.08, lean=5, yaw=-18, hyaw=16, eL=OUT_, eR=OUT_, sp=0.46),                                                         # 1 THE GUARD: the axe at port across his chest, the knees already bent; the hands wide on the haft
            P((-0.15, -0.02, 1.50), (-0.20, 0.40, 0.89), -0.24, shift=0.02, lean=10, yaw=-24, twist=-8, hyaw=26, sh=6, heel=10, eL=(0.3, -0.3, -1.0), eR=(0.9, 0.5, 0.1), sp=0.46),    # 2 THE COIL: sunk deep on both legs, the axe going up his right side, the hands still wide
            P((-0.12, -0.04, 1.97), (0.0, 0.97, 0.25), 0.0, shift=-0.12, lean=-10, yaw=-8, head=-4, hyaw=8, sh=16, step=(0.14, 0, -20), stepb=0.10, air=0.34, tuck=(0.22, 0.12), eL=(1.0, -0.4, 0.0), eR=(1.0, -0.4, 0.0), sp=0.38),   # 3 THE TOP OF THE JUMP: both feet off the floor and drawn up, his back arched, the axe laid back over his head
            P((-0.12, -1.21, 1.62), (0.0, -0.98, 0.17), 0.0, shift=-0.34, lean=26, yaw=4, twist=4, head=-12, sh=6, fw=14, step=(0.45, 0, 20), stepb=-0.15, air=0.30, tuck=(0.02, 0.30), eL=FEET, eR=FEET, sp=0.16),   # 4 THE CHOP, coming down: the right hand slid down to the left, the fists together by the butt; still in the air, the arms thrown out and the blade down through the target's collar
            P((-0.10, -1.12, 0.98), (0.03, -0.92, -0.38), -0.26, shift=-0.36, lean=34, yaw=6, twist=4, head=-16, fw=10, heel=18, step=(0.40, 0, 0), stepb=0.22, sp=0.16),    # 5 LANDED: both feet down ahead of where he stood, the knees deep, the blade driven to the floor, the hands still together
            P((-0.13, -0.42, 1.20), (-0.20, -0.25, 0.95), -0.08, shift=-0.14, lean=6, yaw=-10, hyaw=8, step=(0.18, 0, 0), stepb=0.08, eL=OUT_, eR=OUT_, sp=0.42),             # 6 stepping back, the right hand sliding back up as the axe comes up to the guard
        ]
    if KIT == 'spearthrow':        # THE THROW (11-19): one hand, the left free (`fl`: where its fist is, as `fr`); the spear gone after 4
        F = [
            P((-0.24, -0.06, 1.50), (0.04, -0.97, 0.22), -0.04, lean=2, yaw=-16, hyaw=14, eR=OUT_, fl=(0.16, -0.36, 1.18), eL=DOWN),                                  # 1 the spear up to the right shoulder in an overhand grip, level, its point at the enemy; the left hand coming up in front
            P((-0.30, 0.30, 1.60), (0.10, -0.95, 0.28), -0.05, shift=0.04, lean=-4, yaw=-42, twist=-14, hyaw=50, sh=8, eR=(0.9, 0.5, 0.1), fl=(0.10, -0.56, 1.40)),   # 2 THE DRAW: his left side to the enemy, the weight back, the spear hand drawn back past the ear, the left arm out at the mark
            P((-0.28, 0.08, 1.72), (0.05, -0.97, 0.22), -0.06, shift=-0.01, lean=2, yaw=-22, twist=-4, hyaw=22, sh=12, step=(0.08, 0.05, -8), eR=HIGH, fl=(0.20, -0.42, 1.24)),   # 3 THE STEP: the left foot off the floor and forward, the hips coming round, the elbow leading the hand
            P((-0.18, -0.62, 1.78), (0.0, -0.99, 0.10), -0.10, shift=-0.09, lean=13, yaw=16, twist=10, head=-6, hyaw=-14, sh=8, fw=6, heel=12, step=(0.15, 0, 0), fl=(0.24, -0.14, 1.02)),   # 4 THE RELEASE: the foot down, the weight on it, the arm out high and forward, the spear leaving the fingers; the left hand pulled in to the hip
            P((0.02, -0.46, 0.98), (0.3, -0.8, -0.5), -0.11, shift=-0.10, lean=22, yaw=24, twist=14, head=-10, hyaw=-20, heel=16, step=(0.15, 0, 0), fl=(0.30, 0.06, 1.00)),   # 5 the follow-through: the empty hand down and across, the right shoulder through
            P((-0.24, -0.10, 0.98), (0.0, -0.6, -0.8), -0.05, shift=-0.02, lean=5, yaw=4, step=(0.04, 0, 0), fl=(0.24, -0.10, 0.96)),                              # 6 the foot drawn back, both hands down: he has thrown it
        ]
    elif KIT == 'spearpush':       # KEEP BACK (11-19): the point out, stabbing the space in front of him; `haft` points along the spear to its point
        # RE-POSED 11-20 against the plates (de Gheyn 14, 23 and 29; Fiore's short spear, 39r to 40r), on his ruling of 11-19: "mark the spear
        # one as separate or short, but the hand at the butt". The right fist holds the BUTT and never slides; the left is SPUSH ahead of it.
        # The rear arm stays long and low and DRIVES (de Gheyn 23): the extend is the right fist pushed forward from behind the hip to in
        # front of it, not lifted to the chest as the first pose had it.
        GD = dict(lean=3, yaw=-38, hyaw=34, eL=DOWN, eR=OUT_)
        F = [
            P((-0.24, 0.30, 0.98), (0.18, -0.93, 0.30), -0.05, shift=0.02, **GD),                                                        # 1 THE GUARD: side-on, his left side and foot forward; the rear hand at the butt, behind his right hip; the left hand ahead at his chest's height, the point forward and up at the enemy's face
            P((-0.22, 0.02, 1.04), (0.12, -0.99, 0.07), -0.07, shift=-0.03, lean=8, yaw=-30, hyaw=26, eR=OUT_),                          # 2 EXTEND: the rear arm drives the butt forward past the hip, long and low; the spear runs out level, the knees bending
            P((-0.20, -0.16, 1.16), (0.14, -0.98, 0.10), -0.09, shift=-0.07, lean=13, yaw=-20, hyaw=16, head=-6, fw=8),                  # 3 THE POINT, high: a short jab at the height of a chest, on his left of the middle; both arms long
            P((-0.14, -0.10, 1.20), (-0.04, -0.96, -0.24), -0.12, shift=-0.07, lean=15, yaw=-14, twist=4, hyaw=10, head=-8, fw=8),       # 4 THE POINT AGAIN, somewhere else: the butt lifted, the point dipped low at a thigh, on his right of the middle
            P((-0.24, 0.22, 1.00), (0.16, -0.95, 0.27), -0.06, shift=0.0, lean=5, yaw=-34, hyaw=30, eR=OUT_),                            # 5 the quick return: snatched back, nearly the guard
            P((-0.24, 0.30, 0.98), (0.18, -0.93, 0.30), -0.05, shift=0.02, **GD),                                                        # 6 the guard again
        ]
    elif KIT == 'pike':            # THE PIKE TROOPER (11-20; de Gheyn 14, 23 and 29): the butt in the right fist; `sp` is how far up the shaft the LEFT hand is, and the shaft runs out through it on the thrust
        F = [
            P((-0.22, 0.30, 0.98), (0.08, -0.995, 0.04), -0.06, shift=0.03, lean=3, yaw=-46, hyaw=42, eL=DOWN, eR=OUT_, sp=0.52),                              # 1 THE GUARD: side-on, the left side and foot forward, the pike level at the hip, the butt behind the right hip, the weight back
            P((-0.32, 0.58, 1.36), (0.07, -0.997, 0.0), -0.05, shift=0.05, lean=0, yaw=-62, hyaw=56, sh=4, eL=DOWN, eR=(0.3, 1.0, -0.4), sp=0.66),              # 2 THE CHARGE: drawn back and up to the shoulder -- the right arm straight back along the shaft to the butt, the left hand under the shaft at the chin, the shaft level across the top of the chest (de Gheyn 14)
            P((-0.32, 0.50, 1.36), (0.07, -0.997, 0.0), -0.08, shift=-0.03, lean=5, yaw=-56, hyaw=50, sh=4, step=(0.10, 0.05, -8), eL=DOWN, eR=(0.3, 1.0, -0.4), sp=0.66),   # 3 THE STEP: the weight going forward, the left foot off the floor, the pike still at the charge
            P((-0.16, -0.26, 1.34), (0.03, -0.999, -0.02), -0.12, shift=-0.10, lean=14, yaw=-22, twist=6, hyaw=18, head=-6, fw=8, heel=12, step=(0.18, 0, 0), eL=DOWN, eR=DOWN, sp=0.20),   # 4 THE THRUST: the foot down, the right hand driven forward till it meets the left, the shaft run out through the left hand to its farthest reach; both arms long
            P((-0.22, 0.26, 1.16), (0.07, -0.995, 0.03), -0.08, shift=-0.03, lean=6, yaw=-40, hyaw=36, step=(0.10, 0, 0), eL=DOWN, eR=OUT_, sp=0.50),            # 5 drawn back: the shaft pulled back through the left hand, coming down toward the hip
            P((-0.22, 0.30, 0.98), (0.08, -0.995, 0.04), -0.06, shift=0.03, lean=3, yaw=-46, hyaw=42, eL=DOWN, eR=OUT_, sp=0.52),                              # 6 the guard again
        ]
    IDLE = [dict(F[0])]
    SP = SPUSH if KIT == 'spearpush' else -SPACE          # (the left fist from the right, along the haft toward its head)

    def fin(P, tag):
        Q = {k: v for k, v in P.items() if not k.startswith('_')}
        b = Vector(P['_haft']).normalized(); e = X.cross(b); e = e.normalized() if e.length > 1e-4 else Vector((0, 0, 1))
        fr = Vector(P['_fr']) * U; fr.z += R.FLOOR
        mark = {'b': fr, 'a': fr + b * SP * U}
        if KIT == 'greataxe':          # (the sliding hand, 11-20: the left fist where it always was, the right `sp` up the haft from it)
            mark['b'] = fr + b * (P['_sp'] - SPACE) * U
        if KIT == 'pike':
            mark['a'] = fr + b * P['_sp'] * U
        if P.get('_fl'):               # (a free left hand: where the frame says)
            mark['a'] = Vector(P['_fl']) * U; mark['a'].z += R.FLOOR
        d, lift, shift, sway = R.pose_d(Q); M = R.solve(d, lift, shift, sway, mats=True)[1]       # (the shoulders: the arms not yet placed)
        Q['hands'] = {'b': tuple(b)} if P.get('_fl') else {'a': tuple(b), 'b': tuple(b)}; Q['handsup'] = {'a': tuple(e), 'b': tuple(e)} if KIT == 'greataxe' else {'b': tuple(e)}
        arms = {}
        for s_, sd in (('a', 'L'), ('b', 'R')):
            sho = M['arm.' + sd].translation; arms[s_] = mark[s_] + (sho - mark[s_]).normalized() * HAND * U - sho
        for it in range(8):          # walk each wrist in: the fist is HAND along the forearm from it, wherever the elbow puts the forearm
            Q['arms'] = {k: tuple(v) for k, v in arms.items()}
            d, lift, shift, sway = R.pose_d(Q); M = R.solve(d, lift, shift, sway, mats=True)[1]
            for s_, sd in (('a', 'L'), ('b', 'R')):
                arms[s_] = arms[s_] + (mark[s_] - M['hand.' + sd].translation)
        Q['arms'] = {k: tuple(v) for k, v in arms.items()}
        d, lift, shift, sway = R.pose_d(Q); M = R.solve(d, lift, shift, sway, mats=True)[1]
        out = []
        for s_, sd in (('a', 'L'), ('b', 'R')):
            f = (M['fore.' + sd] @ Vector((0, R.BN['fore.' + sd].length, 0)) - M['fore.' + sd].translation).normalized()
            out.append('%s wrist %3.0f off the haft, its fist %.1f cm off its mark' % (sd, math.degrees(f.angle(b)), (M['hand.' + sd].translation - mark[s_]).length / U * 100))
        ed = M['hand.' + HANDOF.get(KIT, 'R')] @ Vector((0, EDGE[KIT][0] * U, EDGE[KIT][1] * U))
        print("%s %s: %s | the edge's middle at x %.2f y %.2f z %.2f" % (LOG, tag, '; '.join(out), ed.x / U, ed.y / U, (ed.z - R.FLOOR) / U))
        if tag == ROW + ' 4' and KIT != 'spearthrow':
            GARRISON['ty'] = ed.y / U + (0.02 if KIT == 'greataxe' else -0.30)          # (the target stood where the blade comes down, the edge just inside its chest; or a foot past the spear's point: Keep Back stabs the space)
        return Q
    mk = lambda name, FR: (lambda i, n: (fin(dict(FR[i]), '%s %d' % (name, i + 1)), 0))
    return [('idle', 1, False, mk('idle', IDLE), 'ik'), (ROW, 6, False, mk(ROW, F), 'ik')]


def rows(R):
    return rows_greataxe(R) if KIT in ('greataxe', 'spearthrow', 'spearpush', 'pike') else rows_garrison(R) if KIT in GARR else rows_maces(R) if KIT == 'maces' else rows_slash(R)


ROWS_META = {'idle': dict(fps=6), ROW: dict(fps=12, release=3)}     # (frame 4 is the hit in both: his "4 is supposed to be the cut", 11-12)


def heads(arm):
    """each mace head's middle and each fist, in the rig's own metres (the armature unscaled and unturned)."""
    out = {}
    for s in 'LR':
        M = arm.pose.bones['hand.' + s].matrix
        out[s] = (np.array(M @ Vector((0, HEADC * U, 0))) / U, np.array(M @ Vector((0, 0, 0))) / U)
    return out


def main():
    scene, arm, body, maces, dummy, R, vcol = build()
    rowdefs = rows(R)
    R.key_rows(rowdefs)

    R.use(ROW); scene.frame_set(ROWS_META[ROW]['release'] + 1); bpy.context.view_layer.update()
    if KIT == 'maces':     # ---- the target stood where the hit lands: its shoulder line under the two heads at THE HIT
        H = heads(arm); hw, hz, hr = SHO
        ty = float((H['L'][0][1] + H['R'][0][1]) / 2)
        top = hz + 0.01 + 0.075                       # the pad's top
        for s, x in (('L', 1), ('R', -1)):
            h = H[s][0]
            print('%s THE HIT %s: the head at x %.3f y %.3f z %.3f -- the shoulder %.3f across, its pad\'s top %.3f: off by %.3f across, %.3f up (the head\'s underside to the pad)'
                  % (LOG, s, h[0], h[1], h[2], hw * x, top, h[0] - hw * x, h[2] - HEADR - top))
    elif KIT in GARR:      # ---- the garrison's: the axe is not aimed, so the target is stood where its edge comes down; a throw and a shot have it a few paces off
        Mh = arm.pose.bones['hand.' + HANDOF.get(KIT, 'R')].matrix; ed = np.array(Mh @ Vector((0, EDGE[KIT][0] * U, EDGE[KIT][1] * U))) / U
        ty = GARRISON.get('ty', -1.45)
        print('%s THE HIT: the edge\'s middle at x %.3f y %.3f z %.3f (the fist at %s); the weapon points %s; the mark %s' % (LOG, ed[0], ed[1], ed[2],
              np.round(np.array(Mh.translation) / U, 3), np.round(np.array(Mh.to_3x3().col[1]), 2), BELT if KIT == 'axe+shield' else BELLY if KIT == 'stab' else None))
    else:                  # ---- the target stood where the cut meets its neck (rows_slash worked it out)
        ty = SLASH['ty']
        for fr, mark, nm in ((4, LSHO, 'its left shoulder'), (5, RHIP, 'its right hip')) if SWSH else ((4, RIBS if DWARF else NECK, 'its ribs' if DWARF else 'its neck'), (5, ANKLE, 'its right ankle')):
            scene.frame_set(fr); bpy.context.view_layer.update()
            M = arm.pose.bones['hand.R'].matrix; f0 = np.array(M @ Vector((0, 0, 0))) / U; tip = np.array(M @ Vector((0, BLADE * U, 0))) / U
            m = np.array((mark[0], ty, mark[1])); d = tip - f0; t = float(np.dot(m - f0, d) / np.dot(d, d))
            print('%s frame %d: the fist at (%.2f, %.2f, %.2f), the tip at (%.2f, %.2f, %.2f); %s is %.3f from the blade\'s line, %.2f m along it from the fist (the tip at %.2f)'
                  % (LOG, fr, f0[0], f0[1], f0[2], tip[0], tip[1], tip[2], nm, float(np.linalg.norm(f0 + d * t - m)), t * BLADE, BLADE))
    dummy.matrix_world = Matrix.Translation((0, ty * U, 0)); bpy.context.view_layer.update()
    print('%s the target stands %.3f m in front (toe to toe about %.2f)' % (LOG, -ty, -ty - 0.17 - 0.155))
    for name, n, loop, fn, how in rowdefs:
        R.use(name)
        for i in range(n):
            scene.frame_set(i + 1); bpy.context.view_layer.update()
            a = []
            for s in [k for k in maces if k in 'LR']:
                fo, hd = arm.pose.bones['fore.' + s], arm.pose.bones['hand.' + s]
                a.append('%s %.0f' % (s, math.degrees((fo.tail - fo.head).angle(hd.tail - hd.head))))
            hz_ = ['%s %.3f' % (sd, (arm.pose.bones['foot.' + sd].head.z - R.ANK0['a' if sd == 'L' else 'b'].z) / U) for sd in 'LR']
            print('%s wrists %s %d: the weapon off the forearm %s | each ankle risen (m) %s' % (LOG, name, i + 1, ', '.join(a), ', '.join(hz_)))
    # ---- the positions the strips are rendered from, one file a kit (11-20: every guide carries it; before, a seat lifted it from the poser's file by hand)
    os.makedirs(os.path.join(WORK, 'render'), exist_ok=True)
    _plain = lambda v: {k: _plain(x) for k, x in v.items()} if isinstance(v, dict) else [_plain(x) for x in v] if isinstance(v, (tuple, list, Vector)) else v
    json.dump({name: {str(i): _plain(fn(i, n)[0]) for i in range(n)} for name, n, loop, fn, how in rowdefs},
              open(os.path.join(WORK, 'render', os.path.basename(WORK) + '-poses.json'), 'w'), indent=1)
    if MODE == 'hit':
        return

    cam = MQ.make_camera(scene); MQ.look(scene)
    os.makedirs(os.path.join(WORK, 'render'), exist_ok=True)
    held = list(maces.values())

    def hide(objs, v):
        for o in objs:
            o.hide_render = v

    # ---- the size: the mannequin's idle from the front as many rows tall as the hero's idle S (the slash's measure)
    want, hfw, hfh, hax, hay = MQ.hero_height()
    R.use('idle'); scene.frame_set(1); s = 1.0 / U; got = None; hide(held + [dummy], True)
    for it in range(6):
        arm.scale = (s, s, s); MQ.set_facing(arm, 0)
        lo = MQ.screen(cam, MQ.soles(body, R))[:, 1].max()
        MQ.frame_cam(scene, cam, 64, 80, 32, 70 + 0.9 - lo)
        a = MQ.render_alpha(scene, os.path.join(WORK, 'render', '_measure.png'))
        ys = np.where(a.any(1))[0]; got = int(ys[-1] - ys[0])
        if got == want:
            break
        s *= (want + 0.5) / (got + 0.5)
    assert got == want, 'the mannequin never stood %d rows' % want
    print('%s scale %.4f: %d rows, as %s' % (LOG, s, got, MQ.HERO))
    hide(held, False); SCALE = s

    def cells(extra):
        """each row's cell over the five facings (the striker and his maces, and `extra`), the feet's row its anchor."""
        D, Mx = {}, {}
        for name, n, loop, fn, how in rowdefs:
            R.use(name); ext = []
            for fname, f in FACINGS:
                MQ.set_facing(arm, f); scene.frame_set(1)
                lo = MQ.screen(cam, MQ.soles(body, R))[:, 1].max(); D.setdefault(fname, {})[name] = float(lo)
                for i in range(n):
                    scene.frame_set(i + 1)
                    p = MQ.screen(cam, np.vstack([MQ.world_pts(body, 2)] + [MQ.world_pts(o) for o in held + extra]))
                    ext.append((p[:, 0].min(), p[:, 0].max(), (p[:, 1] - lo).min(), (p[:, 1] - lo).max()))
            e = np.array(ext)
            ax = int(math.ceil(max(-e[:, 0].min(), e[:, 1].max()) + PAD)); fw = 2 * ax
            ay = int(math.ceil(-e[:, 2].min() + PAD)); fh = ay + int(math.ceil(max(e[:, 3].max(), 0) + PAD)) + 1; fh += fh % 2
            Mx[name] = dict(ROWS_META[name], fw=fw, fh=fh, ax=ax, ay=ay, frames=n)
        return D, Mx

    meta = dict(hero=MQ.HERO, hero_rows=want, scale=SCALE, ss=SS, k=K, facings=[f for f, _ in FACINGS], rows={}, model={}, points={})
    for kind, extra in (('render', []), ('model', [dummy])) if TARGET else (('render', []),):       # the sprite's cells (the striker alone), then the modeling poses (the target in)
        hide([dummy], not extra)
        D, Mx = cells(extra); meta['rows' if kind == 'render' else 'model'] = Mx
        for name, n, loop, fn, how in rowdefs:
            R.use(name); M = Mx[name]
            print('%s %s %s: the cell %dx%d, the anchor %d,%d' % (LOG, kind, name, M['fw'], M['fh'], M['ax'], M['ay']))
            os.makedirs(os.path.join(WORK, kind, name), exist_ok=True)
            for fname, f in FACINGS:
                MQ.set_facing(arm, f)
                lo = D[fname][name]; oy = M['ay'] + 0.9 - lo
                MQ.frame_cam(scene, cam, M['fw'], M['fh'], M['ax'], oy)
                pts = []
                for i in range(n):
                    scene.frame_set(i + 1); bpy.context.view_layer.update()
                    sc = lambda w: [round(float(v), 2) for v in (MQ.screen(cam, np.array([w]))[0] + np.array([M['ax'], oy]))]
                    if kind == 'render':
                        q = {}
                        for sd in [k for k in maces if k in 'LR']:
                            Mw = arm.matrix_world @ arm.pose.bones['hand.' + sd].matrix
                            q['fist' + sd] = sc(np.array(Mw @ Vector((0, 0, 0)))); q['head' + sd] = sc(np.array(Mw @ Vector((0, (HEADC if KIT == 'maces' else EDGE[KIT][0] if KIT in GARR else BLADE) * U, 0))))
                        wb = MQ.world_pts(body, 1); q['crown'] = sc(wb[MQ.screen(cam, wb)[:, 1].argmin()])
                        sl = MQ.soles(body, R); left = sl @ np.array(arm.matrix_world.to_3x3().col[0]) > 0
                        if left.any() and (~left).any():
                            q['soleL'] = sc(sl[left].mean(0)); q['soleR'] = sc(sl[~left].mean(0))
                        pts.append(q)
                    scene.render.filepath = os.path.join(WORK, kind, name, '%s_%02d.png' % (fname, i))
                    bpy.ops.render.render(write_still=True)
                if kind == 'render':
                    meta['points'].setdefault(name, {})[fname] = pts
            print('%s %s %s rendered' % (LOG, kind, name))
    json.dump(meta, open(os.path.join(WORK, 'render', 'meta.json'), 'w'), indent=1)
    print('%s ok: %s' % (LOG, os.path.join(WORK, 'render', 'meta.json')))

    if MODE == 'poser':
        hide([dummy], not TARGET); arm.scale = (1, 1, 1); arm.rotation_euler = (0, 0, 0); bpy.context.view_layer.update()
        if KIT in GARR:        # (the page carries a held thing whole on every frame: the loosed string stays off it, and the rest go as they are on frame 1)
            R.use(ROW); scene.frame_set(1); bpy.context.view_layer.update()
            for k in ('loose', 'shalf', 'sfull', 'ahalf', 'afull'):
                maces.pop(k, None)
        R.export_poser(os.path.join(WORK, 'poser.json'), rowdefs, col=vcol, fig=os.path.basename(WORK), fps={k: v['fps'] for k, v in ROWS_META.items()},
                       extras=[(maces[k], COL['head' + k] if KIT == 'maces' else COL.get({'span': 'string', 'bolt': 'bolt', 'srest': 'string', 'anock': 'bolt', 'slung': 'haft'}.get(k), COL['blade'])) for k in maces] + ([(dummy, COL['dummy'])] if TARGET else []))


if __name__ == '__main__':
    main()
