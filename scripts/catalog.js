import { BURST_DELAY_MS, GRENADE_IMPACT_DELAY_MS, SMOKE_DURATION_MS } from "./constants.js";

/**
 * JB2A Sequencer database paths from the free pack (JB2A_DnD5e).
 * Ranged entries are registered without the distance suffix. Sequencer
 * picks 05ft–90ft when the effect is stretched between tokens.
 * Each list is primary then fallback. Patreon uses the same paths.
 */

const LASER = ["jb2a.lasershot.blue", "jb2a.energy_beam.normal.blue.01"];
const FLAME = ["jb2a.fireball.beam.orange", "jb2a.scorching_ray.01.orange"];
const PLASMA = ["jb2a.energy_beam.normal.bluepink.02", "jb2a.lasershot.orange"];
const PROJECTILE = ["jb2a.bullet.01.orange", "jb2a.bolt.physical.orange"];
const CRYO = ["jb2a.ray_of_frost.blue", "jb2a.spell_projectile.ice_shard.blue"];
const SHOCK = ["jb2a.chain_lightning.primary.blue", "jb2a.lightning_bolt.narrow.blue"];
const SONIC = ["jb2a.shatter.blue", "jb2a.thunderwave.center.blue"];
const DISINTEGRATOR = ["jb2a.disintegrate.green", "jb2a.lasershot.green"];
const DISRUPTION = ["jb2a.eldritch_blast.purple", "jb2a.chain_lightning.primary.blue"];
const GENERIC_BEAM = ["jb2a.energy_beam.normal.blue.01", "jb2a.lasershot.blue"];
const GENERIC_BOLT = ["jb2a.ranged.01.projectile.01.dark_orange", "jb2a.bullet.01.orange"];
const THROW = ["jb2a.throwable.throw.bomb.01.black"];
const MELEE = ["jb2a.melee_attack.01.shortsword.01.0", "jb2a.dagger.melee.02.white"];
const SOLARIAN = ["jb2a.lasersword.melee.blue.01", "jb2a.melee_attack.01.shortsword.01.0"];
const UNARMED = [
    "jb2a.unarmed_strike.physical.01.blue",
    "jb2a.unarmed_strike.physical.02.blue",
    "jb2a.melee_generic.creature_attack.fist.001.red"
];
const UNARMED_MAGICAL = [
    "jb2a.unarmed_strike.magical.01.blue",
    "jb2a.unarmed_strike.magical.02.blue",
    "jb2a.unarmed_strike.physical.01.blue"
];

/** Body strikes for a damage-type choice. Bludgeoning stays a punch. */
const KINETIC_UNARMED = {
    bludgeoning: UNARMED,
    piercing: ["jb2a.melee_generic.creature_attack.claw.001.red", "jb2a.dagger.melee.02.white"],
    slashing: ["jb2a.melee_generic.slash.01.orange", "jb2a.melee_generic.creature_attack.claw.001.red"]
};

/** Weapon swings when the item offers bludgeoning, piercing, and slashing as alternatives. */
const KINETIC_MELEE = {
    bludgeoning: ["jb2a.club.melee.01.white", "jb2a.melee_attack.01.shortsword.01.0"],
    piercing: ["jb2a.dagger.melee.02.white", "jb2a.melee_attack.01.shortsword.01.0"],
    slashing: ["jb2a.melee_generic.slash.01.orange", "jb2a.melee_attack.01.shortsword.01.0"]
};

/**
 * Colored swings from the free pack. Acid and radiation have no green
 * blade clip, so those keep the steel weapon and add particles.
 */
const MELEE_TRAILS = {
    fire: ["jb2a.melee_attack.01.trail.01.orangered", "jb2a.melee_attack.02.trail.01.orangered"],
    plasma: ["jb2a.melee_attack.01.trail.01.pinkpurple", "jb2a.melee_attack.02.trail.01.pinkpurple"],
    cold: ["jb2a.melee_attack.01.trail.01.blueyellow", "jb2a.melee_attack.02.trail.01.blueyellow"],
    electricity: ["jb2a.melee_attack.01.magic_sword.yellow.01", "jb2a.melee_attack.01.trail.01.blueyellow"]
};

