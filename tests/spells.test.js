import assert from "node:assert/strict";
import test from "node:test";
import { spells } from "./helpers/compendium.js";
import { mapItemEffect, mapWeaponEffect, shouldAnimateSpellOnAttack, shouldAnimateSpellOnCard } from "../scripts/mapper.js";
import { auraFamily, auraMotif, auraPalette, auraSignature, emanationOf, mapSpellAura } from "../scripts/spells.js";

function spell(name, system = {}) {
    return { name, type: "spell", system };
}

test("iconic spells pick their own animations", () => {
    const missile = mapItemEffect(spell("Magic Missile", { actionType: "rsak", school: "evo" }));
    assert.equal(missile.files[0], "jb2a.magic_missile.purple");
    assert.equal(missile.repeats, 3);
    assert.equal(missile.style, "projectile");

    const blast = mapItemEffect(spell("Explosive Blast", { actionType: "save", school: "evo" }));
    assert.equal(blast.files[0], "jb2a.fireball.explosion.orange");
    assert.equal(blast.style, "burst");

    const force = mapItemEffect(spell("Force Blast", {
        actionType: "save",
        school: "evo",
        area: { shape: "cone" }
    }));
    assert.equal(force.style, "cone");
    assert.equal(force.files[0], "jb2a.gust_of_wind.default");

    const cure = mapItemEffect(spell("Mystic Cure", {
        actionType: "heal",
        school: "con",
        damage: { parts: [{ types: { healing: true } }] }
    }));
    assert.equal(cure.files[0], "jb2a.cure_wounds.400px.blue");
    assert.equal(cure.self, true);
    assert.equal(shouldAnimateSpellOnCard(spell("Mystic Cure", {
        damage: { parts: [{ types: { healing: true } }] }
    })), false);

    const hidden = mapItemEffect(spell("Invisibility", { school: "ill" }));
    assert.equal(hidden.files[0], "jb2a.shimmer.01.blue");
    assert.equal(hidden.self, true);
    assert.equal(shouldAnimateSpellOnCard(spell("Invisibility", { school: "ill" })), true);
    assert.equal(mapItemEffect(spell("See Invisibility", { school: "div" })).files[0], "jb2a.detect_magic.circle.blue");

    const door = mapItemEffect(spell("Teleport", { school: "con" }));
    assert.equal(door.files[0], "jb2a.teleport.01.blue");

    assert.equal(mapItemEffect(spell("Time Lapse", { school: "trs" })).files[0], "jb2a.icosahedron.roll.blue");
    assert.equal(mapItemEffect(spell("Akashic Download", { school: "div" })).files[0], "jb2a.markers_scifi.001.complete.001.blue");
    assert.equal(mapItemEffect(spell("Fey Pranksters", { school: "con" })).files[0], "jb2a.fairies.complete.01.bluepurple");

    const wall = mapItemEffect(spell("Wall of Fire", { school: "evo" }));
    assert.equal(wall.files[0], "jb2a.wall_of_fire.500x100.yellow");

    const ray = mapItemEffect(spell("Disintegrate", { actionType: "rsak", school: "trs" }));
    assert.equal(ray.files[0], "jb2a.disintegrate.green");

    const ice = mapItemEffect(spell("Ice Bolt", { actionType: "rsak", school: "evo" }));
    assert.equal(ice.files[0], "jb2a.ray_of_frost.blue");

    const acid = mapItemEffect(spell("Acid Rain", {
        actionType: "save",
        school: "con",
        area: { shape: "cylinder" },
        damage: { parts: [{ types: { acid: true } }] }
    }));
    assert.equal(acid.style, "burst");
    assert.equal(acid.files[0], "jb2a.fumes.steam.white");
    assert.equal(
        mapItemEffect(spell("Ice Bolt", {
            actionType: "rsak",
            school: "evo",
            critical: { effect: "Frostbite" }
        })).criticalParticleFiles[0],
        "jb2a.swirling_sparkles.01.blue"
    );

    const negate = mapItemEffect(spell("Negate Spell", {
        school: "abj",
        activation: { type: "reaction" },
        target: { value: "one spell" }
    }));
    assert.equal(negate.onCaster, true);
    assert.equal(negate.files[0], "jb2a.shatter.blue");
    assert.equal(negate.particleFiles[0], "jb2a.shield.01.complete.01.blue");

    const spheres = mapItemEffect(spell("Hardlight Spheres", {
        school: "evo",
        range: { units: "personal" },
        target: { value: "" }
    }));
    assert.equal(spheres.onCaster, true);
    assert.equal(spheres.files[0], "jb2a.dancing_light.yellow");

    const held = mapItemEffect(spell("Hold Person", {
        school: "enc",
        target: { value: "one humanoid creature" }
    }));
    assert.equal(held.onCaster, false);
    assert.equal(held.particleFiles[0], "jb2a.web.01");

    const wreck = mapItemEffect(spell("Sinking Ship", {
        school: "con",
        area: { shape: "sphere" },
        target: { value: "" }
    }));
    assert.equal(wreck.onCaster, false);
    assert.equal(wreck.belowTokens, true);
    assert.equal(wreck.files[0], "jb2a.template_circle.aura.01.complete.large.bluepurple");
    assert.equal(wreck.layerFiles.length, 4);
    assert.equal(wreck.extraParticleFiles.length, 3);
    const wreckClips = [
        ...wreck.files,
        ...wreck.layerFiles.flat(),
        ...(wreck.particleFiles ?? []),
        ...wreck.extraParticleFiles.flat()
    ];
    assert.equal(wreckClips.includes("jb2a.celestial_bodies.asteroid.disk.iron.red.01"), false);

    const maze = mapItemEffect(spell("Phantasmal Maze", {
        school: "ill",
        area: { shape: "sphere" }
    }));
    assert.equal(maze.files[0], "jb2a.template_circle.aura.01.complete.large.bluepurple");
    assert.equal(maze.onCaster, false);
});

