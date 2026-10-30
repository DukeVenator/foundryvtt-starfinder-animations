import { BURST_DELAY_MS, MODULE_ID, SMOKE_DURATION_MS } from "./constants.js";
import { criticalImpactFiles, criticalImpactForDamage, criticalParticleFiles } from "./catalog.js";
import { toFeet } from "./geometry.js";

/**
 * Spell effects for the Starfinder compendium. Named spells are checked
 * first, then damage type and area, then school. Utility spells play on the
 * caster when nothing is targeted.
 */

const RAY = {
    fire: ["jb2a.fire_bolt.orange", "jb2a.scorching_ray.01.orange"],
    cold: ["jb2a.ray_of_frost.blue", "jb2a.snowball_toss.white.01"],
    electricity: ["jb2a.chain_lightning.primary.blue", "jb2a.lightning_bolt.narrow.blue"],
    acid: ["jb2a.disintegrate.green", "jb2a.arrow.poison.green.01"],
    sonic: ["jb2a.soundwave.01.blue", "jb2a.shatter.blue"],
    radiation: ["jb2a.lasershot.green", "jb2a.disintegrate.green"],
    plasma: ["jb2a.scorching_ray.01.orange", "jb2a.energy_beam.normal.bluepink.02"],
    force: ["jb2a.magic_missile.purple", "jb2a.eldritch_blast.purple"]
};

const BURST = {
    fire: ["jb2a.fireball.explosion.orange", "jb2a.eruption.orange.01"],
    cold: ["jb2a.ice_spikes.radial.burst.white", "jb2a.sleet_storm.01.blue"],
    electricity: ["jb2a.call_lightning.low_res.blue", "jb2a.lightning_strike.blue"],
    acid: ["jb2a.fumes.steam.white", "jb2a.markers.poison.dark_green.01"],
    sonic: ["jb2a.thunderwave.center.blue", "jb2a.shatter.blue"],
    radiation: ["jb2a.particles.swirl.greenyellow.01", "jb2a.particle_burst.01.circle.bluepurple"],
    plasma: ["jb2a.explosion.01.orange", "jb2a.particle_burst.01.circle.bluepurple"],
    force: ["jb2a.explosion.02.blue", "jb2a.energy_strands.complete.blue"]
};

const CONE = {
    fire: ["jb2a.burning_hands.01.orange", "jb2a.breath_weapons.fire.cone.orange.01"],
    cold: ["jb2a.cone_of_cold.blue", "jb2a.breath_weapons.cold.cone.blue"],
    electricity: ["jb2a.breath_weapons.lightning.line.blue", "jb2a.template_cone_5e.lightning.01.loop.bluepurple"],
    acid: ["jb2a.breath_weapons.poison.cone.green", "jb2a.breath_weapons.acid.line.green"],
    sonic: ["jb2a.thunderwave.center.blue", "jb2a.gust_of_wind.default"],
    radiation: ["jb2a.breath_weapons.poison.cone.green", "jb2a.particles.outward.greenyellow.01"],
    plasma: ["jb2a.breath_weapons.fire.cone.orange.01", "jb2a.burning_hands.01.orange"],
    force: ["jb2a.gust_of_wind.default", "jb2a.template_cone_5e.001.001.purplered"]
};

const MELEE = {
    fire: ["jb2a.melee_attack.01.trail.01.orangered", "jb2a.melee_attack.02.trail.01.orangered"],
    cold: ["jb2a.melee_attack.01.trail.01.blueyellow", "jb2a.melee_attack.02.trail.01.blueyellow"],
    electricity: ["jb2a.melee_attack.01.magic_sword.yellow.01", "jb2a.static_electricity.02.blue"],
    acid: ["jb2a.melee_attack.01.shortsword.01.0", "jb2a.particles.outward.greenyellow.01"],
    sonic: ["jb2a.melee_attack.01.trail.01.pinkpurple", "jb2a.soundwave.01.blue"],
    radiation: ["jb2a.melee_attack.01.trail.01.pinkpurple", "jb2a.particles.swirl.greenyellow.01"],
    plasma: ["jb2a.melee_attack.01.trail.01.pinkpurple", "jb2a.melee_attack.02.trail.01.pinkpurple"],
    force: ["jb2a.melee_attack.01.magic_sword.yellow.01", "jb2a.arcane_hand.purple"]
};

const WALL = {
    fire: ["jb2a.energy_wall.01.10x05ft.01.complete.orange", "jb2a.fire_ring.900px.red"],
    cold: ["jb2a.shield_themed.above.ice.01.blue", "jb2a.ice_spikes.wall.burst.white"],
    electricity: ["jb2a.lightning_bolt.wide.blue", "jb2a.electric_arc.01"],
    acid: ["jb2a.energy_strands.in.green", "jb2a.markers.poison.dark_green.01"],
    sonic: ["jb2a.soundwave.02.blue", "jb2a.thunderwave.center.blue"],
    force: ["jb2a.shield.01.complete.01.blue", "jb2a.energy_field.01.blue"],
    default: ["jb2a.energy_wall.01.10x05ft.01.complete.orange", "jb2a.shield.01.complete.01.blue"]
};

const SCHOOL_RAY = {
    evo: ["jb2a.lasershot.orange", "jb2a.scorching_ray.01.orange"],
    nec: ["jb2a.toll_the_dead.green.shockwave", "jb2a.disintegrate.green"],
    enc: ["jb2a.eldritch_blast.purple", "jb2a.magic_missile.purple"],
    ill: ["jb2a.eldritch_blast.purple", "jb2a.magic_signs.circle.02.illusion.complete.purple"],
    abj: ["jb2a.guiding_bolt.01.blueyellow", "jb2a.magic_missile.purple"],
    div: ["jb2a.guiding_bolt.01.blueyellow", "jb2a.moonbeam.01.complete.blue"],
    con: ["jb2a.magic_missile.purple", "jb2a.eldritch_blast.purple"],
    trs: ["jb2a.energy_beam.normal.blue.01", "jb2a.lasershot.blue"],
    uni: ["jb2a.eldritch_blast.purple", "jb2a.cast_generic.02.blue"]
};

const SCHOOL_SELF = {
    abj: ["jb2a.magic_signs.circle.02.abjuration.complete.blue", "jb2a.shield.01.complete.01.blue"],
    con: ["jb2a.magic_signs.circle.02.conjuration.complete.yellow", "jb2a.cast_generic.01.yellow"],
    div: ["jb2a.magic_signs.circle.02.divination.complete.blue", "jb2a.detect_magic.circle.blue"],
    enc: ["jb2a.magic_signs.circle.02.enchantment.complete.pink", "jb2a.bardic_inspiration.greenorange"],
    evo: ["jb2a.magic_signs.circle.02.evocation.complete.red", "jb2a.cast_generic.fire.01.orange"],
    ill: ["jb2a.magic_signs.circle.02.illusion.complete.purple", "jb2a.shimmer.01.blue"],
    nec: ["jb2a.magic_signs.circle.02.necromancy.complete.green", "jb2a.toll_the_dead.green.complete"],
    trs: ["jb2a.magic_signs.circle.02.transmutation.complete.yellow", "jb2a.cast_generic.earth.01.browngreen"],
    uni: ["jb2a.cast_generic.02.blue", "jb2a.magic_signs.circle.01.abjuration"]
};

const ELEMENT_AUDIO = {
    fire: "spellFire",
    cold: "spellCold",
    electricity: "spellCastShort",
    acid: "spellAcid",
    sonic: "spellSonic",
    radiation: "spellAcid",
    plasma: "spellFire",
    force: "spellStrike",
    healing: "spellHeal"
};

const SCHOOL_AUDIO = {
    abj: "spellCastShort",
    con: "spellCastShort",
    div: "spellCastShort",
    enc: "spellCastShort",
    evo: "spellCastShort",
    ill: "spellCastShort",
    nec: "spellCastShort",
    trs: "spellCastShort",
    uni: "spellCastShort"
};

/** Use named cues only when the spell has no damage element. */
function namedSpellAudio(name) {
    if (matches(/smite/, name)) return "spellSmite";
    if (matches(/divine|holy|radiant|sacred/, name)) return "spellDivine";
    if (matches(/summon|conjure|call .*creature|summoning/, name)) return "spellSummon";
    if (matches(/detect|sense|analyze|identify|\bscan\b|divination|see invisibility|true seeing|arcane sight|prying eyes/, name)) return "spellDetect";
    if (matches(/shield|ward|barrier|aegis|protection/, name)) return "spellShield";
    if (matches(/wall|prison|cage|forcecage/, name)) return "spellWall";
    if (matches(/water|wave|tide|ocean|splash|rain|geyser/, name)) return "spellWater";
    if (matches(/gravity|gravit|singularity|black hole|void/, name)) return "spellGravity";
    return null;
}

/**
 * Pick one cue for the spell's visible beat. If `sound` is explicitly null,
 * keep it silent. Otherwise element cues come first, then style, and named
 * cues cover utility spells with no element.
 */
function spellAudioFor({ name = "", sound = null, style = "", element = null, school = "uni" }) {
    if (sound === null) return { sound: null, impactSound: null };
    let next = sound;
    if (style !== "melee") {
        if (element && ELEMENT_AUDIO[element]) next = ELEMENT_AUDIO[element];
        else if (style === "self") next = SCHOOL_AUDIO[school] ?? "spellCastShort";
        else if (style === "burst") next = "explosionShort";
        else if (style === "wall") next = "spellWall";
        else if (style === "cone") next = "spellSonic";
        else if (style === "projectile" || style === "beam") next = "spellStrike";
        const named = element ? null : namedSpellAudio(name);
        if (named) next = named;
    }
    return { sound: next, impactSound: null };
}

function auraSoundFor({ name = "", element = null, school = "uni" }) {
    if (matches(/(?<!see )invisibility|vanishing|displacement|mislead|\bveil\b|shadow body|\bfog\b|smog|\bmist\b|\bfear\b|stealth|silence/, name)) {
        return null;
    }
    if (element && ELEMENT_AUDIO[element]) return ELEMENT_AUDIO[element];
    const named = namedSpellAudio(name);
    if (named) return named;
    return SCHOOL_AUDIO[school] ?? "spellCastShort";
}

const NAME_ELEMENTS = [
    [/disintegrat/, "acid"],
    [/radia|irradiat/, "radiation"],
    [/acid|caustic|corros|venom|poison|miasma|spore|viral/, "acid"],
    [/cold|frost|hail|sleet|polar|subzero|cryo|\bice\b/, "cold"],
    [/electric|lightning|jolting|\bsurge\b|arcing|\bspark\b|discharge|overload/, "electricity"],
    [/sonic|soundwave|shriek|\bhowl\b|dissonan|\bscream\b|sympathetic vibration/, "sonic"],
    [/plasma/, "plasma"],
    [/fire|flame|pyre|lava|ember|volcan|inflame|\bburn\b|\bheat\b|overheat|explosive/, "fire"],
    [/force|gravity|gravitat|telekinet|psychokinetic|forcedisk/, "force"]
];

function spell(partial) {
    return {
        style: partial.style,
        files: partial.files,
        impactFiles: partial.impactFiles ?? null,
        particleFiles: partial.particleFiles ?? null,
        layerFiles: partial.layerFiles ?? [],
        extraCriticalParticles: partial.extraCriticalParticles ?? [],
        repeats: partial.repeats ?? 1,
        repeatDelay: BURST_DELAY_MS,
        scale: partial.scale ?? 1,
        duration: partial.duration ?? null,
        fadeIn: partial.fadeIn ?? null,
        fadeOut: partial.fadeOut ?? null,
        belowTokens: partial.belowTokens ?? false,
        fitToken: partial.fitToken ?? false,
        impactDelay: 0,
        criticalImpactFiles: null,
        unarmed: false,
        sound: partial.sound ?? null,
        impactSound: partial.impactSound ?? null,
        soundDelay: partial.soundDelay ?? 0,
        impactSoundDelay: partial.impactSoundDelay ?? null,
        criticalSound: partial.criticalSound ?? null,
        self: partial.self ?? false,
        onCaster: partial.onCaster ?? false,
        varied: partial.varied ?? false,
        extraParticleFiles: partial.extraParticleFiles ?? []
    };
}

function sparkle(spec, ...lists) {
    const groups = lists.filter((files) => files?.length);
    spec.particleFiles = groups[0] ?? spec.particleFiles ?? null;
    spec.extraParticleFiles = groups.slice(1);
    return spec;
}

function matches(pattern, name) {
    const flags = pattern.flags.includes("i") ? pattern.flags : `${pattern.flags}i`;
    return new RegExp(pattern.source, flags).test(name);
}

function cast(files, extra = {}) {
    return spell({ style: "self", files, self: true, scale: extra.scale ?? 1, sound: "spellCastShort", ...extra, self: true });
}

/** A silent bolt or hex that plays on the target. */
function targeted(files, extra = {}) {
    return spell({ style: "projectile", files, sound: null, ...extra });
}

function ray(files, extra = {}) {
    return spell({ style: "projectile", files, sound: "spellStrike", ...extra });
}

function beam(files, extra = {}) {
    return spell({ style: "beam", files, sound: "spellStrike", ...extra });
}

function burst(files, extra = {}) {
    return spell({ style: "burst", files, sound: extra.sound ?? "explosionShort", self: extra.self ?? false, ...extra });
}

function cone(files, extra = {}) {
    return spell({ style: "cone", files, sound: "spellSonic", ...extra });
}

function swipe(files) {
    return spell({ style: "melee", files, sound: "melee" });
}

function wall(files, extra = {}) {
    return spell({ style: "wall", files, self: true, scale: extra.scale ?? 1.35, sound: extra.sound ?? "spellWall", ...extra });
}

function fog(files = ["jb2a.fog_cloud.01.white", "jb2a.darkness.black"]) {
    return burst(files, {
        sound: null,
        self: true,
        scale: 1.8,
        duration: SMOKE_DURATION_MS,
        fadeIn: 400,
        fadeOut: 900,
        belowTokens: true
    });
}

