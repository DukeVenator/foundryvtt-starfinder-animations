import assert from "node:assert/strict";
import test from "node:test";
import { damageTypesFromRoll, hasDamageParts, mapWeaponEffect, pickExistingFile, playbackScale, shouldAnimateOnAttack } from "../scripts/mapper.js";

const laser = {
    name: "Convergent laser, multiwave",
    type: "weapon",
    system: {
        weaponCategory: "laser",
        weaponType: "heavy",
        properties: {
            two: { value: true },
            unwieldy: { value: true }
        },
        damage: {
            parts: [{ types: { fire: true, piercing: false } }]
        }
    }
};

const machineGun = {
    name: "Squad machine gun",
    type: "weapon",
    system: {
        weaponCategory: "projectile",
        weaponType: "heavy",
        properties: {
            analog: { value: true },
            automatic: { value: true },
            two: { value: true }
        },
        damage: {
            parts: [{ types: { piercing: true } }]
        }
    }
};

const fragGrenade = {
    name: "Frag grenade III",
    type: "weapon",
    system: {
        weaponCategory: "uncategorized",
        weaponType: "grenade",
        properties: {
            explode: { value: true },
            thrown: { value: true }
        },
        damage: {
            parts: [{ types: { piercing: true, slashing: false } }]
        }
    }
};

const smokeGrenade = {
    name: "Smoke grenade",
    type: "weapon",
    system: {
        weaponCategory: "uncategorized",
        weaponType: "grenade",
        properties: {
            explode: { value: true },
            thrown: { value: true }
        },
        damage: {
            parts: []
        }
    }
};

const maul = {
    name: "Elite maul",
    type: "weapon",
    system: {
        weaponCategory: "uncategorized",
        weaponType: "basicM",
        properties: {
            analog: { value: true },
            two: { value: true }
        },
        damage: {
            parts: [{ types: { bludgeoning: true } }]
        }
    }
};

test("fire damage recolors a laser rifle orange", () => {
    const spec = mapWeaponEffect(laser);
    assert.equal(spec.style, "beam");
    assert.equal(spec.files[0], "jb2a.lasershot.orange");
    assert.equal(spec.repeats, 1);
    assert.equal(spec.sound, "blasterHeavyShot");
    assert.equal(shouldAnimateOnAttack(laser), false);
    assert.equal(hasDamageParts(laser), true);
});

test("machine gun maps to a repeated projectile", () => {
    const spec = mapWeaponEffect(machineGun);
    assert.equal(spec.style, "projectile");
    assert.equal(spec.files[0], "jb2a.bullet.01.orange");
    assert.equal(spec.repeats, 6);
    assert.equal(spec.repeatDelay, 160);
    assert.equal(spec.sound, "weaponMachinegunHeavy");
    assert.equal(spec.criticalSound, "weaponMachinegunHeavy");
    assert.equal(spec.criticalParticleFiles[0], "jb2a.claws.400px.red");
    assert.equal(spec.criticalImpactFiles[0], "jb2a.claws.400px.red");
});

test("automatic laser stays a beam and repeats", () => {
    const spec = mapWeaponEffect({
        name: "Autobeam rifle",
        type: "weapon",
        system: {
            weaponCategory: "laser",
            weaponType: "longA",
            properties: { automatic: { value: true } },
            damage: { parts: [{ types: { fire: true } }] }
        }
    });
    assert.equal(spec.style, "beam");
    assert.equal(spec.files[0], "jb2a.lasershot.orange");
    assert.equal(spec.repeats, 3);
    assert.equal(spec.repeatDelay, 300);
    assert.equal(spec.sound, "blasterHeavyShot");
});

test("frag grenade throws a bomb and bursts shrapnel", () => {
    const spec = mapWeaponEffect(fragGrenade);
    assert.equal(spec.style, "grenade");
    assert.equal(spec.files[0], "jb2a.throwable.throw.bomb.01.black");
    assert.equal(spec.impactFiles[0], "jb2a.explosion.shrapnel.bomb.01.black");
    assert.equal(spec.sound, null);
    assert.equal(spec.impactSound, "explosionShort");
    assert.equal(spec.impactSoundDelay, 400);
    assert.equal(spec.impactDelay, 400);
    assert.equal(shouldAnimateOnAttack(fragGrenade), false);
});

