import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { SOUND_FILES } from "../scripts/catalog.js";

const audioDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "audio");

test("every sound key points at a bundled, non-empty file", () => {
    for (const [key, file] of Object.entries(SOUND_FILES)) {
        const full = path.join(audioDir, file);
        assert.ok(fs.existsSync(full), `${key} -> ${file} is missing`);
        assert.ok(fs.statSync(full).size > 1000, `${key} -> ${file} is empty`);
    }
});