const MELEE_PARTICLES = {
    fire: ["jb2a.flames.01.orange", "jb2a.flames.02.orange"],
    plasma: ["jb2a.particle_burst.01.circle.bluepurple", "jb2a.flames.02.orange"],
    cold: ["jb2a.swirling_sparkles.01.blue", "jb2a.particles.002.001.complete.few.blue"],
    electricity: ["jb2a.static_electricity.02.blue", "jb2a.static_electricity.01.blue"],
    acid: ["jb2a.particles.outward.greenyellow.01", "jb2a.energy_strands.in.green"],
    sonic: ["jb2a.particle_burst.01.star.bluepurple", "jb2a.shatter.blue"],
    radiation: ["jb2a.particles.swirl.greenyellow.01", "jb2a.particles.outward.greenyellow.02"]
};
const SMOKE = [
    "jb2a.fog_cloud.01.white",
    "jb2a.smoke.plumes_loop.01.grey.0",
    "jb2a.ambient_fog.001.loop.large.white"
];

const FRAG_BURST = ["jb2a.explosion.shrapnel.bomb.01.black", "jb2a.explosion.01.orange"];
const FIRE_BURST = ["jb2a.fireball.explosion.orange", "jb2a.explosion.01.orange"];
const CRYO_BURST = ["jb2a.explosion.04.blue", "jb2a.ice_spikes.radial.burst.white"];
const SHOCK_BURST = ["jb2a.explosion.02.blue", "jb2a.lightning_ball.blue"];
const DEFAULT_BURST = ["jb2a.explosion.01.orange", "jb2a.fireball.explosion.orange"];
const SNIPE = ["jb2a.bullet.Snipe.blue", "jb2a.bullet.01.orange"];
const FORCE = ["jb2a.magic_missile.purple", "jb2a.guiding_bolt.01.blueyellow"];

/**
 * Category looks that already match an element. Laser is left out because
 * compendium lasers deal fire, and a fixed blue beam would hide that.
 */
export const CATEGORY_NATIVE_ELEMENT = {
    flame: "fire",
    plasma: "plasma",
    cryo: "cold",
    shock: "electricity",
    sonic: "sonic",
    disintegrator: "acid",
    disruption: "electricity"
};

const ELEMENT_BEAMS = {
    fire: ["jb2a.lasershot.orange", "jb2a.lasershot.red"],
    cold: ["jb2a.ray_of_frost.blue", "jb2a.spell_projectile.ice_shard.blue"],
    electricity: ["jb2a.chain_lightning.primary.blue", "jb2a.lightning_bolt.narrow.blue"],
    acid: ["jb2a.disintegrate.green", "jb2a.lasershot.green"],
    sonic: ["jb2a.eldritch_blast.purple", "jb2a.energy_beam.normal.bluepink.03"],
    radiation: ["jb2a.lasershot.green", "jb2a.disintegrate.green"],
    plasma: ["jb2a.energy_beam.normal.bluepink.02", "jb2a.lasershot.orange"]
};

const ELEMENT_PROJECTILES = {
    fire: ["jb2a.fire_bolt.orange", "jb2a.scorching_ray.01.orange"],
    cold: ["jb2a.spell_projectile.ice_shard.blue", "jb2a.ray_of_frost.blue"],
    electricity: ["jb2a.bullet.03.blue", "jb2a.chain_lightning.primary.blue"],
    acid: ["jb2a.arrow.poison.green.01", "jb2a.lasershot.green"],
    sonic: ["jb2a.eldritch_blast.purple", "jb2a.magic_missile.purple"],
    radiation: ["jb2a.lasershot.green", "jb2a.disintegrate.green"],
    plasma: ["jb2a.scorching_ray.01.orange", "jb2a.energy_beam.normal.bluepink.02"]
};