test("smoke grenade plays a cloud even though it also explodes", () => {
    const spec = mapWeaponEffect(smokeGrenade);
    assert.equal(spec.style, "smoke");
    assert.equal(spec.files[0], "jb2a.throwable.throw.bomb.01.black");
    assert.equal(spec.impactFiles[0], "jb2a.fog_cloud.01.white");
    assert.equal(spec.sound, null);
    assert.equal(spec.belowTokens, true);
    assert.equal(spec.duration, 5000);
    assert.equal(shouldAnimateOnAttack(smokeGrenade), true);
    assert.equal(hasDamageParts(smokeGrenade), false);
});

test("melee weapon maps to a swipe", () => {
    const spec = mapWeaponEffect(maul);
    assert.equal(spec.style, "melee");
    assert.equal(spec.files[0], "jb2a.melee_attack.01.shortsword.01.0");
    assert.equal(spec.repeats, 1);
    assert.equal(spec.sound, "melee");
    assert.equal(spec.criticalParticleFiles[0], "jb2a.impact.007.yellow");
    assert.equal(spec.criticalImpactFiles[0], "jb2a.impact.007.yellow");
});

test("unarmed strikes use a fist", () => {
    const spec = mapWeaponEffect({
        name: "Unarmed strike",
        type: "weapon",
        system: {
            weaponCategory: "uncategorized",
            weaponType: "basicM",
            properties: {
                archaic: { value: true },
                nonlethal: { value: true }
            },
            damage: { parts: [{ types: { bludgeoning: true } }] }
        }
    });
    assert.equal(spec.style, "melee");
    assert.equal(spec.files[0], "jb2a.unarmed_strike.physical.01.blue");
    assert.equal(spec.sound, "brawl");
});

test("energy melee uses a colored swing and particles", () => {
    const flaming = mapWeaponEffect({
        name: "Flaming doshko",
        type: "weapon",
        system: {
            weaponCategory: "uncategorized",
            weaponType: "advancedM",
            damage: { parts: [{ types: { fire: true, slashing: true } }] }
        }
    });
    assert.equal(flaming.files[0], "jb2a.melee_attack.01.trail.01.orangered");
    assert.equal(flaming.particleFiles[0], "jb2a.flames.01.orange");
    assert.equal(flaming.impactFiles[0], "jb2a.impact.007.orange");

    const shock = mapWeaponEffect({
        name: "Shock truncheon",
        type: "weapon",
        system: {
            weaponCategory: "uncategorized",
            weaponType: "basicM",
            damage: { parts: [{ types: { electricity: true, bludgeoning: true } }] }
        }
    });
    assert.equal(shock.files[0], "jb2a.melee_attack.01.magic_sword.yellow.01");
    assert.equal(shock.particleFiles[0], "jb2a.static_electricity.02.blue");

    const punch = mapWeaponEffect({
        name: "Unarmed strike",
        type: "weapon",
        system: {
            weaponCategory: "uncategorized",
            weaponType: "basicM",
            damage: { parts: [{ types: { fire: true, bludgeoning: true } }] }
        }
    });
    assert.equal(punch.files[0], "jb2a.unarmed_strike.magical.01.blue");
    assert.equal(punch.particleFiles[0], "jb2a.flames.01.orange");
    assert.equal(punch.sound, "brawl");
});

test("line weapons stretch a beam instead of using their category projectile", () => {
    const spec = mapWeaponEffect({
        name: "Line rifle",
        type: "weapon",
        system: {
            weaponCategory: "projectile",
            weaponType: "longA",
            properties: { line: { value: true } },
            damage: { parts: [{ types: { piercing: true } }] }
        }
    });
    assert.equal(spec.style, "beam");
    assert.equal(spec.files[0], "jb2a.energy_beam.normal.blue.01");
});

test("non-weapons and bare boolean properties", () => {
    assert.equal(mapWeaponEffect({ name: "Fireball", type: "spell", system: {} }), null);
    assert.equal(mapWeaponEffect({ name: "Laser cannon", type: "starshipWeapon", system: { weaponCategory: "laser" } }), null);
    const spec = mapWeaponEffect({
        name: "Old automatic",
        type: "weapon",
        system: {
            weaponCategory: "projectile",
            weaponType: "heavy",
            properties: { automatic: true },
            damage: { parts: [{ types: { piercing: true } }] }
        }
    });
    assert.equal(spec.repeats, 3);
});

