# In-app products (Play Console > Monetize > Products > In-app products / One-time products)
All are **one-time, non-consumable** managed products. IDs must match js/store/catalog.js exactly. Prices in USD; let Play auto-convert other countries.

| Product ID | Price | Title | Description |
|---|---|---|---|
| premium_unlock | $2.99 | Fidget Premium | Special effects on every toy (confetti, glow trails, RGB light, glitter), screen shake, rainbow sand and premium themes. |
| pop_pack_liquidmetal | $0.99 | Pop: Liquid Metal | Mercury bubbles that burst into chrome droplets with a metallic ping. |
| pop_pack_neonjelly | $0.99 | Pop: Neon Jelly | Glowing jelly bubbles with neon shock-rings and a springy boing. |
| pop_pack_lava | $0.99 | Pop: Lava | Molten bubbles that spit embers and smoke with a sizzle. |
| spin_plasma | $0.99 | Spin: Plasma | A glowing plasma core that throws lightning arcs as it spins. |
| spin_obsidian | $0.99 | Spin: Obsidian | Dark volcanic glass with glowing ember discs that shed sparks. |
| spin_aurora | $0.99 | Spin: Aurora | Pearl spinner trailing northern-lights ribbons and a shimmer tone. |
| click_crystal | $0.99 | Click: Crystal Keys | Quartz keycaps with refracting rainbow light and glass-chime presses. |
| click_holo | $0.99 | Click: Holo Glitch | Scanline holo caps with digital glitch bursts and synth blips. |
| click_walnut | $0.99 | Click: Walnut & Brass | Walnut caps, deep wooden thock and drifting sawdust. |
| sand_galaxy | $0.99 | Sand: Galaxy | Starfield sand with nebula dust and planet & star molds. |
| sand_glowtide | $0.99 | Sand: Glow Tide | Bioluminescent sand whose cuts glow and fade like a night tide. |
| sand_goldrush | $0.99 | Sand: Gold Rush | Glittering gold sand with sparkle, gold-flake crumbles and star molds. |

Upgrades work without Premium (each is its own purchase). Premium adds a free bonus look (Rainbow Sand).
Upgrades are purely cosmetic (same physics), so leaderboard scores are never pay-to-win.

## Cube tiers (code-ready, hidden until created in Play — `V2_PRODUCTS=false` in js/store/catalog2.js)
Same structure as Pop/Spin/Click: Classic (free) + 3 tiers at $0.99, each with its own look, sound and particle effect, an animated card in the shop's **Cube** tab, and a free 8-second "Try" of that exact tier. Premium includes all three. Retired Sand owners get the matching tier free (Galaxy→RGB, Gold Rush→Brass, Glow Tide→Frost).

| Product ID | Price | Title | Description |
|---|---|---|---|
| upgrade_cube | $0.99 | Cube: RGB | A colour-cycling cube with a neon edge glow, synth blips and spark bursts on every press. |
| cube_brass | $0.99 | Cube: Steampunk Brass | Polished brass panels and rivets, enamel buttons, a bell-like ting, gold flakes and steam puffs. |
| cube_frost | $0.99 | Cube: Frost | A see-through ice cube with frosted panels, glassy chimes, ice shards and drifting snowflakes. |

**play-ack allowlist — IDs still to add (then redeploy):** `upgrade_cube`, `cube_brass`, `cube_frost`.
