export const MODULE_ID = "sfrpg-weapon-fx";

/** Either pack registers the same `jb2a.*` database paths. */
export const JB2A_MODULE_IDS = ["jb2a_patreon", "JB2A_DnD5e"];

export const BURST_REPEATS = 3;
export const BURST_DELAY_MS = 110;
/** A light machine-gun recording contains three reports at roughly 300 ms. */
export const AUTOMATIC_REPEATS = 3;
export const AUTOMATIC_DELAY_MS = 300;
/** The heavy recording is one continuous 1.2 s burst, so the visual is denser. */
export const HEAVY_AUTOMATIC_REPEATS = 6;
export const HEAVY_AUTOMATIC_DELAY_MS = 160;
export const GRENADE_IMPACT_DELAY_MS = 400;
export const SMOKE_DURATION_MS = 5000;
export const CRITICAL_SCALE = 1.25;
export const CRITICAL_VOLLEY = 6;
export const CRITICAL_PARTICLE_COUNT = 4;
export const CRITICAL_SCATTER = 0.45;

export const MELEE_WEAPON_TYPES = new Set(["basicM", "advancedM", "solarian"]);
