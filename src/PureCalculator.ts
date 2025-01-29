// calculateProjection.ts
import { CalculatorInputData, Projection } from './types'
import { ProjectionLogic } from './projection-logic'

interface CalculateProjectionResult {
  projection: Projection
  maxWithdrawal: number
}

export function calculateProjectionFromData(
  data: CalculatorInputData
): CalculateProjectionResult {
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
    deathBenefit
  } = data

  // 1) Ensure life expectancy is at least currentAge+1
  const calculationLifeExpectancy = Math.max(lifeExpectancy, currentAge + 1)
  const totalYears = calculationLifeExpectancy - currentAge

  // 2) Build out incomes array
  const yearlyIncomes = new Array(totalYears + 1).fill(0)

  // Fill employment
  for (let yr = employmentIncomeStartYear; yr <= employmentIncomeEndYear; yr++) {
    const index = yr - startYear + 1
    if (index > 0 && index <= totalYears) {
      yearlyIncomes[index] += employmentIncome
    }
  }

  // Fill other incomes
  otherIncomes.forEach((inc) => {
    for (let yr = inc.startYear; yr <= inc.endYear; yr++) {
      const index = yr - startYear + 1
      if (index > 0 && index <= totalYears) {
        yearlyIncomes[index] += inc.amount
      }
    }
  })

  // Fill CPP/QPP
  const actualCppStartYear = isReceivingCPP ? 1 : cppStartAge - currentAge + 1
  for (let y = actualCppStartYear; y <= totalYears; y++) {
    if (y > 0) {
      yearlyIncomes[y] += cppAnnualAmount
    }
  }

  // Fill DB
  const actualDbStartYear = isReceivingDB ? 1 : dbStartAge - currentAge + 1
  for (let y = actualDbStartYear; y <= totalYears; y++) {
    if (y > 0) {
      yearlyIncomes[y] += dbAnnualAmount
    }
  }

  // Fill OAS
  const actualOasStartYear = isReceivingOAS ? 1 : oasStartAge - currentAge + 1
  // (Add it the same way, if needed: yearlyIncomes[y] += oasAnnualAmount, etc.)

  // 3) Derive the real income/growth rates
  let realIncomeRate = 0
  let realGrowthRate = 0

  if (specifyOwnRates) {
    const nominalIncomeRate = incomeRate
    const nominalGrowthRate = growthRate
    const sumRates = nominalIncomeRate + nominalGrowthRate
    if (sumRates > 0) {
      const realTotal = sumRates - inflationRate
      const ratioIncome = nominalIncomeRate / sumRates
      const ratioGrowth = nominalGrowthRate / sumRates
      realIncomeRate = (realTotal * ratioIncome) / 100
      realGrowthRate = (realTotal * ratioGrowth) / 100
    }
  } else {
    const totalReturn = rateOfReturn
    const realReturn = totalReturn - inflationRate
    // Example: split half to income, half to growth
    realIncomeRate = (realReturn * 0.5) / 100
    realGrowthRate = (realReturn * 0.5) / 100
  }

  // 4) Grab registered accounts
  const getAccountTypeTotal = (type: string) =>
    registeredAccounts
      .filter((acc) => acc.type === type)
      .reduce((sum, acc) => sum + acc.amount, 0)

  const initialRRSP = getAccountTypeTotal('RRSP')
  const initialTFSA = getAccountTypeTotal('TFSA')
  const initialRRIF = getAccountTypeTotal('RRIF')
  const initialLIRA = getAccountTypeTotal('LIRA')
  const initialLIF = getAccountTypeTotal('LIF')

  // 5) Home sale
  const actualHomeSaleYear = willSellHome ? homeSaleYear - startYear + 1 : null
  const saleAmount = willSellHome ? homeSaleAmount : 0

  // 6) Construct the base projection
  const baseProjection = ProjectionLogic.createInitialProjection(
    startYear,
    currentAge,
    calculationLifeExpectancy,
    yearlyIncomes,
    annualExpenses,
    initialInvestment,
    initialBookValue,
    initialRRSP,
    actualOasStartYear,
    oasAnnualAmount,
    initialTFSA,
    initialRRIF,
    initialLIRA,
    initialLIF,
    actualHomeSaleYear,
    saleAmount,
    useStages,
    stageOneExpenses,
    stageOneHealthcare,
    stageTwoExpenses,
    stageTwoHealthcare,
    stageThreeExpenses,
    stageThreeHealthcare,
    oneOffExpenses,
    province
  )

  // 7) Compute estate goal net of insurance
  const targetEstate = Math.max(0, estateGoal - deathBenefit)

  // 8) Solve for max withdrawal
  const { maxWithdrawal } = ProjectionLogic.findOptimalWithdrawal(
    baseProjection,
    realIncomeRate,
    realGrowthRate,
    targetEstate
  )

  // 9) Final projection with that withdrawal
  const finalProj = ProjectionLogic.calculateProjection(
    JSON.parse(JSON.stringify(baseProjection)), // or a deep-clone
    realIncomeRate,
    realGrowthRate,
    maxWithdrawal
  )

  return {
    projection: finalProj,
    maxWithdrawal
  }
}
