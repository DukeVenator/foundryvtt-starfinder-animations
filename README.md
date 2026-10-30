# Starfinder Weapon FX

I started this for my own Starfinder table. I wanted combat to feel more like a firefight, and I couldn't find a module that handled Starfinder's weapons at the time. It's grown over the last few months as my players kept swapping weapons and I kept adding cases for whatever they brought.

It plays a JB2A animation and a sound when someone rolls weapon damage or casts a spell. Pick a target, roll, and the table sees the hit.

**This is an early beta.** It runs on the experimental V14 Starfinder system, so expect bugs and breaking changes.

![Foundry VTT v14](https://img.shields.io/badge/Foundry_VTT-v14-e8a33d?style=flat-square)
![Starfinder system](https://img.shields.io/badge/System-Starfinder-2f6db3?style=flat-square)
![Requires Sequencer](https://img.shields.io/badge/Requires-Sequencer-6f42c1?style=flat-square)
![Requires JB2A](https://img.shields.io/badge/Requires-JB2A-d73a49?style=flat-square)

## What you need

Foundry VTT 14, the Starfinder system 14.0.0 or newer, Sequencer 4.0.0 or newer, and JB2A. The free JB2A pack is enough to start; the Patreon pack adds more clips. Sequencer and JB2A do the animation work, and neither is bundled here.

## Install

Install Sequencer and JB2A from Foundry's Add-on Modules tab.

Then paste this into the Manifest URL field:

```text
https://github.com/DukeVenator/foundryvtt-starfinder-animations/releases/latest/download/module.json
```

Enable Sequencer, JB2A, and Starfinder Weapon FX in your world, then reload.

## At the table

Select a target and roll **Damage**. If the weapon has no damage, like a smoke grenade, roll **Attack** instead. The chat card handles the rest.

A few things that might catch you out:

- With no target selected, weapons stay quiet. Self spells still play on the caster.
- The actor sheet, macros, and the "roll damage with attack" setting all trigger effects.
- Closing the roll dialog cancels the effect.
- Starship and vehicle attacks are ignored.
- Private cards can keep their effects to the card's audience with the privacy setting.

## Weapons

Lasers get a beam in the weapon's damage color; compendium lasers deal fire, so most of them come out orange. Projectiles get blaster shots, and automatic weapons burst. Grenades get a throw and an explosion, while smoke grenades leave a cloud. Melee gets a swipe, with a colored trail for fire, cold, electricity, or plasma.

Solarian weapons use a laser sword. An unarmed strike punches, and if the damage dialog offers piercing or slashing it claws or slashes instead. Line weapons stretch a beam to each target.

A lot of the odd cases came from my table. The frost-and-flame rifle is why criticals alternate elements. Smoke grenades were annoying because they have no damage roll at all.

## Spells

Casting a spell plays an effect on the caster, then a bolt, burst, cone, wall, or shimmer when the spell resolves. Attack spells wait for the Attack button, damage spells wait for Damage, and utility spells play when the card is posted.

Magic Missile fires three missiles. Self spells like Invisibility shimmer on the caster. Area spells burst on the target, walls land on the target or the caster, and anything without a specific match gets a school-themed palette so two spells from the same school don't look identical.

## Criticals

Critical damage becomes a volley. Six shots leave together by default, three on Low intensity and eight on High. They spread across the target, and the impact particles wait for the first one to land. A second damage type joins in, which is where the frost-and-flame rifle alternates cold and fire.

## Settings

The world settings are the master switches: effects, scale, sound, volume, and private-card privacy. Each player also has their own switches for effects, scale, volume, sounds, intensity, and only animating their own rolls. The defaults are fine for most tables; the client options are there when someone wants things quieter or off.

There's a debug toggle if you need to see why an effect was skipped.

## Preview

`/fx preview Laser Rifle`

For macros, the module exposes an API once the world is ready:

```js
const api = game.modules.get("sfrpg-weapon-fx").api;
await api.preview("Laser Rifle");
await api.preview("Magic Missile", { tokenId: "token-id" });
api.stopAll();
```

`preview()` uses your controlled token and current targets by default. It also accepts an item UUID or an item object.

If you want to override one item, the effect can be changed with `flags["sfrpg-weapon-fx"]`. That's how I test new weapons without touching the mapper.

## If something doesn't play

- Check that Sequencer and JB2A are installed and enabled.
- Make sure the actor has a token on the current scene and a target is selected, unless it's a self spell.
- If other players can't see it, check their client settings and the private-card setting.
- If sound is missing, check the world and client volume, then Foundry's environment volume. Smoke and some stealth or fear effects are silent on purpose.
- If the art looks wrong, the JB2A pack may not have that clip. The module logs it once and tries a fallback. Turn on Debug logging and search for `sfrpg-weapon-fx |`.

## Feedback

Open an issue if something breaks, or if you want an effect for a specific weapon or spell. I want to keep improving this as time goes on, and I'm happy to add cases when I can. Telling me the item name and what you'd expect it to look like helps a lot.

[Open an issue](https://github.com/DukeVenator/foundryvtt-starfinder-animations/issues)

## Credits

JB2A supplies the animations, Sequencer plays them, and both keep their own licenses. The animations aren't bundled with this module.

Sound sources and licenses are in [CREDITS.md](CREDITS.md). `brawl.mp3` is CC BY 3.0 by CastIronCarousel.

Thanks to my players for trying new weapons just to see what would happen.

Not affiliated with Paizo or Foundry Gaming LLC.

## Development

`npm test` runs without Foundry. `npm run fixtures` rebuilds the compendium snapshot from a local Starfinder checkout, or from `SFRPG_SYSTEM_DIR`.