/**
 * Iconic names. Checked before the element and school fallbacks.
 * Patterns are matched against the spell name only.
 */
const NAMED = [
    [/magic missile/, ray(["jb2a.magic_missile.purple", "jb2a.eldritch_blast.purple"], { repeats: 3 })],
    [/sinking ship|spectral ship|shipwreck/, sparkle(burst([
        "jb2a.template_circle.aura.01.complete.large.bluepurple",
        "jb2a.spirit_guardians.blueyellow.ring"
    ], {
        self: true,
        scale: 1.35,
        sound: "explosion",
        duration: 2800,
        fadeOut: 700,
        belowTokens: true,
        layerFiles: [
            ["jb2a.water_splash.circle.01.blue"],
            ["jb2a.ground_cracks.orange.01"],
            ["jb2a.fog_cloud.01.white"],
            ["jb2a.bubble.001.002.complete.blue"]
        ]
    }), ["jb2a.swirling_sparkles.01.blue"], ["jb2a.cast_generic.water.02.blue"], ["jb2a.energy_strands.complete.blue"], ["jb2a.liquid.splash.blue"])],
    [/negate spell|usurp spell|dampen spell|counterspell/, sparkle(cast([
        "jb2a.shatter.blue",
        "jb2a.magic_signs.circle.02.abjuration.complete.blue"
    ], { scale: 1.45 }), ["jb2a.shield.01.complete.01.blue"], ["jb2a.energy_strands.complete.blue"], ["jb2a.swirling_sparkles.01.blue"], ["jb2a.particle_burst.01.circle.bluepurple"])],
    [/psychokinetic shove|telekinetic shove/, sparkle(ray([
        "jb2a.magic_missile.purple",
        "jb2a.boulder.toss.02.01.stone.brown"
    ]), ["jb2a.energy_strands.complete.blue"], ["jb2a.particle_burst.01.circle.bluepurple"], ["jb2a.impact.007.yellow"])],
    [/psychokinetic hand|mage hand|unseen servant/, sparkle(burst([
        "jb2a.arcane_hand.purple",
        "jb2a.arcane_hand.blue"
    ], { self: true, scale: 1.15, sound: null }), ["jb2a.energy_strands.complete.blue"], ["jb2a.swirling_sparkles.01.blue"], ["jb2a.glint.yellow.few"])],
    [/token spell/, sparkle(cast([
        "jb2a.markers_scifi.001.complete.001.blue",
        "jb2a.magic_signs.circle.02.conjuration.complete.yellow"
    ], { scale: 1.2 }), ["jb2a.particle_burst.01.star.bluepurple"], ["jb2a.dancing_light.blueyellow"], ["jb2a.glint.yellow.many"])],
    [/mending|make whole/, sparkle(cast([
        "jb2a.cure_wounds.400px.blue",
        "jb2a.glint.yellow.many"
    ]), ["jb2a.swirling_sparkles.01.blue"], ["jb2a.glint.yellow.few"], ["jb2a.particles.002.001.complete.few.blue"])],
    [/wardrobe change|disguise self/, sparkle(cast([
        "jb2a.shimmer.01.blue",
        "jb2a.butterflies.complete.01.bluepurple"
    ], { onCaster: true, scale: 1.2 }), ["jb2a.dancing_light.pink"], ["jb2a.magic_signs.circle.02.illusion.complete.purple"], ["jb2a.glint.yellow.few"])],
    [/misfire/, sparkle(burst([
        "jb2a.explosion.01.orange",
        "jb2a.static_electricity.02.blue"
    ], { self: true, sound: "explosion" }), ["jb2a.impact.007.yellow"], ["jb2a.particle_burst.01.circle.bluepurple"], ["jb2a.flames.01.orange"])],
    [/hardlight/, sparkle(cast([
        "jb2a.dancing_light.yellow",
        "jb2a.energy_field.01.blue"
    ], { scale: 1.35 }), ["jb2a.particle_burst.01.circle.bluepurple"], ["jb2a.swirling_sparkles.01.blue"], ["jb2a.token_border.circle.static.blue.003"], ["jb2a.energy_strands.complete.blue"])],
    [/identify/, sparkle(cast([
        "jb2a.eyes.01.dark_green.many",
        "jb2a.moonbeam.01.complete.blue"
    ], { scale: 1.2 }), ["jb2a.detect_magic.circle.blue"], ["jb2a.twinkling_stars.points05.white"], ["jb2a.glint.yellow.few"])],
    [/confusion/, sparkle(burst([
        "jb2a.dizzy_stars.400px.blueorange",
        "jb2a.magic_signs.circle.02.enchantment.complete.pink"
    ], { self: true, sound: null, scale: 1.2 }), ["jb2a.music_notations.beamed_quavers.blue"], ["jb2a.swirling_sparkles.01.blue"], ["jb2a.butterflies.loop.01.bluepurple"])],
    [/life bubble/, sparkle(cast([
        "jb2a.bubble.001.002.complete.blue",
        "jb2a.antilife_shell.blue_with_circle"
    ], { scale: 1.4 }), ["jb2a.energy_field.01.blue"], ["jb2a.swirling_sparkles.01.blue"], ["jb2a.token_border.circle.static.blue.004"])],
    [/reality leap/, sparkle(cast([
        "jb2a.teleport.01.blue",
        "jb2a.portals.vertical.ring.bright_yellow"
    ], { scale: 1.3 }), ["jb2a.misty_step.02.blue"], ["jb2a.energy_strands.complete.blue"], ["jb2a.particle_burst.01.star.bluepurple"], ["jb2a.swirling_sparkles.01.blue"])],
    [/phantasmal maze|maze/, sparkle(burst([
        "jb2a.template_circle.aura.01.complete.large.bluepurple",
        "jb2a.magic_signs.circle.02.illusion.complete.purple"
    ], {
        self: true,
        scale: 1.7,
        sound: null,
        duration: 3200,
        fadeOut: 500,
        layerFiles: [["jb2a.web.01"], ["jb2a.energy_wall.01.10x05ft.01.complete.orange"]]
    }), ["jb2a.butterflies.complete.01.bluepurple"], ["jb2a.dizzy_stars.400px.blueorange"], ["jb2a.dancing_light.purplegreen"], ["jb2a.shimmer.01.blue"])],
    [/sustaining shelter|shelter/, sparkle(burst([
        "jb2a.energy_field.01.blue",
        "jb2a.antilife_shell.blue_with_circle"
    ], { self: true, scale: 1.7, sound: null, duration: 4000, fadeOut: 600 }), ["jb2a.fog_cloud.01.white"], ["jb2a.swirling_leaves.complete.01.green"], ["jb2a.bubble.001.002.complete.blue"], ["jb2a.token_border.circle.static.blue.003"])],
    [/disintegrate|erase existence|slice reality/, ray(["jb2a.disintegrate.green", "jb2a.lasershot.green"])],
    [/explosive blast|junk bomb|conjure grenade|time bombs/, burst(["jb2a.fireball.explosion.orange", "jb2a.explosion.01.orange"])],
    [/star storm|call cosmos|song of the cosmos|illusory star field/, burst(["jb2a.twinkling_stars.points06.white", "jb2a.moonbeam.01.complete.blue"], { sound: null, scale: 1.4 })],
    [/detect magic|arcane sight|see invisibility|true seeing|x-ray|glimpse of truth|arcane eye|prying eyes/, sparkle(cast(["jb2a.detect_magic.circle.blue", "jb2a.moonbeam.01.complete.blue"], { scale: 1.3 }), ["jb2a.eyes.01.dark_green.few"], ["jb2a.twinkling_stars.points06.white"], ["jb2a.swirling_sparkles.01.blue"])],
    [/(?<!see )invisibility|vanishing trick|displacement|mislead|\bveil\b|shadow body|selective invisibility/, cast(["jb2a.shimmer.01.blue", "jb2a.misty_step.01.blue"], { sound: null })],
    [/teleport|dimension door|plane shift|shadow jump|shadow walk|slip through space|ethereal jaunt|reality leap|chrono leap|emberstep|interplanetary/, cast(["jb2a.teleport.01.blue", "jb2a.misty_step.02.blue"])],
    [/mystic cure|healing junkbot|regenerate|restoration|stabilize|remove affliction|remove condition|soothing protocol|necromantic revitalization/, cast(["jb2a.cure_wounds.400px.blue", "jb2a.healing_generic.400px.blue"])],
    [/dancing lights|revealing light|bioluminescent|glowing wall/, cast(["jb2a.dancing_light.yellow", "jb2a.dancing_light.blueyellow"])],
    [/darkness|gloom mote|eclipse touch|umbral tendrils/, burst(["jb2a.darkness.black", "jb2a.arms_of_hadar.dark_purple"], { sound: null, self: true })],
    [/fog cloud|wall of fog|smog bank|corrosive haze|acidic mist|burning ash/, fog()],
    [/grease/, burst(["jb2a.grease.dark_brown.loop", "jb2a.liquid.splash.blue"], { sound: null, self: true, belowTokens: true })],
    [/grasping brambles|sprout|verdant|algae bloom|petal storm/, burst(["jb2a.entangle.green", "jb2a.plant_growth.03.square.2x2.complete.greenyellow"], { sound: null, self: true })],
    [/sleep|slumber|fatigue|day's weariness|waves of fatigue/, burst(["jb2a.sleep.cloud.01.pink", "jb2a.sleep.symbol.pink"], { sound: null, self: true })],
    [/fear|paranoia|nightmare|hateful visage|atavistic howl/, burst(["jb2a.icon.fear.dark_purple", "jb2a.eyes.01.dark_green.few"], { sound: null, self: true })],
    [/charm|suggestion|dominate/, cast(["jb2a.magic_signs.circle.02.enchantment.complete.pink", "jb2a.bardic_inspiration.greenorange"])],
    [/hold person|hold monster|hold portal|mental block|feeblemind/, sparkle(burst(["jb2a.magic_signs.circle.02.enchantment.complete.pink", "jb2a.sleep.symbol.dark_pink"], { sound: null, self: true, scale: 1.15 }), ["jb2a.web.01"], ["jb2a.dizzy_stars.400px.blueorange"], ["jb2a.energy_strands.in.green"])],
    [/\bhaste\b|accelerate step|rocket dash|prope[l]+ed leap/, cast(["jb2a.on_token_buff.001.001.orangeyellow", "jb2a.bless.400px.intro.yellow"])],
    [/\bslow\b|time crawl|weight of ages|time loop/, cast(["jb2a.on_token_buff.001.001.blue", "jb2a.magic_signs.circle.02.transmutation.complete.yellow"])],
    [/shield|aegis|resistant armor|reflecting armor|death ward|life bubble|resilient sphere|forcecage|magic seal|digital shield|storm-deflecting/, cast(["jb2a.shield.01.complete.01.blue", "jb2a.antilife_shell.blue_with_circle"], { varied: true })],
    [/summon creature|summon drift|spiritual minion|unseen servant|wisp ally|handy junkbot|battle junkbot|vigilant junkbot|prowling junkbot|healing junkbot|school spirit/, cast(["jb2a.spirit_guardians.blueyellow.ring", "jb2a.arcane_hand.blue"], { scale: 1.2 })],
    [/animate dead|raise dead|reanimate|command undead|control undead|summon corpse|speak with dead|snuff life|soul reap/, cast(["jb2a.toll_the_dead.green.complete", "jb2a.magic_signs.circle.02.necromancy.complete.green"])],
    [/mirror image|holographic|disguise self|afterimage|body double|phantasmal/, cast(["jb2a.shimmer.01.blue", "jb2a.magic_signs.circle.02.illusion.complete.purple"], { varied: true })],
    [/polymorph|flesh to stone|baleful|rewire flesh|nanite form|amorphous|cairn form/, cast(["jb2a.magic_signs.circle.02.transmutation.complete.yellow", "jb2a.cast_generic.earth.01.browngreen"])],
    [/telepath|mindlink|mind probe|mind swap|empathic|psychic|ego whip|mind thrust|id insinuation|synaptic|synapse overload/, ray(["jb2a.eldritch_blast.purple", "jb2a.magic_missile.purple"], { varied: true })],
    [/void grasp|void vessel|embrace of the void|black tentacle|unspeakable/, burst(["jb2a.arms_of_hadar.dark_purple", "jb2a.black_tentacles.dark_purple"], { sound: null, self: true })],
    [/junk shards|shrapnel shot|etheric shards|adamantine shot|seeking shot/, ray(["jb2a.cloud_of_daggers.daggers.blue", "jb2a.dagger.throw.01.white"])],
    [/hurl forcedisk|telekinetic projectile|forceful fling/, ray(["jb2a.magic_missile.purple", "jb2a.boulder.toss.02.01.stone.brown"])],
    [/enervation|ray of exhaustion|inflict pain|rotting touch|wither|heat leech/, ray(["jb2a.toll_the_dead.green.shockwave", "jb2a.disintegrate.green"])],
    [/blessing of youth|divine aspect|rhapsodic|battle sonata|song of/, cast(["jb2a.bless.400px.intro.yellow", "jb2a.bardic_inspiration.greenorange"])],
    [/tracking mark|pinpoint|hunters|predict foe|sniper's edge/, cast(["jb2a.hunters_mark.pulse.01.green", "jb2a.magic_signs.circle.02.divination.complete.blue"])],
    [/knock|passwall|digital doorway|blast door/, sparkle(cast(["jb2a.portals.vertical.ring.bright_yellow", "jb2a.misty_step.01.blue"], { scale: 1.25 }), ["jb2a.glint.yellow.many"], ["jb2a.particle_burst.01.star.bluepurple"], ["jb2a.swirling_sparkles.01.blue"])],
    [/wish|miracle|reality bend|bend reality|warp reality|wonder warp/, cast(["jb2a.particle_burst.01.star.bluepurple", "jb2a.twinkling_stars.points05.orange"], { scale: 1.5 })],
    [/ghost sound|battle sonata/, cast(["jb2a.cast_generic.sound.01.pinkteal", "jb2a.bardic_inspiration.greenorange"])],
    [/daze|distract|stumble|moment's hesitation/, cast(["jb2a.dizzy_stars.400px.blueorange", "jb2a.magic_signs.circle.02.enchantment.complete.pink"])],
    [/flight|hoverdisk|starwalk|spider climb|swim/, cast(["jb2a.misty_step.02.blue", "jb2a.butterflies.complete.01.bluepurple"])],
    [/junksword|phase blade|spiritual weapon|supercharge weapon/, swipe(["jb2a.spiritual_weapon.club.01.spectral.02.green", "jb2a.lasersword.melee.blue.01"])],
    [/microbot assault|inject nanobots|ectoplasmic barrage/, ray(["jb2a.magic_missile.purple", "jb2a.particle_burst.01.circle.bluepurple"], { repeats: 3 })],
    [/gravitational singularity|gravity well|cosmic eddy|pocket vacuum/, burst(["jb2a.sphere_of_annihilation.600px.purple", "jb2a.black_tentacles.dark_purple"], { scale: 1.3 })],
    [/wall of fire/, wall(["jb2a.wall_of_fire.500x100.yellow", "jb2a.energy_wall.01.10x05ft.01.complete.orange"])],
    [/wall of ice|ice prison/, wall(["jb2a.shield_themed.above.ice.01.blue", "jb2a.ice_spikes.wall.burst.white"])],
    [/wall of force|wall of air/, wall(["jb2a.shield.01.complete.01.blue", "jb2a.gust_of_wind.default"])],
    [/wall of earth|wall of stone|wall of steel|wall of steam|tectonic|crystal eruption|lava floor/, wall(["jb2a.ground_cracks.orange.01", "jb2a.eruption.orange.01"])],
    [/control winds|calm the storm|polar vortex|hailstorm/, burst(["jb2a.sleet_storm.01.blue", "jb2a.gust_of_wind.default"], { self: true, sound: null, scale: 1.5 })]
];

/** Themes for the spells that would otherwise share one school circle. */
const THEMES = [
    [/computer|password|wetware|\bdata\b|\bhack\b|download|program|nanobot|omnitool|\btech\b|circuit|auto-cam|autopilot/, cast(["jb2a.markers_scifi.001.complete.001.blue", "jb2a.markers_scifi.001.complete.001.blueteal"])],
    [/junk|barricade|shanty|\bscrap\b|upgrade|obsolescen/, cast(["jb2a.markers_scifi.001.complete.001.orangeyellow", "jb2a.ground_cracks.orange.01"])],
    [/fluid|aqueous|\bchurn\b|\bbubble\b|osmose|lifeforce/, cast(["jb2a.bubble.001.002.complete.blue", "jb2a.cast_generic.water.02.blue"])],
    [/nature|planet|season|biome|climate|groundling|carnivorous|terraform|sprout/, cast(["jb2a.swirling_leaves.complete.02.green", "jb2a.vine.complete.nature.group.01.green"])],
    [/time|chron|temporal|retrocog|hindsight|\blapse\b|rewrite time/, cast(["jb2a.icosahedron.roll.blue", "jb2a.misty_step.01.blue"])],
    [/memory|recall|tongue|language|identify|augury|prescience|commune|clair|vision|\bknow\b|akashic|thought|consciousness/, cast([
        "jb2a.eyes.01.dark_green.few",
        "jb2a.moonbeam.01.complete.blue",
        "jb2a.eyes.01.dark_green.many",
        "jb2a.detect_magic.circle.blue",
        "jb2a.magic_signs.circle.02.divination.complete.blue",
        "jb2a.twinkling_stars.points05.white",
        "jb2a.twinkling_stars.points06.white",
        "jb2a.hunters_mark.pulse.01.green",
        "jb2a.glint.yellow.few",
        "jb2a.swirling_sparkles.01.blue",
        "jb2a.particle_burst.01.star.bluepurple",
        "jb2a.moonbeam.01.loop.blue"
    ])],
    [/fey|prank|\bcats\b|fairy|capricious/, cast(["jb2a.fairies.complete.01.bluepurple", "jb2a.butterflies.complete.01.bluepurple"])],
    [/song|sonata|\bmusic\b|rhapsod/, cast(["jb2a.music_notations.treble_clef.blue", "jb2a.icon.music_note.blue"])],
    [/star|cosmos|asteroid|\bdrift\b|stellar|starlit|starwalk|star wall/, burst(["jb2a.twinkling_stars.points04.white", "jb2a.celestial_bodies.asteroid.disk.iron.red.01"], { sound: null, self: true, scale: 1.3 })],
    [/gravity|telekin|psychokinetic|forcedisk|singularity/, cast(["jb2a.arcane_hand.purple", "jb2a.sphere_of_annihilation.200px.purple"])],
    [/shadow|shade|gloom|umbral|darkvision|eclipse/, cast(["jb2a.bats.complete.01.red", "jb2a.darkness.black"])],
    [/blood|heart|corpse|\bsoul\b|wither|\bdeath\b|enervat/, cast(["jb2a.toll_the_dead.green.skull_smoke", "jb2a.claws.400px.red"])],
    [/luck|probability|\bfate\b|prescience|outcome/, cast(["jb2a.icosahedron.simple.blue", "jb2a.glint.yellow.few"])],
    [/light|flare|glow|lumines|\bspark\b|firework/, cast(["jb2a.sacred_flame.target.yellow", "jb2a.firework.01.orangeyellow.01"])],
    [/speech|message|broadcast|mindlink|telepath/, cast(["jb2a.cast_generic.sound.01.pinkteal", "jb2a.music_notations.quaver.blue"])],
    [/snare|restrain|\bbind\b|\banchor\b|tether/, cast(["jb2a.entangle.brown", "jb2a.black_tentacles.dark_purple"])],
    [/void|tentacle|hadar|unspeakable/, burst(["jb2a.arms_of_hadar.dark_purple", "jb2a.black_tentacles.dark_purple"], { sound: null, self: true })],
    [/bite|claw|maw|skull|crush/, swipe(["jb2a.bite.400px.red", "jb2a.claws.400px.red"])],
    [/camp|bonfire|pyre|hearth/, cast(["jb2a.campfire.03.01.complete.orange", "jb2a.bonfire.01.orange"])],
    [/smoke|smog|fume|haze|mist\b/, fog(["jb2a.fumes.04.complete.grey", "jb2a.fog_cloud.01.white"])],
    [/shield other|barrier|sanctum|refuge|ward\b/, cast(["jb2a.token_border.circle.static.blue.003", "jb2a.energy_field.01.blue"])],
    [/detect|discern|sense|scan|analy|divination|augury|commune|contact other|status|orient|locate|coordinate|meticulous match|preserved path|remembrance|measure|identity storm/, cast([
        "jb2a.detect_magic.circle.blue",
        "jb2a.eyes.01.dark_green.few",
        "jb2a.moonbeam.01.complete.blue",
        "jb2a.magic_signs.circle.02.divination.complete.blue",
        "jb2a.twinkling_stars.points05.white",
        "jb2a.hunters_mark.pulse.01.green",
        "jb2a.swirling_sparkles.01.blue",
        "jb2a.glint.yellow.few",
        "jb2a.particle_burst.01.star.bluepurple",
        "jb2a.eyes.01.dark_green.many"
    ])],
    [/armor|aegis|ward|barrier|sanctum|refuge|resist|stability|fortress|dampening|suppressing|nondetection|antimagic|dispel|break enchantment|unravel|\bseal\b|safeguard|redirection|denial|security protocol|security seal/, cast([
        "jb2a.shield.01.complete.01.blue",
        "jb2a.energy_field.01.blue",
        "jb2a.magic_signs.circle.02.abjuration.complete.blue",
        "jb2a.antilife_shell.blue_with_circle",
        "jb2a.token_border.circle.static.blue.003",
        "jb2a.token_border.circle.static.blue.004",
        "jb2a.particles.002.001.complete.few.blue",
        "jb2a.swirling_sparkles.01.blue",
        "jb2a.shatter.blue",
        "jb2a.impact.006.yellow"
    ])],
    [/command|suggest|dominate|compel|trust|incompetence|unwilling guardian|zone of truth|wave of warning|social reset|unmask|secret locker|dismissal/, targeted([
        "jb2a.magic_signs.circle.02.enchantment.complete.pink",
        "jb2a.bardic_inspiration.greenorange",
        "jb2a.dizzy_stars.400px.blueorange",
        "jb2a.icon.heart.pink",
        "jb2a.music_notations.beamed_quavers.blue",
        "jb2a.butterflies.complete.01.bluepurple",
        "jb2a.dancing_light.pink",
        "jb2a.swirling_sparkles.01.blue"
    ])],
    [/curse|death|undead|corpse|\bsoul\b|reanimate|raise dead|slay|wither|enervat|necrotic|grave|injury echo|last gasp|parasitic|borrow corruption|destruction protocol/, targeted([
        "jb2a.toll_the_dead.green.complete",
        "jb2a.toll_the_dead.green.shockwave",
        "jb2a.toll_the_dead.green.skull_smoke",
        "jb2a.magic_signs.circle.02.necromancy.complete.green",
        "jb2a.claws.200px.red",
        "jb2a.icon.horror.purple",
        "jb2a.bats.complete.01.red",
        "jb2a.arms_of_hadar.dark_purple",
        "jb2a.energy_strands.in.green"
    ])],
    [/polymorph|\bform\b|\bshape\b|enhance|alter|adapt|evolution|growth|shrink|harden|phase|nanite|transformation|varied veneer|subjective reality|quick change|reincarnate|parallel form|flux density|lifting frame|megavitamin|mental muscle|might of the ellicoth/, cast([
        "jb2a.magic_signs.circle.02.transmutation.complete.yellow",
        "jb2a.cast_generic.earth.01.browngreen",
        "jb2a.icosahedron.rune.above.blueyellow",
        "jb2a.swirling_leaves.complete.01.green",
        "jb2a.aura_themed.01.inward.complete.nature.01.green",
        "jb2a.glint.yellow.many",
        "jb2a.shimmer.01.blue",
        "jb2a.particles.outward.greenyellow.01",
        "jb2a.energy_strands.in.green",
        "jb2a.vine.complete.nature.group.01.green"
    ])],
    [/summon|create|creation|conjure|binding|planar|\bplane\b|portal|gate|dimension|bilocation|translocate|transport passengers|phantom cycle|unfettered/, cast([
        "jb2a.magic_signs.circle.02.conjuration.complete.yellow",
        "jb2a.portals.vertical.ring.bright_yellow",
        "jb2a.spirit_guardians.blueyellow.ring",
        "jb2a.arcane_hand.blue",
        "jb2a.teleport.01.blue",
        "jb2a.misty_step.02.blue",
        "jb2a.particle_burst.01.star.bluepurple",
        "jb2a.fairies.outward.01.bluepurple",
        "jb2a.energy_strands.complete.blue",
        "jb2a.swirling_sparkles.01.blue"
    ])],
    [/illusion|invisibility|shimmer|hologram|afterimage|mislead|\bveil\b|disguise|phantasm|\bmaze\b/, cast([
        "jb2a.magic_signs.circle.02.illusion.complete.purple",
        "jb2a.shimmer.01.blue",
        "jb2a.misty_step.02.blue",
        "jb2a.butterflies.loop.01.bluepurple",
        "jb2a.dancing_light.purplegreen",
        "jb2a.glint.yellow.few",
        "jb2a.template_circle.aura.01.complete.large.bluepurple",
        "jb2a.energy_strands.complete.blue",
        "jb2a.fog_cloud.01.white",
        "jb2a.swirling_sparkles.01.blue"
    ])],
    [/weapon|ammunition|charge|recharge|stylus|magic mark|sharpen|supercharge|restore consumable|transfer charge|delay countermeasures/, cast([
        "jb2a.magic_signs.circle.02.evocation.complete.red",
        "jb2a.markers_scifi.001.complete.001.orangeyellow",
        "jb2a.energy_strands.complete.blue",
        "jb2a.static_electricity.01.blue",
        "jb2a.muzzle_flash.single.01.yellow",
        "jb2a.impact.007.yellow",
        "jb2a.glint.yellow.many",
        "jb2a.particle_burst.01.circle.bluepurple",
        "jb2a.flames.01.orange",
        "jb2a.shatter.blue"
    ])],
    [/machine|virus|protocol|countermeasures|remote|pilot|repulsing beacon|modulate frequency|minibot|optimize|drone|circuit|archive|automat/, cast([
        "jb2a.markers_scifi.001.complete.001.blue",
        "jb2a.markers_scifi.001.complete.001.blueteal",
        "jb2a.markers_scifi.001.complete.001.white",
        "jb2a.static_electricity.01.blue",
        "jb2a.static_electricity.02.blue",
        "jb2a.energy_strands.complete.blue",
        "jb2a.particle_burst.01.circle.bluepurple",
        "jb2a.lasershot.blue",
        "jb2a.glint.yellow.few",
        "jb2a.impact.007.yellow"
    ])],
    [/body|bone|flesh|muscle|blood|heart|breath|\blife\b|vital|heal|repair|restore|revital|regenerate|stabilize|cleanse|purge|remove radioactivity/, cast([
        "jb2a.cure_wounds.400px.blue",
        "jb2a.healing_generic.400px.blue",
        "jb2a.healing_generic.400px.green",
        "jb2a.healing_generic.burst.greenorange",
        "jb2a.bless.400px.intro.yellow",
        "jb2a.glint.yellow.few",
        "jb2a.glint.yellow.many",
        "jb2a.icon.heart.pink",
        "jb2a.swirling_sparkles.01.blue",
        "jb2a.energy_strands.in.green"
    ])],
    [/leap|dash|climb|swim|fly|flight|jump|shift|step|slip|ride the wave|accelerat|swift/, cast([
        "jb2a.misty_step.02.blue",
        "jb2a.misty_step.01.blue",
        "jb2a.teleport.01.blue",
        "jb2a.on_token_buff.001.001.blue",
        "jb2a.butterflies.complete.01.bluepurple",
        "jb2a.energy_strands.complete.blue",
        "jb2a.swirling_sparkles.01.blue",
        "jb2a.particle_burst.01.star.bluepurple"
    ])],
    [/atmosphere|pressurize|weather|storm|climate|eruption|geyser|cavitation|fissure|puddle|spore|\bmiasma\b|\bhazard\b|convergence|gyre|collision|shriek|scream|vibration|overload|overheat|discharge|chain surge|arcing surge|flash boil|volcanic|uncanny|viral|elemental/, burst([
        "jb2a.explosion.01.orange",
        "jb2a.explosion.02.blue",
        "jb2a.eruption.orange.01",
        "jb2a.thunderwave.center.blue",
        "jb2a.shatter.blue",
        "jb2a.static_electricity.02.blue",
        "jb2a.particle_burst.01.circle.bluepurple",
        "jb2a.fumes.steam.white",
        "jb2a.ground_cracks.orange.01",
        "jb2a.twinkling_stars.points06.white"
    ])],
    [/gravit|gravity|pressure|density|\bmass\b|weight|singularity/, burst([
        "jb2a.sphere_of_annihilation.600px.purple",
        "jb2a.sphere_of_annihilation.200px.purple",
        "jb2a.black_tentacles.dark_purple",
        "jb2a.arcane_hand.purple",
        "jb2a.energy_strands.complete.blue",
        "jb2a.particle_burst.01.circle.bluepurple",
        "jb2a.impact.007.yellow",
        "jb2a.template_circle.aura.01.complete.large.bluepurple"
    ])],
    [/taclash|cestus|fist|plow|claw|talon|damoritosh|plurality/, swipe([
        "jb2a.melee_attack.01.magic_sword.yellow.01",
        "jb2a.melee_attack.01.trail.01.orangered",
        "jb2a.claws.400px.red",
        "jb2a.impact.007.yellow",
        "jb2a.spiritual_weapon.club.01.spectral.02.green"
    ])]
];

const SCHOOL_PALETTES = {
    abj: [
        "jb2a.magic_signs.circle.02.abjuration.complete.blue",
        "jb2a.shield.01.complete.01.blue",
        "jb2a.energy_field.01.blue",
        "jb2a.token_border.circle.static.blue.004",
        "jb2a.antilife_shell.blue_with_circle",
        "jb2a.particles.002.001.complete.few.blue",
        "jb2a.bubble.001.002.complete.blue",
        "jb2a.template_circle.aura.01.complete.small.bluepurple",
        "jb2a.impact.006.yellow",
        "jb2a.energy_strands.complete.blue"
    ],
    con: [
        "jb2a.magic_signs.circle.02.conjuration.complete.yellow",
        "jb2a.spirit_guardians.blueyellow.ring",
        "jb2a.arcane_hand.blue",
        "jb2a.fairies.outward.01.bluepurple",
        "jb2a.cast_generic.01.yellow",
        "jb2a.portals.vertical.ring.bright_yellow",
        "jb2a.cast_generic.02.blue",
        "jb2a.misty_step.02.blue",
        "jb2a.particle_burst.01.circle.bluepurple",
        "jb2a.bubble.001.002.complete.blue"
    ],
    div: [
        "jb2a.magic_signs.circle.02.divination.complete.blue",
        "jb2a.detect_magic.circle.blue",
        "jb2a.moonbeam.01.loop.blue",
        "jb2a.eyes.01.dark_green.many",
        "jb2a.twinkling_stars.points05.white",
        "jb2a.hunters_mark.pulse.01.green",
        "jb2a.moonbeam.01.complete.blue",
        "jb2a.twinkling_stars.points06.white",
        "jb2a.glint.yellow.few",
        "jb2a.swirling_sparkles.01.blue"
    ],
    enc: [
        "jb2a.magic_signs.circle.02.enchantment.complete.pink",
        "jb2a.bardic_inspiration.greenorange",
        "jb2a.music_notations.beamed_quavers.blue",
        "jb2a.dizzy_stars.400px.blueorange",
        "jb2a.sleep.symbol.pink",
        "jb2a.icon.heart.pink",
        "jb2a.music_notations.treble_clef.blue",
        "jb2a.butterflies.complete.01.bluepurple",
        "jb2a.dancing_light.pink",
        "jb2a.glint.yellow.few"
    ],
    evo: [
        "jb2a.magic_signs.circle.02.evocation.complete.red",
        "jb2a.cast_generic.fire.01.orange",
        "jb2a.firework.01.yellow.02",
        "jb2a.sacred_flame.source.yellow",
        "jb2a.flames.02.orange",
        "jb2a.particle_burst.01.star.bluepurple",
        "jb2a.explosion.04.blue",
        "jb2a.firework.01.orangeyellow.01",
        "jb2a.flames.01.orange",
        "jb2a.energy_strands.complete.blue"
    ],
    ill: [
        "jb2a.magic_signs.circle.02.illusion.complete.purple",
        "jb2a.shimmer.01.blue",
        "jb2a.butterflies.loop.01.bluepurple",
        "jb2a.misty_step.02.blue",
        "jb2a.dancing_light.pink",
        "jb2a.glint.yellow.few",
        "jb2a.butterflies.complete.01.bluepurple",
        "jb2a.fog_cloud.01.white",
        "jb2a.energy_strands.complete.blue",
        "jb2a.template_circle.aura.01.complete.large.bluepurple"
    ],
    nec: [
        "jb2a.magic_signs.circle.02.necromancy.complete.green",
        "jb2a.toll_the_dead.green.bell",
        "jb2a.bats.loop.01.red",
        "jb2a.arms_of_hadar.dark_purple",
        "jb2a.icon.horror.purple",
        "jb2a.claws.200px.red",
        "jb2a.toll_the_dead.green.shockwave",
        "jb2a.bats.complete.01.red",
        "jb2a.energy_strands.in.green",
        "jb2a.fog_cloud.01.white"
    ],
    trs: [
        "jb2a.magic_signs.circle.02.transmutation.complete.yellow",
        "jb2a.cast_generic.earth.01.browngreen",
        "jb2a.swirling_leaves.complete.01.green",
        "jb2a.aura_themed.01.inward.complete.nature.01.green",
        "jb2a.icosahedron.rune.above.blueyellow",
        "jb2a.glint.yellow.many",
        "jb2a.particles.outward.greenyellow.01",
        "jb2a.energy_strands.in.green",
        "jb2a.swirling_leaves.loop.02.green",
        "jb2a.cure_wounds.400px.blue"
    ],
    uni: [
        "jb2a.cast_generic.02.blue",
        "jb2a.cast_generic.03.blue",
        "jb2a.energy_strands.complete.blue",
        "jb2a.particle_burst.01.circle.bluepurple",
        "jb2a.on_token_buff.001.001.bluepurple",
        "jb2a.markers_scifi.001.complete.001.white",
        "jb2a.teleport.01.blue",
        "jb2a.misty_step.01.blue",
        "jb2a.icosahedron.roll.blue",
        "jb2a.dancing_light.blueyellow"
    ]
};

const SCHOOL_PARTICLES = {
    abj: "jb2a.swirling_sparkles.01.blue",
    con: "jb2a.particles.outward.greenyellow.01",
    div: "jb2a.twinkling_stars.points06.orange",
    enc: "jb2a.music_notations.crotchet.blue",
    evo: "jb2a.flames.01.orange",
    ill: "jb2a.dancing_light.purplegreen",
    nec: "jb2a.particles.002.001.complete.few.blue",
    trs: "jb2a.swirling_leaves.loop.02.green",
    uni: "jb2a.glint.yellow.few"
};

/** Circles and auras that read as that school when the spell is cast. */
const AURA_FAMILIES = {
    abj: [
        "jb2a.magic_signs.circle.02.abjuration.complete.blue",
        "jb2a.shield.01.complete.01.blue",
        "jb2a.energy_field.01.blue",
        "jb2a.token_border.circle.static.blue.004",
        "jb2a.antilife_shell.blue_with_circle",
        "jb2a.particles.002.001.complete.few.blue",
        "jb2a.template_circle.aura.01.complete.small.bluepurple",
        "jb2a.swirling_sparkles.01.blue"
    ],
    con: [
        "jb2a.magic_signs.circle.02.conjuration.complete.yellow",
        "jb2a.spirit_guardians.blueyellow.ring",
        "jb2a.arcane_hand.blue",
        "jb2a.fairies.outward.01.bluepurple",
        "jb2a.cast_generic.01.yellow",
        "jb2a.portals.vertical.ring.bright_yellow",
        "jb2a.particle_burst.01.star.bluepurple",
        "jb2a.bubble.001.002.complete.blue"
    ],
    div: [
        "jb2a.magic_signs.circle.02.divination.complete.blue",
        "jb2a.detect_magic.circle.blue",
        "jb2a.moonbeam.01.loop.blue",
        "jb2a.eyes.01.dark_green.many",
        "jb2a.twinkling_stars.points05.white",
        "jb2a.hunters_mark.pulse.01.green",
        "jb2a.eyes.01.dark_green.few",
        "jb2a.moonbeam.01.complete.blue"
    ],
    enc: [
        "jb2a.magic_signs.circle.02.enchantment.complete.pink",
        "jb2a.bardic_inspiration.greenorange",
        "jb2a.music_notations.beamed_quavers.blue",
        "jb2a.dizzy_stars.400px.blueorange",
        "jb2a.sleep.symbol.pink",
        "jb2a.icon.heart.pink",
        "jb2a.music_notations.treble_clef.blue",
        "jb2a.butterflies.complete.01.bluepurple"
    ],
    evo: [
        "jb2a.magic_signs.circle.02.evocation.complete.red",
        "jb2a.cast_generic.fire.01.orange",
        "jb2a.firework.01.yellow.02",
        "jb2a.sacred_flame.source.yellow",
        "jb2a.flames.02.orange",
        "jb2a.particle_burst.01.star.bluepurple",
        "jb2a.explosion.04.blue",
        "jb2a.sacred_flame.target.yellow"
    ],
    ill: [
        "jb2a.magic_signs.circle.02.illusion.complete.purple",
        "jb2a.shimmer.01.blue",
        "jb2a.butterflies.loop.01.bluepurple",
        "jb2a.misty_step.02.blue",
        "jb2a.dancing_light.pink",
        "jb2a.glint.yellow.few",
        "jb2a.dancing_light.purplegreen",
        "jb2a.template_circle.aura.01.complete.large.bluepurple"
    ],
    nec: [
        "jb2a.magic_signs.circle.02.necromancy.complete.green",
        "jb2a.toll_the_dead.green.bell",
        "jb2a.bats.loop.01.red",
        "jb2a.arms_of_hadar.dark_purple",
        "jb2a.icon.horror.purple",
        "jb2a.claws.200px.red",
        "jb2a.toll_the_dead.green.skull_smoke",
        "jb2a.fog_cloud.01.white"
    ],
    trs: [
        "jb2a.magic_signs.circle.02.transmutation.complete.yellow",
        "jb2a.cast_generic.earth.01.browngreen",
        "jb2a.swirling_leaves.complete.01.green",
        "jb2a.aura_themed.01.inward.complete.nature.01.green",
        "jb2a.icosahedron.rune.above.blueyellow",
        "jb2a.glint.yellow.many",
        "jb2a.swirling_leaves.complete.02.green",
        "jb2a.cure_wounds.400px.blue"
    ],
    uni: [
        "jb2a.cast_generic.02.blue",
        "jb2a.cast_generic.03.blue",
        "jb2a.energy_strands.complete.blue",
        "jb2a.particle_burst.01.circle.bluepurple",
        "jb2a.on_token_buff.001.001.bluepurple",
        "jb2a.markers_scifi.001.complete.001.white",
        "jb2a.markers_scifi.001.complete.001.blue",
        "jb2a.glint.yellow.few"
    ]
};

export function auraFamily(school) {
    return AURA_FAMILIES[school] ?? AURA_FAMILIES.uni;
}

function nameHash(name, salt = 0) {
    let hash = (0x811c9dc5 ^ salt) >>> 0;
    for (let i = 0; i < name.length; i += 1) {
        hash ^= name.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash;
}

function pickFrom(list, name, salt) {
    const hash = nameHash(`${salt}:${name}`, salt);
    const mixed = (hash ^ (hash >>> 16)) >>> 0;
    return list[mixed % list.length];
}

/**
 * Cast radius in token-widths. Sequencer fits the art to the caster, so a
 * 0-level spell stays about one square and a 6th-level spell draws a wide array.
 */
const AURA_LEVEL_RADIUS = [1, 1.45, 2, 2.7, 3.6, 4.6, 6];

function auraScale(name, level) {
    const step = AURA_LEVEL_RADIUS[Math.min(level, AURA_LEVEL_RADIUS.length - 1)];
    const jitter = (nameHash(name, 3) % 7) / 100;
    return Number((step + jitter).toFixed(3));
}

function uniqueClips(list) {
    return [...new Set(list)];
}

/**
 * Cast themes, most specific first. Every clip in a cast comes from the
 * matched theme.
 */
const CAST_MOTIFS = [
    { id: "shipwreck", pattern: /sinking ship|spectral ship|shipwreck/i, clips: [
        "jb2a.template_circle.aura.01.complete.small.bluepurple", "jb2a.spirit_guardians.blueyellow.ring",
        "jb2a.water_splash.circle.01.blue", "jb2a.fog_cloud.01.white",
        "jb2a.bubble.001.002.complete.blue", "jb2a.energy_strands.complete.blue",
        "jb2a.swirling_sparkles.01.blue", "jb2a.cast_generic.water.02.blue",
        "jb2a.magic_signs.circle.02.conjuration.complete.yellow", "jb2a.liquid.splash.blue"
    ] },
    { id: "negate", pattern: /negate spell|usurp spell|dampen spell|counterspell|dispel magic|break enchantment|antimagic/i, clips: [
        "jb2a.shatter.blue", "jb2a.magic_signs.circle.02.abjuration.complete.blue",
        "jb2a.shield.01.complete.01.blue", "jb2a.energy_strands.complete.blue",
        "jb2a.swirling_sparkles.01.blue", "jb2a.particle_burst.01.circle.bluepurple",
        "jb2a.energy_field.01.blue", "jb2a.token_border.circle.static.blue.004",
        "jb2a.impact.006.yellow", "jb2a.particles.002.001.complete.few.blue"
    ] },
    { id: "telekinesis", pattern: /psychokinetic|telekinetic|forcedisk|mage hand|unseen servant/i, clips: [
        "jb2a.arcane_hand.purple", "jb2a.arcane_hand.blue", "jb2a.magic_missile.purple",
        "jb2a.boulder.toss.02.01.stone.brown", "jb2a.energy_strands.complete.blue",
        "jb2a.particle_burst.01.circle.bluepurple", "jb2a.impact.007.yellow",
        "jb2a.glint.yellow.few", "jb2a.sphere_of_annihilation.200px.purple",
        "jb2a.swirling_sparkles.01.blue"
    ] },
    { id: "mending", pattern: /mending|make whole/i, clips: [
        "jb2a.cure_wounds.400px.blue", "jb2a.glint.yellow.many", "jb2a.glint.yellow.few",
        "jb2a.swirling_sparkles.01.blue", "jb2a.particles.002.001.complete.few.blue",
        "jb2a.healing_generic.400px.blue", "jb2a.healing_generic.burst.greenorange",
        "jb2a.magic_signs.circle.02.transmutation.complete.yellow",
        "jb2a.token_border.circle.static.blue.003", "jb2a.dancing_light.yellow"
    ] },
    { id: "disguise", pattern: /wardrobe change|disguise self|mirror image|holographic|afterimage|body double|phantasmal/i, clips: [
        "jb2a.shimmer.01.blue", "jb2a.butterflies.complete.01.bluepurple",
        "jb2a.butterflies.loop.01.bluepurple", "jb2a.dancing_light.pink",
        "jb2a.magic_signs.circle.02.illusion.complete.purple", "jb2a.glint.yellow.few",
        "jb2a.dancing_light.purplegreen", "jb2a.misty_step.02.blue",
        "jb2a.fog_cloud.01.white", "jb2a.template_circle.aura.01.complete.large.bluepurple"
    ] },
    { id: "misfire", pattern: /misfire|junk bomb|conjure grenade/i, clips: [
        "jb2a.explosion.01.orange", "jb2a.static_electricity.02.blue", "jb2a.static_electricity.01.blue",
        "jb2a.impact.007.yellow", "jb2a.particle_burst.01.circle.bluepurple",
        "jb2a.flames.01.orange", "jb2a.muzzle_flash.single.01.yellow",
        "jb2a.markers_scifi.001.complete.001.orangeyellow", "jb2a.ground_cracks.orange.01",
        "jb2a.firework.01.yellow.02"
    ] },
    { id: "hardlight", pattern: /hardlight/i, clips: [
        "jb2a.dancing_light.yellow", "jb2a.dancing_light.blueyellow", "jb2a.energy_field.01.blue",
        "jb2a.particle_burst.01.circle.bluepurple", "jb2a.swirling_sparkles.01.blue",
        "jb2a.token_border.circle.static.blue.003", "jb2a.energy_strands.complete.blue",
        "jb2a.shield.01.complete.01.blue", "jb2a.glint.yellow.many", "jb2a.magic_signs.circle.02.evocation.complete.red"
    ] },
    { id: "detect", pattern: /detect magic|arcane sight|see invisibility|true seeing|x-ray|glimpse of truth|arcane eye|prying eyes|identify/i, clips: [
        "jb2a.detect_magic.circle.blue", "jb2a.eyes.01.dark_green.many", "jb2a.eyes.01.dark_green.few",
        "jb2a.moonbeam.01.complete.blue", "jb2a.moonbeam.01.loop.blue",
        "jb2a.twinkling_stars.points05.white", "jb2a.twinkling_stars.points06.white",
        "jb2a.swirling_sparkles.01.blue", "jb2a.magic_signs.circle.02.divination.complete.blue",
        "jb2a.glint.yellow.few"
    ] },
    { id: "confusion", pattern: /confusion|daze|distract|stumble|moment's hesitation/i, clips: [
        "jb2a.dizzy_stars.400px.blueorange", "jb2a.magic_signs.circle.02.enchantment.complete.pink",
        "jb2a.music_notations.beamed_quavers.blue", "jb2a.swirling_sparkles.01.blue",
        "jb2a.butterflies.loop.01.bluepurple", "jb2a.sleep.symbol.pink",
        "jb2a.sleep.symbol.dark_pink", "jb2a.dancing_light.pink",
        "jb2a.bardic_inspiration.greenorange", "jb2a.icon.heart.pink"
    ] },
    { id: "bubble", pattern: /life bubble|resilient sphere/i, clips: [
        "jb2a.bubble.001.002.complete.blue", "jb2a.antilife_shell.blue_with_circle",
        "jb2a.energy_field.01.blue", "jb2a.swirling_sparkles.01.blue",
        "jb2a.token_border.circle.static.blue.004", "jb2a.token_border.circle.static.blue.003",
        "jb2a.shield.01.complete.01.blue", "jb2a.magic_signs.circle.02.abjuration.complete.blue",
        "jb2a.particles.002.001.complete.few.blue", "jb2a.fog_cloud.01.white"
    ] },
    { id: "teleport", pattern: /reality leap|teleport|dimension door|plane shift|shadow jump|shadow walk|slip through space|ethereal jaunt|chrono leap|emberstep|interplanetary|bilocation/i, clips: [
        "jb2a.teleport.01.blue", "jb2a.portals.vertical.ring.bright_yellow", "jb2a.misty_step.02.blue",
        "jb2a.misty_step.01.blue", "jb2a.energy_strands.complete.blue",
        "jb2a.particle_burst.01.star.bluepurple", "jb2a.swirling_sparkles.01.blue",
        "jb2a.magic_signs.circle.02.conjuration.complete.yellow", "jb2a.shimmer.01.blue",
        "jb2a.twinkling_stars.points04.white"
    ] },
    { id: "maze", pattern: /phantasmal maze|\bmaze\b/i, clips: [
        "jb2a.template_circle.aura.01.complete.large.bluepurple",
        "jb2a.magic_signs.circle.02.illusion.complete.purple", "jb2a.web.01",
        "jb2a.energy_wall.01.10x05ft.01.complete.orange", "jb2a.butterflies.complete.01.bluepurple",
        "jb2a.dizzy_stars.400px.blueorange", "jb2a.dancing_light.purplegreen",
        "jb2a.shimmer.01.blue", "jb2a.fog_cloud.01.white", "jb2a.energy_strands.in.green"
    ] },
    { id: "shelter", pattern: /sustaining shelter|\bshelter\b|sanctum|refuge/i, clips: [
        "jb2a.energy_field.01.blue", "jb2a.antilife_shell.blue_with_circle", "jb2a.fog_cloud.01.white",
        "jb2a.swirling_leaves.complete.01.green", "jb2a.bubble.001.002.complete.blue",
        "jb2a.token_border.circle.static.blue.003", "jb2a.shield.01.complete.01.blue",
        "jb2a.magic_signs.circle.02.abjuration.complete.blue", "jb2a.plant_growth.03.square.2x2.complete.greenyellow",
        "jb2a.particles.outward.greenyellow.01"
    ] },
    { id: "healing", pattern: /mystic cure|healing junkbot|regenerate|restoration|stabilize|remove affliction|remove condition|soothing protocol|necromantic revitalization|blessing of youth/i, clips: [
        "jb2a.cure_wounds.400px.blue", "jb2a.healing_generic.400px.blue", "jb2a.healing_generic.400px.green",
        "jb2a.healing_generic.burst.greenorange", "jb2a.bless.400px.intro.yellow",
        "jb2a.glint.yellow.few", "jb2a.glint.yellow.many", "jb2a.icon.heart.pink",
        "jb2a.swirling_sparkles.01.blue", "jb2a.particles.002.001.complete.few.blue",
        "jb2a.energy_strands.in.green", "jb2a.magic_signs.circle.02.necromancy.complete.green"
    ] },
    { id: "shield", pattern: /shield|aegis|resistant armor|reflecting armor|death ward|forcecage|magic seal|digital shield|storm-deflecting|barrier|\bward\b/i, clips: [
        "jb2a.shield.01.complete.01.blue", "jb2a.antilife_shell.blue_with_circle",
        "jb2a.magic_signs.circle.02.abjuration.complete.blue", "jb2a.energy_field.01.blue",
        "jb2a.token_border.circle.static.blue.003", "jb2a.token_border.circle.static.blue.004",
        "jb2a.particles.002.001.complete.few.blue", "jb2a.swirling_sparkles.01.blue",
        "jb2a.template_circle.aura.01.complete.small.bluepurple", "jb2a.impact.006.yellow"
    ] },
    { id: "summon", pattern: /summon creature|summon drift|spiritual minion|wisp ally|handy junkbot|battle junkbot|vigilant junkbot|prowling junkbot|school spirit|spiritual weapon/i, clips: [
        "jb2a.spirit_guardians.blueyellow.ring", "jb2a.arcane_hand.blue", "jb2a.arcane_hand.purple",
        "jb2a.fairies.outward.01.bluepurple", "jb2a.fairies.complete.01.bluepurple",
        "jb2a.portals.vertical.ring.bright_yellow", "jb2a.particle_burst.01.star.bluepurple",
        "jb2a.cast_generic.01.yellow", "jb2a.magic_signs.circle.02.conjuration.complete.yellow",
        "jb2a.swirling_sparkles.01.blue"
    ] },
    { id: "undead", pattern: /animate dead|raise dead|reanimate|command undead|control undead|summon corpse|speak with dead|snuff life|soul reap|alter corpse/i, clips: [
        "jb2a.toll_the_dead.green.complete", "jb2a.toll_the_dead.green.bell",
        "jb2a.toll_the_dead.green.skull_smoke", "jb2a.magic_signs.circle.02.necromancy.complete.green",
        "jb2a.bats.loop.01.red", "jb2a.bats.complete.01.red", "jb2a.claws.200px.red",
        "jb2a.claws.400px.red", "jb2a.arms_of_hadar.dark_purple", "jb2a.icon.horror.purple",
        "jb2a.fog_cloud.01.white", "jb2a.energy_strands.in.green"
    ] },
    { id: "psychic", pattern: /telepath|mindlink|mind probe|mind swap|empathic|psychic|ego whip|mind thrust|id insinuation|synaptic|synapse|battlemind/i, clips: [
        "jb2a.eldritch_blast.purple", "jb2a.magic_missile.purple", "jb2a.dizzy_stars.400px.blueorange",
        "jb2a.arcane_hand.purple", "jb2a.energy_strands.complete.blue", "jb2a.energy_strands.in.green",
        "jb2a.icon.fear.dark_purple", "jb2a.magic_signs.circle.02.enchantment.complete.pink",
        "jb2a.particle_burst.01.star.bluepurple", "jb2a.arms_of_hadar.dark_purple",
        "jb2a.sleep.symbol.dark_pink", "jb2a.swirling_sparkles.01.blue"
    ] },
    { id: "tracking", pattern: /tracking mark|pinpoint|hunters|predict foe|sniper's edge|navigation/i, clips: [
        "jb2a.hunters_mark.pulse.01.green", "jb2a.eyes.01.dark_green.few", "jb2a.eyes.01.dark_green.many",
        "jb2a.moonbeam.01.complete.blue", "jb2a.detect_magic.circle.blue",
        "jb2a.magic_signs.circle.02.divination.complete.blue", "jb2a.twinkling_stars.points05.white",
        "jb2a.glint.yellow.few", "jb2a.particle_burst.01.star.bluepurple", "jb2a.swirling_sparkles.01.blue"
    ] },
    { id: "warding", pattern: /safeguard|security protocol|security seal|dampening field|physical stability|intellect fortress|nondetection|mental silence/i, clips: [
        "jb2a.shield.01.complete.01.blue", "jb2a.energy_field.01.blue", "jb2a.antilife_shell.blue_with_circle",
        "jb2a.token_border.circle.static.blue.003", "jb2a.token_border.circle.static.blue.004",
        "jb2a.magic_signs.circle.02.abjuration.complete.blue", "jb2a.particles.002.001.complete.few.blue",
        "jb2a.swirling_sparkles.01.blue", "jb2a.template_circle.aura.01.complete.small.bluepurple",
        "jb2a.impact.006.yellow", "jb2a.shatter.blue", "jb2a.bubble.001.002.complete.blue"
    ] },
    { id: "logic", pattern: /logic bomb/i, clips: [
        "jb2a.markers_scifi.001.complete.001.blue", "jb2a.markers_scifi.001.complete.001.orangeyellow",
        "jb2a.static_electricity.01.blue", "jb2a.static_electricity.02.blue",
        "jb2a.explosion.01.orange", "jb2a.muzzle_flash.single.01.yellow",
        "jb2a.particle_burst.01.circle.bluepurple", "jb2a.energy_strands.complete.blue",
        "jb2a.glint.yellow.many", "jb2a.lasershot.blue", "jb2a.impact.007.yellow", "jb2a.shatter.blue"
    ] },
    { id: "knowledge", pattern: /memory|recall|tongue|language|augury|prescience|commune|clair|vision|akashic|thought|consciousness|retrocog|hindsight/i, clips: [
        "jb2a.eyes.01.dark_green.few", "jb2a.eyes.01.dark_green.many", "jb2a.moonbeam.01.complete.blue",
        "jb2a.moonbeam.01.loop.blue", "jb2a.detect_magic.circle.blue",
        "jb2a.magic_signs.circle.02.divination.complete.blue", "jb2a.twinkling_stars.points05.white",
        "jb2a.twinkling_stars.points06.white", "jb2a.hunters_mark.pulse.01.green",
        "jb2a.glint.yellow.few", "jb2a.swirling_sparkles.01.blue", "jb2a.particle_burst.01.star.bluepurple"
    ] },
    { id: "time", pattern: /time|chron|temporal|retrocog|hindsight|\blapse\b|cheat time/i, clips: [
        "jb2a.icosahedron.roll.blue", "jb2a.icosahedron.simple.blue", "jb2a.icosahedron.rune.above.blueyellow",
        "jb2a.misty_step.01.blue", "jb2a.misty_step.02.blue", "jb2a.teleport.01.blue",
        "jb2a.on_token_buff.001.001.blue", "jb2a.magic_signs.circle.02.transmutation.complete.yellow",
        "jb2a.energy_strands.complete.blue", "jb2a.particle_burst.01.star.bluepurple",
        "jb2a.swirling_sparkles.01.blue", "jb2a.glint.yellow.few"
    ] },
    { id: "tech", pattern: /computer|password|wetware|\bdata\b|\bhack\b|download|program|nanobot|omnitool|\btech\b|circuit|auto-cam|autopilot|archive/i, clips: [
        "jb2a.markers_scifi.001.complete.001.blue", "jb2a.markers_scifi.001.complete.001.blueteal",
        "jb2a.markers_scifi.001.complete.001.white", "jb2a.markers_scifi.001.complete.001.orangeyellow",
        "jb2a.static_electricity.01.blue", "jb2a.static_electricity.02.blue",
        "jb2a.energy_strands.complete.blue", "jb2a.particle_burst.01.circle.bluepurple",
        "jb2a.glint.yellow.few", "jb2a.glint.yellow.many", "jb2a.muzzle_flash.single.01.yellow",
        "jb2a.lasershot.blue"
    ] },
    { id: "nature", pattern: /nature|planet|season|biome|climate|groundling|carnivorous|terraform|sprout|algae|verdant|petal|bramble/i, clips: [
        "jb2a.swirling_leaves.complete.01.green", "jb2a.swirling_leaves.complete.02.green",
        "jb2a.swirling_leaves.loop.02.green", "jb2a.vine.complete.nature.group.01.green",
        "jb2a.entangle.green", "jb2a.plant_growth.03.square.2x2.complete.greenyellow",
        "jb2a.aura_themed.01.inward.complete.nature.01.green", "jb2a.cast_generic.earth.01.browngreen",
        "jb2a.particles.outward.greenyellow.01", "jb2a.magic_signs.circle.02.transmutation.complete.yellow",
        "jb2a.fairies.complete.01.bluepurple", "jb2a.ground_cracks.orange.01"
    ] },
    { id: "polymorph", pattern: /polymorph|flesh to stone|baleful|rewire flesh|nanite form|amorphous|cairn form/i, clips: [
        "jb2a.magic_signs.circle.02.transmutation.complete.yellow", "jb2a.cast_generic.earth.01.browngreen",
        "jb2a.swirling_leaves.complete.01.green", "jb2a.aura_themed.01.inward.complete.nature.01.green",
        "jb2a.icosahedron.rune.above.blueyellow", "jb2a.glint.yellow.many",
        "jb2a.shimmer.01.blue", "jb2a.particles.outward.greenyellow.01",
        "jb2a.energy_strands.in.green", "jb2a.vine.complete.nature.group.01.green"
    ] },
    { id: "illusion", pattern: /invisibility|vanishing trick|displacement|mislead|\bveil\b|shadow body/i, clips: [
        "jb2a.shimmer.01.blue", "jb2a.misty_step.01.blue", "jb2a.misty_step.02.blue",
        "jb2a.magic_signs.circle.02.illusion.complete.purple", "jb2a.fog_cloud.01.white",
        "jb2a.butterflies.loop.01.bluepurple", "jb2a.dancing_light.purplegreen",
        "jb2a.glint.yellow.few", "jb2a.template_circle.aura.01.complete.large.bluepurple",
        "jb2a.energy_strands.complete.blue"
    ] },
    { id: "fear", pattern: /fear|paranoia|nightmare|hateful visage|atavistic howl/i, clips: [
        "jb2a.icon.fear.dark_purple", "jb2a.eyes.01.dark_green.few", "jb2a.icon.horror.purple",
        "jb2a.arms_of_hadar.dark_purple", "jb2a.bats.complete.01.red", "jb2a.darkness.black",
        "jb2a.magic_signs.circle.02.necromancy.complete.green", "jb2a.fog_cloud.01.white",
        "jb2a.toll_the_dead.green.skull_smoke", "jb2a.claws.400px.red"
    ] },
    { id: "sleep", pattern: /sleep|slumber|fatigue|day's weariness|waves of fatigue/i, clips: [
        "jb2a.sleep.cloud.01.pink", "jb2a.sleep.symbol.pink", "jb2a.sleep.symbol.dark_pink",
        "jb2a.magic_signs.circle.02.enchantment.complete.pink", "jb2a.dizzy_stars.400px.blueorange",
        "jb2a.fog_cloud.01.white", "jb2a.butterflies.loop.01.bluepurple",
        "jb2a.music_notations.beamed_quavers.blue", "jb2a.dancing_light.pink", "jb2a.icon.heart.pink"
    ] },
    { id: "charm", pattern: /charm|suggestion|dominate|build trust/i, clips: [
        "jb2a.magic_signs.circle.02.enchantment.complete.pink", "jb2a.bardic_inspiration.greenorange",
        "jb2a.icon.heart.pink", "jb2a.music_notations.beamed_quavers.blue",
        "jb2a.music_notations.treble_clef.blue", "jb2a.butterflies.complete.01.bluepurple",
        "jb2a.dancing_light.pink", "jb2a.glint.yellow.few", "jb2a.swirling_sparkles.01.blue",
        "jb2a.dizzy_stars.400px.blueorange"
    ] },
    { id: "music", pattern: /song|sonata|\bmusic\b|rhapsod|ghost sound|synesthesia/i, clips: [
        "jb2a.music_notations.treble_clef.blue", "jb2a.music_notations.beamed_quavers.blue",
        "jb2a.music_notations.crotchet.blue", "jb2a.music_notations.quaver.blue",
        "jb2a.icon.music_note.blue", "jb2a.cast_generic.sound.01.pinkteal",
        "jb2a.bardic_inspiration.greenorange", "jb2a.bless.400px.intro.yellow",
        "jb2a.swirling_sparkles.01.blue", "jb2a.dancing_light.blueyellow"
    ] },
    { id: "stars", pattern: /star|cosmos|asteroid|\bdrift\b|stellar|starlit|starwalk/i, clips: [
        "jb2a.twinkling_stars.points04.white", "jb2a.twinkling_stars.points05.white",
        "jb2a.twinkling_stars.points06.white", "jb2a.twinkling_stars.points05.orange",
        "jb2a.twinkling_stars.points06.orange", "jb2a.celestial_bodies.asteroid.disk.iron.red.01",
        "jb2a.moonbeam.01.complete.blue", "jb2a.moonbeam.01.loop.blue",
        "jb2a.particle_burst.01.star.bluepurple", "jb2a.swirling_sparkles.01.blue"
    ] },
    { id: "gravity", pattern: /gravity|gravitat|singularity|cosmic eddy|pocket vacuum/i, clips: [
        "jb2a.sphere_of_annihilation.600px.purple", "jb2a.sphere_of_annihilation.200px.purple",
        "jb2a.black_tentacles.dark_purple", "jb2a.arcane_hand.purple",
        "jb2a.energy_strands.complete.blue", "jb2a.particle_burst.01.circle.bluepurple",
        "jb2a.magic_missile.purple", "jb2a.darkness.black", "jb2a.impact.007.yellow",
        "jb2a.template_circle.aura.01.complete.large.bluepurple"
    ] },
    { id: "void", pattern: /void|tentacle|hadar|unspeakable/i, clips: [
        "jb2a.arms_of_hadar.dark_purple", "jb2a.black_tentacles.dark_purple", "jb2a.darkness.black",
        "jb2a.sphere_of_annihilation.600px.purple", "jb2a.icon.horror.purple",
        "jb2a.toll_the_dead.green.skull_smoke", "jb2a.fog_cloud.01.white",
        "jb2a.energy_strands.in.green", "jb2a.bats.complete.01.red", "jb2a.claws.400px.red"
    ] },
    { id: "shadow", pattern: /shadow|shade|gloom|umbral|darkvision|eclipse|darkness/i, clips: [
        "jb2a.darkness.black", "jb2a.bats.complete.01.red", "jb2a.bats.loop.01.red",
        "jb2a.arms_of_hadar.dark_purple", "jb2a.fog_cloud.01.white", "jb2a.icon.horror.purple",
        "jb2a.magic_signs.circle.02.necromancy.complete.green", "jb2a.shimmer.01.blue",
        "jb2a.eyes.01.dark_green.few", "jb2a.energy_strands.in.green"
    ] },
    { id: "water", pattern: /fluid|aqueous|\bchurn\b|\bbubble\b|osmose|lifeforce|geyser|cavitation/i, clips: [
        "jb2a.bubble.001.002.complete.blue", "jb2a.cast_generic.water.02.blue",
        "jb2a.water_splash.circle.01.blue", "jb2a.liquid.splash.blue",
        "jb2a.fog_cloud.01.white", "jb2a.swirling_sparkles.01.blue",
        "jb2a.energy_strands.complete.blue", "jb2a.sleet_storm.01.blue",
        "jb2a.magic_signs.circle.02.conjuration.complete.yellow", "jb2a.particles.002.001.complete.few.blue"
    ] },
    { id: "fog", pattern: /smoke|smog|fume|haze|mist\b|fog cloud|burning ash/i, clips: [
        "jb2a.fog_cloud.01.white", "jb2a.fumes.04.complete.grey", "jb2a.fumes.steam.white",
        "jb2a.darkness.black", "jb2a.particles.outward.greenyellow.01",
        "jb2a.swirling_sparkles.01.blue", "jb2a.template_circle.aura.01.complete.large.bluepurple",
        "jb2a.energy_strands.in.green", "jb2a.markers.poison.dark_green.01", "jb2a.bubble.001.002.complete.blue"
    ] },
    { id: "fey", pattern: /fey|prank|\bcats\b|fairy|capricious/i, clips: [
        "jb2a.fairies.complete.01.bluepurple", "jb2a.fairies.outward.01.bluepurple",
        "jb2a.butterflies.complete.01.bluepurple", "jb2a.butterflies.loop.01.bluepurple",
        "jb2a.dancing_light.pink", "jb2a.dancing_light.purplegreen", "jb2a.glint.yellow.few",
        "jb2a.swirling_leaves.complete.02.green", "jb2a.magic_signs.circle.02.enchantment.complete.pink",
        "jb2a.swirling_sparkles.01.blue"
    ] },
    { id: "junk", pattern: /junk|barricade|shanty|\bscrap\b|upgrade|obsolescen/i, clips: [
        "jb2a.markers_scifi.001.complete.001.orangeyellow", "jb2a.ground_cracks.orange.01",
        "jb2a.explosion.01.orange", "jb2a.impact.007.yellow", "jb2a.muzzle_flash.single.01.yellow",
        "jb2a.particle_burst.01.circle.bluepurple", "jb2a.static_electricity.02.blue",
        "jb2a.glint.yellow.many", "jb2a.markers_scifi.001.complete.001.white", "jb2a.flames.01.orange"
    ] },
    { id: "light", pattern: /dancing lights|revealing light|bioluminescent|glowing|\blight\b|flare|lumines|firework/i, clips: [
        "jb2a.dancing_light.yellow", "jb2a.dancing_light.blueyellow", "jb2a.dancing_light.pink",
        "jb2a.sacred_flame.target.yellow", "jb2a.sacred_flame.source.yellow",
        "jb2a.firework.01.yellow.02", "jb2a.firework.01.orangeyellow.01",
        "jb2a.glint.yellow.few", "jb2a.glint.yellow.many", "jb2a.twinkling_stars.points05.white",
        "jb2a.moonbeam.01.complete.blue", "jb2a.swirling_sparkles.01.blue"
    ] },
    { id: "luck", pattern: /luck|probability|\bfate\b|outcome/i, clips: [
        "jb2a.icosahedron.simple.blue", "jb2a.icosahedron.roll.blue", "jb2a.icosahedron.rune.above.blueyellow",
        "jb2a.glint.yellow.few", "jb2a.glint.yellow.many", "jb2a.particle_burst.01.star.bluepurple",
        "jb2a.twinkling_stars.points05.orange", "jb2a.swirling_sparkles.01.blue",
        "jb2a.magic_signs.circle.02.divination.complete.blue", "jb2a.bless.400px.intro.yellow"
    ] },
    { id: "bulwark", pattern: /armor|aegis|resist|stability|fortress|dampening|suppressing|nondetection|antimagic|dispel|break enchantment|unravel|\bseal\b|redirection|denial|communal bond/i, clips: [
        "jb2a.shield.01.complete.01.blue", "jb2a.energy_field.01.blue", "jb2a.antilife_shell.blue_with_circle",
        "jb2a.magic_signs.circle.02.abjuration.complete.blue", "jb2a.token_border.circle.static.blue.003",
        "jb2a.token_border.circle.static.blue.004", "jb2a.particles.002.001.complete.few.blue",
        "jb2a.swirling_sparkles.01.blue", "jb2a.impact.006.yellow", "jb2a.shatter.blue"
    ] },
    { id: "analysis", pattern: /sense|scan|analy|divination|augury|commune|contact other|status|orient|locate|coordinates|meticulous|preserved path|remembrance|measure|identity storm/i, clips: [
        "jb2a.detect_magic.circle.blue", "jb2a.eyes.01.dark_green.few", "jb2a.eyes.01.dark_green.many",
        "jb2a.moonbeam.01.complete.blue", "jb2a.magic_signs.circle.02.divination.complete.blue",
        "jb2a.twinkling_stars.points05.white", "jb2a.hunters_mark.pulse.01.green",
        "jb2a.swirling_sparkles.01.blue", "jb2a.glint.yellow.few", "jb2a.particle_burst.01.star.bluepurple"
    ] },
    { id: "command", pattern: /command|suggest|dominate|compel|trust|incompetence|unwilling guardian|zone of truth|wave of warning|social reset|unmask|secret locker|dismissal|repulsing beacon/i, clips: [
        "jb2a.magic_signs.circle.02.enchantment.complete.pink", "jb2a.bardic_inspiration.greenorange",
        "jb2a.dizzy_stars.400px.blueorange", "jb2a.icon.heart.pink", "jb2a.music_notations.beamed_quavers.blue",
        "jb2a.butterflies.complete.01.bluepurple", "jb2a.dancing_light.pink", "jb2a.swirling_sparkles.01.blue",
        "jb2a.music_notations.treble_clef.blue", "jb2a.glint.yellow.few"
    ] },
    { id: "necrosis", pattern: /curse|death|undead|corpse|\bsoul\b|reanimate|raise dead|slay|wither|enervat|necrotic|grave|injury echo|last gasp|parasitic|borrow corruption|destruction protocol|infect blood|stop heart|crush skull|weight of ages/i, clips: [
        "jb2a.toll_the_dead.green.complete", "jb2a.toll_the_dead.green.shockwave", "jb2a.toll_the_dead.green.skull_smoke",
        "jb2a.magic_signs.circle.02.necromancy.complete.green", "jb2a.claws.200px.red", "jb2a.icon.horror.purple",
        "jb2a.bats.complete.01.red", "jb2a.arms_of_hadar.dark_purple", "jb2a.energy_strands.in.green",
        "jb2a.fog_cloud.01.white"
    ] },
    { id: "reshape", pattern: /polymorph|\bform\b|\bshape\b|enhance|alter|adapt|evolution|growth|shrink|harden|phase|nanite|transformation|varied veneer|subjective reality|quick change|reincarnate|parallel form|flux density|lifting frame|megavitamin|mental muscle|might of the ellicoth|reject augmentation|electroplating/i, clips: [
        "jb2a.magic_signs.circle.02.transmutation.complete.yellow", "jb2a.cast_generic.earth.01.browngreen",
        "jb2a.icosahedron.rune.above.blueyellow", "jb2a.swirling_leaves.complete.01.green",
        "jb2a.aura_themed.01.inward.complete.nature.01.green", "jb2a.glint.yellow.many", "jb2a.shimmer.01.blue",
        "jb2a.particles.outward.greenyellow.01", "jb2a.energy_strands.in.green", "jb2a.vine.complete.nature.group.01.green"
    ] },
    { id: "conjuring", pattern: /create|creation|conjure|binding|planar|\bplane\b|portal|\bgate\b|dimension|bilocation|translocate|transport passengers|phantom cycle|unfettered|companion bond/i, clips: [
        "jb2a.magic_signs.circle.02.conjuration.complete.yellow", "jb2a.portals.vertical.ring.bright_yellow",
        "jb2a.spirit_guardians.blueyellow.ring", "jb2a.arcane_hand.blue", "jb2a.teleport.01.blue",
        "jb2a.misty_step.02.blue", "jb2a.particle_burst.01.star.bluepurple", "jb2a.fairies.outward.01.bluepurple",
        "jb2a.energy_strands.complete.blue", "jb2a.swirling_sparkles.01.blue"
    ] },
    { id: "motion", pattern: /leap|dash|climb|swim|fly|flight|jump|shift|step|slip|ride the wave|accelerat|swift|hoverdisk|propelled/i, clips: [
        "jb2a.misty_step.02.blue", "jb2a.misty_step.01.blue", "jb2a.teleport.01.blue",
        "jb2a.on_token_buff.001.001.blue", "jb2a.butterflies.complete.01.bluepurple",
        "jb2a.energy_strands.complete.blue", "jb2a.swirling_sparkles.01.blue", "jb2a.particle_burst.01.star.bluepurple",
        "jb2a.dancing_light.blueyellow", "jb2a.glint.yellow.few"
    ] },
    { id: "weaponcraft", pattern: /weapon|ammunition|charge|recharge|stylus|magic mark|sharpen|supercharge|restore consumable|transfer charge|delay countermeasures/i, clips: [
        "jb2a.magic_signs.circle.02.evocation.complete.red", "jb2a.markers_scifi.001.complete.001.orangeyellow",
        "jb2a.energy_strands.complete.blue", "jb2a.static_electricity.01.blue", "jb2a.muzzle_flash.single.01.yellow",
        "jb2a.impact.007.yellow", "jb2a.glint.yellow.many", "jb2a.particle_burst.01.circle.bluepurple",
        "jb2a.flames.01.orange", "jb2a.shatter.blue"
    ] },
    { id: "fabrication", pattern: /machine|virus|protocol|countermeasures|remote|pilot|modulate frequency|minibot|optimize|drone|circuit|archive|automat/i, clips: [
        "jb2a.markers_scifi.001.complete.001.blue", "jb2a.markers_scifi.001.complete.001.blueteal",
        "jb2a.markers_scifi.001.complete.001.white", "jb2a.static_electricity.01.blue",
        "jb2a.static_electricity.02.blue", "jb2a.energy_strands.complete.blue",
        "jb2a.particle_burst.01.circle.bluepurple", "jb2a.lasershot.blue", "jb2a.glint.yellow.few",
        "jb2a.impact.007.yellow"
    ] },
    { id: "renewal", pattern: /heal|repair|restore|revital|regenerate|stabilize|cleanse|purge|remove radioactivity|megavitamin|rapid repair/i, clips: [
        "jb2a.cure_wounds.400px.blue", "jb2a.healing_generic.400px.blue", "jb2a.healing_generic.400px.green",
        "jb2a.healing_generic.burst.greenorange", "jb2a.bless.400px.intro.yellow", "jb2a.glint.yellow.few",
        "jb2a.glint.yellow.many", "jb2a.icon.heart.pink", "jb2a.swirling_sparkles.01.blue",
        "jb2a.energy_strands.in.green"
    ] },
    { id: "tempest", pattern: /atmosphere|pressurize|weather|\bstorm\b|climate|eruption|geyser|cavitation|fissure|puddle|spore|\bmiasma\b|\bhazard\b|convergence|gyre|collision|shriek|scream|vibration|overload|overheat|discharge|chain surge|arcing surge|flash boil|volcanic|uncanny|viral|elemental/i, clips: [
        "jb2a.explosion.01.orange", "jb2a.explosion.02.blue", "jb2a.eruption.orange.01",
        "jb2a.thunderwave.center.blue", "jb2a.shatter.blue", "jb2a.static_electricity.02.blue",
        "jb2a.particle_burst.01.circle.bluepurple", "jb2a.fumes.steam.white", "jb2a.ground_cracks.orange.01",
        "jb2a.twinkling_stars.points06.white"
    ] },
    { id: "martial", pattern: /taclash|cestus|fist|plow|claw|talon|damoritosh|plurality|spectral weapon|phase blade|junksword/i, clips: [
        "jb2a.melee_attack.01.magic_sword.yellow.01", "jb2a.melee_attack.01.trail.01.orangered",
        "jb2a.claws.400px.red", "jb2a.impact.007.yellow", "jb2a.spiritual_weapon.club.01.spectral.02.green",
        "jb2a.melee_attack.02.trail.01.pinkpurple", "jb2a.melee_attack.01.shortsword.01.0",
        "jb2a.static_electricity.02.blue", "jb2a.arcane_hand.purple", "jb2a.glint.yellow.few"
    ] }
];

const ELEMENT_MOTIFS = {
    fire: { id: "fire", clips: uniqueClips([
        ...BURST.fire, ...RAY.fire, ...CONE.fire,
        "jb2a.flames.01.orange", "jb2a.flames.02.orange", "jb2a.cast_generic.fire.01.orange",
        "jb2a.sacred_flame.source.yellow", "jb2a.sacred_flame.target.yellow",
        "jb2a.firework.01.yellow.02", "jb2a.explosion.01.orange", "jb2a.campfire.03.01.complete.orange",
        "jb2a.bonfire.01.orange", "jb2a.ground_cracks.orange.01", "jb2a.energy_wall.01.10x05ft.01.complete.orange"
    ]) },
    cold: { id: "cold", clips: uniqueClips([
        ...BURST.cold, ...RAY.cold, ...CONE.cold,
        "jb2a.shield_themed.above.ice.01.blue", "jb2a.ice_spikes.wall.burst.white",
        "jb2a.sleet_storm.01.blue", "jb2a.cast_generic.water.02.blue", "jb2a.fog_cloud.01.white"
    ]) },
    electricity: { id: "electricity", clips: uniqueClips([
        ...BURST.electricity, ...RAY.electricity, ...CONE.electricity,
        "jb2a.static_electricity.01.blue", "jb2a.static_electricity.02.blue",
        "jb2a.electric_arc.01", "jb2a.lightning_bolt.wide.blue", "jb2a.muzzle_flash.single.01.yellow"
    ]) },
    acid: { id: "acid", clips: uniqueClips([
        ...BURST.acid, ...RAY.acid, ...CONE.acid,
        "jb2a.fumes.04.complete.grey", "jb2a.fumes.steam.white", "jb2a.markers.poison.dark_green.01",
        "jb2a.energy_strands.in.green", "jb2a.particles.outward.greenyellow.01", "jb2a.liquid.splash.blue"
    ]) },
    sonic: { id: "sonic", clips: uniqueClips([
        ...BURST.sonic, ...RAY.sonic, ...CONE.sonic,
        "jb2a.soundwave.02.blue", "jb2a.cast_generic.sound.01.pinkteal", "jb2a.shatter.blue",
        "jb2a.music_notations.quaver.blue"
    ]) },
    radiation: { id: "radiation", clips: uniqueClips([
        ...BURST.radiation, ...RAY.radiation, ...CONE.radiation,
        "jb2a.particles.swirl.greenyellow.01", "jb2a.particles.outward.greenyellow.01",
        "jb2a.lasershot.green", "jb2a.energy_strands.in.green"
    ]) },
    plasma: { id: "plasma", clips: uniqueClips([
        ...BURST.plasma, ...RAY.plasma, ...CONE.plasma,
        "jb2a.energy_beam.normal.bluepink.02", "jb2a.flames.02.orange", "jb2a.static_electricity.02.blue"
    ]) },
    force: { id: "force", clips: uniqueClips([
        ...BURST.force, ...RAY.force, ...CONE.force,
        "jb2a.arcane_hand.purple", "jb2a.sphere_of_annihilation.200px.purple",
        "jb2a.energy_strands.complete.blue", "jb2a.magic_signs.circle.02.evocation.complete.red"
    ]) },
    healing: { id: "healing", clips: [
        "jb2a.cure_wounds.400px.blue", "jb2a.healing_generic.400px.blue", "jb2a.healing_generic.400px.green",
        "jb2a.healing_generic.burst.greenorange", "jb2a.bless.400px.intro.yellow",
        "jb2a.glint.yellow.few", "jb2a.glint.yellow.many", "jb2a.icon.heart.pink",
        "jb2a.swirling_sparkles.01.blue", "jb2a.particles.002.001.complete.few.blue"
    ] }
};

/**
 * The cast theme for a spell. Named motifs win, then the damage element,
 * then the school.
 * @param {{ name?: string, system?: object }} item
 */
export function auraMotif(item) {
    const name = String(item?.name ?? "");
    for (const motif of CAST_MOTIFS) {
        if (motif.pattern.test(name)) return motif;
    }
    const element = spellEnergyElements(name, damageTypesOf(item?.system))[0];
    if (element && ELEMENT_MOTIFS[element]) return ELEMENT_MOTIFS[element];
    const school = item?.system?.school || "uni";
    return { id: school, clips: auraFamily(school) };
}

function effectClips(spec) {
    if (!spec) return [];
    return [
        ...(spec.files ?? []),
        ...(spec.particleFiles ?? []),
        ...(spec.extraParticleFiles ?? []).flat(),
        ...(spec.layerFiles ?? []).flat()
    ];
}

/**
 * Clips allowed in a cast: the spell's own effect, then its theme.
 * @param {{ name?: string, type?: string, system?: object }} item
 */
export function auraPalette(item) {
    const motif = auraMotif(item);
    return uniqueClips([...effectClips(mapSpellEffect(item)), ...motif.clips]);
}

/**
 * A cast effect on the caster. The theme supplies every clip, the spell name
 * picks the lead, and the level sets the radius.
 */
export function mapSpellAura(item, { level = null } = {}) {
    if (!item || item.type !== "spell") return null;
    const name = String(item.name ?? "spell");
    const clips = auraPalette(item);
    const safeLevel = spellLevel(item.system, level);
    const auraElement = spellEnergyElements(name, damageTypesOf(item.system))[0] ?? null;
    const auraSound = auraSoundFor({
        name,
        element: auraElement,
        school: item.system?.school || "uni"
    });
    const filler = new Set([
        "jb2a.swirling_sparkles.01.blue",
        "jb2a.glint.yellow.few",
        "jb2a.glint.yellow.many",
        "jb2a.energy_strands.complete.blue",
        "jb2a.energy_strands.in.green",
        "jb2a.particle_burst.01.star.bluepurple",
        "jb2a.particle_burst.01.circle.bluepurple"
    ]);
    const distinctive = clips.filter((clip) => !filler.has(clip));
    const pool = distinctive.length >= 5 ? distinctive : clips;
    const salts = [1, 7, 13, 19, 29, 31, 41, 53, 59];
    const picks = salts.map((salt) => pickFrom(pool, name, salt));
    const ring = pickFrom(pool, name, 67);
    const rune = pickFrom(pool, `${name}:${Math.min(6, safeLevel)}`, 71);
    const aura = cast([picks[0], picks[1]], {
        scale: auraScale(name, safeLevel),
        fitToken: true,
        duration: 1200 + (nameHash(name, 5) % 180) * 10,
        fadeOut: 280 + (nameHash(name, 11) % 50) * 8,
        sound: auraSound,
        onCaster: true,
        particleFiles: [picks[2]],
        extraParticleFiles: [[picks[3]], [picks[4]], [picks[5]], [picks[6]], [picks[7]], [picks[8]]],
        layerFiles: [[ring], [rune]]
    });
    const flags = item.flags?.[MODULE_ID];
    if (flags && typeof flags === "object") {
        if (flags.skip === true) return null;
        if (Array.isArray(flags.files) && flags.files.length) {
            const files = flags.files.filter((file) => typeof file === "string" && file.trim());
            if (files.length) aura.files = files;
        }
        const overrideScale = Number(flags.scale);
        if (Number.isFinite(overrideScale)) aura.scale = Math.min(4, Math.max(0.1, overrideScale));
        if (flags.sound === null || typeof flags.sound === "string") aura.sound = flags.sound;
        if (typeof flags.belowTokens === "boolean") aura.belowTokens = flags.belowTokens;
        if (typeof flags.fitToken === "boolean") aura.fitToken = flags.fitToken;
    }
    return aura;
}

export function auraSignature(spec) {
    return [
        spec?.files?.[0],
        spec?.files?.[1],
        spec?.layerFiles?.flat().join(","),
        spec?.particleFiles?.[0],
        ...(spec?.extraParticleFiles ?? []).map((files) => files?.[0]),
        spec?.scale,
        spec?.duration,
        spec?.fadeOut
    ].join("|");
}

const BURST_PALETTE = [
    "jb2a.explosion.01.orange",
    "jb2a.explosion.02.blue",
    "jb2a.explosion.04.blue",
    "jb2a.firework.02.orangeyellow.01",
    "jb2a.call_lightning.low_res.purple",
    "jb2a.call_lightning.low_res.green",
    "jb2a.particle_burst.01.star.bluepurple",
    "jb2a.sacred_flame.target.yellow",
    "jb2a.energy_strands.complete.blue",
    "jb2a.thunderwave.center.blue"
];

function damageTypesOf(system) {
    const types = new Set();
    const parts = system?.damage?.parts;
    if (!Array.isArray(parts)) return types;
    for (const part of parts) {
        const flags = part?.types;
        if (!flags || typeof flags !== "object") continue;
        for (const [type, enabled] of Object.entries(flags)) {
            if (enabled === true) types.add(type);
        }
    }
    return types;
}

function spellEnergyElements(name, types) {
    if (types.has("healing")) return ["healing"];
    const priority = ["radiation", "sonic", "acid", "electricity", "cold", "fire"];
    const found = priority.filter((type) => types.has(type));
    if (types.has("fire") && types.has("electricity") && found.every((type) => type === "fire" || type === "electricity")) {
        return ["plasma"];
    }
    if (found.length) return found;
    for (const [pattern, element] of NAME_ELEMENTS) {
        if (matches(pattern, name)) return [element];
    }
    return [];
}

const DELIVERY_TABLES = {
    projectile: RAY,
    beam: RAY,
    cone: CONE,
    burst: BURST,
    melee: MELEE,
    wall: WALL
};

function deliveryOf(name, system, element) {
    const shape = system?.area?.shape ?? "";
    const action = system?.actionType ?? "";
    if (matches(/wall of|forcecage|ice prison|lava floor/, name)) return "wall";
    if (shape === "cone") return "cone";
    if (shape === "line") return "line";
    if (shape === "other") return "burst";
    if (shape === "sphere" || shape === "cylinder" || shape === "cube") return "burst";
    if (action === "msak" || action === "mwak" || matches(/\b(touch|grasp|clutch|fist)\b/, name)) return "melee";
    if (action === "rsak" || matches(/\b(ray|bolt|shot|missile)\b/, name)) return "ray";
    if (element === "healing" || action === "heal") return "heal";
    if (element && (action === "save" || (system?.damage?.parts?.length > 0))) return "burst";
    return "self";
}

function filesFor(table, element, fallback) {
    return table[element] ?? fallback;
}

function variant(name, files) {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
        hash = (Math.imul(hash, 33) + name.charCodeAt(i)) >>> 0;
    }
    const index = hash % files.length;
    const next = (index + 1) % files.length;
    return [files[index], files[next]];
}

