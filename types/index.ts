export type Species =
  | 'cattle' | 'pig' | 'sheep' | 'goat' | 'chicken'
  | 'duck' | 'turkey' | 'rabbit' | 'horse' | 'alpaca' | 'other'

export type AnimalStatus = 'active' | 'sold' | 'deceased' | 'butchered' | 'culled'
export type Sex = 'male' | 'female' | 'unknown'

/**
 * IRS Schedule F livestock classification.
 * See models/Animal.ts for full documentation of each value.
 */
export type AnimalClassification =
  | 'resale_inventory'
  | 'raised_for_sale'
  | 'breeding_dairy'
  | 'draft_work'
  | 'other'
  | 'review_needed'

export type AcquisitionMethod = 'purchased' | 'born_on_farm' | 'transferred' | 'other'

export type HealthType =
  | 'vaccination' | 'medication' | 'vet_visit' | 'injury'
  | 'illness' | 'deworming' | 'weight_check' | 'hoof_care' | 'other'

export type FeedType =
  | 'hay' | 'grain' | 'pellets' | 'silage' | 'pasture'
  | 'supplement' | 'mineral' | 'scratch' | 'mash' | 'mixed' | 'other'

export type BreedingMethod = 'natural' | 'ai' | 'embryo_transfer' | 'unknown'

export type BreedingStatus =
  | 'pending' | 'confirmed_pregnant' | 'not_pregnant' | 'delivered' | 'lost'

