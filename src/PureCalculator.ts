// calculateProjection.ts

import { CalculatorInputData, Projection, RegisteredAccountType } from './types'
import { ProjectionLogic } from './projection-logic'

// If you have these utility functions in a separate file, import them.
// Otherwise, define them inline here.
function computeRealRates(
  specifyOwnRates: boolean,
  rateOfReturn: number,
  incomeRate: number,
  growthRate: number,
  inflationRate: number
) {
  // This matches your original snippet approach:
  let realIncomeRate = 0;
  let realGrowthRate = 0;

  if (specifyOwnRates) {
    // e.g. nominalIncomeRate = incomeRate, nominalGrowthRate = growthRate
    const nominalIncomeRate = incomeRate;
    const nominalGrowthRate = growthRate;
    const sumRates = nominalIncomeRate + nominalGrowthRate;
    if (sumRates > 0) {
      // subtract inflation from the sum, then split proportionally
      const realTotal = sumRates - inflationRate;
      const ratioIncome = nominalIncomeRate / sumRates;
      const ratioGrowth = nominalGrowthRate / sumRates;
      realIncomeRate = (realTotal * ratioIncome) / 100;
      realGrowthRate = (realTotal * ratioGrowth) / 100;
    }
  } else {
    // single totalReturn -> realReturn -> half to income, half to growth
    const realReturn = rateOfReturn - inflationRate;
    realIncomeRate = (realReturn * 0.5) / 100;
    realGrowthRate = (realReturn * 0.5) / 100;
  }

  return { realIncomeRate, realGrowthRate };
}

export interface CalculateProjectionResult {
  projection: Projection;
  maxWithdrawal: number;
}

