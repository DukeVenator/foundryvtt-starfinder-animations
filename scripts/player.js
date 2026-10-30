import { CRITICAL_SCATTER, JB2A_MODULE_IDS, MODULE_ID } from "./constants.js";
import { CATEGORY_EFFECTS, SOUND_FILES } from "./catalog.js";
import { mapSpellAura } from "./spells.js";
import { feetToPixels, pointAhead, sceneGrid } from "./geometry.js";
import {
    effectiveScale,
    effectiveVolume,
    effectsEnabled,
    intensityProfile,
    notifySkips,
    onlyMyRolls,
    preloadEnabled,
    privacyMode,
    soundsEnabled
} from "./settings.js";
import {
    mapItemEffect,
    damageTypesFromRoll,
    pickExistingFile,
    pickExistingVariant,
    playbackScale,
    shouldAnimateOnAttack,
    shouldAnimateSpellOnAttack,
    shouldAnimateSpellOnCard
} from "./mapper.js";

const missingReports = new Set();
const skipReports = new Set();

function debug(...args) {
    try {
        if (!game.settings.get(MODULE_ID, "debug")) return;
    } catch (error) {
        return;
    }
    console.debug(`${MODULE_ID} |`, ...args);
}

function notifySkip(reason, item) {
    debug("Skipping", reason, item?.name ?? "");
    if (!notifySkips() || typeof ui === "undefined" || !ui.notifications) return;
    const key = `${reason}:${item?.uuid ?? item?.name ?? ""}`;
    if (skipReports.has(key)) return;
    skipReports.add(key);
    ui.notifications.info(game.i18n?.format?.("SFRPGWEAPONFX.SkipInfo", { item: item?.name ?? "", reason }) ?? `Starfinder Weapon FX: ${reason}`);
}

export function sequencerReady() {
    return Boolean(game.modules.get("sequencer")?.active && globalThis.Sequence && globalThis.Sequencer?.Database);
}

export function jb2aReady() {
    return JB2A_MODULE_IDS.some((id) => game.modules.get(id)?.active);
}

export function checkDependencies() {
    const localize = (key, fallback) => game.i18n?.localize?.(key) ?? fallback;
    if (!game.modules.get("sequencer")?.active) {
        ui.notifications.error(localize("SFRPGWEAPONFX.MissingSequencer", "Starfinder Weapon FX requires the Sequencer module. Weapon animations are disabled."));
        return;
    }
    if (!sequencerReady()) {
        ui.notifications.warn(localize("SFRPGWEAPONFX.SequencerNotReady", "Sequencer is active but not ready yet. Effects will start after the canvas is ready."));
        return;
    }
    if (!jb2aReady()) {
        ui.notifications.warn(localize("SFRPGWEAPONFX.MissingJB2A", "Starfinder Weapon FX needs JB2A Free or JB2A Patreon before weapon effects can play."));
    }
}

function databaseHas(key) {
    try {
        return Sequencer.Database.entryExists(key) === true;
    } catch (error) {
        debug("Database lookup failed", key, error);
        return false;
    }
}

function firstExisting(files) {
    const found = pickExistingFile(files, databaseHas);
    if (found || !(files?.length)) return found;
    const reportKey = files.join("|");
    if (!missingReports.has(reportKey)) {
        missingReports.add(reportKey);
        console.warn(`${MODULE_ID} | No JB2A database entry for ${files.join(", ")}`);
    }
    return null;
}

/** Pick among installed variants so repeated shots do not use the same frame. */
function firstExistingVariant(files) {
    const found = pickExistingVariant(files, databaseHas);
    if (found || !(files?.length)) return found;
    return firstExisting(files);
}

function resolveSourceToken(actor) {
    if (!actor?.getActiveTokens || !canvas?.scene) return null;
    let tokens = [];
    try {
        tokens = actor.getActiveTokens(false, false);
    } catch (error) {
        debug("Could not read active tokens", error);
        return null;
    }
    const onScene = tokens.filter((token) => {
        const tokenScene = token.scene ?? token.parent;
        return tokenScene?.id === canvas.scene.id;
    });
    if (!onScene.length) return null;
    return onScene.find((token) => token.controlled) ?? onScene[0];
}

