import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const fixturePath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "fixtures",
    "compendium.json.gz"
);

const data = JSON.parse(zlib.gunzipSync(fs.readFileSync(fixturePath)).toString("utf8"));

export const spells = data.spells;
export const weapons = data.weapons;
