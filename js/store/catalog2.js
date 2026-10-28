// Cube looks. HIDDEN until the matching one-time products exist in Play Console (see play-upload/products-v2.csv).
// To launch: create the products in Play with these exact IDs, then set V2_PRODUCTS = true (catalog.js merges them, the shop lists them).
// Premium already includes every one of these looks; each look is its own product. Owners of a retired Sand pack get the matching cube look free (kit2.js LEGACY).
export const V2_PRODUCTS = true;
export const CATALOG_V2 = [
  { id: 'upgrade_cube', toy: 'cube', price: '$0.99', title: 'Cube: RGB', desc: 'A colour-cycling cube with a neon edge glow, synth blips and spark bursts on every press.' },
  { id: 'cube_brass', toy: 'cube', price: '$0.99', title: 'Cube: Steampunk Brass', desc: 'Polished brass panels and rivets, enamel buttons, a bell-like ting, gold flakes and steam puffs.' },
  { id: 'cube_frost', toy: 'cube', price: '$0.99', title: 'Cube: Frost', desc: 'A see-through ice cube with frosted panels, glassy chimes, ice shards and drifting snowflakes.' },
];
