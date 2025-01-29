// types.ts

export type RegisteredAccountType = 'RRSP' | 'TFSA' | 'RRIF' | 'LIRA' | 'LIF';

export interface RegisteredAccount {
  type: RegisteredAccountType;
  amount: number;
}

export interface OtherIncome {
  // actual calendar years (e.g. 2024, 2030)
  startYear: number;
  endYear: number;
  amount: number;
  description?: string;
}

export interface OneOffExpense {
  // relative year 1, 2, 3... from the "start" (depending on your design)
  year: number;
  amount: number;
  description?: string;
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
  | 'NU';

// For each year of the projection:
export interface YearData {
  year: number;          // 1, 2, 3...
  calendarYear: number;  // e.g. 2024, 2025
  age: number;           // the "primary" person's age that year

  // Income
  salary: number;        // total (employment + other lumps) recognized as "salary"

  // Non-registered
  amountInvested: number;
  investmentCostBasis: number;
  investmentIncome: number; // e.g. dividends or interest

  // RRSP
  amountInRRSP: number;
  rrspCostBasis: number;
  rrspWithdrawal: number;

  // RRIF
  amountInRRIF: number;
  rrifWithdrawal: number;

  // TFSA
  amountInTFSA: number;
  tfsaWithdrawal: number;

  // Basic expenses
  expenses: number;
  healthcareExpenses: number;
  useStages: boolean;
  stageOneExpenses: number;
  stageOneHealthcare: number;
  stageTwoExpenses: number;
  stageTwoHealthcare: number;
  stageThreeExpenses: number;
  stageThreeHealthcare: number;
  oneOffExpenses: OneOffExpense[];

  // OAS
  oasIncome: number;
  oasClawback: number;
  oasAfterClawback: number;

  // Summaries
  credits: number; // total inflows
  debits: number;  // total outflows (expenses + tax, etc.)
  taxPaid: number;

  // LIRA
  amountInLIRA: number;
  // LIF
  amountInLIF: number;

  // Home Sale
  homeSaleProceeds: number;

  // Additional fields for clarity
  employmentIncome: number;
  otherIncomes: OtherIncome[];

  province: Province;
}

export type Projection = YearData[];

export interface CalculatorInputData {
  // Primary person
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
  rateOfReturn: number;      // if not specifying your own rates
  specifyOwnRates: boolean;  // whether to use your own separation of incomeRate / growthRate
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

  // -------- SPOUSE FIELDS -----------
  hasSpouse?: boolean;

  spouseCurrentAge?: number;
  spouseLifeExpectancy?: number;

  spouseEmploymentIncome?: number;
  spouseEmploymentIncomeStartYear?: number;
  spouseEmploymentIncomeEndYear?: number;

  spouseOtherIncomes?: OtherIncome[];

  spouseIsReceivingOAS?: boolean;
  spouseOasStartAge?: number;
  spouseOasAnnualAmount?: number;

  spouseIsReceivingCPP?: boolean;
  spouseCppStartAge?: number;
  spouseCppAnnualAmount?: number;

  spouseIsReceivingDB?: boolean;
  spouseDbStartAge?: number;
  spouseDbAnnualAmount?: number;

  spouseRegisteredAccounts?: RegisteredAccount[];

  spouseAnnualExpenses?: number;
  spouseAnnualHealthcareExpenses?: number;
  spouseUseStages?: boolean;
  spouseStageOneExpenses?: number;
  spouseStageOneHealthcare?: number;
  spouseStageTwoExpenses?: number;
  spouseStageTwoHealthcare?: number;
  spouseStageThreeExpenses?: number;
  spouseStageThreeHealthcare?: number;

  spouseOneOffExpenses?: OneOffExpense[];
}
