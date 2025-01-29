// types.ts

export type RegisteredAccountType = 'RRSP' | 'TFSA' | 'RRIF' | 'LIRA' | 'LIF';

export interface RegisteredAccount {
  type: RegisteredAccountType;
  amount: number;
}

export interface OtherIncome {
  startYear: number;
  endYear: number;
  amount: number;
  description?: string;
}

export interface OneOffExpense {
  year: number;
  amount: number;
  description?: string;
}

export interface CalculatorInputData {
  // Basic
  currentAge: number;
  province: Province;
  lifeExpectancy: number;

  // Employment
  employmentIncome: number;
  employmentIncomeStartYear: number;
  employmentIncomeEndYear: number;

  // Other incomes
  otherIncomes: OtherIncome[];

  // Expenses
  annualExpenses: number;
  annualHealthcareExpenses: number;
  useStages: boolean;
  stageOneExpenses: number;
  stageOneHealthcare: number;
  stageTwoExpenses: number;
  stageTwoHealthcare: number;
  stageThreeExpenses: number;
  stageThreeHealthcare: number;

  // Investments
  initialInvestment: number;
  initialBookValue: number;
  startYear: number;

  // Registered accounts
  registeredAccounts: RegisteredAccount[];

  // Home sale
  willSellHome: boolean;
  homeSaleYear: number;
  homeSaleAmount: number;

  // Rate of return
  rateOfReturn: number;
  specifyOwnRates: boolean;
  incomeRate: number;
  growthRate: number;
  inflationRate: number;

  // OAS
  isReceivingOAS: boolean;
  oasStartAge: number;
  oasAnnualAmount: number;

  // CPP/QPP
  isReceivingCPP: boolean;
  cppStartAge: number;
  cppAnnualAmount: number;

  // DB Pension
  isReceivingDB: boolean;
  dbStartAge: number;
  dbAnnualAmount: number;

  // One-off expenses
  oneOffExpenses: OneOffExpense[];

  // Estate
  estateGoal: number;
  deathBenefit: number;
}

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

  province: Province
}

export type Projection = YearData[]