test("item data picks element color, critical flashes, and property shapes", () => {
    const plainLaser = mapWeaponEffect({
        name: "Azimuth laser",
        type: "weapon",
        system: {
            weaponCategory: "laser",
            weaponType: "smallA",
            damage: { parts: [] }
        }
    });
    assert.equal(plainLaser.files[0], "jb2a.lasershot.blue");

    const flame = mapWeaponEffect({
        name: "Flame pistol",
        type: "weapon",
        system: {
            weaponCategory: "flame",
            weaponType: "smallA",
            damage: { parts: [{ types: { fire: true } }] }
        }
    });
    assert.equal(flame.files[0], "jb2a.fireball.beam.orange");

    const shockRound = mapWeaponEffect({
        name: "Shock caster",
        type: "weapon",
        system: {
            weaponCategory: "projectile",
            weaponType: "smallA",
            damage: { parts: [{ types: { electricity: true, piercing: true } }] }
        }
    });
    assert.equal(shockRound.files[0], "jb2a.bullet.03.blue");

    const burningLaser = mapWeaponEffect({
        name: "Artillery laser",
        type: "weapon",
        system: {
            weaponCategory: "laser",
            weaponType: "heavy",
            damage: { parts: [{ types: { fire: true } }] },
            critical: { effect: "Burn 1d6" }
        }
    });
    assert.equal(burningLaser.criticalImpactFiles[0], "jb2a.impact.007.orange");
    assert.equal(burningLaser.criticalParticleFiles[0], "jb2a.flames.01.orange");

    const bleed = mapWeaponEffect({
        name: "Needler",
        type: "weapon",
        system: {
            weaponCategory: "projectile",
            weaponType: "smallA",
            damage: { parts: [{ types: { piercing: true } }] },
            critical: { effect: "Bleed 1d6" }
        }
    });
    assert.equal(bleed.criticalImpactFiles, null);
    assert.equal(bleed.criticalParticleFiles[0], "jb2a.icon.drop.red");

    const sniper = mapWeaponEffect({
        name: "Shirren-eye rifle",
        type: "weapon",
        system: {
            weaponCategory: "projectile",
            weaponType: "sniper",
            properties: { sniper: { value: true } },
            damage: { parts: [{ types: { piercing: true } }] }
        }
    });
    assert.equal(sniper.files[0], "jb2a.bullet.Snipe.blue");

    const cone = mapWeaponEffect({
        name: "Arc emitter",
        type: "weapon",
        system: {
            weaponCategory: "shock",
            weaponType: "longA",
            properties: { blast: { value: true } },
            area: { shape: "cone" },
            damage: { parts: [{ types: { electricity: true } }] }
        }
    });
    assert.equal(cone.style, "cone");
    assert.equal(cone.files[0], "jb2a.breath_weapons.lightning.line.blue");

    const acidBlade = mapWeaponEffect({
        name: "Acid blade",
        type: "weapon",
        system: {
            weaponCategory: "uncategorized",
            weaponType: "advancedM",
            properties: { reach: { value: true } },
            damage: { parts: [{ types: { acid: true, slashing: true } }] }
        }
    });
    assert.equal(acidBlade.style, "melee");
    assert.equal(acidBlade.impactFiles[0], "jb2a.markers.poison.dark_green.01");
    assert.equal(acidBlade.particleFiles[0], "jb2a.particles.outward.greenyellow.01");
    assert.equal(acidBlade.files[0], "jb2a.melee_attack.01.shortsword.01.0");
    assert.equal(acidBlade.scale, 1.15);

    const forceBow = mapWeaponEffect({
        name: "Apocalypse bow",
        type: "weapon",
        system: {
            weaponCategory: "uncategorized",
            weaponType: "special",
            properties: { force: { value: true } },
            damage: { parts: [{ types: { piercing: true } }] }
        }
    });
    assert.equal(forceBow.files[0], "jb2a.magic_missile.purple");
});

