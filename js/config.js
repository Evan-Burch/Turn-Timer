export const PHASES = [
  'Storm',
  'Spice Blow and Nexus',
  'CHOAM Charity',
  'Bidding',
  'Revival',
  'Shipping and Movement',
  'Battle',
  'Spice Collection',
  'Mentat Pause'
];

export const MAX_TURNS = 10;

export const PHASE_LIMITS_MS = [
  1.5 * 60 * 1000, // Storm
  3.5 * 60 * 1000, // Spice Blow and Nexus
  30 * 1000, // CHOAM Charity
  11 * 60 * 1000, // Bidding
  2 * 60 * 1000, // Revival
  18 * 60 * 1000, // Shipping and Movement
  6.5 * 60 * 1000, // Battle
  30 * 1000, // Spice Collection
  30 * 1000 // Mentat Pause
];

export const TURN_LIMIT_MS = 45 * 60 * 1000;
