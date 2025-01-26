import React, { useEffect, useState } from 'react'
import { OneOffExpense, OtherIncome, Projection } from '../data-types'
import { ProjectionLogic } from '../projection-logic'
import ProjectionChart from './ProjectionChart'
import ProjectionTable from './ProjectionTable'

type RegisteredAccountType = 'RRSP' | 'TFSA' | 'RRIF' | 'LIRA' | 'LIF'

interface RegisteredAccount {
  type: RegisteredAccountType
  amount: number
}

const Calculator: React.FC = () => {
  // Core personal data
  const [currentAge, setCurrentAge] = useState(35)
  const [province, setProvince] = useState<
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
    | 'NU'
  >('ON')
  const [lifeExpectancy, setLifeExpectancy] = useState(95)
  const [calculationLifeExpectancy, setCalculationLifeExpectancy] = useState(95)

  // Validate life expectancy is always greater than current age
  const handleLifeExpectancyChange = (value: number) => {
    setLifeExpectancy(value)
  }

  // When the input loses focus, enforce the validation
  const handleLifeExpectancyBlur = () => {
    const validValue = Math.max(currentAge + 1, lifeExpectancy)
    setLifeExpectancy(validValue)
    setCalculationLifeExpectancy(validValue)
  }

  const handleCurrentAgeChange = (value: number) => {
    if (value < calculationLifeExpectancy) {
      setCurrentAge(value)
    } else {
      // If current age would be greater than life expectancy, adjust life expectancy
      const newLifeExpectancy = value + 1
      setLifeExpectancy(newLifeExpectancy)
      setCalculationLifeExpectancy(newLifeExpectancy)
      setCurrentAge(value)
    }
  }

  // Employment income
  const [employmentIncome, setEmploymentIncome] = useState(50000)
  const [employmentIncomeStartYear, setEmploymentIncomeStartYear] =
    useState(2024)
  const [employmentIncomeEndYear, setEmploymentIncomeEndYear] = useState(2024)

  // Other incomes
  const [otherIncomes, setOtherIncomes] = useState<OtherIncome[]>([])

  // Expenses
  const [annualExpenses, setAnnualExpenses] = useState(50000)
  const [annualHealthcareExpenses, setAnnualHealthcareExpenses] = useState(0)
  const [useStages, setUseStages] = useState(false)

  // Staged
  const [stageOneExpenses, setStageOneExpenses] = useState(50000)
  const [stageOneHealthcare, setStageOneHealthcare] = useState(0)
  const [stageTwoExpenses, setStageTwoExpenses] = useState(45000)
  const [stageTwoHealthcare, setStageTwoHealthcare] = useState(5000)
  const [stageThreeExpenses, setStageThreeExpenses] = useState(40000)
  const [stageThreeHealthcare, setStageThreeHealthcare] = useState(10000)

  // Investments
  const [initialInvestment, setInitialInvestment] = useState(500000)
  const [initialBookValue, setInitialBookValue] = useState(500000)
  const [startYear, setStartYear] = useState(2024)

  // Registered accounts
  const [registeredAccounts, setRegisteredAccounts] = useState<
    RegisteredAccount[]
  >([])
  const addRegisteredAccount = () => {
    setRegisteredAccounts((prev) => [...prev, { type: 'RRSP', amount: 0 }])
  }
  const removeRegisteredAccount = (index: number) => {
    setRegisteredAccounts((prev) => prev.filter((_, i) => i !== index))
  }

  // Home sale
  const [willSellHome, setWillSellHome] = useState(false)
  const [homeSaleYear, setHomeSaleYear] = useState(2030)
  const [homeSaleAmount, setHomeSaleAmount] = useState(500000)

  // Rate of return
  const [rateOfReturn, setRateOfReturn] = useState(7) // used if not specifying own rates
  const [specifyOwnRates, setSpecifyOwnRates] = useState(false)
  const [incomeRate, setIncomeRate] = useState(3)
  const [growthRate, setGrowthRate] = useState(3)
  const [inflationRate, setInflationRate] = useState(2)

  // OAS
  const [isReceivingOAS, setIsReceivingOAS] = useState(false)
  const [oasStartAge, setOasStartAge] = useState(65)
  const [oasAnnualAmount, setOasAnnualAmount] = useState(8301)

  // CPP/QPP
  const [isReceivingCPP, setIsReceivingCPP] = useState(false)
  const [cppStartAge, setCppStartAge] = useState(65)
  const [cppAnnualAmount, setCppAnnualAmount] = useState(15000)

  // DB Pension
  const [isReceivingDB, setIsReceivingDB] = useState(false)
  const [dbStartAge, setDbStartAge] = useState(65)
  const [dbAnnualAmount, setDbAnnualAmount] = useState(0)

  // One-off expenses
  const [oneOffExpenses, setOneOffExpenses] = useState<OneOffExpense[]>([])

  // Estate
  const [estateGoal, setEstateGoal] = useState(0)
  const [deathBenefit, setDeathBenefit] = useState(0)

  // Final projection data
  const [projection, setProjection] = useState<Projection>([])
  const [maxWithdrawal, setMaxWithdrawal] = useState(0)

  // Helper to sum a specific account type
  const getAccountTypeTotal = (type: RegisteredAccountType) => {
    return registeredAccounts
      .filter((acc) => acc.type === type)
      .reduce((sum, acc) => sum + acc.amount, 0)
  }

  // Recalculate the projection whenever inputs change
  useEffect(() => {
    recalculateProjection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentAge,
    calculationLifeExpectancy,
    province,
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
    estateGoal,
    deathBenefit,
    oneOffExpenses,
  ])

  const recalculateProjection = () => {
    const totalYears = Math.max(1, calculationLifeExpectancy - currentAge) // Ensure at least 1 year

    // Build array for incomes by "relative year" index 1..N
    const yearlyIncomes = new Array(totalYears + 1).fill(0)

    // Fill in employment income
    for (
      let yr = employmentIncomeStartYear;
      yr <= employmentIncomeEndYear;
      yr++
    ) {
      const index = yr - startYear + 1
      if (index > 0 && index <= totalYears) {
        yearlyIncomes[index] += employmentIncome
      }
    }

    // Fill in other incomes
    otherIncomes.forEach((inc) => {
      for (let yr = inc.startYear; yr <= inc.endYear; yr++) {
        const index = yr - startYear + 1
        if (index > 0 && index <= totalYears) {
          yearlyIncomes[index] += inc.amount
        }
      }
    })

    // Fill in CPP
    const actualCppStartYear = isReceivingCPP ? 1 : cppStartAge - currentAge + 1
    for (let y = actualCppStartYear; y <= totalYears; y++) {
      if (y > 0) {
        yearlyIncomes[y] += cppAnnualAmount
      }
    }

    // Fill in DB pension
    const actualDbStartYear = isReceivingDB ? 1 : dbStartAge - currentAge + 1
    for (let y = actualDbStartYear; y <= totalYears; y++) {
      if (y > 0) {
        yearlyIncomes[y] += dbAnnualAmount
      }
    }

    // OAS
    const actualOasStartYear = isReceivingOAS ? 1 : oasStartAge - currentAge + 1

    // Compute real rates from user inputs
    let realIncomeRate = 0
    let realGrowthRate = 0

    if (specifyOwnRates) {
      const nominalIncomeRate = incomeRate
      const nominalGrowthRate = growthRate
      const sumRates = nominalIncomeRate + nominalGrowthRate // e.g. 8
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
      realIncomeRate = (realReturn * 0.5) / 100
      realGrowthRate = (realReturn * 0.5) / 100
    }

    // initial values from the registered accounts
    const initialRRSP = getAccountTypeTotal('RRSP')
    const initialTFSA = getAccountTypeTotal('TFSA')
    const initialRRIF = getAccountTypeTotal('RRIF')
    const initialLIRA = getAccountTypeTotal('LIRA')
    const initialLIF = getAccountTypeTotal('LIF')

    // Convert calendar year to relative year for home sale
    const actualHomeSaleYear = willSellHome
      ? homeSaleYear - startYear + 1
      : null
    const saleAmount = willSellHome ? homeSaleAmount : 0

    // Create the base projection
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
      oneOffExpenses
    )

    // Estate goal net of deathBenefit
    const targetEstate = Math.max(0, estateGoal - deathBenefit)

    // Find optimal withdrawal
    const { maxWithdrawal, finalBalance } =
      ProjectionLogic.findOptimalWithdrawal(
        baseProjection,
        realIncomeRate,
        realGrowthRate,
        targetEstate
      )
    setMaxWithdrawal(maxWithdrawal)

    // Now compute final projection with that withdrawal
    const finalProj = ProjectionLogic.calculateProjection(
      JSON.parse(JSON.stringify(baseProjection)),
      realIncomeRate,
      realGrowthRate,
      maxWithdrawal
    )
    setProjection([...finalProj])
  }

  // Handler helpers for dynamic arrays
  const addOtherIncome = () => {
    setOtherIncomes((prev) => [
      ...prev,
      {
        startYear,
        endYear: startYear,
        amount: 0,
        description: '',
      },
    ])
  }
  const removeOtherIncome = (index: number) => {
    setOtherIncomes((prev) => prev.filter((_, i) => i !== index))
  }

  const addOneOffExpense = () => {
    setOneOffExpenses((prev) => [
      ...prev,
      {
        year: 1,
        amount: 0,
      },
    ])
  }
  const removeOneOffExpense = (index: number) => {
    setOneOffExpenses((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="calculator">
      <h2>Projection Calculator</h2>

      {/* Basic inputs */}
      <div className="input-group">
        <label>Current Age:</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={currentAge}
          onChange={(e) => {
            const val = e.target.value === '' ? 0 : Number(e.target.value)
            handleCurrentAgeChange(val)
          }}
          min="0"
          max="120"
        />
      </div>

      <div className="input-group">
        <label>Province:</label>
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value as any)}
        >
          <option value="ON">Ontario</option>
          <option value="BC">British Columbia</option>
          <option value="AB">Alberta</option>
          <option value="QC">Quebec</option>
          <option value="MB">Manitoba</option>
          <option value="SK">Saskatchewan</option>
          <option value="NS">Nova Scotia</option>
          <option value="NB">New Brunswick</option>
          <option value="NL">Newfoundland and Labrador</option>
          <option value="PE">Prince Edward Island</option>
          <option value="YT">Yukon</option>
          <option value="NT">Northwest Territories</option>
          <option value="NU">Nunavut</option>
        </select>
      </div>

      <div className="input-group">
        <label>Life Expectancy:</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={lifeExpectancy}
          onChange={(e) => {
            const val = e.target.value === '' ? 0 : Number(e.target.value)
            handleLifeExpectancyChange(val)
          }}
          onBlur={handleLifeExpectancyBlur}
          min={currentAge + 1}
          max="120"
        />
      </div>

      {/* Employment Income */}
      <div className="input-group">
        <h3>Employment Income</h3>
        <label>Annual Amount (before tax):</label>
        <input
          type="number"
          value={employmentIncome}
          onChange={(e) => setEmploymentIncome(Number(e.target.value))}
        />
        <label>Start Year:</label>
        <input
          type="number"
          value={employmentIncomeStartYear}
          onChange={(e) => {
            const val = Number(e.target.value)
            setEmploymentIncomeStartYear(val)
            if (employmentIncomeEndYear < val) {
              setEmploymentIncomeEndYear(val)
            }
          }}
        />
        <label>End Year:</label>
        <input
          type="number"
          value={employmentIncomeEndYear}
          onChange={(e) => {
            const val = Number(e.target.value)
            setEmploymentIncomeEndYear(val)
            if (val < employmentIncomeStartYear) {
              setEmploymentIncomeStartYear(val)
            }
          }}
        />
      </div>

      {/* Other Incomes */}
      <div className="input-group">
        <h3>Other Incomes</h3>
        <button onClick={addOtherIncome}>Add Other Income</button>
        {otherIncomes.map((inc, index) => (
          <div
            key={index}
            style={{
              margin: '10px 0',
              border: '1px solid #444',
              padding: '10px',
            }}
          >
            <label>Amount:</label>
            <input
              type="number"
              value={inc.amount}
              onChange={(e) => {
                const val = Number(e.target.value)
                setOtherIncomes((prev) => {
                  const clone = [...prev]
                  clone[index] = { ...clone[index], amount: val }
                  return clone
                })
              }}
            />
            <label>Start Year:</label>
            <input
              type="number"
              value={inc.startYear}
              onChange={(e) => {
                const val = Number(e.target.value)
                setOtherIncomes((prev) => {
                  const clone = [...prev]
                  if (val > clone[index].endYear) {
                    clone[index].endYear = val
                  }
                  clone[index] = { ...clone[index], startYear: val }
                  return clone
                })
              }}
            />
            <label>End Year:</label>
            <input
              type="number"
              value={inc.endYear}
              onChange={(e) => {
                const val = Number(e.target.value)
                setOtherIncomes((prev) => {
                  const clone = [...prev]
                  if (val < clone[index].startYear) {
                    clone[index].startYear = val
                  }
                  clone[index] = { ...clone[index], endYear: val }
                  return clone
                })
              }}
            />
            <label>Description:</label>
            <input
              type="text"
              value={inc.description || ''}
              onChange={(e) => {
                const val = e.target.value
                setOtherIncomes((prev) => {
                  const clone = [...prev]
                  clone[index] = { ...clone[index], description: val }
                  return clone
                })
              }}
            />
            <button
              style={{ marginLeft: '10px', backgroundColor: 'red' }}
              onClick={() => removeOtherIncome(index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Expenses */}
      <div className="input-group">
        <label>Annual Expenses:</label>
        <input
          type="number"
          value={annualExpenses}
          onChange={(e) => setAnnualExpenses(Number(e.target.value))}
        />
      </div>
      <div className="input-group">
        <label>Annual Healthcare Expenses:</label>
        <input
          type="number"
          value={annualHealthcareExpenses}
          onChange={(e) => setAnnualHealthcareExpenses(Number(e.target.value))}
        />
      </div>
      <div className="input-group">
        <label>
          <input
            type="checkbox"
            checked={useStages}
            onChange={(e) => setUseStages(e.target.checked)}
          />
          Use Retirement Stages
        </label>
        {useStages && (
          <div style={{ marginTop: '10px' }}>
            <h4>Stage 1: Current Age to 75</h4>
            <label>Annual Expenses: </label>
            <input
              type="number"
              value={stageOneExpenses}
              onChange={(e) => setStageOneExpenses(Number(e.target.value))}
            />
            <label>Healthcare: </label>
            <input
              type="number"
              value={stageOneHealthcare}
              onChange={(e) => setStageOneHealthcare(Number(e.target.value))}
            />

            <h4>Stage 2: 76 to 85</h4>
            <label>Annual Expenses: </label>
            <input
              type="number"
              value={stageTwoExpenses}
              onChange={(e) => setStageTwoExpenses(Number(e.target.value))}
            />
            <label>Healthcare: </label>
            <input
              type="number"
              value={stageTwoHealthcare}
              onChange={(e) => setStageTwoHealthcare(Number(e.target.value))}
            />

            <h4>Stage 3: 86+</h4>
            <label>Annual Expenses: </label>
            <input
              type="number"
              value={stageThreeExpenses}
              onChange={(e) => setStageThreeExpenses(Number(e.target.value))}
            />
            <label>Healthcare: </label>
            <input
              type="number"
              value={stageThreeHealthcare}
              onChange={(e) => setStageThreeHealthcare(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      {/* Investments */}
      <div className="input-group">
        <label>Initial Investment (Non-Registered):</label>
        <input
          type="number"
          value={initialInvestment}
          onChange={(e) => setInitialInvestment(Number(e.target.value))}
        />
      </div>
      <div className="input-group">
        <label>Initial Book Value (Non-Registered):</label>
        <input
          type="number"
          value={initialBookValue}
          onChange={(e) => setInitialBookValue(Number(e.target.value))}
        />
      </div>
      <div className="input-group">
        <label>Current Year:</label>
        <input
          type="number"
          value={startYear}
          onChange={(e) => {
            setStartYear(Number(e.target.value))
          }}
        />
      </div>

      {/* Registered Accounts */}
      <div className="input-group">
        <h3>Registered Accounts</h3>
        <button onClick={addRegisteredAccount}>Add Account</button>
        {registeredAccounts.map((acc, idx) => (
          <div
            key={idx}
            style={{
              margin: '10px 0',
              border: '1px solid #444',
              padding: '10px',
            }}
          >
            <label>Type:</label>
            <select
              value={acc.type}
              onChange={(e) => {
                const val = e.target.value as RegisteredAccountType
                setRegisteredAccounts((prev) => {
                  const clone = [...prev]
                  clone[idx] = { ...clone[idx], type: val }
                  return clone
                })
              }}
            >
              <option value="RRSP">RRSP</option>
              <option value="TFSA">TFSA</option>
              <option value="RRIF">RRIF</option>
              <option value="LIRA">LIRA</option>
              <option value="LIF">LIF</option>
            </select>
            <label>Amount:</label>
            <input
              type="number"
              value={acc.amount}
              onChange={(e) => {
                const val = Number(e.target.value)
                setRegisteredAccounts((prev) => {
                  const clone = [...prev]
                  clone[idx] = { ...clone[idx], amount: val }
                  return clone
                })
              }}
            />
            <button
              style={{ marginLeft: '10px', backgroundColor: 'red' }}
              onClick={() => removeRegisteredAccount(idx)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Home sale */}
      <div className="input-group">
        <label>
          <input
            type="checkbox"
            checked={willSellHome}
            onChange={(e) => setWillSellHome(e.target.checked)}
          />
          Plan to sell home
        </label>
        {willSellHome && (
          <div style={{ marginTop: '10px' }}>
            <label>Sale Year:</label>
            <input
              type="number"
              value={homeSaleYear}
              onChange={(e) => setHomeSaleYear(Number(e.target.value))}
            />
            <label>Sale Amount:</label>
            <input
              type="number"
              value={homeSaleAmount}
              onChange={(e) => setHomeSaleAmount(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      {/* Rate of Return */}
      <div className="input-group">
        <label>Investment Risk Profile (Total %):</label>
        <select
          value={rateOfReturn}
          onChange={(e) => setRateOfReturn(Number(e.target.value))}
          disabled={specifyOwnRates}
        >
          <option value="5">Risk Averse (5%)</option>
          <option value="6">Conservative (6%)</option>
          <option value="7">Moderate (7%)</option>
          <option value="8">Aggressive (8%)</option>
          <option value="9">Speculative (9%)</option>
        </select>
        <p style={{ margin: '5px 0' }}>
          (If growth ~4% and investment income ~3%, pick 7%).
        </p>
        <label>
          <input
            type="checkbox"
            checked={specifyOwnRates}
            onChange={(e) => setSpecifyOwnRates(e.target.checked)}
          />
          I would like to specify my own rates
        </label>
        {specifyOwnRates && (
          <div style={{ marginTop: '10px' }}>
            <label>Income Return (%):</label>
            <input
              type="number"
              value={incomeRate}
              onChange={(e) => setIncomeRate(Number(e.target.value))}
            />
            <label>Growth Return (%):</label>
            <input
              type="number"
              value={growthRate}
              onChange={(e) => setGrowthRate(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      <div className="input-group">
        <label>Estimated Inflation (%):</label>
        <input
          type="number"
          value={inflationRate}
          onChange={(e) => setInflationRate(Number(e.target.value))}
        />
      </div>

      {/* OAS */}
      <div className="input-group">
        <h3>Old Age Security (OAS)</h3>
        <label>
          <input
            type="checkbox"
            checked={isReceivingOAS}
            onChange={(e) => setIsReceivingOAS(e.target.checked)}
          />
          Currently receiving OAS
        </label>
        {!isReceivingOAS && (
          <div style={{ marginTop: '10px' }}>
            <label>OAS Start Age:</label>
            <input
              type="number"
              value={oasStartAge}
              onChange={(e) => setOasStartAge(Number(e.target.value))}
            />
          </div>
        )}
        <label>Annual OAS Amount:</label>
        <input
          type="number"
          value={oasAnnualAmount}
          onChange={(e) => setOasAnnualAmount(Number(e.target.value))}
        />
      </div>

      {/* CPP/QPP */}
      <div className="input-group">
        <h3>CPP/QPP</h3>
        <label>
          <input
            type="checkbox"
            checked={isReceivingCPP}
            onChange={(e) => setIsReceivingCPP(e.target.checked)}
          />
          Currently receiving CPP/QPP
        </label>
        {!isReceivingCPP && (
          <div style={{ marginTop: '10px' }}>
            <label>CPP Start Age:</label>
            <input
              type="number"
              value={cppStartAge}
              onChange={(e) => setCppStartAge(Number(e.target.value))}
            />
          </div>
        )}
        <label>Annual CPP/QPP Amount:</label>
        <input
          type="number"
          value={cppAnnualAmount}
          onChange={(e) => setCppAnnualAmount(Number(e.target.value))}
        />
      </div>

      {/* DB Pension */}
      <div className="input-group">
        <h3>Defined Benefit (DB) Pension</h3>
        <label>
          <input
            type="checkbox"
            checked={isReceivingDB}
            onChange={(e) => setIsReceivingDB(e.target.checked)}
          />
          Currently receiving DB Pension
        </label>
        {!isReceivingDB && (
          <div style={{ marginTop: '10px' }}>
            <label>DB Start Age:</label>
            <input
              type="number"
              value={dbStartAge}
              onChange={(e) => setDbStartAge(Number(e.target.value))}
            />
          </div>
        )}
        <label>Annual DB Pension Amount:</label>
        <input
          type="number"
          value={dbAnnualAmount}
          onChange={(e) => setDbAnnualAmount(Number(e.target.value))}
        />
      </div>

      {/* One-off expenses */}
      <div className="input-group">
        <h3>One-off Expenses</h3>
        <button onClick={addOneOffExpense}>Add One-off Expense</button>
        {oneOffExpenses.map((exp, idx) => {
          // Convert relative year to actual calendar year for display
          const calendarYear = startYear + exp.year - 1
          return (
            <div
              key={idx}
              style={{
                margin: '10px 0',
                border: '1px solid #444',
                padding: '10px',
              }}
            >
              <label>Calendar Year:</label>
              <input
                type="number"
                value={calendarYear}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  const relativeYear = val - startYear + 1
                  setOneOffExpenses((prev) => {
                    const clone = [...prev]
                    clone[idx] = { ...clone[idx], year: relativeYear }
                    return clone
                  })
                }}
              />
              <label>Amount:</label>
              <input
                type="number"
                value={exp.amount}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setOneOffExpenses((prev) => {
                    const clone = [...prev]
                    clone[idx] = { ...clone[idx], amount: val }
                    return clone
                  })
                }}
              />
              <label>Description:</label>
              <input
                type="text"
                value={exp.description || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setOneOffExpenses((prev) => {
                    const clone = [...prev]
                    clone[idx] = { ...clone[idx], description: val }
                    return clone
                  })
                }}
              />
              <button
                style={{ marginLeft: '10px', backgroundColor: 'red' }}
                onClick={() => removeOneOffExpense(idx)}
              >
                Remove
              </button>
            </div>
          )
        })}
      </div>

      {/* Estate Goal */}
      <div className="input-group">
        <label>Amount to Leave to Heirs (Estate Goal):</label>
        <input
          type="number"
          value={estateGoal}
          onChange={(e) => setEstateGoal(Number(e.target.value))}
        />
      </div>
      <div className="input-group">
        <label>Death Benefit (Insurance):</label>
        <input
          type="number"
          value={deathBenefit}
          onChange={(e) => setDeathBenefit(Number(e.target.value))}
        />
      </div>

      {/* Results */}
      <div style={{ marginTop: '20px' }}>
        <h3>Results</h3>
        <p>
          Based on your inputs, the maximum initial lump-sum withdrawal you can
          take (while still targeting an estate of at least {estateGoal} minus
          death benefit of {deathBenefit}) is:
          <br />
          <strong>{ProjectionLogic.formatMoney(maxWithdrawal)}</strong>
        </p>
      </div>

      {/* Chart */}
      <ProjectionChart projection={projection} />

      {/* Table */}
      <ProjectionTable projection={projection} />
    </div>
  )
}

export default Calculator