test("multiple energy types each get a shot", () => {
    const mixed = mapWeaponEffect({
        name: "Cryo-flame rifle",
        type: "weapon",
        system: {
            weaponCategory: "laser",
            weaponType: "longA",
            damage: { parts: [{ types: { fire: true, cold: true } }] }
        }
    });
    assert.equal(mixed.files[0], "jb2a.ray_of_frost.blue");
    assert.equal(mixed.layerFiles[0][0], "jb2a.lasershot.orange");
    assert.equal(mixed.extraCriticalParticles[0][0], "jb2a.flames.01.orange");

    const blade = mapWeaponEffect({
        name: "Frostfire blade",
        type: "weapon",
        system: {
            weaponCategory: "uncategorized",
            weaponType: "advancedM",
            damage: { parts: [{ types: { fire: true, cold: true, slashing: true } }] }
        }
    });
    assert.equal(blade.files[0], "jb2a.melee_attack.01.trail.01.blueyellow");
    assert.equal(blade.particleFiles[0], "jb2a.swirling_sparkles.01.blue");
    assert.equal(blade.extraParticleFiles[0][0], "jb2a.flames.01.orange");

    const plasma = mapWeaponEffect({
        name: "Plasma rifle",
        type: "weapon",
        system: {
            weaponCategory: "plasma",
            weaponType: "longA",
            damage: { parts: [{ types: { fire: true, electricity: true } }] }
        }
    });
    assert.equal(plasma.files[0], "jb2a.energy_beam.normal.bluepink.02");
    assert.equal(plasma.layerFiles.length, 0);
});

test("a damage-group choice uses the selected kinetic type", () => {
    const fist = {
        name: "Unarmed strike",
        type: "weapon",
        system: {
            weaponCategory: "uncategorized",
            weaponType: "basicM",
            damage: {
                parts: ["bludgeoning", "piercing", "slashing"].map((type, index) => ({
                    name: type,
                    formula: "2d6 + 4",
                    group: 1,
                    isPrimarySection: index === 0,
                    types: { [type]: true }
                }))
            }
        }
    };

    assert.equal(mapWeaponEffect(fist).files[0], "jb2a.unarmed_strike.physical.01.blue");
    assert.equal(mapWeaponEffect(fist).layerFiles.length, 0);
    assert.equal(
        mapWeaponEffect(fist, { damageTypes: new Set(["piercing"]) }).files[0],
        "jb2a.melee_generic.creature_attack.claw.001.red"
    );
    assert.equal(
        mapWeaponEffect(fist, { damageTypes: new Set(["slashing"]) }).files[0],
        "jb2a.melee_generic.slash.01.orange"
    );
    assert.equal(
        mapWeaponEffect(fist, { damageTypes: new Set(["piercing"]) }).criticalParticleFiles[0],
        "jb2a.claws.400px.red"
    );
    assert.equal(
        mapWeaponEffect(fist, { damageTypes: new Set(["slashing"]) }).criticalImpactFiles[0],
        "jb2a.impact.007.orange"
    );
    assert.equal(
        mapWeaponEffect(fist, { damageTypes: new Set(["fire"]) }).criticalImpactFiles[0],
        "jb2a.impact.007.orange"
    );

    const blade = {
        name: "Versatile blade",
        type: "weapon",
        system: {
            weaponCategory: "uncategorized",
            weaponType: "advancedM",
            damage: {
                parts: ["bludgeoning", "piercing", "slashing"].map((type) => ({
                    formula: "2d6",
                    group: 1,
                    types: { [type]: true }
                }))
            }
        }
    };
    assert.equal(
        mapWeaponEffect(blade, { damageTypes: new Set(["bludgeoning"]) }).files[0],
        "jb2a.club.melee.01.white"
    );
    assert.equal(
        mapWeaponEffect(blade, { damageTypes: new Set(["piercing"]) }).files[0],
        "jb2a.dagger.melee.02.white"
    );

    const breath = {
        name: "Elemental breath",
        type: "weapon",
        system: {
            weaponCategory: "uncategorized",
            weaponType: "special",
            properties: { blast: { value: true } },
            area: { shape: "cone" },
            damage: {
                parts: ["cold", "electricity", "fire"].map((type) => ({
                    formula: "2d6",
                    group: 1,
                    types: { [type]: true }
                }))
            }
        }
    };
    assert.equal(mapWeaponEffect(breath).files[0], "jb2a.breath_weapons.cold.cone.blue");
    assert.equal(mapWeaponEffect(breath).layerFiles.length, 0);
    assert.equal(
        mapWeaponEffect(breath, { damageTypes: new Set(["electricity"]) }).files[0],
        "jb2a.breath_weapons.lightning.line.blue"
    );

    const roll = { dice: [{ options: { damageParts: [{ types: ["piercing"], operator: "and" }] } }] };
    assert.equal(damageTypesFromRoll(roll).has("piercing"), true);
    assert.equal(damageTypesFromRoll(roll).size, 1);
    assert.equal(damageTypesFromRoll(null), null);
});