const CONE_FILES = {
    fire: ["jb2a.breath_weapons.fire.cone.orange.01", "jb2a.burning_hands.01.orange"],
    cold: ["jb2a.breath_weapons.cold.cone.blue", "jb2a.cone_of_cold.blue"],
    electricity: ["jb2a.breath_weapons.lightning.line.blue", "jb2a.lightning_bolt.wide.blue"],
    acid: ["jb2a.breath_weapons.poison.cone.green", "jb2a.breath_weapons.acid.line.green"],
    sonic: ["jb2a.thunderwave.center.blue", "jb2a.shatter.blue"],
    radiation: ["jb2a.breath_weapons.poison.cone.green", "jb2a.lasershot.green"],
    plasma: ["jb2a.breath_weapons.fire.cone.orange.01", "jb2a.breath_weapons02.burst.cone.fire.orange.01"],
    default: ["jb2a.burning_hands.01.orange", "jb2a.breath_weapons.fire.cone.orange.01"]
};

const ELEMENT_IMPACTS = {
    fire: ["jb2a.impact.007.orange", "jb2a.explosion.01.orange"],
    cold: ["jb2a.impact_themed.ice_shard.blue", "jb2a.ice_spikes.radial.burst.white"],
    electricity: ["jb2a.static_electricity.02.blue", "jb2a.lightning_ball.blue"],
    acid: ["jb2a.markers.poison.dark_green.01"],
    sonic: ["jb2a.shatter.blue", "jb2a.thunderwave.center.blue"],
    radiation: ["jb2a.markers.poison.dark_green.02"],
    plasma: ["jb2a.impact.013.001.orangeyellow", "jb2a.impact.007.orange"],
    bright: ["jb2a.impact.006.yellow", "jb2a.impact.007.yellow"]
};

function effect(partial) {
    return {
        style: partial.style,
        files: partial.files,
        impactFiles: partial.impactFiles ?? null,
        repeats: 1,
        repeatDelay: BURST_DELAY_MS,
        scale: partial.scale ?? 1,
        duration: partial.duration ?? null,
        fadeIn: partial.fadeIn ?? null,
        fadeOut: partial.fadeOut ?? null,
        belowTokens: partial.belowTokens ?? false,
        impactDelay: partial.impactDelay ?? 0,
        criticalImpactFiles: partial.criticalImpactFiles ?? null,
        particleFiles: partial.particleFiles ?? null,
        layerFiles: partial.layerFiles ?? [],
        extraParticleFiles: partial.extraParticleFiles ?? [],
        extraImpactFiles: partial.extraImpactFiles ?? [],
        extraCriticalParticles: partial.extraCriticalParticles ?? [],
        unarmed: partial.unarmed ?? false,
        sound: partial.sound ?? null,
        impactSound: partial.impactSound ?? null,
        soundDelay: partial.soundDelay ?? 0,
        impactSoundDelay: partial.impactSoundDelay ?? null,
        criticalSound: partial.criticalSound ?? null
    };
}

export function filesForElement(style, element) {
    if (!element) return null;
    if (style === "beam") return ELEMENT_BEAMS[element] ?? null;
    if (style === "projectile") return ELEMENT_PROJECTILES[element] ?? null;
    if (style === "cone") return CONE_FILES[element] ?? CONE_FILES.default;
    return null;
}

export function coneFilesFor(category, element) {
    const key = element || CATEGORY_NATIVE_ELEMENT[category] || "default";
    return CONE_FILES[key] ?? CONE_FILES.default;
}

export function impactForElement(element) {
    return element ? (ELEMENT_IMPACTS[element] ?? null) : null;
}

export function meleeTrailFiles(element) {
    return element ? (MELEE_TRAILS[element] ?? null) : null;
}

export function meleeParticleFiles(element) {
    return element ? (MELEE_PARTICLES[element] ?? null) : null;
}

export function magicalUnarmedFiles() {
    return UNARMED_MAGICAL;
}

