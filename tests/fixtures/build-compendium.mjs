import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const systemDir = path.resolve(process.env.SFRPG_SYSTEM_DIR ?? path.join(root, "..", "foundryvtt-sfrpg"));

const spellsDir = path.join(systemDir, "src", "items", "spells");
const equipmentDir = path.join(systemDir, "src", "items", "equipment");

if (!fs.existsSync(spellsDir) || !fs.existsSync(equipmentDir)) {
    console.error(`Could not find Starfinder item data at ${systemDir}`);
    console.error("Set SFRPG_SYSTEM_DIR to the foundryvtt-sfrpg checkout.");
    process.exit(1);
}

function readItems(directory) {
    return fs.readdirSync(directory)
        .filter((file) => file.endsWith(".json"))
        .sort()
        .map((file) => JSON.parse(fs.readFileSync(path.join(directory, file), "utf8")));
}

function slim(item) {
    return {
        name: item.name,
        type: item.type,
        system: item.system
    };
}

const spells = readItems(spellsDir).map(slim);
const weapons = readItems(equipmentDir)
    .filter((item) => item.type === "weapon")
    .map(slim);

const output = path.join(here, "compendium.json.gz");
const payload = JSON.stringify({ spells, weapons });
fs.writeFileSync(output, zlib.gzipSync(payload, { level: 9 }));

console.log(`Wrote ${output}`);
console.log(`Spells: ${spells.length}`);
console.log(`Weapons: ${weapons.length}`);
