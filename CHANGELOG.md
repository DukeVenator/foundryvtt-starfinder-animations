# Changelog

## 0.3.1 - 2026-10-30

- Relicensed under GPL-3.0. Ships `LICENSE` and `NOTICE`.

## 0.3.0 - 2026-10-30

First public release. Includes the 0.2.1 sound and playback changes, plus the Foundry release manifest and ZIP.

## 0.2.1 - 2026-10-30

- Weapon sounds for heavy lasers, machine guns, plasma, flame, cryo, sonic, disintegrators, snipers, shotguns, railguns, missiles, mines, and grenades.
- Spell and aura sounds for fire, cold, acid, sonic, healing, shields, summoning, walls, water, gravity, detection, and divine magic.
- Automatic fire uses one burst clip per attack. Light machine guns: 3 shots at 300 ms. Heavy and squad guns: 6 at 160 ms.
- Criticals use one primary sound and at most one impact sound.
- Grenades and mines delay the explosion to the 400 ms impact. Missiles launch immediately.
- New effect fields: `impactSound`, `soundDelay`, `impactSoundDelay`, `criticalSound`. Per-item `impactSound` override.
- Tests: 42.
- Removed the Mixkit explosion. `explosion` now uses the CC0 `explosion_short.mp3`.

## 0.2.0 - 2026-10-30

- Spell coverage from 67% to 93% (547 of 586).
- New theme groups: detection, warding, command, necromancy, transmutation, summoning/space, illusion, weapons, machines, healing, movement, weather, gravity, martial magic.
- Area handling for burst, spread, shape `other`, and formula-driven emanations.
- School palettes: ten clips each, second aura layer, name-based variation.
- Name fallbacks for the remaining compendium weapons. Generic bolts: 66 to 0.
- Privacy modes for private cards: `restrict`, `skip`, `ignore`.
- Cast cards require the creating user, `flags.sfrpg.item`, and a finite level.
- Cast level drives aura size, emanations, and formula areas.
- Per-item flags: style, files, impacts, scale, sound, belowTokens, fitToken, repeats, skip.
- Client settings, module API, and `/fx preview`.
- Tests: 33.

## 0.1.0

First release: weapon mapper, playback, spell auras, sounds, mapper tests.
