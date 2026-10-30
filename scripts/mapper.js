import {
    beamEffect,
    CATEGORY_EFFECTS,
    CATEGORY_NATIVE_ELEMENT,
    categorySound,
    coneEffect,
    coneFilesFor,
    criticalImpactFiles,
    criticalImpactForDamage,
    criticalParticleFiles,
    filesForElement,
    forceFiles,
    genericBoltEffect,
    grenadeEffect,
    impactForElement,
    lineBeamFiles,
    kineticMeleeFiles,
    magicalUnarmedFiles,
    meleeEffect,
    meleeParticleFiles,
    meleeTrailFiles,
    namedWeaponEffect,
    smokeEffect,
    snipeFiles
} from "./catalog.js";
import { mapSpellEffect } from "./spells.js";
import {
    AUTOMATIC_DELAY_MS,
    AUTOMATIC_REPEATS,
    CRITICAL_SCALE,
    GRENADE_IMPACT_DELAY_MS,
    HEAVY_AUTOMATIC_DELAY_MS,
    HEAVY_AUTOMATIC_REPEATS,
    MELEE_WEAPON_TYPES,
    MODULE_ID
} from "./constants.js";

/**
 * Starfinder usually stores weapon properties as `{ value, extension }`.
 * A bare `true` is accepted too, for fixtures and older data.
 */
export function propertyEnabled(properties, key) {
    const entry = properties?.[key];
    if (entry === true) return true;
    if (!entry || typeof entry !== "object") return false;
    return entry.value === true;
}

export function collectDamageTypes(system) {
    const types = new Set();
    const parts = system?.damage?.parts;
    if (!Array.isArray(parts)) return types;
    for (const part of parts) addPartTypes(part, types);
    return types;
}

function addPartTypes(part, types) {
    const flags = part?.types;
    if (!flags || typeof flags !== "object") return;
    for (const [type, enabled] of Object.entries(flags)) {
        if (enabled === true) types.add(type);
    }
}

/**
 * Types that are actually dealt. Parts that share a numbered group are a
 * radio choice, so only the enabled, primary, or first part of that group
 * counts. Ungrouped parts are all included.
 */
export function activeDamageTypes(system) {
    const parts = system?.damage?.parts;
    const types = new Set();
    if (!Array.isArray(parts)) return types;

    const groups = new Map();
    for (const part of parts) {
        const group = part?.group;
        if (group === null || group === undefined || group === "") {
            addPartTypes(part, types);
            continue;
        }
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group).push(part);
    }

    for (const groupParts of groups.values()) {
        const picked = groupParts.find((part) => part.enabled === true)
            ?? groupParts.find((part) => part.isPrimarySection)
            ?? groupParts[0];
        addPartTypes(picked, types);
    }
    return types;
}

/**
 * Damage types on the roll the dialog just made. Sequencer playback uses
 * this so a radio choice of piercing does not also count as bludgeoning.
 * Returns null when the roll has no damage parts.
 */
export function damageTypesFromRoll(roll) {
    const dice = roll?.dice;
    if (!Array.isArray(dice)) return null;
    const types = new Set();
    for (const die of dice) {
        const damageParts = die?.options?.damageParts;
        if (!Array.isArray(damageParts)) continue;
        for (const part of damageParts) {
            for (const type of part?.types ?? []) {
                if (typeof type === "string" && type) types.add(type);
            }
        }
    }
    return types.size ? types : null;
}

const KINETIC_TYPES = ["piercing", "slashing", "bludgeoning"];

function kineticTypesIn(damageTypes) {
    return KINETIC_TYPES.filter((type) => damageTypes?.has?.(type));
}

/** True when the item can deal more than one of bludgeoning, piercing, or slashing. */
export function hasKineticChoice(system) {
    const types = new Set();
    const parts = system?.damage?.parts;
    if (!Array.isArray(parts)) return false;
    for (const part of parts) {
        for (const type of kineticTypesIn(collectDamageTypes({ damage: { parts: [part] } }))) {
            types.add(type);
        }
    }
    return types.size > 1;
}

