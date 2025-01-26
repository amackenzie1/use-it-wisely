// data-types.ts

export type Province =
  | 'QC'
  | 'ON'
  | 'BC'
  | 'AB'
  | 'NB'
  | 'NS'
  | 'MB'
  | 'SK'
  | 'NL'
  | 'PE'
  | 'YT'
  | 'NT'
  | 'NU'

export interface OneOffExpense {
  year: number // relative year (1, 2, 3...) from the start
  amount: number
  description?: string
}

export interface OtherIncome {
  startYear: number // actual calendar year
  endYear: number // actual calendar year
  amount: number
  description?: string
}

export interface YearData {
  year: number // 1, 2, 3...
  calendarYear: number // e.g. 2024, 2025
  age: number

  // Income
  salary: number

  // Non-registered
  amountInvested: number
  investmentCostBasis: number
  investmentIncome: number // e.g. dividends or interest taxed each year

  // RRSP
  amountInRRSP: number
  rrspCostBasis: number
  rrspWithdrawal: number

  // RRIF
  amountInRRIF: number
  rrifWithdrawal: number

  // TFSA
  amountInTFSA: number
  tfsaWithdrawal: number

  // Basic expenses
  expenses: number
  healthcareExpenses: number
  stageOneExpenses: number
  stageOneHealthcare: number
  stageTwoExpenses: number
  stageTwoHealthcare: number
  stageThreeExpenses: number
  stageThreeHealthcare: number
  useStages: boolean
  oneOffExpenses: OneOffExpense[]

  // OAS
  oasIncome: number
  oasClawback: number
  oasAfterClawback: number

  // Summaries
  credits: number
  debits: number
  taxPaid: number

  // LIRA
  amountInLIRA: number
  // LIF
  amountInLIF: number

  // Home Sale
  homeSaleProceeds: number

  // New fields for income tracking
  employmentIncome: number
  otherIncomes: OtherIncome[]
}

export type Projection = YearData[]