function effectForDelivery(delivery, element, school, name) {
    if (delivery === "heal" || element === "healing") {
        return cast(["jb2a.cure_wounds.400px.blue", "jb2a.healing_generic.400px.green"], {
            particleFiles: ["jb2a.healing_generic.burst.greenorange"]
        });
    }
    if (delivery === "cone") return cone(filesFor(CONE, element, CONE.force));
    if (delivery === "line") return beam(filesFor(RAY, element, SCHOOL_RAY[school] ?? SCHOOL_RAY.uni));
    if (delivery === "burst") {
        const files = element
            ? filesFor(BURST, element, BURST.force)
            : variant(name, BURST_PALETTE);
        return burst(files, { particleFiles: ["jb2a.particles.outward.greenyellow.02"] });
    }
    if (delivery === "melee") return swipe(filesFor(MELEE, element, MELEE.force));
    if (delivery === "ray") return ray(filesFor(RAY, element, SCHOOL_RAY[school] ?? SCHOOL_RAY.uni));
    if (delivery === "wall") return wall(filesFor(WALL, element, WALL.default));
    const palette = SCHOOL_PALETTES[school] ?? SCHOOL_PALETTES.uni;
    return cast(variant(name, palette), {
        particleFiles: [SCHOOL_PARTICLES[school] ?? SCHOOL_PARTICLES.uni]
    });
}

