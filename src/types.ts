// types.ts

export type Province =
  | 'ON'
  | 'BC'
  | 'AB'
  | 'QC'
  | 'MB'
  | 'SK'
  | 'NS'
  | 'NB'
  | 'NL'
  | 'PE'
  | 'YT'
  | 'NT'
  | 'NU';

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
