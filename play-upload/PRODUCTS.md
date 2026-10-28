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

## Oct 2026 lineup change (4 toys: Pop, Spin, Click, Cube)
- Sand, Pop It, Slime, Squish and Switch were removed from the app.
- sand_galaxy / sand_goldrush / sand_glowtide: KEEP ACTIVE in Play (do not delete) so purchases restore. Hidden in the shop. Owners get the equivalent cube look free: Galaxy→Cube RGB (upgrade_cube), Gold Rush→Steampunk Brass (cube_brass), Glow Tide→Frost (cube_frost).
- Hidden v2 IDs for removed toys (upgrade_popit/slime/squish/switch) are dropped. New cube IDs: see products-v2.csv. When created in Play: add them to the play-ack allowlist, redeploy, then set V2_PRODUCTS=true.