test("spell sounds follow the element and named utility families", () => {
    assert.equal(mapItemEffect(spell("Explosive Blast", {
        school: "evo",
        actionType: "save",
        damage: { parts: [{ types: { fire: true } }] }
    })).sound, "spellFire");

    assert.equal(mapItemEffect(spell("Ice Bolt", {
        school: "evo",
        actionType: "rsak",
        damage: { parts: [{ types: { cold: true } }] }
    })).sound, "spellCold");

    assert.equal(mapItemEffect(spell("Acid Rain", {
        school: "con",
        actionType: "save",
        area: { shape: "cylinder" },
        damage: { parts: [{ types: { acid: true } }] }
    })).sound, "spellAcid");

    assert.equal(mapItemEffect(spell("Detect Magic", { school: "div" })).sound, "spellDetect");
    assert.equal(mapItemEffect(spell("Mystic Cure", {
        school: "con",
        actionType: "heal",
        damage: { parts: [{ types: { healing: true } }] }
    })).sound, "spellHeal");
    assert.equal(mapItemEffect(spell("Shield", { school: "abj" })).sound, "spellShield");
    assert.equal(mapItemEffect(spell("Summon Creature", { school: "con" })).sound, "spellSummon");
    assert.equal(mapItemEffect(spell("Acid Fog", { school: "con" })).sound, "spellAcid");

    assert.equal(mapSpellAura(spell("Acid Rain", {
        school: "con",
        actionType: "save",
        area: { shape: "cylinder" },
        damage: { parts: [{ types: { acid: true } }] }
    })).sound, "spellAcid");
    assert.equal(mapSpellAura(spell("Detect Magic", { school: "div" })).sound, "spellDetect");
    assert.equal(mapSpellAura(spell("See Invisibility", { school: "div" })).sound, "spellDetect");
    assert.equal(mapSpellAura(spell("Invisibility", { school: "ill" })).sound, null);
});

test("an emanation is drawn from the caster, not a selected creature", () => {
    const detect = spells.find((item) => item.name === "Detect Magic");
    assert.ok(detect);
    assert.deepEqual(emanationOf(detect.system), { shape: "cone", feet: 60 });
    const spec = mapItemEffect(detect);
    assert.equal(spec.onCaster, true);
    assert.equal(spec.emanation.shape, "cone");
    assert.equal(spec.emanation.feet, 60);

    const zone = spell("Zone of Truth", {
        school: "enc",
        area: { effect: "emanation", shape: "sphere", value: "20" },
        target: { value: "creatures" }
    });
    assert.equal(mapItemEffect(zone).onCaster, true);
    assert.equal(emanationOf(zone.system).feet, 20);

    const burst = spell("Explosive Blast", {
        school: "evo",
        area: { effect: "burst", shape: "sphere", value: "20" },
        target: { value: "" }
    });
    assert.equal(emanationOf(burst.system), null);
    assert.equal(mapItemEffect(burst).onCaster, false);
});

test("spell attacks without damage wait for the attack roll", () => {
    const item = spell("Energy Ray", { actionType: "rsak", school: "evo" });
    assert.equal(shouldAnimateSpellOnAttack(item), true);
    assert.equal(shouldAnimateSpellOnCard(item), false);
    assert.equal(mapItemEffect(item).style, "projectile");
    assert.equal(mapWeaponEffect(item), null);
});

