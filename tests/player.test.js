import assert from "node:assert/strict";
import test from "node:test";
import { audienceForMessage } from "../scripts/player.js";

function withUser(id, settings = {}) {
    globalThis.game = {
        user: { id, isGM: false },
        settings: { get: (moduleId, key) => settings[key] }
    };
}

test("card audiences follow whisper, blind, and self-only messages", (t) => {
    t.after(() => { delete globalThis.game; });
    withUser("player-1", { privacyMode: "restrict" });
    assert.equal(audienceForMessage({ author: "player-1", whisper: [], blind: false }), null);

    const whispered = audienceForMessage({ author: "player-1", whisper: ["gm-1"], blind: false });
    assert.deepEqual(whispered, { ids: ["gm-1", "player-1"], local: false, skip: false });

    const selfOnly = audienceForMessage({ author: "player-1", whisper: ["player-1"], blind: false });
    assert.deepEqual(selfOnly, { ids: ["player-1"], local: true, skip: false });

    const blind = audienceForMessage({ author: "player-1", whisper: [], blind: true });
    assert.deepEqual(blind, { ids: ["player-1"], local: true, skip: false });

    const otherBlind = audienceForMessage({ author: "player-2", whisper: [], blind: true });
    assert.equal(otherBlind.local, false);
});

test("skip mode refuses cards the player cannot see", (t) => {
    t.after(() => { delete globalThis.game; });
    withUser("player-1", { privacyMode: "skip" });
    const whisper = audienceForMessage({ author: "player-2", whisper: ["gm-1"], blind: false });
    assert.equal(whisper.skip, true);

    withUser("player-1", { privacyMode: "ignore" });
    assert.equal(audienceForMessage({ author: "player-2", whisper: ["gm-1"] }), null);
});