export function kineticMeleeFiles(type, { unarmed = false } = {}) {
    const table = unarmed ? KINETIC_UNARMED : KINETIC_MELEE;
    return type ? (table[type] ?? null) : null;
}

export function snipeFiles() {
    return SNIPE;
}

export function forceFiles() {
    return FORCE;
}

/**
 * On-target flash for a critical hit whose text names an elemental critical.
 * Condition crits such as Wound, Staggered, and Bleed don't have a free JB2A clip.
 */
export function criticalImpactFiles(effectText) {
    const text = String(effectText ?? "");
    if (!text.trim()) return null;
    if (/burn|jet|ignite/i.test(text)) return ELEMENT_IMPACTS.fire;
    if (/corrode/i.test(text)) return ELEMENT_IMPACTS.acid;
    if (/frostbite/i.test(text)) return ELEMENT_IMPACTS.cold;
    if (/arc|electrocute/i.test(text)) return ELEMENT_IMPACTS.electricity;
    if (/deafen/i.test(text)) return ELEMENT_IMPACTS.sonic;
    if (/blind/i.test(text)) return ELEMENT_IMPACTS.bright;
    if (/irradiate/i.test(text)) return ELEMENT_IMPACTS.radiation;
    return null;
}

const CRIT_PARTICLES = {
    fire: ["jb2a.flames.01.orange", "jb2a.impact.007.orange"],
    cold: ["jb2a.swirling_sparkles.01.blue", "jb2a.impact_themed.ice_shard.blue"],
    electricity: ["jb2a.static_electricity.01.blue", "jb2a.lightning_ball.blue"],
    acid: ["jb2a.particles.outward.greenyellow.01", "jb2a.liquid.splash.blue"],
    sonic: ["jb2a.soundwave.01.blue", "jb2a.shatter.blue"],
    radiation: ["jb2a.particles.swirl.greenyellow.01", "jb2a.particles.outward.greenyellow.02"],
    plasma: ["jb2a.particle_burst.01.circle.bluepurple", "jb2a.flames.02.orange"],
    force: ["jb2a.energy_strands.complete.blue", "jb2a.particle_burst.01.circle.bluepurple"],
    bright: ["jb2a.impact.006.yellow", "jb2a.dancing_light.yellow"],
    bleed: ["jb2a.icon.drop.red", "jb2a.liquid.blob.blue"],
    wound: ["jb2a.impact.007.orange", "jb2a.icon.drop.red"],
    stagger: ["jb2a.dizzy_stars.400px.blueorange", "jb2a.dizzy_stars.200px.blueorange"],
    knockdown: ["jb2a.ground_cracks.01.orange", "jb2a.impact.007.yellow"],
    melee: ["jb2a.impact.007.yellow", "jb2a.particles.outward.greenyellow.01"],
    projectile: ["jb2a.muzzle_flash.single.01.yellow", "jb2a.impact.007.yellow"],
    beam: ["jb2a.swirling_sparkles.01.blue", "jb2a.particle_burst.01.circle.bluepurple"],
    grenade: ["jb2a.explosion.01.orange", "jb2a.firework.01.orangeyellow.01"],
    solarian: ["jb2a.particle_burst.01.star.bluepurple", "jb2a.swirling_sparkles.01.blue"],
    bludgeoning: ["jb2a.impact.007.yellow", "jb2a.impact.006.yellow"],
    piercing: ["jb2a.claws.400px.red", "jb2a.bite.400px.red"],
    slashing: ["jb2a.impact.007.orange", "jb2a.impact.005.orange"]
};

const CRIT_TEXT = [
    [/burn|jet|ignite/i, "fire"],
    [/corrode/i, "acid"],
    [/frostbite/i, "cold"],
    [/arc|electrocute/i, "electricity"],
    [/deafen/i, "sonic"],
    [/blind/i, "bright"],
    [/irradiate/i, "radiation"],
    [/bleed/i, "bleed"],
    [/wound/i, "wound"],
    [/stagger/i, "stagger"],
    [/knockdown|prone/i, "knockdown"]
];