export function hasDamageParts(item) {
    const parts = item?.system?.damage?.parts;
    return Array.isArray(parts) && parts.length > 0;
}

/**
 * Weapons with no damage parts, such as a smoke grenade, have an Attack
 * button and no Damage button. Animate those from attackRolled only.
 */
export function shouldAnimateOnAttack(item) {
    return item?.type === "weapon" && !hasDamageParts(item);
}

const ATTACK_ACTIONS = new Set(["msak", "rsak", "mwak", "rwak"]);

export function isAttackAction(item) {
    return ATTACK_ACTIONS.has(item?.system?.actionType);
}

/** Spell cards with no Attack or Damage button animate when the card is posted. */
export function shouldAnimateSpellOnCard(item) {
    return item?.type === "spell" && !hasDamageParts(item) && !isAttackAction(item);
}

/** A spell attack with no damage parts animates from attackRolled. */
export function shouldAnimateSpellOnAttack(item) {
    return item?.type === "spell" && isAttackAction(item) && !hasDamageParts(item);
}

export function mapItemEffect(item, options = {}) {
    let spec = null;
    if (item?.type === "spell") {
        const damageTypes = options.damageTypes ?? activeDamageTypes(item?.system);
        spec = mapSpellEffect(item, { damageTypes, level: options.level ?? null });
    } else {
        spec = mapWeaponEffect(item, options);
    }
    return applyItemOverrides(spec, item);
}

/**
 * First database path that the installed JB2A pack actually has.
 * `exists` is Sequencer.Database.entryExists in Foundry, or a stub in tests.
 */
export function pickExistingFile(files, exists) {
    for (const file of files ?? []) {
        if (exists(file)) return file;
    }
    return null;
}

/**
 * Choose one installed variant from a list. `random` is injectable so tests can
 * pin the choice; production uses Math.random for frame-to-frame variety.
 */
export function pickExistingVariant(files, exists, random = Math.random) {
    const available = (files ?? []).filter((file) => exists(file));
    if (!available.length) return null;
    const roll = Number(random());
    const index = Number.isFinite(roll) ? Math.floor(Math.max(0, Math.min(0.999999, roll)) * available.length) : 0;
    return available[index] ?? available[0];
}

export function playbackScale({ base = 1, setting = 1, isCritical = false } = {}) {
    const crit = isCritical ? CRITICAL_SCALE : 1;
    const safeBase = Number.isFinite(base) ? base : 1;
    const safeSetting = Number.isFinite(setting) ? setting : 1;
    return safeBase * safeSetting * crit;
}

function cloneSpec(spec) {
    return {
        ...spec,
        files: [...spec.files],
        impactFiles: spec.impactFiles ? [...spec.impactFiles] : null,
        particleFiles: spec.particleFiles ? [...spec.particleFiles] : null,
        layerFiles: (spec.layerFiles ?? []).map((files) => [...files]),
        extraParticleFiles: (spec.extraParticleFiles ?? []).map((files) => [...files]),
        extraImpactFiles: (spec.extraImpactFiles ?? []).map((files) => [...files]),
        extraCriticalParticles: (spec.extraCriticalParticles ?? []).map((files) => [...files])
    };
}

function stringList(value) {
    return Array.isArray(value)
        ? value.filter((file) => typeof file === "string" && file.trim()).map((file) => file.trim())
        : null;
}

/**
 * Per-item overrides live on `flags["sfrpg-weapon-fx"]`. Only known fields are
 * copied, so a bad flag can't inject arbitrary spec state.
 */