test("every compendium spell maps, and many use distinct art", () => {
    const counts = new Map();
    let mapped = 0;
    for (const item of spells) {
        const spec = mapItemEffect(item);
        assert.ok(spec, item.name);
        assert.ok(spec.files?.length, item.name);
        counts.set(spec.files[0], (counts.get(spec.files[0]) ?? 0) + 1);
        mapped += 1;
    }
    assert.equal(mapped, spells.length);
    assert.ok(counts.size >= 100, `expected many distinct clips, got ${counts.size}`);
    const busiest = Math.max(...counts.values());
    assert.ok(busiest <= 25, `one clip is still used by ${busiest} spells`);
});

function auraClips(aura) {
    return [
        aura.files[0],
        aura.files[1],
        aura.particleFiles?.[0],
        ...(aura.extraParticleFiles ?? []).map((files) => files?.[0]),
        ...(aura.layerFiles ?? []).map((files) => files?.[0])
    ];
}

test("every spell casts its own themed aura", () => {
    const negate = mapSpellAura(spell("Negate Spell", { school: "abj", level: 3 }));
    assert.equal(negate.onCaster, true);
    assert.equal(negate.self, true);
    assert.equal(negate.sound, "spellCastShort");
    assert.equal(auraMotif(spell("Negate Spell", { school: "abj" })).id, "negate");
    assert.ok(auraMotif(spell("Negate Spell", { school: "abj" })).clips.includes("jb2a.shatter.blue"));

    const blast = mapSpellAura(spell("Explosive Blast", { school: "evo", level: 1 }));
    assert.equal(auraMotif(spell("Explosive Blast", { school: "evo" })).id, "fire");
    assert.notEqual(auraSignature(negate), auraSignature(blast));

    const mendingItem = spell("Mending", { school: "trs", level: 0 });
    const mending = mapSpellAura(mendingItem);
    const mendingMotif = auraMotif(mendingItem);
    assert.equal(mendingMotif.id, "mending");
    assert.ok(mendingMotif.clips.includes("jb2a.cure_wounds.400px.blue"));
    assert.ok(mendingMotif.clips.includes(mending.files[0]));

    const wish = mapSpellAura(spell("Wish", { school: "uni", level: 6 }));
    assert.equal(mending.fitToken, true);
    assert.ok(mending.scale <= 1.1, `mending scale ${mending.scale}`);
    assert.ok(mending.scale >= 0.95, `mending scale ${mending.scale}`);
    assert.ok(wish.scale >= 5.5, `wish scale ${wish.scale}`);
    assert.ok(wish.scale > mending.scale * 4);

    const investigation = spell("Akashic Investigation", { school: "div", level: 1 });
    const augury = spell("Augury", { school: "div", level: 2 });
    assert.equal(auraMotif(investigation).id, "knowledge");
    assert.equal(auraMotif(augury).id, "knowledge");
    assert.notEqual(auraClips(mapSpellAura(investigation)).join("|"), auraClips(mapSpellAura(augury)).join("|"));

    const seen = new Map();
    const spanByLevel = new Map();
    for (const item of spells) {
        const aura = mapSpellAura(item);
        const motif = auraMotif(item);
        const palette = auraPalette(item);
        const ring = auraFamily(item.system?.school || "uni")[0];
        const level = Number(item.system?.level);
        const safeLevel = Number.isFinite(level) ? Math.max(0, level) : 0;
        const span = spanByLevel.get(safeLevel) ?? { min: Infinity, max: 0 };
        span.min = Math.min(span.min, aura.scale);
        span.max = Math.max(span.max, aura.scale);
        spanByLevel.set(safeLevel, span);
        assert.ok(aura?.files?.length, item.name);
        assert.equal(aura.onCaster, true, item.name);
        for (const clip of auraClips(aura)) {
            assert.ok(
                palette.includes(clip) || clip === ring,
                `${item.name} (${motif.id}) uses off-theme ${clip}`
            );
        }
        const key = auraClips(aura).join("|");
        assert.equal(seen.has(key), false, `${item.name} casts the same aura as ${seen.get(key)}`);
        seen.set(key, item.name);
    }
    assert.equal(seen.size, spells.length);
    const levels = [...spanByLevel.keys()].sort((a, b) => a - b);
    for (let i = 1; i < levels.length; i += 1) {
        const lower = spanByLevel.get(levels[i - 1]);
        const higher = spanByLevel.get(levels[i]);
        assert.ok(
            higher.min > lower.max,
            `level ${levels[i]} (${higher.min}) should cast a wider circle than level ${levels[i - 1]} (${lower.max})`
        );
    }
});
