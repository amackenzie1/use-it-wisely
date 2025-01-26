// projection-logic.ts

import { Projection, OneOffExpense } from './data-types'
import { calculateTax, calculateOASClawback, findRequiredTotalWithdrawalThreeWay } from './utils'

export const ProjectionLogic = {
  createInitialProjection(
    startYear: number,
    currentAge: number,
    lifeExpectancy: number,
    yearlyIncomes: number[],
    baseAnnualExpenses: number,
    initialInvestment: number,
    initialBookValue: number,
    initialRRSP: number,
    oasStartYear: number,
    oasAnnualAmount: number,
    initialTFSA: number,
    initialRRIF: number,
    initialLIRA: number,
    initialLIF: number,
    homeSaleYear: number | null,
    homeSaleAmount: number,
    useStages: boolean,
    stageOneExpenses: number,
    stageOneHealthcare: number,
    stageTwoExpenses: number,
    stageTwoHealthcare: number,
    stageThreeExpenses: number,
    stageThreeHealthcare: number,
    oneOffExpenses: OneOffExpense[] = []
  ): Projection {
    const totalYears = lifeExpectancy - currentAge;
    const projection: Projection = [];

    for (let i = 1; i <= totalYears; i++) {
      const isHomeSaleYear = homeSaleYear === i;
      const personAge = currentAge + i - 1;

      let yearlyExpenses = baseAnnualExpenses;
      let yearlyHealthcare = 0;

      if (useStages) {
        if (personAge <= 75) {
          yearlyExpenses = stageOneExpenses;
          yearlyHealthcare = stageOneHealthcare;
        } else if (personAge <= 85) {
          yearlyExpenses = stageTwoExpenses;
          yearlyHealthcare = stageTwoHealthcare;
        } else {
          yearlyExpenses = stageThreeExpenses;
          yearlyHealthcare = stageThreeHealthcare;
        }
      }

      const yearOneOffExpenses = oneOffExpenses.filter(e => e.year === i);

      projection.push({
        year: i,
        calendarYear: startYear + i - 1,
        age: personAge,

        salary: yearlyIncomes[i] || 0,

        amountInvested: i === 1 ? initialInvestment : 0,
        investmentCostBasis: i === 1 ? initialBookValue : 0,
        investmentIncome: 0,

        amountInRRSP: i === 1 ? initialRRSP : 0,
        rrspCostBasis: i === 1 ? initialRRSP : 0,
        rrspWithdrawal: 0,

        amountInRRIF: i === 1 ? initialRRIF : 0,
        rrifWithdrawal: 0,

        amountInTFSA: i === 1 ? initialTFSA : 0,
        tfsaWithdrawal: 0,

        expenses: yearlyExpenses,
        healthcareExpenses: yearlyHealthcare,
        stageOneExpenses,
        stageOneHealthcare,
        stageTwoExpenses,
        stageTwoHealthcare,
        stageThreeExpenses,
        stageThreeHealthcare,
        useStages,
        oneOffExpenses: yearOneOffExpenses,

        oasIncome: i >= oasStartYear ? oasAnnualAmount : 0,
        oasClawback: 0,
        oasAfterClawback: 0,

        credits: 0,
        debits: 0,
        taxPaid: 0,

        amountInLIRA: i === 1 ? initialLIRA : 0,
        amountInLIF: i === 1 ? initialLIF : 0,

        homeSaleProceeds: isHomeSaleYear ? homeSaleAmount : 0,

        employmentIncome: yearlyIncomes[i] || 0,
        otherIncomes: [],
      });
    }
    return projection;
  },

  calculateNextYear(projection, yearIndex, incomeRate, growthRate) {
    const RRSP_MAX = 30000;
    const TFSA_MAX = 30000;

    const thisYear = projection[yearIndex];
    const nextYear = (yearIndex + 1 < projection.length)
      ? projection[yearIndex + 1]
      : null;

    const oneOffExpensesTotal = thisYear.oneOffExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = thisYear.expenses + thisYear.healthcareExpenses + oneOffExpensesTotal;

    // Handle home sale proceeds
    if (thisYear.homeSaleProceeds > 0) {
      let remainingProceeds = thisYear.homeSaleProceeds;

      // Top up RRSP if age <= 71
      if (thisYear.age <= 71) {
        const roomInRRSP = RRSP_MAX - thisYear.amountInRRSP;
        const rrspContribution = Math.min(roomInRRSP, remainingProceeds);
        thisYear.amountInRRSP += rrspContribution;
        thisYear.rrspCostBasis += rrspContribution;
        remainingProceeds -= rrspContribution;
      }

      // Top up TFSA
      const roomInTFSA = TFSA_MAX - thisYear.amountInTFSA;
      const tfsaContribution = Math.min(roomInTFSA, remainingProceeds);
      thisYear.amountInTFSA += tfsaContribution;
      remainingProceeds -= tfsaContribution;

      // Remainder goes non-registered
      if (remainingProceeds > 0) {
        thisYear.amountInvested += remainingProceeds;
        thisYear.investmentCostBasis += remainingProceeds;
      }
    }

    // Growth
    const nonRegGrowth = thisYear.amountInvested * growthRate;
    const rrspGrowth = thisYear.amountInRRSP * (incomeRate + growthRate);
    const tfsaGrowth = thisYear.amountInTFSA * (incomeRate + growthRate);
    const rrifGrowth = thisYear.amountInRRIF * (incomeRate + growthRate);
    const liraGrowth = thisYear.amountInLIRA * (incomeRate + growthRate);
    const lifGrowth = thisYear.amountInLIF * (incomeRate + growthRate);

    thisYear.amountInvested += nonRegGrowth;
    thisYear.amountInRRSP += rrspGrowth;
    thisYear.amountInTFSA += tfsaGrowth;
    thisYear.amountInRRIF += rrifGrowth;
    thisYear.amountInLIRA += liraGrowth;
    thisYear.amountInLIF += lifGrowth;

    // Investment income from non-registered
    const investmentIncome = thisYear.amountInvested * incomeRate;
    thisYear.investmentIncome = investmentIncome;

    // LIRA & LIF payouts if age > 65 (simplified)
    if (thisYear.age > 65) {
      const liraPayout = thisYear.amountInLIRA * 0.08;
      const lifPayout = thisYear.amountInLIF * 0.06;
      thisYear.amountInLIRA -= liraPayout;
      thisYear.amountInLIF -= lifPayout;
      thisYear.salary += (liraPayout + lifPayout);
    }

    // Calculate initial tax
    const initialTaxableIncome = thisYear.salary + investmentIncome;
    const initialTax = calculateTax(initialTaxableIncome);
    const totalDebit = totalExpenses + initialTax;

    // OAS Clawback
    const { clawback, oasAfterClawback } = calculateOASClawback(initialTaxableIncome, thisYear.oasIncome);
    thisYear.oasClawback = clawback;
    thisYear.oasAfterClawback = oasAfterClawback;

    const availableCash = initialTaxableIncome + oasAfterClawback;
    const surplusOrDeficit = availableCash - totalDebit;

    if (surplusOrDeficit >= 0) {
      // Surplus
      thisYear.credits = initialTaxableIncome + oasAfterClawback;
      thisYear.debits = totalExpenses + initialTax;
      thisYear.taxPaid = initialTax;
      const surplus = surplusOrDeficit;

      if (nextYear) {
        // Additional contributions
        const rrspAfterGrowth = thisYear.amountInRRSP;
        const tfsaAfterGrowth = thisYear.amountInTFSA;

        const toRRSP = (thisYear.age <= 71 && rrspAfterGrowth < RRSP_MAX)
          ? Math.min(RRSP_MAX - rrspAfterGrowth, surplus)
          : 0;
        let leftover = surplus - toRRSP;

        const toTFSA = (tfsaAfterGrowth < TFSA_MAX)
          ? Math.min(TFSA_MAX - tfsaAfterGrowth, leftover)
          : 0;
        leftover -= toTFSA;

        const toNonReg = leftover;

        nextYear.amountInRRSP = rrspAfterGrowth + toRRSP;
        nextYear.amountInTFSA = tfsaAfterGrowth + toTFSA;
        nextYear.amountInvested = thisYear.amountInvested + toNonReg;

        nextYear.investmentCostBasis = thisYear.investmentCostBasis + toNonReg;
        nextYear.rrspCostBasis = thisYear.rrspCostBasis + toRRSP;

        nextYear.amountInLIRA = thisYear.amountInLIRA;
        nextYear.amountInLIF = thisYear.amountInLIF;
      }
      thisYear.rrspWithdrawal = 0;
      thisYear.tfsaWithdrawal = 0;
    } else {
      // Deficit
      const needed = -surplusOrDeficit;
      const {
        totalWithdrawal,
        fromNonReg,
        fromTFSA,
        fromRRSP,
        fromRRIF
      } = findRequiredTotalWithdrawalThreeWay(
        thisYear.salary,
        thisYear.amountInvested,
        thisYear.investmentCostBasis,
        thisYear.amountInTFSA,
        thisYear.amountInRRSP,
        thisYear.amountInRRIF,
        totalExpenses,
        thisYear.age
      );

      // Recalculate taxes based on that actual withdrawal
      let cgTaxable = 0;
      if (fromNonReg > 0) {
        const proportion = fromNonReg / thisYear.amountInvested;
        const costBasisUsed = thisYear.investmentCostBasis * proportion;
        const realizedGain = fromNonReg - costBasisUsed;
        cgTaxable = realizedGain > 0 ? realizedGain * 0.5 : 0;
      }

      const ordinaryIncome = thisYear.salary + fromRRSP + fromRRIF;
      const totalTax = calculateTax(cgTaxable) + calculateTax(ordinaryIncome);
      const finalDebits = totalExpenses + totalTax;
      const finalCredits = (thisYear.salary + totalWithdrawal) + oasAfterClawback;

      thisYear.credits = finalCredits;
      thisYear.debits = finalDebits;
      thisYear.taxPaid = totalTax;
      thisYear.rrspWithdrawal = fromRRSP;
      thisYear.tfsaWithdrawal = fromTFSA;
      thisYear.rrifWithdrawal = fromRRIF;

      if (nextYear) {
        nextYear.amountInvested = thisYear.amountInvested - fromNonReg;
        if (fromNonReg > 0) {
          const proportion = fromNonReg / thisYear.amountInvested;
          const costBasisUsed = thisYear.investmentCostBasis * proportion;
          nextYear.investmentCostBasis = thisYear.investmentCostBasis - costBasisUsed;
        } else {
          nextYear.investmentCostBasis = thisYear.investmentCostBasis;
        }

        nextYear.amountInTFSA = thisYear.amountInTFSA - fromTFSA;
        nextYear.amountInRRSP = thisYear.amountInRRSP - fromRRSP;
        nextYear.rrspCostBasis = thisYear.rrspCostBasis;
        nextYear.amountInRRIF = thisYear.amountInRRIF - fromRRIF;

        nextYear.amountInLIRA = thisYear.amountInLIRA;
        nextYear.amountInLIF = thisYear.amountInLIF;
      }
    }
  },

  calculateProjection(projection, incomeRate, growthRate, lumpSumWithdrawal=0) {
    // Lump sum withdrawal in first year if needed
    if (projection.length > 0 && lumpSumWithdrawal > 0) {
      const yearOne = projection[0];
      const withdrawalAmount = Math.min(yearOne.amountInvested, lumpSumWithdrawal);

      let cgTaxable = 0;
      if (withdrawalAmount > 0) {
        const proportion = withdrawalAmount / yearOne.amountInvested;
        const costBasisUsed = yearOne.investmentCostBasis * proportion;
        const realizedGain = withdrawalAmount - costBasisUsed;
        cgTaxable = realizedGain > 0 ? realizedGain * 0.5 : 0;
      }
      const taxOnWithdrawal = calculateTax(cgTaxable);

      yearOne.debits += withdrawalAmount + taxOnWithdrawal;
      yearOne.amountInvested -= withdrawalAmount;
      yearOne.investmentCostBasis -= (withdrawalAmount > 0)
        ? (yearOne.investmentCostBasis * (withdrawalAmount / (withdrawalAmount + taxOnWithdrawal)))
        : 0;
      yearOne.taxPaid += taxOnWithdrawal;
    }

    for (let i = 0; i < projection.length - 1; i++) {
      this.calculateNextYear(projection, i, incomeRate, growthRate);
    }

    return projection;
  },

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  },

  findOptimalWithdrawal(baseProjection, incomeRate, growthRate, targetEstate=0) {
    const initialYear = baseProjection[0];
    const totalAssets = initialYear.amountInvested +
                        initialYear.amountInRRSP +
                        initialYear.amountInTFSA;

    let low = 0;
    let high = totalAssets;
    let bestWithdrawal = 0;
    let bestFinalBalance = Infinity;
    const TOLERANCE = 1000;
    const MAX_ITERATIONS = 30;
    let iterations = 0;

    while (high - low > TOLERANCE && iterations < MAX_ITERATIONS) {
      iterations++;
      const mid = (low + high) / 2;
      const testProjection = JSON.parse(JSON.stringify(baseProjection));
      const finalProjection = this.calculateProjection(
        testProjection,
        incomeRate,
        growthRate,
        mid
      );

      let isValidProjection = true;
      for (let i = 0; i < finalProjection.length - 1; i++) {
        const year = finalProjection[i];
        const yearBalance = year.amountInvested + year.amountInRRSP + year.amountInTFSA;
        if (yearBalance <= TOLERANCE) {
          isValidProjection = false;
          break;
        }
      }

      const lastYear = finalProjection[finalProjection.length - 1];
      const finalBalance = lastYear.amountInvested + lastYear.amountInRRSP + lastYear.amountInTFSA;

      if (isValidProjection) {
        if (bestWithdrawal === 0 ||
            Math.abs(finalBalance - targetEstate) < Math.abs(bestFinalBalance - targetEstate)) {
          bestWithdrawal = mid;
          bestFinalBalance = finalBalance;
        }
      }

      if (!isValidProjection || finalBalance < targetEstate) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return {
      maxWithdrawal: bestWithdrawal,
      finalBalance: bestFinalBalance
    };
  },
};
