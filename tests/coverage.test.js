import assert from "node:assert/strict";
import test from "node:test";
import { spells, weapons } from "./helpers/compendium.js";
import { mapItemEffect, mapWeaponEffect, pickExistingVariant } from "../scripts/mapper.js";
import { auraMotif, effectSource, emanationOf } from "../scripts/spells.js";

test("compendium fixture contains the full system snapshot", () => {
    assert.equal(spells.length, 586);
    assert.equal(weapons.length, 1789);
});

test("spell specificity and aura fallback stay below their targets", () => {
    const sources = new Map();
    let auraFallbacks = 0;
    for (const item of spells) {
        const spec = mapItemEffect(item);
        sources.set(spec.source, (sources.get(spec.source) ?? 0) + 1);
        const motif = auraMotif(item).id;
        if (["abj", "con", "div", "enc", "evo", "ill", "nec", "trs", "uni"].includes(motif)) auraFallbacks += 1;
    }
    const generic = (sources.get("school") ?? 0) + (sources.get("delivery") ?? 0);
    assert.ok(generic / spells.length < 0.2, `generic effects ${generic}/${spells.length}`);
    assert.ok(auraFallbacks / spells.length < 0.25, `aura fallbacks ${auraFallbacks}/${spells.length}`);
});

test("area spells map to area shapes, including the formula emanation", () => {
    const fixtures = [
        "Dazzling Flares",
        "Harness Lightning",
        "Lava Floor",
        "School Spirit",
        "Shared Gravity",
        "Soul Reap",
        "Synaptic Pulse",
        "Tempting Fate",
        "Time Crawl",
        "Wither"
    ];
    for (const name of fixtures) {
        const item = spells.find((candidate) => candidate.name === name);
        assert.ok(item, name);
        const spec = mapItemEffect(item);
        assert.ok(["burst", "cone", "beam"].includes(spec.style), `${name} mapped to ${spec.style}`);
    }

    const conduit = spells.find((item) => /conduit of destruction/i.test(item.name));
    assert.ok(conduit);
    assert.equal(emanationOf(conduit.system, 2).feet, 5);
    assert.equal(emanationOf(conduit.system, 5).feet, 10);
    assert.equal(mapItemEffect(conduit, { level: 5 }).emanation.feet, 10);
});

test("weapon name fallbacks replace almost every generic bolt", () => {
    const generic = weapons.filter((item) => {
        const spec = mapWeaponEffect(item);
        return spec?.files?.[0] === "jb2a.ranged.01.projectile.01.dark_orange";
    });
    assert.ok(generic.length < 15, `generic bolts: ${generic.map((item) => item.name).join(", ")}`);
});

test("per-item flags override a mapped effect without mutating it", () => {
    const item = {
        name: "Test Rifle",
        type: "weapon",
        flags: {
            "sfrpg-weapon-fx": {
                files: ["jb2a.lasershot.blue"],
                style: "beam",
                scale: 1.4,
                sound: null,
                repeats: 2
            }
        },
        system: {
            weaponCategory: "projectile",
            weaponType: "smallA",
            damage: { parts: [{ types: { piercing: true } }] }
        }
    };
    const spec = mapWeaponEffect(item);
    assert.deepEqual(spec.files, ["jb2a.lasershot.blue"]);
    assert.equal(spec.style, "beam");
    assert.equal(spec.scale, 1.4);
    assert.equal(spec.sound, null);
    assert.equal(spec.repeats, 2);

    item.flags["sfrpg-weapon-fx"].skip = true;
    assert.equal(mapWeaponEffect(item), null);
});

test("variant picking only returns installed files and exposes effect source", () => {
    const files = ["missing", "installed-a", "installed-b"];
    const exists = (file) => file.startsWith("installed");
    assert.equal(pickExistingVariant(files, exists, () => 0), "installed-a");
    assert.equal(pickExistingVariant(files, exists, () => 0.99), "installed-b");
    assert.equal(pickExistingVariant(files, () => false), null);

    assert.equal(effectSource({ name: "Magic Missile", type: "spell", system: {} }), "named");
    assert.equal(effectSource({ name: "A Brand New Spell", type: "spell", system: { school: "evo" } }), "school");
});