function currentScale(spec, isCritical) {
    return playbackScale({
        base: spec.scale ?? 1,
        setting: effectiveScale(),
        isCritical
    });
}

function messageAuthorId(message) {
    const author = message?.author;
    if (!author) return null;
    if (typeof author === "string") return author;
    return author.id ?? null;
}

/**
 * Audience of a chat message. Public messages have no whisper list; blind
 * messages are author-only. Sequencer filters rendering per user, but the
 * effect data itself is still broadcast (GMs always see their own effects).
 */
export function audienceForMessage(message) {
    if (!message || privacyMode() === "ignore") return null;
    const mode = privacyMode();
    const author = messageAuthorId(message);
    const ids = new Set();
    if (message.blind) {
        if (author) ids.add(author);
    } else {
        for (const entry of message.whisper ?? []) {
            const id = typeof entry === "string" ? entry : entry?.id;
            if (id) ids.add(id);
        }
        if (!ids.size) return null;
        if (author) ids.add(author);
    }
    if (!ids.size) return null;
    const audience = {
        ids: [...ids],
        local: ids.size === 1 && ids.has(game.user?.id),
        skip: false
    };
    if (mode === "skip" && !ids.has(game.user?.id)) audience.skip = true;
    return audience;
}

/** Damage rolls do not expose their message, so honor the client roll mode as a fallback. */
function audienceForRoll(roll) {
    if (privacyMode() === "ignore") return null;
    const messageId = roll?.options?.sfrpgMessageId;
    if (messageId && game.messages?.get) {
        const message = game.messages.get(messageId);
        if (message) return audienceForMessage(message);
    }
    const rollMode = game.settings?.get?.("core", "rollMode") ?? "publicroll";
    if (rollMode === "publicroll") return null;
    const ids = rollMode === "selfroll"
        ? [game.user?.id].filter(Boolean)
        : (game.users?.filter?.((user) => user.isGM) ?? []).map((user) => user.id);
    if (!ids.length) return null;
    const audience = {
        ids,
        local: ids.length === 1 && ids[0] === game.user?.id,
        skip: privacyMode() === "skip" && !ids.includes(game.user?.id)
    };
    return audience;
}

function applyAudience(section, audience) {
    if (!section || !audience) return section;
    try {
        if (audience.local && typeof section.locally === "function") section.locally(true);
        else if (audience.ids?.length && typeof section.forUsers === "function") section.forUsers(audience.ids);
    } catch (error) {
        debug("Could not scope a Sequencer section", error);
    }
    return section;
}

function applyMetadata(section, spec) {
    if (!section) return section;
    try {
        if (spec.origin && typeof section.origin === "function") section.origin(spec.origin);
        if (spec.documents?.length && typeof section.tieToDocuments === "function") {
            section.tieToDocuments(spec.documents);
        }
        if (typeof section.name === "function") section.name(spec.effectName ?? MODULE_ID);
    } catch (error) {
        debug("Could not attach Sequencer metadata", error);
    }
    return section;
}

function scope(section, spec) {
    applyMetadata(section, spec);
    return applyAudience(section, spec.audience);
}

function addStretch(sequence, file, source, target, scale, spec) {
    const effect = scope(sequence.effect(), spec)
        .file(file)
        .atLocation(source)
        .stretchTo(target)
        .scale(scale);
    if (spec.repeats > 1) effect.repeats(spec.repeats, spec.repeatDelay);
    return effect;
}

function addImpact(sequence, file, target, scale, spec) {
    const effect = scope(sequence.effect(), spec)
        .file(file)
        .atLocation(target);
    if (spec.fitToken) effect.scaleToObject(scale, { uniform: true });
    else effect.scale(scale);
    if (spec.impactDelay > 0) effect.delay(spec.impactDelay);
    if (spec.fadeIn) effect.fadeIn(spec.fadeIn);
    if (spec.fadeOut) effect.fadeOut(spec.fadeOut);
    if (spec.duration) effect.duration(spec.duration);
    if (spec.belowTokens) effect.belowTokens(true);
    return effect;
}

