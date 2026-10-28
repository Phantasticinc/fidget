// v2 toy upgrades. HIDDEN until the matching one-time products exist in Play Console (see play-upload/products-v2.csv).
// To launch: create the products in Play with these exact IDs, then set V2_PRODUCTS = true (catalog.js merges them, the shop lists them).
// Premium already includes every one of these looks; an upgrade unlocks the rich look on just that toy.
export const V2_PRODUCTS = false;
export const CATALOG_V2 = [
  { id: 'upgrade_popit', toy: 'popit', price: '$0.99', title: 'Pop It: Neon Rave', desc: 'Hue-shifting neon silicone with glowing domes, light rings and a confetti flip.' },
  { id: 'upgrade_slime', toy: 'slime', price: '$0.99', title: 'Slime: Holo Glitter', desc: 'Iridescent colour-shifting slime packed with twinkling glitter and sparkle trails.' },
  { id: 'upgrade_squish', toy: 'squish', price: '$0.99', title: 'Squish: Galaxy Gel', desc: 'A translucent gel ball with glowing beads that swirl away from your fingers.' },
  { id: 'upgrade_cube', toy: 'cube', price: '$0.99', title: 'Cube: RGB', desc: 'A colour-cycling cube with an RGB edge glow and spark bursts on every click.' },
  { id: 'upgrade_switch', toy: 'switch', price: '$0.99', title: 'Switch: Party Lights', desc: 'Colour-changing lamps, light rings and a confetti finale when every switch is on.' },
];