/**
 * @param {{ name?: string, type?: string, system?: object }} item
 * @param {{ damageTypes?: Set<string>|null, level?: number|null }} [options]
 * @returns {object|null}
 */
export function mapSpellEffect(item, { damageTypes = null, level = null } = {}) {
    if (!item || item.type !== "spell") return null;
    const system = item.system ?? {};
    const name = String(item.name ?? "");
    const types = damageTypes ?? damageTypesOf(system);
    for (const [pattern, spec] of NAMED) {
        if (matches(pattern, name)) {
            const named = normalizeAreaSpec({ ...spec, source: "named" }, system);
            if (named.varied && named.files.length > 1) named.files = variant(name, named.files);
            return withCrit(named, name, system, null, types, level);
        }
    }
    for (const [pattern, spec] of THEMES) {
        if (matches(pattern, name)) {
            const themed = normalizeAreaSpec({ ...spec, source: "theme" }, system);
            if (themed.files.length >= 8) themed.files = variant(name, themed.files);
            return withCrit(themed, name, system, null, types, level);
        }
    }
    const elements = spellEnergyElements(name, types);
    const element = elements[0] ?? null;
    const delivery = deliveryOf(name, system, element);
    const spec = effectForDelivery(delivery, element, system.school || "uni", name);
    spec.source = element ? "element" : (spec.style === "self" ? "school" : "delivery");
    const table = DELIVERY_TABLES[spec.style];
    if (table) {
        spec.layerFiles = elements.slice(1)
            .map((extra) => table[extra])
            .filter(Boolean)
            .map((files) => [...files]);
    }
    const normalized = normalizeAreaSpec(spec, system, element);
    return withCrit(normalized, name, system, elements, types, level);
}