/**
 * Scattered crit particles. Critical-effect text is checked first, then the
 * damage type (energy or kinetic), then the weapon style.
 */
export function criticalParticleFiles({ effectText = "", element = null, kinetic = null, style = "", weaponType = "" } = {}) {
    const text = String(effectText ?? "");
    for (const [pattern, key] of CRIT_TEXT) {
        if (pattern.test(text)) return CRIT_PARTICLES[key];
    }
    if (element && CRIT_PARTICLES[element]) return CRIT_PARTICLES[element];
    if (kinetic && CRIT_PARTICLES[kinetic]) return CRIT_PARTICLES[kinetic];
    if (weaponType === "solarian") return CRIT_PARTICLES.solarian;
    if (weaponType === "grenade" || style === "grenade") return CRIT_PARTICLES.grenade;
    if (style === "melee") return CRIT_PARTICLES.melee;
    if (style === "projectile") return CRIT_PARTICLES.projectile;
    if (style === "beam" || style === "cone") return CRIT_PARTICLES.beam;
    return CRIT_PARTICLES.projectile;
}

/**
 * Impact flash for the end of a critical hit, colored by damage type.
 * Condition crits such as Bleed keep their particles and don't add this flash.
 */
export function criticalImpactForDamage({ element = null, kinetic = null } = {}) {
    if (element && ELEMENT_IMPACTS[element]) return ELEMENT_IMPACTS[element];
    if (kinetic && CRIT_PARTICLES[kinetic]) return CRIT_PARTICLES[kinetic];
    return null;
}

/**
 * One cue per weapon family. There is no dedicated shock or cryo clip yet,
 * so those borrow the closest prepared effect.
 */
export const CATEGORY_SOUNDS = {
    laser: "laser",
    flame: "spellFire",
    plasma: "weaponPlasma",
    projectile: "gunnery",
    cryo: "spellCold",
    shock: "laser",
    sonic: "spellSonic",
    disintegrator: "spellAcid",
    disruption: "spellSonic"
};

export function categorySound(category, weaponType = "") {
    if (category === "laser" && weaponType === "heavy") return "blasterHeavyShot";
    return CATEGORY_SOUNDS[category] ?? "laser";
}

export const CATEGORY_EFFECTS = {
    laser: effect({ style: "beam", files: LASER, sound: "laser" }),
    flame: effect({ style: "beam", files: FLAME, sound: "spellFire" }),
    plasma: effect({ style: "beam", files: PLASMA, sound: "weaponPlasma" }),
    projectile: effect({ style: "projectile", files: PROJECTILE, sound: "gunnery" }),
    cryo: effect({ style: "beam", files: CRYO, sound: "spellCold" }),
    shock: effect({ style: "beam", files: SHOCK, sound: "laser" }),
    sonic: effect({ style: "impact", files: SONIC, sound: "spellSonic" }),
    disintegrator: effect({ style: "beam", files: DISINTEGRATOR, sound: "spellAcid" }),
    disruption: effect({ style: "beam", files: DISRUPTION, sound: "spellSonic" })
};

export const LINE_BEAM_FILES = {
    laser: LASER,
    flame: FLAME,
    plasma: PLASMA,
    cryo: CRYO,
    shock: SHOCK,
    disintegrator: DISINTEGRATOR,
    disruption: DISRUPTION,
    sonic: GENERIC_BEAM,
    projectile: GENERIC_BEAM,
    uncategorized: GENERIC_BEAM
};

export function lineBeamFiles(category) {
    return LINE_BEAM_FILES[category] ?? GENERIC_BEAM;
}