function addMelee(sequence, file, source, target, scale, spec) {
    return scope(sequence.effect(), spec)
        .file(file)
        .atLocation(source)
        .rotateTowards(target, { template: true })
        .scale(scale);
}

function addMeleeParticles(sequence, file, source, target, scale, spec) {
    return scope(sequence.effect(), spec)
        .file(file)
        .atLocation(source)
        .rotateTowards(target)
        .anchor({ x: 0.2, y: 0.5 })
        .scale(scale * 0.65)
        .fadeOut(180);
}

const VOLLEY_STAGGER_MS = 80;

function addVolleyShot(sequence, spec, file, source, target, scale, delay) {
    const scattered = spec.style === "beam" || spec.style === "projectile";
    let effect;
    if (spec.style === "melee") {
        effect = scope(sequence.effect(), spec)
            .file(file)
            .atLocation(source)
            .rotateTowards(target, { template: true })
            .scale(scale);
    } else if (spec.style === "cone") {
        effect = scope(sequence.effect(), spec)
            .file(file)
            .atLocation(source)
            .rotateTowards(target)
            .scale(scale);
    } else if (scattered) {
        effect = scope(sequence.effect(), spec)
            .file(file)
            .atLocation(source)
            .stretchTo(target, { randomOffset: CRITICAL_SCATTER })
            .scale(scale);
    } else {
        effect = scope(sequence.effect(), spec)
            .file(file)
            .atLocation(target, { randomOffset: CRITICAL_SCATTER })
            .scale(scale * 0.85);
    }
    if (delay > 0) effect.delay(delay);
    return effect;
}

/**
 * Critical hits use a volley. Queue the extra shots first so they leave
 * together, then wait for the first one to land before starting the impact
 * flash and particles.
 */
function addCriticalVolley(sequence, spec, source, target, scale) {
    const lists = [spec.files, ...(spec.layerFiles ?? [])].filter((files) => files?.length);
    if (!lists.length) return false;

    const volley = intensityProfile().volley;
    const leadList = lists.find((files) => firstExisting(files)) ?? null;
    let lead = null;
    for (let i = 1; i < volley; i += 1) {
        const file = firstExisting(lists[i % lists.length]);
        if (file) addVolleyShot(sequence, spec, file, source, target, scale, VOLLEY_STAGGER_MS * i);
    }
    const leadFile = leadList ? firstExisting(leadList) : null;
    if (leadFile) {
        lead = addVolleyShot(sequence, spec, leadFile, source, target, scale, 0);
        lead.waitUntilFinished();
    }

    let played = Boolean(lead);
    if (spec.impactFiles) {
        const impact = firstExisting(spec.impactFiles);
        if (impact) {
            addImpact(sequence, impact, target, scale * 0.65, { ...spec, fadeOut: 140 });
            played = true;
        }
    }
    for (const files of spec.extraImpactFiles ?? []) {
        const impact = firstExisting(files);
        if (impact) {
            addImpact(sequence, impact, target, scale * 0.6, { ...spec, fadeOut: 140 });
            played = true;
        }
    }
    if (spec.criticalImpactFiles) {
        const critFile = firstExisting(spec.criticalImpactFiles);
        if (critFile) {
            addImpact(sequence, critFile, target, scale, { ...spec, fadeOut: 160 });
            played = true;
        }
    }

    const particleSets = [spec.criticalParticleFiles, ...(spec.extraCriticalParticles ?? [])].filter((files) => files?.length);
    const perSet = Math.max(1, Math.ceil(intensityProfile().particles / Math.max(particleSets.length, 1)));
    particleSets.forEach((files, setIndex) => {
        const particle = firstExisting(files);
        if (!particle) return;
        for (let i = 0; i < perSet; i += 1) {
            const effect = scope(sequence.effect(), spec)
                .file(particle)
                .atLocation(target, { randomOffset: CRITICAL_SCATTER + 0.1 })
                .scale(scale * (0.32 + (i % 2) * 0.12))
                .delay(50 * (setIndex + i))
                .fadeOut(140);
            played = true;
        }
    });
    return played;
}

function gridInfo() {
    return sceneGrid(canvas?.scene ?? {}, canvas?.grid ?? {});
}

