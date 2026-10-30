const DEFAULTS = {
    enabled: true,
    clientEnabled: true,
    enableSounds: true,
    clientSounds: true,
    scale: 1,
    clientScale: 1,
    volume: 0.5,
    clientVolume: 1,
    intensity: "normal",
    privacyMode: "ignore",
    onlyMyRolls: false,
    notifySkips: false,
    preload: false,
    debug: false
};

function saveGlobal(name) {
    return {
        name,
        exists: Object.prototype.hasOwnProperty.call(globalThis, name),
        value: globalThis[name]
    };
}

function restoreGlobal(saved) {
    if (saved.exists) globalThis[saved.name] = saved.value;
    else delete globalThis[saved.name];
}

export function section(kind, log) {
    const api = { kind };

    function record(event) {
        return (...args) => {
            log.push({ kind, event, args, value: args[0] });
            return api;
        };
    }

    return Object.assign(api, {
        file: record("file"),
        atLocation: record("atLocation"),
        stretchTo: record("stretchTo"),
        rotateTowards: record("rotateTowards"),
        scale: record("scale"),
        scaleToObject: record("scaleToObject"),
        size: record("size"),
        repeats: record("repeats"),
        delay: record("delay"),
        fadeIn: record("fadeIn"),
        fadeOut: record("fadeOut"),
        duration: record("duration"),
        belowTokens: record("belowTokens"),
        anchor: record("anchor"),
        locally: record("locally"),
        forUsers: record("forUsers"),
        origin: record("origin"),
        tieToDocuments: record("tieToDocuments"),
        name: record("name"),
        waitUntilFinished: record("waitUntilFinished"),
        volume: record("volume"),
        audioChannel: record("audioChannel")
    });
}

export function installFoundry(log, overrides = {}) {
    const saved = ["Sequence", "Sequencer", "canvas", "ui", "game", "fromUuidSync"].map(saveGlobal);

    const source = overrides.source ?? {
        id: "source",
        scene: { id: "scene" },
        center: { x: 100, y: 100 },
        document: { rotation: 0 },
        controlled: true
    };
    const target = overrides.target ?? { id: "target", center: { x: 300, y: 100 }, document: { rotation: 0 } };
    const targets = overrides.targets ?? [target];
    const actor = { getActiveTokens: () => [source] };
    source.actor = actor;

    class FakeSequence {
        effect() { return section("effect", log); }
        sound() { return section("sound", log); }
        async play() {
            log.push({ kind: "sequence", event: "play", args: [] });
            return true;
        }
    }

    const settings = { ...DEFAULTS, ...(overrides.settings ?? {}) };
    const databaseExists = overrides.databaseExists ?? (() => true);

    globalThis.Sequence = FakeSequence;
    globalThis.Sequencer = {
        Database: { entryExists: databaseExists },
        EffectManager: { endEffects: () => true },
        Preloader: { preloadForClients: () => true }
    };
    globalThis.canvas = {
        scene: { id: "scene", grid: { units: "ft", distance: 5 } },
        grid: { size: 100 },
        tokens: { get: () => targets[0], controlled: [source] }
    };
    globalThis.ui = { notifications: { info: () => {}, warn: () => {}, error: () => {} } };
    globalThis.game = {
        user: { id: "user", targets: new Set(targets), isGM: false },
        actors: [actor],
        users: [],
        modules: new Map([
            ["sequencer", { active: true }],
            ["JB2A_DnD5e", { active: true }]
        ]),
        messages: new Map(),
        settings: { get: (_moduleId, key) => settings[key] }
    };

    return {
        actor,
        source,
        target,
        targets,
        log,
        restore: () => saved.reverse().forEach(restoreGlobal)
    };
}

export function sounds(log) {
    return log.filter((entry) => entry.kind === "sound" && entry.event === "file");
}
