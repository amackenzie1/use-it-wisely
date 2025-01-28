import { Province } from "./data-types"

// Interface for tax brackets
interface TaxBracket {
  rate: number;
  upTo?: number;
}

/** Federal tax brackets for 2025 */
const federalBrackets: TaxBracket[] = [
  { rate: 0.15, upTo: 57375 },
  { rate: 0.205, upTo: 114750 },
  { rate: 0.26, upTo: 177882 },
  { rate: 0.29, upTo: 253414 },
  { rate: 0.33 }
];

/**
 * Helper function to calculate tax using progressive brackets
 */
function applyProgressiveBrackets(
  taxableIncome: number,
  brackets: TaxBracket[]
): number {
  let tax = 0;
  let previousLimit = 0;

  for (const { rate, upTo } of brackets) {
    if (upTo === undefined) {
      if (taxableIncome > previousLimit) {
        tax += (taxableIncome - previousLimit) * rate;
      }
      break;
    } else {
      if (taxableIncome <= previousLimit) {
        break;
      } else if (taxableIncome > upTo) {
        tax += (upTo - previousLimit) * rate;
        previousLimit = upTo;
      } else {
        tax += (taxableIncome - previousLimit) * rate;
        break;
      }
    }
  }

  return tax;
}

/**
 * Gets the federal Basic Personal Amount based on income
 */
function getFederalBPA(income: number): number {
  const fullBPA = 15705;
  const lowerThreshold = 177882;
  const upperThreshold = 253414;

  if (income <= lowerThreshold) return fullBPA;
  if (income >= upperThreshold) return 0;

  const portionIntoPhaseout = income - lowerThreshold;
  const phaseoutRange = upperThreshold - lowerThreshold;
  const fraction = portionIntoPhaseout / phaseoutRange;
  return fullBPA * (1 - fraction);
}

/**
 * Calculates federal tax including BPA and Quebec abatement
 */
function calculateFederalTax(province: Province, income: number): number {
  const federalBPA = getFederalBPA(income);
  const federalTaxable = Math.max(0, income - federalBPA);
  let federalTaxOwed = applyProgressiveBrackets(federalTaxable, federalBrackets);

  if (province === "QC") {
    federalTaxOwed *= 1 - 0.165;
  }

  return federalTaxOwed;
}

/**
 * Calculates provincial tax based on province-specific brackets and BPA
 */
function calculateProvincialTax(province: Province, income: number): number {
  const { personalAmount, brackets } = provincialTaxData[province];
  const taxableIncome = Math.max(0, income - personalAmount);
  return applyProgressiveBrackets(taxableIncome, brackets);
}

/**
 * Calculates total combined federal and provincial tax
 */
export function calculateTax(income: number, province: Province): number {
  if (income <= 0) return 0;
  
  const fedTax = calculateFederalTax(province, income);
  const provTax = calculateProvincialTax(province, income);
  return fedTax + provTax;
}

/**
 * Holds the provincial/territorial basic personal amount (BPA)
 * and the array of progressive brackets (rate + upTo).
 */
const provincialTaxData: Record<
  Province,
  {
    personalAmount: number;
    brackets: TaxBracket[];
  }
> = {
  AB: {
    personalAmount: 21885, // 2024 AB
    brackets: [
      { rate: 0.10, upTo: 148269 },
      { rate: 0.12, upTo: 177922 },
      { rate: 0.13, upTo: 237230 },
      { rate: 0.14, upTo: 355845 },
      { rate: 0.15 }
    ]
  },
  BC: {
    personalAmount: 12932, // 2025 BC
    brackets: [
      { rate: 0.0506, upTo: 49279 },
      { rate: 0.077, upTo: 98560 },
      { rate: 0.105, upTo: 113158 },
      { rate: 0.1229, upTo: 137407 },
      { rate: 0.147, upTo: 186306 },
      { rate: 0.168, upTo: 259829 },
      { rate: 0.205 }
    ]
  },
  MB: {
    personalAmount: 10000, // Placeholder
    brackets: [
      { rate: 0.108, upTo: 47000 },
      { rate: 0.1275, upTo: 100000 },
      { rate: 0.174 }
    ]
  },
  NB: {
    personalAmount: 11500, // Placeholder
    brackets: [
      { rate: 0.094, upTo: 49958 },
      { rate: 0.14, upTo: 99916 },
      { rate: 0.16, upTo: 185064 },
      { rate: 0.195 }
    ]
  },
  NL: {
    personalAmount: 11067, // 2025 NL
    brackets: [
      { rate: 0.087, upTo: 44192 },
      { rate: 0.145, upTo: 88382 },
      { rate: 0.158, upTo: 157792 },
      { rate: 0.178, upTo: 220910 },
      { rate: 0.198, upTo: 275870 },
      { rate: 0.208, upTo: 551739 },
      { rate: 0.213, upTo: 1103478 },
      { rate: 0.218 }
    ]
  },
  NS: {
    personalAmount: 11481, // 2024 NS
    brackets: [
      { rate: 0.0879, upTo: 29590 },
      { rate: 0.1495, upTo: 59180 },
      { rate: 0.1667, upTo: 93000 },
      { rate: 0.175, upTo: 150000 },
      { rate: 0.21 }
    ]
  },
  NT: {
    personalAmount: 17842, // 2025 NT
    brackets: [
      { rate: 0.059, upTo: 51964 },
      { rate: 0.086, upTo: 103930 },
      { rate: 0.122, upTo: 168967 },
      { rate: 0.1405 }
    ]
  },
  NU: {
    personalAmount: 19274, // 2025 NU
    brackets: [
      { rate: 0.04, upTo: 54707 },
      { rate: 0.07, upTo: 109413 },
      { rate: 0.09, upTo: 177881 },
      { rate: 0.115 }
    ]
  },
  ON: {
    personalAmount: 12399, // Approx. for 2025
    brackets: [
      { rate: 0.0505, upTo: 52886 },
      { rate: 0.0915, upTo: 105775 },
      { rate: 0.1116, upTo: 150000 },
      { rate: 0.1216, upTo: 220000 },
      { rate: 0.1316 }
    ]
  },
  PE: {
    personalAmount: 14250, // 2025 PE
    brackets: [
      { rate: 0.095, upTo: 33328 },
      { rate: 0.1347, upTo: 64656 },
      { rate: 0.166, upTo: 105000 },
      { rate: 0.1762, upTo: 140000 },
      { rate: 0.19 }
    ]
  },
  QC: {
    personalAmount: 18571, // 2025 QC
    brackets: [
      { rate: 0.14, upTo: 53255 },
      { rate: 0.19, upTo: 106495 },
      { rate: 0.24, upTo: 129590 },
      { rate: 0.2575 }
    ]
  },
  SK: {
    personalAmount: 19491, // 2025 SK
    brackets: [
      { rate: 0.105, upTo: 53463 },
      { rate: 0.125, upTo: 152750 },
      { rate: 0.145 }
    ]
  },
  YT: {
    personalAmount: 15705, // 2025 YT
    brackets: [
      { rate: 0.064, upTo: 57375 },
      { rate: 0.09, upTo: 114750 },
      { rate: 0.109, upTo: 177882 },
      { rate: 0.128, upTo: 500000 },
      { rate: 0.15 }
    ]
  }
};