/** Bundled sound files. */
export const SOUND_FILES = {
    laser: "blaster.mp3",
    projectile: "blaster.mp3",
    gunnery: "gunnery.mp3",
    heavy: "blaster_heavy.mp3",
    explosion: "explosion_short.mp3",
    explosionShort: "explosion_short.mp3",
    explosionGrenade: "explosion_grenade.mp3",
    explosionCannon: "explosion_cannon.mp3",
    melee: "melee.mp3",
    lightsaber: "lightsaber.mp3",
    brawl: "brawl.mp3",
    railgun: "railgun.mp3",
    mortarVolley: "mortar_volley.mp3",
    missileLaunch: "missile_launch.mp3",
    sniper: "sniper.mp3",
    blasterHeavyShot: "blaster_heavy_shot.mp3",
    artillery: "artillery.mp3",
    spellCast: "spell_cast.mp3",
    spellCastShort: "spell_cast_short.mp3",
    spellFire: "spell_fire.mp3",
    spellSmite: "spell_smite.mp3",
    spellStrike: "spell_strike.mp3",
    spellSonic: "spell_sonic.mp3",
    spellWater: "spell_water.mp3",
    spellCold: "spell_cold.mp3",
    spellAcid: "spell_acid.mp3",
    spellSummon: "spell_summon.mp3",
    spellGravity: "spell_gravity.mp3",
    spellDetect: "spell_detect.mp3",
    spellHeal: "spell_heal.mp3",
    spellShield: "spell_shield.mp3",
    spellWall: "spell_wall.mp3",
    spellDivine: "spell_divine.mp3",
    weaponShotgun: "weapon_shotgun.mp3",
    weaponMineBeep: "weapon_mine_beep.mp3",
    weaponMachinegun: "weapon_machinegun.mp3",
    weaponMachinegunHeavy: "weapon_machinegun_heavy.mp3",
    weaponPlasma: "weapon_plasma.mp3"
};

export function genericBoltEffect() {
    return effect({ style: "projectile", files: GENERIC_BOLT, sound: "projectile" });
}

const ARROW = ["jb2a.arrow.poison.green.01", "jb2a.ranged.01.projectile.01.dark_orange"];
const NEEDLE = ["jb2a.bullet.03.blue", "jb2a.arrow.poison.green.01"];
const NET = ["jb2a.web.01", "jb2a.entangle.green"];
const SHURIKEN = ["jb2a.dagger.throw.01.white", "jb2a.ranged_slash.instant.001.blue"];
const MISSILE = ["jb2a.fireball.beam.orange", "jb2a.scorching_ray.01.orange"];
const CLUSTER = ["jb2a.explosion.01.orange", "jb2a.fireball.explosion.orange"];
const MINE = ["jb2a.throwable.throw.bomb.01.black", "jb2a.explosion.shrapnel.bomb.01.black"];
const SHIELD = ["jb2a.shield.01.complete.01.blue", "jb2a.energy_field.01.blue"];
const GRAVITON = ["jb2a.sphere_of_annihilation.200px.purple", "jb2a.magic_missile.purple"];
const VENOM = ["jb2a.arrow.poison.green.01", "jb2a.liquid.blob.blue"];
const NANITE = ["jb2a.particle_burst.01.circle.bluepurple", "jb2a.markers.poison.dark_green.01"];
const RANGEFINDER = ["jb2a.lasershot.blue", "jb2a.energy_beam.normal.blue.01"];
const CESTUS = ["jb2a.muzzle_flash.single.01.yellow", "jb2a.unarmed_strike.physical.01.blue"];
const SKIPSHOT = ["jb2a.bullet.03.blue", "jb2a.bullet.01.orange"];
const STINGER = ["jb2a.soundwave.01.blue", "jb2a.shatter.blue"];

/**
 * Name-based looks for weapons whose compendium category is `uncategorized`.
 * Checked after category effects and before the generic bolt, so a real
 * category still wins.
 */