function emanationFile(spec) {
    const shape = spec.emanation?.shape;
    if (shape === "cone" && /detect|measure/i.test(spec.name ?? "")) {
        return firstExisting(["jb2a.detect_magic.cone.blue", ...(spec.files ?? [])]);
    }
    if (shape === "cone") {
        return firstExisting([...(spec.files ?? []), "jb2a.template_cone_5e.001.001.purplered"]);
    }
    return firstExisting(spec.files);
}

/**
 * Draw the spell's area from the caster. A cone uses the token's facing.
 * A sphere, cube, or cylinder is a circle whose diameter is twice the radius.
 */
function addEmanation(sequence, spec, source) {
    const file = emanationFile(spec);
    const feet = spec.emanation?.feet;
    if (!file || !feet) return false;
    const reach = feet * effectiveScale() * (spec.areaScale ?? 1);
    const grid = gridInfo();
    const effect = scope(sequence.effect(), spec)
        .file(file)
        .atLocation(source)
        .belowTokens(true);
    const shape = spec.emanation.shape;
    if (shape === "cone" || shape === "line") {
        effect.stretchTo(pointAhead(source.center ?? source, source.document?.rotation ?? source.rotation ?? 0, reach, grid));
    } else {
        effect.size(feetToPixels(reach, grid) * 2);
    }
    return true;
}

function addCone(sequence, file, source, target, scale, spec) {
    return scope(sequence.effect(), spec)
        .file(file)
        .atLocation(source)
        .rotateTowards(target)
        .scale(scale);
}

function addRideAlong(sequence, spec, source, target, scale) {
    const groups = [spec.particleFiles, ...(spec.extraParticleFiles ?? [])].filter((files) => files?.length);
    for (const files of groups) {
        const particle = firstExisting(files);
        if (!particle) continue;
        if (spec.style === "melee") addMeleeParticles(sequence, particle, source, target, scale, spec);
        else addImpact(sequence, particle, target, scale * 0.5, {
            ...spec,
            fadeOut: 180,
            belowTokens: spec.belowTokens,
            fitToken: spec.fitToken
        });
    }
}

function addLayers(sequence, spec, source, target, scale) {
    for (const files of spec.layerFiles ?? []) {
        const file = firstExisting(files);
        if (!file) continue;
        let effect;
        if (spec.style === "melee") effect = addMelee(sequence, file, source, target, scale * 0.9, spec);
        else if (spec.style === "cone") effect = addCone(sequence, file, source, target, scale * 0.9, spec);
        else if (spec.style === "beam" || spec.style === "projectile") {
            effect = addStretch(sequence, file, source, target, scale, { ...spec, repeats: 1 });
        } else {
            effect = addImpact(sequence, file, target, scale * 0.85, {
                ...spec,
                fadeOut: 160,
                belowTokens: spec.belowTokens,
                fitToken: spec.fitToken
            });
        }
        effect.delay(70);
    }
}

function addExtraImpacts(sequence, spec, target, scale, delay) {
    for (const files of spec.extraImpactFiles ?? []) {
        const impact = firstExisting(files);
        if (impact) addImpact(sequence, impact, target, scale * 0.6, { ...spec, impactDelay: delay, fadeOut: 140 });
    }
}

/**
 * Add one target's effects. Returns true when at least one file was found.
 */
