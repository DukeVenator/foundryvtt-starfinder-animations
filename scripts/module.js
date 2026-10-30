import { bindHooks, checkDependencies, preloadEffects, preview, stopAll } from "./player.js";
import { registerSettings } from "./settings.js";
import { MODULE_ID } from "./constants.js";

Hooks.once("init", () => {
    registerSettings();
});

Hooks.once("ready", () => {
    checkDependencies();
    bindHooks();
    const module = game.modules.get(MODULE_ID);
    if (module) {
        module.api = {
            preview,
            stopAll,
            preload: preloadEffects,
            version: module.version
        };
    }
    preloadEffects();
});

Hooks.on("chatMessage", (chatLog, message) => {
    const match = /^\/fx\s+preview\s+(.+)$/i.exec(String(message ?? "").trim());
    if (!match) return true;
    preview(match[1].trim()).catch((error) => console.error(`${MODULE_ID} | Preview failed`, error));
    return false;
});