/**
 * Which rule produced an effect. Useful for diagnostics and coverage tests.
 * @returns {"named"|"theme"|"element"|"delivery"|"school"|null}
 */
export function effectSource(item, options = {}) {
    return mapSpellEffect(item, options)?.source ?? null;
}

const KINETIC_CRIT = ["piercing", "slashing", "bludgeoning"];

/** The cast level used for area formulas and aura radius. */
export function spellLevel(system, override = null) {
    if (override !== null && override !== undefined) {
        const chosen = Number(override);
        if (Number.isFinite(chosen)) return Math.max(0, chosen);
    }
    const level = Number(system?.level);
    return Number.isFinite(level) ? Math.max(0, level) : 0;
}

/**
 * Area values are usually a number, but some compendium entries store a
 * formula such as `ternary(gte(@item.level, 5), 10, 5)`.
 */
export function resolveAreaValue(value, level = 0) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const text = String(value ?? "").trim();
    if (!text) return null;
    const direct = Number(text);
    if (Number.isFinite(direct)) return direct;
    const substituted = text.replace(/@(?:item|details)\.(?:level|cl\.value)/gi, String(level));
    const ternary = substituted.match(
        /ternary\s*\(\s*gte\s*\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)\s*,\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/i
    );
    if (ternary) {
        const left = Number(ternary[1]);
        const right = Number(ternary[2]);
        const whenTrue = Number(ternary[3]);
        const whenFalse = Number(ternary[4]);
        if ([left, right, whenTrue, whenFalse].every(Number.isFinite)) {
            return left >= right ? whenTrue : whenFalse;
        }
    }
    try {
        if (typeof Roll !== "undefined" && typeof Roll?.safeEval === "function") {
            const evaluated = Number(Roll.safeEval(substituted));
            if (Number.isFinite(evaluated)) return evaluated;
        }
    } catch (error) {
        // Fall through to the first number in the expression.
    }
    const first = substituted.match(/-?\d+(?:\.\d+)?/);
    return first ? Number(first[0]) : null;
}