function addTargetEffects(sequence, spec, source, target, isCritical) {
    const scale = currentScale(spec, isCritical);
    const primary = firstExistingVariant(spec.files);
    const impact = firstExisting(spec.impactFiles);
    const skipCrit = spec.style === "grenade" || spec.style === "smoke";
    if (isCritical && !skipCrit) {
        addRideAlong(sequence, spec, source, target, scale);
        return addCriticalVolley(sequence, spec, source, target, scale);
    }

    let played = false;

    if (spec.style === "melee") {
        if (primary) {
            addMelee(sequence, primary, source, target, scale, spec);
            played = true;
        }
    } else if (spec.style === "cone") {
        if (primary) {
            addCone(sequence, primary, source, target, scale, spec);
            played = true;
        }
    } else if (spec.style === "impact" || spec.style === "burst" || spec.style === "wall" || spec.style === "self") {
        if (primary) {
            addImpact(sequence, primary, target, scale, spec);
            played = true;
        }
    } else if (spec.style === "grenade" || spec.style === "smoke") {
        if (primary) addStretch(sequence, primary, source, target, 1, { ...spec, repeats: 1 });
        if (impact) addImpact(sequence, impact, target, scale, spec);
        played = Boolean(primary || impact);
    } else if (primary) {
        addStretch(sequence, primary, source, target, scale, spec);
        played = true;
    }

    if (played) {
        addRideAlong(sequence, spec, source, target, scale);
        addLayers(sequence, spec, source, target, scale);
    }

    if (played && impact && spec.style !== "grenade" && spec.style !== "smoke" && spec.style !== "impact") {
        addImpact(sequence, impact, target, scale * 0.65, { ...spec, impactDelay: 120 });
    }
    if (played) addExtraImpacts(sequence, spec, target, scale, spec.impactDelay || 120);

    return played;
}

function addSound(sequence, spec, delay = 0, key = spec.sound) {
    if (!soundsEnabled()) return;
    const fileName = SOUND_FILES[key];
    if (!fileName || typeof sequence.sound !== "function") return;
    const sound = scope(sequence.sound(), spec)
        .file(`modules/${MODULE_ID}/assets/audio/${fileName}`)
        .volume(effectiveVolume());
    if (delay > 0) sound.delay(delay);
    if (typeof AudioContext !== "undefined" && game.audio?.environment instanceof AudioContext && typeof sound.audioChannel === "function") {
        sound.audioChannel("environment");
    }
}

/** The cast or attack cue. An aura uses this and does not add an impact cue. */
function addCastSound(sequence, spec) {
    addSound(sequence, spec, spec.soundDelay ?? 0, spec.sound);
}

/**
 * One primary cue per attack, plus one optional impact cue. Automatic fire
 * uses a burst recording for the whole attack. Criticals also use one cue,
 * so a 1.5-second clip can't overlap itself.
 */
function addAttackSounds(sequence, spec, isCritical) {
    const primary = (isCritical && spec.criticalSound) || spec.sound;
    addSound(sequence, spec, spec.soundDelay ?? 0, primary);
    if (!spec.impactSound) return;
    const delay = spec.impactSoundDelay ?? (spec.impactDelay > 0 ? spec.impactDelay : 120);
    addSound(sequence, spec, delay, spec.impactSound);
}

export async function playWeaponEffect(data, { isCritical = false, level = null, message = null, preview = false, audience = null } = {}) {
    try {
        if (!effectsEnabled()) return;
        if (!sequencerReady() || !jb2aReady()) return;

        const item = data?.item;
        const authorId = messageAuthorId(message);
        if (!preview && onlyMyRolls()) {
            const otherAuthor = authorId && authorId !== game.user?.id;
            const otherActor = !authorId && data?.actor?.isOwner === false;
            if (otherAuthor || otherActor) {
                notifySkip("not your roll", item);
                return;
            }
        }
        const aud = preview ? null : (audience ?? (message ? audienceForMessage(message) : audienceForRoll(data?.roll)));
        if (aud?.skip) {
            notifySkip("private message", item);
            return;
        }

        const chosenTypes = damageTypesFromRoll(data?.roll);
        const spec = mapItemEffect(item, {
            ...(chosenTypes ? { damageTypes: chosenTypes } : {}),
            level
        });
        if (!spec) return;

        spec.origin = item?.uuid ?? null;
        spec.documents = item?.uuid ? [item.uuid] : [];
        spec.effectName = MODULE_ID;
        spec.audience = aud;
        spec.name = item?.name ?? "";

        const targets = data?.targets ? [...data.targets] : [...(game.user?.targets ?? [])];
        const source = data?.source ?? resolveSourceToken(data?.actor);
        if (!source) {
            notifySkip("no source token", item);
            return;
        }
        if (spec.emanation?.feet) {
            const sequence = new Sequence();
            addAttackSounds(sequence, spec, isCritical);
            if (!addEmanation(sequence, spec, source)) {
                notifySkip("effect assets missing", item);
                return;
            }
            debug("Playing emanation", { name: item?.name, spec, source: source.id });
            await sequence.play();
            return;
        }
        const destinations = spec.onCaster
            ? [source]
            : (targets.length ? targets : (spec.self ? [source] : []));
        if (!destinations.length) {
            notifySkip("no target", item);
            return;
        }

        if (isCritical && destinations.length > 1) {
            const soundSequence = new Sequence();
            addAttackSounds(soundSequence, spec, true);
            const soundPlay = soundSequence.play();
            const plays = destinations.map((target) => {
                const sequence = new Sequence();
                if (!addTargetEffects(sequence, spec, source, target, true)) return Promise.resolve(false);
                return sequence.play().then(() => true);
            });
            const [, results] = await Promise.all([soundPlay, Promise.all(plays)]);
            if (!results.some(Boolean)) notifySkip("effect assets missing", item);
            return;
        }

        const sequence = new Sequence();
        addAttackSounds(sequence, spec, isCritical);
        let played = false;
        for (const target of destinations) {
            played = addTargetEffects(sequence, spec, source, target, isCritical) || played;
        }
        if (!played) {
            notifySkip("effect assets missing", item);
            return;
        }

        debug("Playing", { name: item?.name, spec, source: source.id, targets: destinations.map((token) => token.id), audience: aud });
        await sequence.play();
    } catch (error) {
        console.error(`${MODULE_ID} | Failed to play weapon effect`, error);
    }
}

