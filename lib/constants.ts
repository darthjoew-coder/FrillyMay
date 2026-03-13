export const GESTATION_DAYS: Record<string, number> = {
  cattle: 283,
  pig: 114,
  sheep: 147,
  goat: 150,
  horse: 340,
  rabbit: 31,
  alpaca: 345,
  chicken: 21,
  duck: 28,
  turkey: 28,
}

export const SPECIES_OPTIONS = [
  'cattle', 'pig', 'sheep', 'goat', 'chicken',
  'duck', 'turkey', 'rabbit', 'horse', 'alpaca', 'other',
]

export const SPECIES_EMOJI: Record<string, string> = {
  cattle: '🐄', pig: '🐷', sheep: '🐑', goat: '🐐',
  chicken: '🐔', duck: '🦆', turkey: '🦃', rabbit: '🐇',
  horse: '🐴', alpaca: '🦙', other: '🐾',
}

export const FEED_TYPES = [
  'hay', 'grain', 'pellets', 'silage', 'pasture',
  'supplement', 'mineral', 'scratch', 'mash', 'mixed', 'other',
]

export const HEALTH_TYPES = [
  'vaccination', 'medication', 'vet_visit', 'injury',
  'illness', 'deworming', 'weight_check', 'hoof_care', 'other',
]

export const BREEDING_METHODS = ['natural', 'ai', 'embryo_transfer', 'unknown']

export const BREEDING_STATUSES = [
  'pending', 'confirmed_pregnant', 'not_pregnant', 'delivered', 'lost',
]

export const ANIMAL_STATUSES = ['active', 'sold', 'deceased']

export const SEX_OPTIONS = ['male', 'female', 'unknown']

export const WATER_ACCESS_OPTIONS = [
  'fresh_provided', 'trough_checked', 'automatic', 'limited', 'none',
]

export const FEEDING_TIME_OPTIONS = [
  'morning', 'midday', 'evening', 'free_choice', 'other',
]

export const UNIT_OPTIONS = ['kg', 'lbs', 'flakes', 'scoops', 'cups', 'bales', 'liters']

export const SCHEDULE_FREQUENCIES = ['daily', 'twice_daily', 'weekly', 'as_needed']