export function applyItemOverrides(spec, item) {
    if (!spec) return spec;
    const flags = item?.flags?.[MODULE_ID];
    if (!flags || typeof flags !== "object") return spec;
    if (flags.skip === true) return null;

    const overridden = cloneSpec(spec);
    if (typeof flags.style === "string" && flags.style.trim()) {
        overridden.style = flags.style.trim();
    }
    const files = stringList(flags.files);
    if (files?.length) overridden.files = files;
    const impactFiles = stringList(flags.impactFiles);
    if (impactFiles?.length) overridden.impactFiles = impactFiles;
    const scale = Number(flags.scale);
    if (Number.isFinite(scale)) overridden.scale = Math.min(4, Math.max(0.1, scale));
    if (flags.sound === null || typeof flags.sound === "string") overridden.sound = flags.sound;
    if (flags.impactSound === null || typeof flags.impactSound === "string") overridden.impactSound = flags.impactSound;
    if (typeof flags.belowTokens === "boolean") overridden.belowTokens = flags.belowTokens;
    if (typeof flags.fitToken === "boolean") overridden.fitToken = flags.fitToken;
    const repeats = Number(flags.repeats ?? flags.repeat);
    if (Number.isFinite(repeats)) overridden.repeats = Math.min(20, Math.max(1, Math.floor(repeats)));
    return overridden;
}

function isLineWeapon(properties) {
    return propertyEnabled(properties, "line")
        || propertyEnabled(properties, "wideLine")
        || propertyEnabled(properties, "flexibleLine");
}

function isUnarmedName(name) {
    return /\bunarmed\b/i.test(name) || /\bfists?\b/i.test(name);
}

const ENERGY_PRIORITY = ["radiation", "sonic", "acid", "electricity", "cold", "fire"];

/**
 * Every energy type on the weapon, in a stable order. Fire plus electricity
 * and nothing else is plasma. Kinetic types do not pick a color.
 */
export function energyElements(damageTypes) {
    const has = (type) => damageTypes?.has?.(type);
    const found = ENERGY_PRIORITY.filter((type) => has(type));
    if (has("fire") && has("electricity") && found.every((type) => type === "fire" || type === "electricity")) {
        return ["plasma"];
    }
    return found;
}

/** The first energy type, or null when the weapon is only kinetic. */
export function dominantElement(damageTypes) {
    return energyElements(damageTypes)[0] ?? null;
}

function isConeWeapon(system, properties) {
    return propertyEnabled(properties, "blast") || system?.area?.shape === "cone";
}

function applyWeaponAudio(spec, { name, category, weaponType, properties }) {
    if (weaponType === "sniper" || propertyEnabled(properties, "sniper")) {
        spec.sound = "sniper";
        spec.impactSound = null;
    }
    if (/shotgun|scattergun/i.test(name)) {
        spec.sound = "weaponShotgun";
        spec.impactSound = null;
    }
    if (/railgun/i.test(name)) {
        spec.sound = "railgun";
        spec.impactSound = "explosionCannon";
        spec.impactSoundDelay = 120;
    }
    if (category === "laser" && weaponType === "heavy" && spec.sound === "laser") {
        spec.sound = "blasterHeavyShot";
    }
}

function pushImpact(spec, element) {
    const impact = impactForElement(element);
    if (!impact) return;
    if (!spec.impactFiles) spec.impactFiles = [...impact];
    else spec.extraImpactFiles.push([...impact]);
}

/**
 * Recolor a beam or projectile when the damage element is not already
 * what that weapon category looks like. Each extra energy type adds its
 * own shot, particles, or impact. Also adds crit flashes, cones, sniper
 * shots, force bolts, and on-hit impacts from properties.
 */
