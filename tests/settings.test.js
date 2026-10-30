import assert from "node:assert/strict";
import test from "node:test";
import {
    clientScale,
    clientVolume,
    effectiveScale,
    effectiveVolume,
    effectsEnabled,
    intensity,
    intensityProfile,
    privacyMode,
    worldScale,
    worldVolume
} from "../scripts/settings.js";

function withSettings(values) {
    globalThis.game = {
        settings: {
            get: (moduleId, key) => values[key]
        }
    };
}

test("setting values are clamped and multiplied safely", () => {
    withSettings({ scale: 3, clientScale: 2, volume: 4, clientVolume: 0.25, enabled: true, clientEnabled: false });
    assert.equal(worldScale(), 2);
    assert.equal(clientScale(), 2);
    assert.equal(effectiveScale(), 4);
    assert.equal(worldVolume(), 1);
    assert.equal(clientVolume(), 0.25);
    assert.equal(effectiveVolume(), 0.25);
    assert.equal(effectsEnabled(), false);

    withSettings({ scale: "bad", clientScale: 0, volume: -1, clientVolume: "bad", enabled: true, clientEnabled: true });
    assert.equal(worldScale(), 1);
    assert.equal(effectiveScale(), 0.5);
    assert.equal(effectiveVolume(), 0);
    assert.equal(effectsEnabled(), true);
});

test("privacy and intensity fall back to safe defaults", () => {
    withSettings({ privacyMode: "nonsense", intensity: "extreme" });
    assert.equal(privacyMode(), "restrict");
    assert.equal(intensity(), "normal");
    assert.deepEqual(intensityProfile(), { volley: 6, particles: 4, extraLayers: true });

    withSettings({ privacyMode: "skip", intensity: "low" });
    assert.equal(privacyMode(), "skip");
    assert.deepEqual(intensityProfile(), { volley: 3, particles: 2, extraLayers: false });

    withSettings({ intensity: "high" });
    assert.deepEqual(intensityProfile(), { volley: 8, particles: 6, extraLayers: true });
});
