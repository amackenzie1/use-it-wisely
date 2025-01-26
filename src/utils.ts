// utils.ts

const COMBINED_TAX_BRACKETS = [
  { bracketUpTo: 15000, rate: 0.15 },
  { bracketUpTo: 50000, rate: 0.25 },
  { bracketUpTo: 100000, rate: 0.35 },
  { bracketUpTo: Infinity, rate: 0.45 },
]

const OAS_CLAWBACK = {
  THRESHOLD: 90997,
  RATE: 0.15,
}

/**
 * Calculate progressive tax on given income.
 */
export function calculateTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0

  let remaining = taxableIncome
  let totalTax = 0
  let prevBracketEnd = 0

  for (const bracket of COMBINED_TAX_BRACKETS) {
    const bracketSize = bracket.bracketUpTo - prevBracketEnd
    const amountAtThisRate = Math.min(remaining, bracketSize)
    totalTax += amountAtThisRate * bracket.rate

    remaining -= amountAtThisRate
    prevBracketEnd = bracket.bracketUpTo
    if (remaining <= 0) break
  }

  return totalTax
}

/**
 * Calculate OAS clawback based on net income above threshold.
 */
export function calculateOASClawback(
  netIncome: number,
  oasAmount: number
): {
  clawback: number
  oasAfterClawback: number
} {
  if (netIncome <= OAS_CLAWBACK.THRESHOLD) {
    return { clawback: 0, oasAfterClawback: oasAmount }
  }
  const over = netIncome - OAS_CLAWBACK.THRESHOLD
  const clawback = Math.min(oasAmount, over * OAS_CLAWBACK.RATE)
  return {
    clawback,
    oasAfterClawback: oasAmount - clawback,
  }
}

/**
 * For a given shortfall, figure out how much to withdraw from
 * Non-registered, TFSA, or RRSP (and RRIF).
 * Simple approach: NonReg -> TFSA -> RRSP -> RRIF
 */
export function findRequiredTotalWithdrawalThreeWay(
  salary: number,
  nonRegBalance: number,
  nonRegCostBasis: number,
  tfsaBalance: number,
  rrspBalance: number,
  rrifBalance: number,
  expenses: number,
  age: number
): {
  totalWithdrawal: number
  fromNonReg: number
  fromTFSA: number
  fromRRSP: number
  fromRRIF: number
} {
  const EPSILON = 1
  let low = 0
  let high = nonRegBalance + tfsaBalance + rrspBalance + rrifBalance
  let bestGuess = 0

  let bestFromNonReg = 0
  let bestFromTFSA = 0
  let bestFromRRSP = 0
  let bestFromRRIF = 0

  while (high - low > 1e-7) {
    const mid = (low + high) / 2

    // Attempt to withdraw 'mid' total
    let needed = mid
    const fromNonReg = Math.min(needed, nonRegBalance)
    needed -= fromNonReg

    const fromTFSA = Math.min(needed, tfsaBalance)
    needed -= fromTFSA

    const fromRRSP = Math.min(needed, rrspBalance)
    needed -= fromRRSP

    const fromRRIF = Math.min(needed, rrifBalance)
    needed -= fromRRIF

    // Capital gains from non-reg
    let cgTaxable = 0
    if (fromNonReg > 0) {
      const proportion = fromNonReg / nonRegBalance
      const costBasisUsed = nonRegCostBasis * proportion
      const realizedGain = fromNonReg - costBasisUsed
      cgTaxable = realizedGain > 0 ? realizedGain * 0.5 : 0
    }

    const cgTax = calculateTax(cgTaxable)
    const ordinaryTax = calculateTax(salary + fromRRSP + fromRRIF)
    const totalTax = cgTax + ordinaryTax

    const debits = expenses + totalTax
    const credits = salary + mid
    const difference = credits - debits

    // Check closeness to covering expenses
    if (Math.abs(difference) <= EPSILON) {
      bestGuess = mid
      bestFromNonReg = fromNonReg
      bestFromTFSA = fromTFSA
      bestFromRRSP = fromRRSP
      bestFromRRIF = fromRRIF
      break
    }

    if (difference < 0) {
      // Not enough
      low = mid
    } else {
      high = mid
    }

    bestGuess = mid
    bestFromNonReg = fromNonReg
    bestFromTFSA = fromTFSA
    bestFromRRSP = fromRRSP
    bestFromRRIF = fromRRIF
  }

  return {
    totalWithdrawal: bestGuess,
    fromNonReg: bestFromNonReg,
    fromTFSA: bestFromTFSA,
    fromRRSP: bestFromRRSP,
    fromRRIF: bestFromRRIF,
  }
}