function applyItemDetails(spec, { category, weaponType, properties, damageTypes, criticalEffect, kineticChoice }) {
    const elements = energyElements(damageTypes);
    const native = CATEGORY_NATIVE_ELEMENT[category] ?? null;
    const primary = elements.includes(native) ? native : (elements[0] ?? null);
    const extras = elements.filter((element) => element !== primary);

    if (primary && primary !== native && (spec.style === "beam" || spec.style === "projectile")) {
        const tinted = filesForElement(spec.style, primary);
        if (tinted) spec.files = [...tinted];
    }
    if (spec.style === "beam" || spec.style === "projectile" || spec.style === "cone") {
        for (const element of extras) {
            const tinted = filesForElement(spec.style, element);
            if (tinted) spec.layerFiles.push([...tinted]);
        }
    }

    if (
        spec.style === "projectile"
        && !primary
        && (weaponType === "sniper" || propertyEnabled(properties, "sniper"))
    ) {
        spec.files = [...snipeFiles()];
    }

    if (
        !primary
        && propertyEnabled(properties, "force")
        && (spec.style === "beam" || spec.style === "projectile")
    ) {
        spec.files = [...forceFiles()];
        spec.style = "projectile";
    }

    if (
        !primary
        && kineticChoice
        && kineticTypesIn(damageTypes)[0] === "slashing"
        && (spec.style === "projectile" || spec.style === "beam")
    ) {
        spec.files = ["jb2a.ranged_slash.instant.001.blue", "jb2a.dagger.throw.01.white"];
        spec.style = "projectile";
    }

    if (spec.style === "melee" && elements.length) {
        const trailElement = elements.find((element) => meleeTrailFiles(element));
        if (spec.unarmed) {
            spec.files = [...magicalUnarmedFiles()];
        } else if (trailElement) {
            spec.files = [...meleeTrailFiles(trailElement)];
        }
        const particles = elements.map((element) => meleeParticleFiles(element)).filter(Boolean);
        if (particles[0]) spec.particleFiles = [...particles[0]];
        spec.extraParticleFiles = particles.slice(1).map((files) => [...files]);
        for (const element of elements) pushImpact(spec, element);
    } else if (spec.style === "melee" && !elements.length && (spec.unarmed || kineticChoice)) {
        const kinetics = kineticTypesIn(damageTypes);
        const primaryFiles = kineticMeleeFiles(kinetics[0], { unarmed: spec.unarmed });
        if (primaryFiles) spec.files = [...primaryFiles];
        for (const extra of kinetics.slice(1)) {
            const more = kineticMeleeFiles(extra, { unarmed: spec.unarmed });
            if (more) spec.layerFiles.push([...more]);
        }
    } else if (spec.style === "impact" && primary && primary !== native) {
        pushImpact(spec, primary);
    }
    if (spec.style === "grenade" || spec.style === "impact") {
        for (const element of extras) pushImpact(spec, element);
    }

    if (spec.style === "melee" && propertyEnabled(properties, "reach")) {
        spec.scale = (spec.scale || 1) * 1.15;
    }

    if (!spec.impactFiles && propertyEnabled(properties, "stun")) {
        spec.impactFiles = [...impactForElement("electricity")];
    } else if (!spec.impactFiles && propertyEnabled(properties, "bright")) {
        spec.impactFiles = [...impactForElement("bright")];
    }

    if (propertyEnabled(properties, "healing")) {
        spec.particleFiles = ["jb2a.healing_generic.burst.greenorange"];
        if (spec.style === "impact" || spec.style === "melee") {
            spec.files = ["jb2a.cure_wounds.400px.blue", "jb2a.healing_generic.400px.green"];
        }
        spec.sound = "spellHeal";
    }
    if (propertyEnabled(properties, "teleportive")) {
        spec.layerFiles.push(["jb2a.teleport.01.blue"]);
    }
    if (propertyEnabled(properties, "polarize")) {
        pushImpact(spec, "electricity");
    }
    if (propertyEnabled(properties, "swarm")) {
        spec.extraParticleFiles.push(["jb2a.particles.swirl.greenyellow.01"]);
    }
    if (propertyEnabled(properties, "guided") && spec.style === "projectile") {
        spec.layerFiles.push(["jb2a.magic_missile.purple"]);
    }
    if (propertyEnabled(properties, "mine")) {
        if (!spec.impactFiles) spec.impactFiles = ["jb2a.explosion.01.orange"];
        spec.impactDelay = Math.max(spec.impactDelay ?? 0, GRENADE_IMPACT_DELAY_MS);
    }

    const kinetic = kineticTypesIn(damageTypes)[0] ?? null;
    const conditionCrit = /bleed|wound|stagger|knockdown|prone/i.test(String(criticalEffect ?? ""));
    spec.criticalImpactFiles = criticalImpactFiles(criticalEffect)
        ?? (conditionCrit ? null : criticalImpactForDamage({ element: primary, kinetic }));
    spec.criticalParticleFiles = criticalParticleFiles({
        effectText: criticalEffect,
        element: primary,
        kinetic,
        style: spec.style,
        weaponType
    });
    spec.extraCriticalParticles = [
        ...extras.map((element) => criticalParticleFiles({ element, style: spec.style, weaponType })),
        ...kineticTypesIn(damageTypes).slice(1).map((type) => criticalParticleFiles({
            kinetic: type,
            style: spec.style,
            weaponType
        }))
    ];
    return spec;
}

