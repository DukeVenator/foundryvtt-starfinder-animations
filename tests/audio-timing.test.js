import assert from "node:assert/strict";
import test from "node:test";
import { installFoundry, sounds } from "./helpers/foundry.js";
import { playWeaponEffect, preview } from "../scripts/player.js";

function weapon(name, system) {
    return { name, type: "weapon", system };
}

test("a normal automatic weapon plays one burst recording, not one clip per shot", async (t) => {
    const log = [];
    const { actor, restore } = installFoundry(log);
    t.after(restore);
    const item = weapon("Squad machine gun", {
        weaponCategory: "projectile",
        weaponType: "heavy",
        properties: { automatic: { value: true } },
        damage: { parts: [{ types: { piercing: true } }] }
    });

    await playWeaponEffect({ item, actor, roll: { dice: [] } });

    const cues = sounds(log);
    assert.equal(cues.length, 1);
    assert.match(cues[0].value, /weapon_machinegun_heavy\.mp3$/);
    assert.equal(log.filter((entry) => entry.kind === "sequence" && entry.event === "play").length, 1);
});

test("a critical automatic weapon still plays one cue and cannot overlap itself", async (t) => {
    const log = [];
    const { actor, restore } = installFoundry(log);
    t.after(restore);
    const item = weapon("Light machine gun", {
        weaponCategory: "projectile",
        weaponType: "heavy",
        properties: { automatic: { value: true } },
        damage: { parts: [{ types: { piercing: true } }] }
    });

    await playWeaponEffect({ item, actor, roll: { dice: [] } }, { isCritical: true });

    const cues = sounds(log);
    assert.equal(cues.length, 1);
    assert.match(cues[0].value, /weapon_machinegun\.mp3$/);
    assert.equal(log.filter((entry) => entry.kind === "sound" && entry.event === "delay").length, 0);
});

test("a critical burst spell plays one burst cue, not one cue per volley clone", async (t) => {
    const log = [];
    const { actor, restore } = installFoundry(log);
    t.after(restore);
    const item = {
        name: "Explosive Blast",
        type: "spell",
        actor,
        system: {
            level: 3,
            school: "evo",
            actionType: "save",
            area: { shape: "sphere", value: "20", units: "ft" },
            damage: { parts: [{ types: { fire: true } }] }
        }
    };

    await playWeaponEffect({ item, actor, roll: { dice: [] } }, { isCritical: true });

    const cues = sounds(log);
    assert.equal(cues.length, 1);
    assert.match(cues[0].value, /spell_fire\.mp3$/);
});

test("a critical against two targets shares one sound sequence", async (t) => {
    const log = [];
    const { actor, target, restore } = installFoundry(log);
    t.after(restore);
    const second = { ...target, id: "target-2", center: { x: 400, y: 100 } };
    const item = weapon("Squad machine gun", {
        weaponCategory: "projectile",
        weaponType: "heavy",
        properties: { automatic: { value: true } },
        damage: { parts: [{ types: { piercing: true } }] }
    });

    await playWeaponEffect({ item, actor, targets: [target, second], roll: { dice: [] } }, { isCritical: true });

    assert.equal(sounds(log).length, 1);
});

test("a grenade explodes at the impact delay instead of at the throw", async (t) => {
    const log = [];
    const { actor, restore } = installFoundry(log);
    t.after(restore);
    const item = weapon("Frag grenade III", {
        weaponCategory: "uncategorized",
        weaponType: "grenade",
        properties: { explode: { value: true }, thrown: { value: true } },
        damage: { parts: [{ types: { piercing: true } }] }
    });

    await playWeaponEffect({ item, actor, roll: { dice: [] } });

    const cues = sounds(log);
    assert.equal(cues.length, 1);
    assert.match(cues[0].value, /explosion_short\.mp3$/);
    const delay = log.find((entry) => entry.kind === "sound" && entry.event === "delay");
    assert.equal(delay.value, 400);
});

test("a spell cast plays its aura cue before the spell effect", async (t) => {
    const log = [];
    const { actor, restore } = installFoundry(log);
    t.after(restore);
    const item = {
        name: "Detect Magic",
        type: "spell",
        actor,
        system: {
            level: 0,
            school: "div",
            area: { effect: "emanation", shape: "cone", value: "60", units: "ft" }
        }
    };

    assert.equal(await preview(item, { tokenId: "source" }), true);

    const cues = sounds(log);
    assert.ok(cues.length >= 1);
    assert.ok(cues.every((entry) => /spell_detect\.mp3$/.test(entry.value)));
});