/**
 * An area spell whose art is aimed like a ray or cast on the caster still
 * needs to play at the area's shape and center.
 */
function normalizeAreaSpec(spec, system) {
    const effect = String(system?.area?.effect ?? "").toLowerCase();
    if (effect !== "burst" && effect !== "spread") return spec;
    const shape = String(system?.area?.shape ?? "").toLowerCase();
    let style = spec.style;
    if (shape === "cone") style = "cone";
    else if (shape === "line") style = "beam";
    else if (["self", "melee", "wall", "projectile", "beam", "cone"].includes(style)) style = "burst";
    if (style === spec.style) return spec;
    return { ...spec, style, self: false, onCaster: false, fitToken: false };
}

/**
 * An emanation starts at the caster and ignores selected creatures.
 * @param {object} system
 * @param {number|null} [level] Cast level, when it differs from the item level.
 * @returns {{ shape: string, feet: number|null }|null}
 */
export function emanationOf(system, level = null) {
    const area = system?.area;
    if (area?.effect !== "emanation") return null;
    const value = resolveAreaValue(area.value, spellLevel(system, level));
    const feet = value === null ? null : toFeet(value, area.units ?? "ft");
    return {
        shape: area.shape || "sphere",
        feet: Number.isFinite(feet) && feet > 0 ? feet : null
    };
}