const NAME_EFFECTS = [
    [/railgun/, () => effect({
        style: "beam",
        files: RANGEFINDER,
        impactFiles: ["jb2a.impact.006.yellow", "jb2a.explosion.01.orange"],
        sound: "railgun",
        impactSound: "explosionCannon",
        impactSoundDelay: 120
    })],
    [/shotgun|scattergun/, () => effect({
        style: "projectile",
        files: PROJECTILE,
        impactFiles: ["jb2a.impact.006.yellow", "jb2a.impact.007.yellow"],
        sound: "weaponShotgun"
    })],
    [/mortar/, () => effect({
        style: "grenade",
        files: THROW,
        impactFiles: FRAG_BURST,
        sound: "mortarVolley",
        impactSound: "explosionCannon",
        impactSoundDelay: GRENADE_IMPACT_DELAY_MS,
        impactDelay: GRENADE_IMPACT_DELAY_MS
    })],
    [/artillery|field gun/, () => effect({
        style: "projectile",
        files: MISSILE,
        impactFiles: FRAG_BURST,
        sound: "artillery",
        impactSound: "explosionCannon",
        impactSoundDelay: GRENADE_IMPACT_DELAY_MS
    })],
    [/battlebow|\bbow\b/, () => effect({
        style: "projectile",
        files: ARROW,
        impactFiles: ["jb2a.impact.007.orange", "jb2a.arrow.poison.green.01"],
        sound: "projectile"
    })],
    [/needler|needle/, () => effect({
        style: "projectile",
        files: NEEDLE,
        impactFiles: ["jb2a.markers.poison.dark_green.01", "jb2a.impact.007.yellow"],
        sound: "projectile"
    })],
    [/net gun|nyfiber net|\bnet\b/, () => effect({
        style: "projectile",
        files: NET,
        impactFiles: ["jb2a.entangle.green", "jb2a.web.01"],
        sound: "projectile"
    })],
    [/shuriken|throwing star/, () => effect({
        style: "projectile",
        files: SHURIKEN,
        impactFiles: ["jb2a.impact.007.yellow", "jb2a.ranged_slash.instant.001.blue"],
        sound: "projectile"
    })],
    [/cluster launcher|cluster/, () => effect({
        style: "grenade",
        files: MISSILE,
        impactFiles: CLUSTER,
        sound: "missileLaunch",
        impactSound: "explosionCannon",
        impactSoundDelay: GRENADE_IMPACT_DELAY_MS,
        impactDelay: GRENADE_IMPACT_DELAY_MS
    })],
    [/missile launcher|missile/, () => effect({
        style: "projectile",
        files: MISSILE,
        impactFiles: CLUSTER,
        sound: "missileLaunch",
        impactSound: "explosionCannon",
        impactSoundDelay: GRENADE_IMPACT_DELAY_MS,
        impactDelay: GRENADE_IMPACT_DELAY_MS
    })],
    [/minelayer|\bmine\b/, () => effect({
        style: "grenade",
        files: MINE,
        impactFiles: FRAG_BURST,
        sound: "weaponMineBeep",
        impactSound: "explosionShort",
        impactSoundDelay: GRENADE_IMPACT_DELAY_MS,
        impactDelay: GRENADE_IMPACT_DELAY_MS
    })],
    [/shield projector/, () => effect({
        style: "impact",
        files: SHIELD,
        impactFiles: SHIELD,
        sound: "spellShield",
        scale: 1.2
    })],
    [/graviton/, () => effect({
        style: "projectile",
        files: GRAVITON,
        impactFiles: ["jb2a.impact.007.yellow", "jb2a.particle_burst.01.circle.bluepurple"],
        sound: "spellGravity"
    })],
    [/venomcaster|venom|\bvenom\b/, () => effect({
        style: "projectile",
        files: VENOM,
        impactFiles: ["jb2a.markers.poison.dark_green.01", "jb2a.liquid.splash.blue"],
        sound: "spellAcid"
    })],
    [/nanite/, () => effect({
        style: "projectile",
        files: NANITE,
        impactFiles: ["jb2a.static_electricity.02.blue", "jb2a.particles.outward.greenyellow.01"],
        sound: "spellAcid"
    })],
    [/rangefinder/, () => effect({
        style: "beam",
        files: RANGEFINDER,
        impactFiles: ["jb2a.impact.006.yellow", "jb2a.impact.007.yellow"],
        sound: "spellDetect"
    })],
    [/cestus pistol/, () => effect({
        style: "projectile",
        files: CESTUS,
        impactFiles: ["jb2a.impact.007.yellow", "jb2a.unarmed_strike.physical.01.blue"],
        sound: "gunnery"
    })],
    [/skipshot/, () => effect({
        style: "projectile",
        files: SKIPSHOT,
        impactFiles: ["jb2a.impact.006.yellow", "jb2a.impact.007.yellow"],
        sound: "projectile"
    })],
    [/singing stinger|stinger/, () => effect({
        style: "projectile",
        files: STINGER,
        impactFiles: ["jb2a.shatter.blue", "jb2a.soundwave.02.blue"],
        sound: "spellSonic"
    })],
    [/grenade launcher/, () => effect({
        style: "grenade",
        files: THROW,
        impactFiles: FRAG_BURST,
        sound: null,
        impactSound: "explosionShort",
        impactSoundDelay: GRENADE_IMPACT_DELAY_MS,
        impactDelay: GRENADE_IMPACT_DELAY_MS
    })],
    [/honorbringer/, () => effect({
        style: "beam",
        files: LASER,
        impactFiles: ["jb2a.impact.006.yellow", "jb2a.impact.007.yellow"],
        sound: "blasterHeavyShot"
    })]
];