/**
 * Map a weapon item to an effect spec. Returns null for non-weapon items
 * (spells, starship weapons, hazards).
 *
 * Automatic fire changes beams and projectiles. It can't be its own branch,
 * because those weapons still carry a category.
 *
 * @param {{ name?: string, type?: string, system?: object }} item
 * @param {{ damageTypes?: Set<string>|null }} [options] Types chosen in the damage dialog.
 * @returns {object|null}
 */
export function mapWeaponEffect(item, options = {}) {
    if (!item || item.type !== "weapon") return null;

    const system = item.system ?? {};
    const name = String(item.name ?? "");
    const weaponType = system.weaponType ?? "";
    const category = system.weaponCategory || "uncategorized";
    const properties = system.properties ?? {};
    const damageTypes = options.damageTypes ?? activeDamageTypes(system);
    const criticalEffect = system.critical?.effect;

    let spec;
    if (weaponType === "grenade" && /smoke/i.test(name)) {
        spec = smokeEffect();
    } else if (weaponType === "grenade" || propertyEnabled(properties, "explode")) {
        spec = grenadeEffect(name, damageTypes);
    } else if (isConeWeapon(system, properties)) {
        spec = coneEffect(coneFilesFor(category, dominantElement(damageTypes)), categorySound(category, weaponType));
    } else if (isLineWeapon(properties)) {
        const scale = propertyEnabled(properties, "wideLine") ? 1.35 : 1;
        spec = beamEffect(lineBeamFiles(category), scale, categorySound(category, weaponType));
    } else if (MELEE_WEAPON_TYPES.has(weaponType)) {
        spec = meleeEffect(weaponType, { unarmed: isUnarmedName(name) });
    } else if (CATEGORY_EFFECTS[category]) {
        spec = cloneSpec(CATEGORY_EFFECTS[category]);
    } else {
        spec = namedWeaponEffect(name) ?? genericBoltEffect();
    }

    applyItemDetails(spec, {
        category,
        weaponType,
        properties,
        damageTypes,
        criticalEffect,
        kineticChoice: hasKineticChoice(system)
    });
    applyWeaponAudio(spec, { name, category, weaponType, properties });

    if (
        propertyEnabled(properties, "automatic")
        && (spec.style === "beam" || spec.style === "projectile")
    ) {
        const heavy = /heavy|squad|assault/i.test(name);
        if (spec.style === "beam") {
            spec.repeats = AUTOMATIC_REPEATS;
            spec.repeatDelay = AUTOMATIC_DELAY_MS;
            spec.sound = "blasterHeavyShot";
        } else if (heavy) {
            spec.repeats = HEAVY_AUTOMATIC_REPEATS;
            spec.repeatDelay = HEAVY_AUTOMATIC_DELAY_MS;
            spec.sound = "weaponMachinegunHeavy";
        } else {
            spec.repeats = AUTOMATIC_REPEATS;
            spec.repeatDelay = AUTOMATIC_DELAY_MS;
            spec.sound = "weaponMachinegun";
        }
        spec.criticalSound = spec.sound;
        spec.impactSound = null;
    }

    return applyItemOverrides(spec, item);
}