export function calculateProjectionFromData(
  data: CalculatorInputData
): CalculateProjectionResult {
  // Extract the data
  const {
    currentAge,
    province,
    lifeExpectancy,

    employmentIncome,
    employmentIncomeStartYear,
    employmentIncomeEndYear,

    otherIncomes,

    annualExpenses,
    annualHealthcareExpenses,
    useStages,
    stageOneExpenses,
    stageOneHealthcare,
    stageTwoExpenses,
    stageTwoHealthcare,
    stageThreeExpenses,
    stageThreeHealthcare,

    initialInvestment,
    initialBookValue,
    startYear,

    registeredAccounts,

    willSellHome,
    homeSaleYear,
    homeSaleAmount,

    rateOfReturn,
    specifyOwnRates,
    incomeRate,
    growthRate,
    inflationRate,

    isReceivingOAS,
    oasStartAge,
    oasAnnualAmount,

    isReceivingCPP,
    cppStartAge,
    cppAnnualAmount,

    isReceivingDB,
    dbStartAge,
    dbAnnualAmount,

    oneOffExpenses,

    estateGoal,
    deathBenefit,

    // Spouse fields
    hasSpouse = false,

    spouseCurrentAge = 0,
    spouseLifeExpectancy = 0,

    spouseEmploymentIncome = 0,
    spouseEmploymentIncomeStartYear = 0,
    spouseEmploymentIncomeEndYear = 0,

    spouseOtherIncomes = [],

    spouseIsReceivingOAS = false,
    spouseOasStartAge = 65,
    spouseOasAnnualAmount = 0,

    spouseIsReceivingCPP = false,
    spouseCppStartAge = 65,
    spouseCppAnnualAmount = 0,

    spouseIsReceivingDB = false,
    spouseDbStartAge = 65,
    spouseDbAnnualAmount = 0,

    spouseRegisteredAccounts = [],

    spouseAnnualExpenses = 0,
    spouseAnnualHealthcareExpenses = 0,
    spouseUseStages = false,
    spouseStageOneExpenses = 0,
    spouseStageOneHealthcare = 0,
    spouseStageTwoExpenses = 0,
    spouseStageTwoHealthcare = 0,
    spouseStageThreeExpenses = 0,
    spouseStageThreeHealthcare = 0,

    spouseOneOffExpenses = []
  } = data;

  //
  // 1) Determine the “household” life expectancy
  //
  const householdLifeExpectancy = hasSpouse
    ? Math.max(lifeExpectancy, spouseLifeExpectancy)
    : lifeExpectancy;

  // Also pick the "householdCurrentAge" (anchor on the primary user’s age)
  const householdCurrentAge = currentAge;
  const calculationLifeExpectancy = Math.max(householdLifeExpectancy, householdCurrentAge + 1);
  const totalYears = calculationLifeExpectancy - householdCurrentAge;

  //
  // 2) Combine incomes into a single array
  //
  const yearlyIncomes = new Array(totalYears + 1).fill(0);

  // Primary’s employment
  for (let yr = employmentIncomeStartYear; yr <= employmentIncomeEndYear; yr++) {
    const index = yr - startYear + 1;
    if (index > 0 && index <= totalYears) {
      yearlyIncomes[index] += employmentIncome;
    }
  }

  // Spouse’s employment
  if (hasSpouse) {
    for (let yr = spouseEmploymentIncomeStartYear; yr <= spouseEmploymentIncomeEndYear; yr++) {
      const index = yr - startYear + 1;
      if (index > 0 && index <= totalYears) {
        yearlyIncomes[index] += spouseEmploymentIncome;
      }
    }
  }

  // Primary’s other incomes
  otherIncomes.forEach((inc) => {
    for (let yr = inc.startYear; yr <= inc.endYear; yr++) {
      const index = yr - startYear + 1;
      if (index > 0 && index <= totalYears) {
        yearlyIncomes[index] += inc.amount;
      }
    }
  });

  // Spouse’s other incomes
  if (hasSpouse) {
    spouseOtherIncomes.forEach((inc) => {
      for (let yr = inc.startYear; yr <= inc.endYear; yr++) {
        const index = yr - startYear + 1;
        if (index > 0 && index <= totalYears) {
          yearlyIncomes[index] += inc.amount;
        }
      }
    });
  }

  //
  // 3) Add in CPP/QPP, DB, OAS for both
  //

  // Primary’s CPP
  if (isReceivingCPP) {
    // if isReceivingCPP is true from year 1, or else start at (cppStartAge - currentAge + 1)
    const start = (cppStartAge <= currentAge) ? 1 : (cppStartAge - currentAge + 1);
    for (let y = start; y <= totalYears; y++) {
      if (y > 0 && y <= totalYears) {
        yearlyIncomes[y] += cppAnnualAmount;
      }
    }
  }

  // Spouse’s CPP
  if (hasSpouse && spouseIsReceivingCPP) {
    const spouseStart = (spouseCppStartAge <= currentAge)
      ? 1
      : (spouseCppStartAge - currentAge + 1);
    for (let y = spouseStart; y <= totalYears; y++) {
      if (y > 0 && y <= totalYears) {
        yearlyIncomes[y] += spouseCppAnnualAmount;
      }
    }
  }

  // Primary’s DB
  if (isReceivingDB) {
    const start = (dbStartAge <= currentAge) ? 1 : (dbStartAge - currentAge + 1);
    for (let y = start; y <= totalYears; y++) {
      if (y > 0 && y <= totalYears) {
        yearlyIncomes[y] += dbAnnualAmount;
      }
    }
  }

  // Spouse’s DB
  if (hasSpouse && spouseIsReceivingDB) {
    const spouseStart = (spouseDbStartAge <= currentAge)
      ? 1
      : (spouseDbStartAge - currentAge + 1);
    for (let y = spouseStart; y <= totalYears; y++) {
      if (y > 0 && y <= totalYears) {
        yearlyIncomes[y] += spouseDbAnnualAmount;
      }
    }
  }

  // Primary’s OAS
  let actualOasStartYear = (oasStartAge <= currentAge) ? 1 : (oasStartAge - currentAge + 1);
  // (We don't add OAS to `yearlyIncomes` directly because your logic uses a separate field in createInitialProjection
  //  but if you do want to combine it, you can do so. We’ll pass `actualOasStartYear` to createInitialProjection.)

  // Spouse’s OAS
  let spouseOasYear = 0;
  if (hasSpouse && spouseIsReceivingOAS) {
    spouseOasYear = (spouseOasStartAge <= currentAge)
      ? 1
      : (spouseOasStartAge - currentAge + 1);
    // The logic in createInitialProjection has only ONE “oasAnnualAmount.” 
    // If you want to do a quick hack, you can add them. Or you can add them to `yearlyIncomes`. 
    // For demonstration, let's just “add” them to your main OAS approach. 
    // There's no separate spouse OAS in your original code, so let's keep it simple 
    // by adding spouse OAS into the same pipeline.

    // We'll do the simple approach: just add spouse's OAS to `yearlyIncomes`.
    // Or we can treat it as second OAS. 
    for (let y = spouseOasYear; y <= totalYears; y++) {
      if (y > 0 && y <= totalYears) {
        yearlyIncomes[y] += spouseOasAnnualAmount;
      }
    }
  }

  //
  // 4) Merge spouse’s expenses
  //
  let combinedAnnualExpenses = annualExpenses;
  let combinedAnnualHealthcareExpenses = annualHealthcareExpenses;
  let combinedUseStages = useStages;

  if (hasSpouse) {
    combinedAnnualExpenses += spouseAnnualExpenses;
    combinedAnnualHealthcareExpenses += spouseAnnualHealthcareExpenses;
    combinedUseStages = (useStages || spouseUseStages);
  }

  // If using stage logic for each spouse, you can sum them:
  const combinedStageOneExpenses = stageOneExpenses + (hasSpouse ? spouseStageOneExpenses : 0);
  const combinedStageOneHealthcare = stageOneHealthcare + (hasSpouse ? spouseStageOneHealthcare : 0);
  const combinedStageTwoExpenses = stageTwoExpenses + (hasSpouse ? spouseStageTwoExpenses : 0);
  const combinedStageTwoHealthcare = stageTwoHealthcare + (hasSpouse ? spouseStageTwoHealthcare : 0);
  const combinedStageThreeExpenses = stageThreeExpenses + (hasSpouse ? spouseStageThreeExpenses : 0);
  const combinedStageThreeHealthcare = stageThreeHealthcare + (hasSpouse ? spouseStageThreeHealthcare : 0);

  //
  // 5) Merge one-off expenses
  //
  let combinedOneOffExpenses = [...oneOffExpenses];
  if (hasSpouse) {
    combinedOneOffExpenses = combinedOneOffExpenses.concat(spouseOneOffExpenses);
  }

  //
  // 6) Merge spouse’s registered accounts
  //
  const allRegisteredAccounts = hasSpouse
    ? [...registeredAccounts, ...spouseRegisteredAccounts]
    : registeredAccounts;

  const getAccountTypeTotal = (type: RegisteredAccountType) =>
    allRegisteredAccounts
      .filter((acc) => acc.type === type)
      .reduce((sum, acc) => sum + acc.amount, 0);

  const initialRRSP = getAccountTypeTotal('RRSP');
  const initialTFSA = getAccountTypeTotal('TFSA');
  const initialRRIF = getAccountTypeTotal('RRIF');
  const initialLIRA = getAccountTypeTotal('LIRA');
  const initialLIF = getAccountTypeTotal('LIF');

  //
  // 7) Build the base projection (using existing logic)
  //
  const baseProjection = ProjectionLogic.createInitialProjection(
    startYear,
    householdCurrentAge,
    calculationLifeExpectancy,
    yearlyIncomes,
    combinedAnnualExpenses,
    initialInvestment,
    initialBookValue,
    initialRRSP,
    actualOasStartYear,
    oasAnnualAmount, // doesn't include spouse OAS in the default logic— 
                     // we already added spouse’s OAS to 'yearlyIncomes' above
    initialTFSA,
    initialRRIF,
    initialLIRA,
    initialLIF,
    willSellHome ? (homeSaleYear - startYear + 1) : null,
    willSellHome ? homeSaleAmount : 0,
    combinedUseStages,
    combinedStageOneExpenses,
    combinedStageOneHealthcare,
    combinedStageTwoExpenses,
    combinedStageTwoHealthcare,
    combinedStageThreeExpenses,
    combinedStageThreeHealthcare,
    combinedOneOffExpenses,
    province
  );

  //
  // 8) Compute “real” income/growth rates
  //
  const { realIncomeRate, realGrowthRate } = computeRealRates(
    specifyOwnRates,
    rateOfReturn,
    incomeRate,
    growthRate,
    inflationRate
  );

  //
  // 9) If spouse is present, double the RRSP/TFSA “max” in the logic:
  //
  const rrspMaxMultiplier = hasSpouse ? 2 : 1;
  const tfsaMaxMultiplier = hasSpouse ? 2 : 1;

  //
  // 10) Estate goal net of insurance
  //
  const targetEstate = Math.max(0, estateGoal - deathBenefit);

  //
  // 11) Solve for max withdrawal
  //
  const { maxWithdrawal } = ProjectionLogic.findOptimalWithdrawal(
    baseProjection,
    realIncomeRate,
    realGrowthRate,
    targetEstate,
    rrspMaxMultiplier,
    tfsaMaxMultiplier
  );

  //
  // 12) Compute final projection
  //
  const finalProj = ProjectionLogic.calculateProjection(
    JSON.parse(JSON.stringify(baseProjection)), // deep clone
    realIncomeRate,
    realGrowthRate,
    maxWithdrawal,
    rrspMaxMultiplier,
    tfsaMaxMultiplier
  );

  return {
    projection: finalProj,
    maxWithdrawal
  };
}