export function namedWeaponEffect(name) {
    const label = String(name ?? "");
    for (const [pattern, make] of NAME_EFFECTS) {
        const flags = pattern.flags.includes("i") ? pattern.flags : `${pattern.flags}i`;
        if (new RegExp(pattern.source, flags).test(label)) return make();
    }
    return null;
}

export function meleeEffect(weaponType, { unarmed = false } = {}) {
    if (unarmed) {
        return effect({ style: "melee", files: UNARMED, sound: "brawl", unarmed: true });
    }
    const files = weaponType === "solarian" ? SOLARIAN : MELEE;
    const sound = weaponType === "solarian" ? "lightsaber" : "melee";
    return effect({ style: "melee", files, sound });
}

export function beamEffect(files, scale = 1, sound = "laser") {
    return effect({ style: "beam", files, scale, sound });
}

export function coneEffect(files, sound = "laser") {
    return effect({ style: "cone", files, sound });
}

export function smokeEffect() {
    return effect({
        style: "smoke",
        files: THROW,
        impactFiles: SMOKE,
        sound: null,
        scale: 1.8,
        duration: SMOKE_DURATION_MS,
        fadeIn: 400,
        fadeOut: 900,
        belowTokens: true,
        impactDelay: GRENADE_IMPACT_DELAY_MS
    });
}

export function grenadeImpactFiles(name, damageTypes) {
    const label = String(name ?? "").toLowerCase();
    if (label.includes("cryo") || damageTypes.has("cold")) return CRYO_BURST;
    if (label.includes("shock") || label.includes("ion") || damageTypes.has("electricity")) return SHOCK_BURST;
    if (
        label.includes("incendiary")
        || label.includes("fire")
        || label.includes("flame")
        || damageTypes.has("fire")
    ) return FIRE_BURST;
    if (label.includes("frag") || damageTypes.has("piercing") || damageTypes.has("slashing")) return FRAG_BURST;
    return DEFAULT_BURST;
}

export function grenadeEffect(name, damageTypes) {
    return effect({
        style: "grenade",
        files: THROW,
        impactFiles: grenadeImpactFiles(name, damageTypes),
        // No launch cue exists for a thrown grenade yet, so play the
        // explosion when it lands.
        sound: null,
        impactSound: "explosionShort",
        impactSoundDelay: GRENADE_IMPACT_DELAY_MS,
        impactDelay: GRENADE_IMPACT_DELAY_MS
    });
}
