export type Species =
  | 'cattle' | 'pig' | 'sheep' | 'goat' | 'chicken'
  | 'duck' | 'turkey' | 'rabbit' | 'horse' | 'alpaca' | 'other'

export type AnimalStatus = 'active' | 'sold' | 'deceased'
export type Sex = 'male' | 'female' | 'unknown'

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
  fileName: string
  mimeType: string
  fileSize: number
  uploadedAt: string
}

export interface ISale {
  _id: string
  date: string
  productType: SaleProductType
  quantity?: number
  unit?: string
  unitPrice?: number
  totalAmount: number
  customerName?: string
  paymentMethod: PaymentMethod
  referenceNumber?: string
  notes?: string
  taxYear: number
  createdAt: string
  updatedAt: string
}

export interface IAccountingReport {
  year: number
  income: {
    totalAmount: number
    byProductType: { productType: string; total: number; count: number }[]
  }
  expenses: {
    totalAmount: number
    byCategory: { categoryId: string; name: string; scheduleFBucket: string; total: number; count: number }[]
    byScheduleF: { bucket: string; total: number }[]
  }
  netIncome: number
  missingReceipts: number
}
