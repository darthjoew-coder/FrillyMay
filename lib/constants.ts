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

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
]

export const PRODUCT_LINES = [
  { value: 'beef', label: '🥩 Beef' },
  { value: 'eggs', label: '🥚 Eggs' },
  { value: 'general', label: '🌾 General Farm' },
]

export const SALE_PRODUCT_TYPES = [
  { value: 'beef', label: '🥩 Beef' },
  { value: 'eggs', label: '🥚 Eggs' },
  { value: 'other', label: '🌾 Other Farm Product' },
]

export const EXPENSE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'finalized', label: 'Finalized' },
]

// Fiscal year starts in January (month 1) by default. Change this to adjust all reporting.
export const FISCAL_YEAR_START_MONTH = 1 // 1 = January

export const CUSTOMER_TAGS = [
  { value: 'retail', label: 'Retail' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'family', label: 'Family/Friend' },
  { value: 'other', label: 'Other' },
]

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Feed', type: 'expense', scheduleFBucket: 'Feed purchased (Line 12)', sortOrder: 1 },
  { name: 'Livestock Purchases', type: 'expense', scheduleFBucket: 'Livestock purchased for resale (Line 32)', sortOrder: 2 },
  { name: 'Veterinary & Medicine', type: 'expense', scheduleFBucket: 'Veterinary, breeding, and medicine (Line 19)', sortOrder: 3 },
  { name: 'Breeding', type: 'expense', scheduleFBucket: 'Veterinary, breeding, and medicine (Line 19)', sortOrder: 4 },
  { name: 'Bedding & Litter', type: 'expense', scheduleFBucket: 'Supplies purchased (Line 16)', sortOrder: 5 },
  { name: 'Supplies', type: 'expense', scheduleFBucket: 'Supplies purchased (Line 16)', sortOrder: 6 },
  { name: 'Fuel & Oil', type: 'expense', scheduleFBucket: 'Gas, fuel, and oil (Line 9)', sortOrder: 7 },
  { name: 'Repairs & Maintenance', type: 'expense', scheduleFBucket: 'Repairs and maintenance (Line 21)', sortOrder: 8 },
  { name: 'Small Tools & Equipment', type: 'expense', scheduleFBucket: 'Other expenses (Line 24)', sortOrder: 9 },
  { name: 'Utilities', type: 'expense', scheduleFBucket: 'Utilities (Line 18)', sortOrder: 10 },
  { name: 'Insurance', type: 'expense', scheduleFBucket: 'Insurance (other than health) (Line 10)', sortOrder: 11 },
  { name: 'Labor & Contract Labor', type: 'expense', scheduleFBucket: 'Labor hired (Line 22)', sortOrder: 12 },
  { name: 'Trucking & Hauling', type: 'expense', scheduleFBucket: 'Other expenses (Line 24)', sortOrder: 13 },
  { name: 'Marketing & Advertising', type: 'expense', scheduleFBucket: 'Other expenses (Line 24)', sortOrder: 14 },
  { name: 'Rent & Lease', type: 'expense', scheduleFBucket: 'Rent or lease (Line 14)', sortOrder: 15 },
  { name: 'Property & Farm Maintenance', type: 'expense', scheduleFBucket: 'Repairs and maintenance (Line 21)', sortOrder: 16 },
  { name: 'Office & Software', type: 'expense', scheduleFBucket: 'Other expenses (Line 24)', sortOrder: 17 },
  { name: 'Professional Services', type: 'expense', scheduleFBucket: 'Other expenses (Line 24)', sortOrder: 18 },
  { name: 'Taxes & Permits', type: 'expense', scheduleFBucket: 'Taxes (Line 23)', sortOrder: 19 },
  { name: 'Depreciable Equipment', type: 'expense', scheduleFBucket: 'Depreciation and Section 179 (Line 14d)', sortOrder: 20 },
  { name: 'Other Farm Expense', type: 'expense', scheduleFBucket: 'Other expenses (Line 24)', sortOrder: 21 },
  { name: 'Beef Sales', type: 'income', scheduleFBucket: 'Sales of livestock and other items (Line 1a)', sortOrder: 1 },
  { name: 'Egg Sales', type: 'income', scheduleFBucket: 'Sales of livestock and other items (Line 1a)', sortOrder: 2 },
  { name: 'Other Farm Income', type: 'income', scheduleFBucket: 'Other farm income (Line 7)', sortOrder: 3 },
]
