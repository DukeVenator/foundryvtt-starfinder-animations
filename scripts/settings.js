import { MODULE_ID } from "./constants.js";

export const PRIVACY_MODES = ["restrict", "skip", "ignore"];
export const INTENSITY_MODES = ["low", "normal", "high"];

/** Clamp a numeric setting, falling back when the value is not a finite number. */
export function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
}

function setting(key, fallback) {
    try {
        const value = game.settings.get(MODULE_ID, key);
        return value === undefined ? fallback : value;
    } catch (error) {
        return fallback;
    }
}

export function worldScale() {
    return clampNumber(setting("scale", 1), 0.5, 2, 1);
}

export function clientScale() {
    return clampNumber(setting("clientScale", 1), 0.5, 2, 1);
}

/** The scale actually applied to effects: world setting times the player's own multiplier. */
export function effectiveScale() {
    return clampNumber(worldScale() * clientScale(), 0.1, 4, 1);
}

export function worldVolume() {
    return clampNumber(setting("volume", 0.5), 0, 1, 0.5);
}

export function clientVolume() {
    return clampNumber(setting("clientVolume", 1), 0, 1, 1);
}

export function effectiveVolume() {
    return clampNumber(worldVolume() * clientVolume(), 0, 1, 0.5);
}

export function effectsEnabled() {
    return Boolean(setting("enabled", true) && setting("clientEnabled", true));
}

export function soundsEnabled() {
    return Boolean(setting("enableSounds", true) && setting("clientSounds", true));
}

export function privacyMode() {
    const mode = setting("privacyMode", "restrict");
    return PRIVACY_MODES.includes(mode) ? mode : "restrict";
}

export function intensity() {
    const mode = setting("intensity", "normal");
    return INTENSITY_MODES.includes(mode) ? mode : "normal";
}

/**
 * How many volley shots and particles to build. Single attacks stay the same.
 * The profile mostly affects criticals and multi-target playback.
 */
export function intensityProfile() {
    switch (intensity()) {
        case "low":
            return { volley: 3, particles: 2, extraLayers: false };
        case "high":
            return { volley: 8, particles: 6, extraLayers: true };
        default:
            return { volley: 6, particles: 4, extraLayers: true };
    }
}

export function onlyMyRolls() {
    return Boolean(setting("onlyMyRolls", false));
}

export function notifySkips() {
    return Boolean(setting("notifySkips", false));
}

export function preloadEnabled() {
    return Boolean(setting("preload", false));
}

export function registerSettings() {
    game.settings.register(MODULE_ID, "enabled", {
        name: "SFRPGWEAPONFX.EnableName",
        hint: "SFRPGWEAPONFX.EnableHint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register(MODULE_ID, "scale", {
        name: "SFRPGWEAPONFX.ScaleName",
        hint: "SFRPGWEAPONFX.ScaleHint",
        scope: "world",
        config: true,
        type: Number,
        default: 1,
        range: { min: 0.5, max: 2, step: 0.05 }
    });

    game.settings.register(MODULE_ID, "enableSounds", {
        name: "SFRPGWEAPONFX.EnableSoundsName",
        hint: "SFRPGWEAPONFX.EnableSoundsHint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register(MODULE_ID, "volume", {
        name: "SFRPGWEAPONFX.VolumeName",
        hint: "SFRPGWEAPONFX.VolumeHint",
        scope: "world",
        config: true,
        type: Number,
        default: 0.5,
        range: { min: 0, max: 1, step: 0.05 }
    });

    game.settings.register(MODULE_ID, "privacyMode", {
        name: "SFRPGWEAPONFX.PrivacyName",
        hint: "SFRPGWEAPONFX.PrivacyHint",
        scope: "world",
        config: true,
        type: String,
        default: "restrict",
        choices: {
            restrict: "SFRPGWEAPONFX.PrivacyRestrict",
            skip: "SFRPGWEAPONFX.PrivacySkip",
            ignore: "SFRPGWEAPONFX.PrivacyIgnore"
        }
    });

    game.settings.register(MODULE_ID, "clientEnabled", {
        name: "SFRPGWEAPONFX.ClientEnableName",
        hint: "SFRPGWEAPONFX.ClientEnableHint",
        scope: "client",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register(MODULE_ID, "clientScale", {
        name: "SFRPGWEAPONFX.ClientScaleName",
        hint: "SFRPGWEAPONFX.ClientScaleHint",
        scope: "client",
        config: true,
        type: Number,
        default: 1,
        range: { min: 0.5, max: 2, step: 0.05 }
    });

    game.settings.register(MODULE_ID, "clientVolume", {
        name: "SFRPGWEAPONFX.ClientVolumeName",
        hint: "SFRPGWEAPONFX.ClientVolumeHint",
        scope: "client",
        config: true,
        type: Number,
        default: 1,
        range: { min: 0, max: 1, step: 0.05 }
    });

    game.settings.register(MODULE_ID, "clientSounds", {
        name: "SFRPGWEAPONFX.ClientSoundsName",
        hint: "SFRPGWEAPONFX.ClientSoundsHint",
        scope: "client",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register(MODULE_ID, "intensity", {
        name: "SFRPGWEAPONFX.IntensityName",
        hint: "SFRPGWEAPONFX.IntensityHint",
        scope: "client",
        config: true,
        type: String,
        default: "normal",
        choices: {
            low: "SFRPGWEAPONFX.IntensityLow",
            normal: "SFRPGWEAPONFX.IntensityNormal",
            high: "SFRPGWEAPONFX.IntensityHigh"
        }
    });

    game.settings.register(MODULE_ID, "onlyMyRolls", {
        name: "SFRPGWEAPONFX.OnlyMyRollsName",
        hint: "SFRPGWEAPONFX.OnlyMyRollsHint",
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });

    game.settings.register(MODULE_ID, "notifySkips", {
        name: "SFRPGWEAPONFX.NotifySkipsName",
        hint: "SFRPGWEAPONFX.NotifySkipsHint",
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });

    game.settings.register(MODULE_ID, "preload", {
        name: "SFRPGWEAPONFX.PreloadName",
        hint: "SFRPGWEAPONFX.PreloadHint",
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });

    game.settings.register(MODULE_ID, "debug", {
        name: "SFRPGWEAPONFX.DebugName",
        hint: "SFRPGWEAPONFX.DebugHint",
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });
}