async function playSpellAura(data, { level = null, message = null, preview = false, audience = null } = {}) {
    try {
        if (!effectsEnabled()) return;
        if (!sequencerReady() || !jb2aReady()) return;
        const spec = mapSpellAura(data?.item, { level });
        if (!spec) return;
        const source = data?.source ?? resolveSourceToken(data?.actor);
        if (!source) {
            notifySkip("no source token", data?.item);
            return;
        }
        spec.origin = data?.item?.uuid ?? null;
        spec.documents = data?.item?.uuid ? [data.item.uuid] : [];
        spec.effectName = MODULE_ID;
        spec.audience = audience ?? (message ? audienceForMessage(message) : null);
        spec.name = data?.item?.name ?? "";
        if (spec.audience?.skip && !preview) {
            notifySkip("private message", data?.item);
            return;
        }
        const sequence = new Sequence();
        addCastSound(sequence, spec);
        if (!addTargetEffects(sequence, spec, source, source, false)) {
            notifySkip("effect assets missing", data?.item);
            return;
        }
        debug("Casting aura", { name: data?.item?.name, spec, source: source.id, audience: spec.audience });
        await sequence.play();
    } catch (error) {
        console.error(`${MODULE_ID} | Failed to play a spell aura`, error);
    }
}

function onDamageRolled(data) {
    return playWeaponEffect(data, {
        isCritical: Boolean(data?.isCritical),
        message: data?.roll?.options?.sfrpgMessageId ? game.messages?.get?.(data.roll.options.sfrpgMessageId) : null
    });
}

function onAttackRolled(data) {
    const item = data?.item;
    if (!shouldAnimateOnAttack(item) && !shouldAnimateSpellOnAttack(item)) return;
    const messageId = data?.roll?.options?.sfrpgMessageId;
    return playWeaponEffect(data, {
        isCritical: false,
        message: messageId ? game.messages?.get?.(messageId) : null
    });
}

function onSpellCard(message, options, userId) {
    try {
        const flags = message?.flags?.sfrpg;
        const level = Number(flags?.level);
        if (!flags?.item || !Number.isFinite(level)) return;
        if (userId && userId !== game.user?.id) return;
        const authorId = messageAuthorId(message);
        if (authorId && authorId !== game.user?.id) return;
        if (typeof fromUuidSync !== "function") return;
        const item = fromUuidSync(flags.item);
        if (item?.type !== "spell") return;
        const actor = item.actor ?? (flags.actor ? fromUuidSync(flags.actor) : null);
        const audience = audienceForMessage(message);
        if (audience?.skip) {
            notifySkip("private message", item);
            return;
        }
        const aura = playSpellAura({ item, actor }, { level, message, audience });
        if (!shouldAnimateSpellOnCard(item)) return aura;
        return Promise.all([
            aura,
            playWeaponEffect({ item, actor }, { level, message, audience })
        ]);
    } catch (error) {
        console.error(`${MODULE_ID} | Failed to animate a spell card`, error);
    }
}

