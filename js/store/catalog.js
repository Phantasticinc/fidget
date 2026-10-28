// Single source of truth for in-app products. Must match the Play Console "One-time products" exactly.
import { CATALOG_V2, V2_PRODUCTS } from './catalog2.js?v=2';
export const PREMIUM = 'premium_unlock';
export const CATALOG = [
  { id: PREMIUM, price: '$2.99', title: 'Fidget Premium', desc: 'Special effects on every toy (confetti, glow trails, RGB light, glitter), screen shake, premium themes and Premium looks for the fidget cube.' },
  { id: 'pop_pack_liquidmetal', toy: 'pop', price: '$0.99', title: 'Pop: Liquid Metal', desc: 'Mercury bubbles that burst into chrome droplets with a metallic ping.' },
  { id: 'pop_pack_neonjelly', toy: 'pop', price: '$0.99', title: 'Pop: Neon Jelly', desc: 'Glowing jelly bubbles with neon shock-rings and a springy boing.' },
  { id: 'pop_pack_lava', toy: 'pop', price: '$0.99', title: 'Pop: Lava', desc: 'Molten bubbles that spit embers and smoke with a sizzle.' },
  { id: 'spin_plasma', toy: 'spin', price: '$0.99', title: 'Spin: Plasma', desc: 'A glowing plasma core that throws lightning arcs as it spins.' },
  { id: 'spin_obsidian', toy: 'spin', price: '$0.99', title: 'Spin: Obsidian', desc: 'Dark volcanic glass with glowing ember discs that shed sparks.' },
  { id: 'spin_aurora', toy: 'spin', price: '$0.99', title: 'Spin: Aurora', desc: 'Pearl spinner trailing northern-lights ribbons and a shimmer tone.' },
  { id: 'click_crystal', toy: 'click', price: '$0.99', title: 'Click: Crystal Keys', desc: 'Quartz keycaps with refracting rainbow light and glass-chime presses.' },
  { id: 'click_holo', toy: 'click', price: '$0.99', title: 'Click: Holo Glitch', desc: 'Scanline holo caps with digital glitch bursts and synth blips.' },
  { id: 'click_walnut', toy: 'click', price: '$0.99', title: 'Click: Walnut & Brass', desc: 'Walnut caps, deep wooden thock and drifting sawdust.' },
  { id: 'sand_galaxy', toy: 'sand', price: '$0.99', title: 'Sand: Galaxy', desc: 'Starfield sand with nebula dust and planet & star molds.' },
  { id: 'sand_glowtide', toy: 'sand', price: '$0.99', title: 'Sand: Glow Tide', desc: 'Bioluminescent sand whose cuts glow and fade like a night tide.' },
  { id: 'sand_goldrush', toy: 'sand', price: '$0.99', title: 'Sand: Gold Rush', desc: 'Glittering gold sand with sparkle, gold-flake crumbles and star molds.' },
];
if (V2_PRODUCTS) CATALOG.push(...CATALOG_V2);
export const byId = id => CATALOG.find(p => p.id === id);