test("prepared weapon sounds follow category, element, and property", () => {
    const make = (name, category, weaponType = "longA", properties = {}, types = { piercing: true }) => ({
        name,
        type: "weapon",
        system: {
            weaponCategory: category,
            weaponType,
            properties,
            damage: { parts: [{ types }] }
        }
    });

    assert.equal(mapWeaponEffect(make("Plasma rifle", "plasma", "longA", {}, { fire: true, electricity: true })).sound, "weaponPlasma");
    assert.equal(mapWeaponEffect(make("Cryo rifle", "cryo", "longA", {}, { cold: true })).sound, "spellCold");
    assert.equal(mapWeaponEffect(make("Flame pistol", "flame", "smallA", {}, { fire: true })).sound, "spellFire");
    assert.equal(mapWeaponEffect(make("Sonic rifle", "sonic", "longA", {}, { sonic: true })).sound, "spellSonic");
    assert.equal(mapWeaponEffect(make("Disintegrator", "disintegrator", "longA", {}, { acid: true })).sound, "spellAcid");

    const shotgun = mapWeaponEffect(make("Scattergun", "projectile", "longA", {}, { piercing: true }));
    assert.equal(shotgun.sound, "weaponShotgun");

    const sniper = mapWeaponEffect(make("Sniper rifle", "projectile", "sniper", { sniper: { value: true } }, { piercing: true }));
    assert.equal(sniper.sound, "sniper");

    const railgun = mapWeaponEffect(make("Railgun", "uncategorized", "longA", {}, { piercing: true }));
    assert.equal(railgun.sound, "railgun");
    assert.equal(railgun.impactSound, "explosionCannon");

    const missile = mapWeaponEffect(make("Missile launcher", "uncategorized", "longA", {}, { piercing: true }));
    assert.equal(missile.sound, "missileLaunch");
    assert.equal(missile.impactSound, "explosionCannon");
    assert.equal(missile.impactSoundDelay, 400);

    const mine = mapWeaponEffect(make("Minelayer", "uncategorized", "longA", {}, { piercing: true }));
    assert.equal(mine.sound, "weaponMineBeep");
    assert.equal(mine.impactSound, "explosionShort");
    assert.equal(mine.impactSoundDelay, 400);

    const lightMg = mapWeaponEffect(make("Light machine gun", "projectile", "heavy", { automatic: { value: true } }, { piercing: true }));
    assert.equal(lightMg.sound, "weaponMachinegun");
    const heavyMg = mapWeaponEffect(make("Squad machine gun", "projectile", "heavy", { automatic: { value: true } }, { piercing: true }));
    assert.equal(heavyMg.sound, "weaponMachinegunHeavy");

    const healing = mapWeaponEffect(make("Locus Beam, harmonic", "uncategorized", "smallA", { healing: { value: true } }, { healing: true }));
    assert.equal(healing.sound, "spellHeal");
});

test("database fallback uses the first installed JB2A path", () => {
    const files = ["jb2a.lasershot.blue", "jb2a.energy_beam.normal.blue.01"];
    const installed = new Set(["jb2a.energy_beam.normal.blue.01"]);
    assert.equal(pickExistingFile(files, (file) => installed.has(file)), "jb2a.energy_beam.normal.blue.01");
    assert.equal(pickExistingFile(files, () => false), null);
    assert.equal(pickExistingFile(null, () => true), null);
});

test("critical hits scale the effect by 25 percent", () => {
    assert.equal(playbackScale({ base: 1, setting: 1, isCritical: false }), 1);
    assert.equal(playbackScale({ base: 1, setting: 1, isCritical: true }), 1.25);
    assert.equal(playbackScale({ base: 1.8, setting: 2, isCritical: true }), 4.5);
});
