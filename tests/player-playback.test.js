import assert from "node:assert/strict";
import test from "node:test";
import { installFoundry } from "./helpers/foundry.js";
import { playWeaponEffect, preview } from "../scripts/player.js";

test("weapon playback builds and plays a sequence against a target", async (t) => {
    const log = [];
    const { actor, target, restore } = installFoundry(log);
    t.after(restore);

    const item = {
        name: "Laser Rifle",
        type: "weapon",
        system: {
            weaponCategory: "laser",
            weaponType: "longA",
            damage: { parts: [{ types: { fire: true } }] }
        }
    };

    await playWeaponEffect({ item, actor, roll: { dice: [] } });

    const file = log.find((entry) => entry.kind === "effect" && entry.event === "file");
    assert.ok(file, "an effect file was requested");
    assert.match(file.value, /lasershot/);
    assert.equal(log.filter((entry) => entry.kind === "sequence" && entry.event === "play").length, 1);

    const stretch = log.find((entry) => entry.kind === "effect" && entry.event === "stretchTo");
    assert.ok(stretch, "the effect stretched to a target");
    assert.equal(stretch.value, target);

    const sound = log.find((entry) => entry.kind === "sound" && entry.event === "file");
    assert.ok(sound, "a sound was requested");
    assert.match(sound.value, /blaster\.mp3$/);

    globalThis.fromUuidSync = () => item;
    assert.equal(await preview(item), true);
});