export interface IAnimal {
  _id: string
  tagId: string
  name?: string
  species: Species
  breed?: string
  sex: Sex
  dateOfBirth?: string
  acquisitionDate?: string
  acquisitionSource?: string
  acquisitionMethod: AcquisitionMethod
  classification: AnimalClassification
  intendedUse?: string
  currentWeight?: number
  status: AnimalStatus
  statusDate?: string
  statusNotes?: string
  location?: string
  color?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface IHealthRecord {
  _id: string
  animalId: string
  animal?: Pick<IAnimal, '_id' | 'tagId' | 'name' | 'species'>
  date: string
  type: HealthType
  title: string
  description?: string
  medication?: string
  dosage?: string
  administeredBy?: string
  cost?: number
  nextDueDate?: string
  weight?: number
  temperature?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface IFeedingRecord {
  _id: string
  animalId?: string
  animal?: Pick<IAnimal, '_id' | 'tagId' | 'name' | 'species'>
  groupName?: string
  date: string
  feedType: FeedType
  feedBrand?: string
  quantity?: number
  unit?: string
  feedingTime?: string
  waterAccess?: string
  waterNotes?: string
  isScheduleTemplate?: boolean
  scheduleFrequency?: string
  cost?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface IBreedingEvent {
  _id: string
  damId: string
  dam?: Pick<IAnimal, '_id' | 'tagId' | 'name' | 'species'>
  sireId?: string
  sire?: Pick<IAnimal, '_id' | 'tagId' | 'name'>
  sireExternal?: string
  breedingDate: string
  method: BreedingMethod
  species: string
  expectedDueDate?: string
  gestationDays?: number
  status: BreedingStatus
  confirmationDate?: string
  confirmationMethod?: string
  actualDeliveryDate?: string
  offspringCount?: number
  offspringIds?: string[]
  offspringNotes?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface IDashboardStats {
  totalAnimals: number
  activeAnimals: number
  speciesBreakdown: { species: string; count: number }[]
  recentHealthEvents: IHealthRecord[]
  upcomingTreatments: IHealthRecord[]
  activePregnancies: IBreedingEvent[]
  feedingScheduleCount: number
}

export interface ApiResponse<T> {
  data: T
  total?: number
  page?: number
}

export interface ApiError {
  error: string
}

export type PaymentMethod = 'cash' | 'check' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'other'
export type ProductLine = 'beef' | 'eggs' | 'general'
export type ExpenseCategoryType = 'expense' | 'income'
export type ExpenseStatus = 'draft' | 'finalized'
export type SaleProductType = 'beef' | 'eggs' | 'other'

export interface IExpenseCategory {
  _id: string
  name: string
  type: ExpenseCategoryType
  scheduleFBucket: string
  active: boolean
  sortOrder: number
  capitalizable: boolean
  createdAt: string
  updatedAt: string
}

export type AssetCategory =
  | 'machinery_equipment'
  | 'building_structure'
  | 'land_improvement'
  | 'breeding_dairy_livestock'
  | 'orchard_vineyard'
  | 'vehicle'
  | 'other'

export type DepreciationMethod =
  | 'macrs'
  | 'straight_line'
  | 'section_179'
  | 'bonus'
  | 'not_depreciable'

export type AssetStatus = 'active' | 'disposed' | 'fully_depreciated'

export interface IFarmAsset {
  _id: string
  name: string
  description?: string
  assetCategory: AssetCategory
  placedInServiceDate: string
  acquisitionCost: number
  freightInstallation: number
  otherBasisCosts: number
  costBasis: number
  salvageValue: number
  usefulLifeYears: number
  depreciationMethod: DepreciationMethod
  section179Amount: number
  bonusDepreciationPct: number
  status: AssetStatus
  disposalDate?: string
  disposalAmount?: number
  vendor?: string
  serialNumber?: string
  location?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface IAssetDepreciation {
  _id: string
  assetId: string
  asset?: Pick<IFarmAsset, '_id' | 'name' | 'assetCategory'>
  taxYear: number
  depreciationAmount: number
  method: string
  basisAtStartOfYear: number
  accumulatedDepreciation: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface IExpense {
  _id: string
  date: string
  vendor: string
  amount: number
  categoryId: string
  category?: Pick<IExpenseCategory, '_id' | 'name' | 'scheduleFBucket'>
  subcategory?: string
  paymentMethod: PaymentMethod
  description?: string
  notes?: string
  productLine: ProductLine
  taxYear: number
  status: ExpenseStatus
  receiptCount?: number
  createdAt: string
  updatedAt: string
}

export interface IReceipt {
  _id: string
  expenseId: string
  source: 'web' | 'mobile'
  fileName: string
  imageMimeType: string
  imageSize: number
  // mobile-only fields
  merchantName?: string
  receiptDate?: string
  totalAmount?: number
  status?: string
  uploadedAt: string
}

export type CustomerTag = 'retail' | 'wholesale' | 'restaurant' | 'family' | 'other'

export interface ICustomer {
  _id: string
  firstName: string
  lastName: string
  businessName?: string
  displayName: string
  email?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  zip?: string
  tags?: CustomerTag[]
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ICustomerSummary {
  lifetimeTotal: number
  ytdTotal: number
  orderCount: number
  avgSale: number
  lastSaleDate?: string
}

export interface ISale {
  _id: string
  date: string
  productType: SaleProductType
  quantity?: number
  unit?: string
  unitPrice?: number
  totalAmount: number
  customerId?: string
  customer?: Pick<ICustomer, '_id' | 'displayName'>
  customerName?: string
  paymentMethod: PaymentMethod
  referenceNumber?: string
  notes?: string
  taxYear: number
  createdAt: string
  updatedAt: string
}

/** Individual animal sale record – drives Schedule F Lines 1 and 2 */
export interface IAnimalPurchase {
  _id: string
  animalId: string
  purchaseDate: string
  purchasePrice: number
  truckingCost: number
  otherCosts: number
  costBasis: number
  sellerName?: string
  referenceNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type AnimalSaleType = 'auction' | 'private' | 'other'

export interface IAnimalSale {
  _id: string
  animalId: string
  animal?: Pick<IAnimal, '_id' | 'tagId' | 'name' | 'species' | 'classification'>
  saleDate: string
  taxYear: number
  saleAmount: number
  costBasis: number
  classificationAtSale: AnimalClassification
  buyerName?: string
  saleType?: AnimalSaleType
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface IDashboardTiles {
  monthlyTotals: { month: number; label: string; total: number }[]
  salesByProduct: { productType: string; total: number; quantity: number | null }[]
  topCustomers: { customerId: string; displayName: string; total: number; count: number }[]
}

export interface ILivestockScheduleF {
  /** Schedule F Line 1a – gross sales of purchased livestock (resale_inventory) */
  line1a: number
  /** Schedule F Line 1b – cost basis of purchased livestock sold this year */
  line1b: number
  /** Schedule F Line 1 net (1a − 1b) */
  line1Net: number
  /** Schedule F Line 2 – gross sales of raised livestock */
  line2: number
  /** Animals excluded from Schedule F (breeding/dairy/draft) – flag for Form 4797 */
  form4797Total: number
  form4797Count: number
  /** Animals with review_needed classification – not included in any line */
  reviewNeededCount: number
}

export interface IAccountingReport {
  year: number
  income: {
    totalAmount: number
    byProductType: { productType: string; total: number; count: number }[]
  }
  /** Livestock-specific Schedule F lines (Lines 1 and 2) */
  livestock: ILivestockScheduleF
  expenses: {
    totalAmount: number
    byCategory: { categoryId: string; name: string; scheduleFBucket: string; total: number; count: number }[]
    byScheduleF: { bucket: string; total: number }[]
  }
  /** Schedule F Line 14d / Form 4562 depreciation */
  depreciation: {
    totalAmount: number
    assetCount: number
  }
  netIncome: number
  missingReceipts: number
}