function resolvePreviewItem(itemOrUuid) {
    if (itemOrUuid?.type) return itemOrUuid;
    const key = String(itemOrUuid ?? "");
    if (!key) return null;
    if (typeof fromUuidSync === "function" && key.includes(".")) {
        const item = fromUuidSync(key);
        if (item?.type) return item;
    }
    const direct = game.items?.getName?.(key);
    if (direct) return direct;
    for (const actor of game.actors ?? []) {
        const owned = actor.items?.getName?.(key);
        if (owned) return owned;
    }
    return null;
}

async function findPreviewItem(itemOrUuid) {
    const direct = resolvePreviewItem(itemOrUuid);
    if (direct || typeof itemOrUuid !== "string") return direct;
    const packs = game.packs?.filter?.((pack) => pack.documentName === "Item") ?? [];
    const wanted = String(itemOrUuid).toLowerCase();
    for (const pack of packs) {
        try {
            const index = await pack.getIndex({ fields: ["name", "type"] });
            const entry = index.find?.((candidate) => String(candidate.name ?? "").toLowerCase() === wanted);
            if (entry) return await pack.getDocument(entry._id);
        } catch (error) {
            debug("Could not search a compendium for preview", pack?.metadata?.id, error);
        }
    }
    return null;
}

/**
 * Play an item's effect without a roll. Used by the public API and /fx preview.
 */
export async function preview(itemOrUuid, { tokenId = null, targetIds = null } = {}) {
    const item = await findPreviewItem(itemOrUuid);
    if (!item) {
        ui.notifications?.warn?.(game.i18n?.localize?.("SFRPGWEAPONFX.PreviewMissingItem") ?? "No matching item to preview.");
        return false;
    }
    const actor = item.actor ?? game.actors?.find?.((candidate) => candidate.items?.has?.(item.id)) ?? null;
    const source = tokenId
        ? canvas?.tokens?.get?.(tokenId)
        : (resolveSourceToken(actor) ?? canvas?.tokens?.controlled?.[0] ?? null);
    const targets = targetIds?.length
        ? targetIds.map((id) => canvas?.tokens?.get?.(id)).filter(Boolean)
        : [...(game.user?.targets ?? [])];
    if (!source) {
        notifySkip("no source token", item);
        return false;
    }
    if (item.type === "spell") {
        const aura = playSpellAura({ item, actor: actor ?? source.actor, source }, { level: Number(item.system?.level), preview: true, audience: null });
        const effect = playWeaponEffect({ item, actor: actor ?? source.actor, source, targets }, { level: Number(item.system?.level), preview: true, audience: null });
        await Promise.all([aura, effect]);
        return true;
    }
    await playWeaponEffect({ item, actor: actor ?? source.actor, source, targets }, { preview: true, audience: null });
    return true;
}

export function stopAll({ origin = null } = {}) {
    const manager = globalThis.Sequencer?.EffectManager;
    if (!manager?.endEffects) return false;
    try {
        if (origin) manager.endEffects({ origin });
        else manager.endEffects({ name: MODULE_ID });
        return true;
    } catch (error) {
        debug("Could not stop effects", error);
        return false;
    }
}

export function preloadEffects() {
    if (!preloadEnabled() || !sequencerReady()) return false;
    const preloader = globalThis.Sequencer?.Preloader;
    if (!preloader?.preloadForClients) return false;
    const files = new Set();
    for (const effect of Object.values(CATEGORY_EFFECTS)) {
        for (const file of effect.files ?? []) files.add(file);
    }
    try {
        preloader.preloadForClients([...files]);
        return true;
    } catch (error) {
        debug("Preload failed", error);
        return false;
    }
}

export function bindHooks() {
    Hooks.on("damageRolled", onDamageRolled);
    Hooks.on("attackRolled", onAttackRolled);
    Hooks.on("createChatMessage", onSpellCard);
}