function centersOnCaster(system) {
    const target = String(system?.target?.value ?? "").trim();
    const range = String(system?.range?.units ?? "").trim();
    const shape = String(system?.area?.shape ?? "").trim();
    const hasArea = Boolean(shape) && !/^(none)$/i.test(shape);
    const attack = ["msak", "rsak", "mwak", "rwak"].includes(system?.actionType);
    if (/^personal$/i.test(range) || /^personal$/i.test(target)) return true;
    if (/^(you|yourself|self|the caster)$/i.test(target)) return true;
    if (/\bspell\b/i.test(target) && !/\bcreature\b/i.test(target)) return true;
    if (!target && !hasArea && !attack) return true;
    return false;
}

function withCrit(spec, name, system, elements = null, damageTypes = null, level = null) {
    const types = damageTypes ?? damageTypesOf(system);
    const list = elements ?? spellEnergyElements(name, types);
    const primary = list[0] && list[0] !== "healing" ? list[0] : null;
    const kinetic = primary ? null : (KINETIC_CRIT.find((type) => types.has(type)) ?? null);
    const effectText = system.critical?.effect;
    const conditionCrit = /bleed|wound|stagger|knockdown|prone/i.test(String(effectText ?? ""));
    const extras = list.filter((element) => element !== primary && element !== "healing");
    const safeLevel = spellLevel(system, level);
    const selfCast = spec.style === "self";
    const emanation = emanationOf(system, level);
    const areaScale = emanation ? Math.min(2, 1 + 0.12 * Math.max(0, safeLevel - 1)) : 1;
    const audio = spellAudioFor({
        name,
        sound: spec.sound,
        style: spec.style,
        element: list[0] ?? null,
        school: system?.school || "uni"
    });
    return {
        ...spec,
        level: safeLevel,
        areaScale,
        sound: audio.sound,
        impactSound: audio.impactSound,
        scale: selfCast ? auraScale(name, safeLevel) : spec.scale,
        fitToken: selfCast || Boolean(spec.fitToken),
        files: [...spec.files],
        layerFiles: (spec.layerFiles ?? []).map((files) => [...files]),
        extraParticleFiles: (spec.extraParticleFiles ?? []).map((files) => [...files]),
        emanation,
        onCaster: Boolean(spec.onCaster) || centersOnCaster(system) || Boolean(emanation),
        self: Boolean(spec.self) || Boolean(spec.onCaster) || centersOnCaster(system),
        criticalImpactFiles: criticalImpactFiles(effectText)
            ?? (conditionCrit ? null : criticalImpactForDamage({ element: primary, kinetic })),
        criticalParticleFiles: criticalParticleFiles({
            effectText,
            element: primary,
            kinetic,
            style: spec.style
        }),
        extraCriticalParticles: extras.map((element) => criticalParticleFiles({
            element,
            style: spec.style
        }))
    };
}
