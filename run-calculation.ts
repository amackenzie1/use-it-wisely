// run-calculation.ts
import inputData from './input-data.json'
import { calculateProjectionFromData } from './src/PureCalculator'
import { CalculatorInputData } from './src/types'

const { projection, maxWithdrawal } = calculateProjectionFromData(inputData as CalculatorInputData)

console.log('Max Withdrawal:', maxWithdrawal)
console.log('Projection (first few years):', projection)
// Or do something else with the results...
