// UISchemaConverter.ts

// 1) Map the UI's province names to the back-end province codes.
const provinceMap: Record<string, string> = {
    "Alberta": "AB",
    "British Columbia": "BC",
    "Manitoba": "MB",
    "New Brunswick": "NB",
    "Newfoundland & Labrador": "NL",
    "Nova Scotia": "NS",
    "Nunavut": "NU",
    "Ontario": "ON",
    "Prince Edward Island": "PE",
    "Saskatchewan": "SK",
    "Quebec": "QC",
    "Yukon": "YT",
    // If you want to handle Northwest Territories (not in your front-end schema, but in your back-end type):
    "Northwest Territories": "NT",
  };
  
  export const convertUISchema = (uiSchema: string): string => {
    const currentYear = new Date().getFullYear();
    const data = JSON.parse(uiSchema);
  
    // Helper to map UI province -> back-end "Province" code
    function mapProvince(uiProvince: string): string {
      return provinceMap[uiProvince] || "ON"; 
      // Fallback to "ON" or throw an error if not found
    }
  
    // 1) Identify "self" and (optionally) "spouse"
    const selfPerson = data.persons.find((p: any) => p.personType === "self");
    if (!selfPerson) {
      throw new Error("No 'self' person found in data.");
    }
    const spousePerson = data.persons.find((p: any) => p.personType === "spouse");
    const hasSpouse = !!(data.calculateForSpouse && spousePerson);
  
    // 2) Convert birthYear -> currentAge
    const getCurrentAge = (birthYear?: number) =>
      birthYear ? currentYear - birthYear : 0;
  
    const selfCurrentAge = getCurrentAge(selfPerson.birthYear);
    const selfLifeExpectancy = selfPerson.lifeExpectancy ?? 90;
  
    let spouseCurrentAge = 0;
    let spouseLifeExpectancy = 0;
    if (hasSpouse && spousePerson) {
      spouseCurrentAge = getCurrentAge(spousePerson.birthYear);
      spouseLifeExpectancy = spousePerson.lifeExpectancy ?? 90;
    }
  
    // 3) Convert main rates
    const specifyOwnRates = data.specifyReturn === true;
    // Remember the front-end uses decimals (e.g. 0.05 for 5%), 
    // while the back-end wants whole numbers (e.g. 5 for 5%).
    const rateOfReturn = Math.round((data.investmentReturnRate ?? 0.05) * 100);
    const inflationRate = Math.round((data.inflationRate ?? 0.025) * 100);
    const incomeRate = specifyOwnRates
      ? Math.round((data.incomeReturnRate ?? 0) * 100)
      : 0;
    const growthRate = specifyOwnRates
      ? Math.round((data.growthReturnRate ?? 0) * 100)
      : 0;
  
    // 4) Employment income
    const employmentIncome = selfPerson.primaryYearlyIncome ?? 0;
    const employmentIncomeStartYear = selfPerson.incomeYearStart ?? currentYear;
    const employmentIncomeEndYear = selfPerson.incomeYearEnd ?? currentYear;
  
    let spouseEmploymentIncome = 0;
    let spouseEmploymentIncomeStartYear = 0;
    let spouseEmploymentIncomeEndYear = 0;
    if (hasSpouse && spousePerson) {
      spouseEmploymentIncome = spousePerson.primaryYearlyIncome ?? 0;
      spouseEmploymentIncomeStartYear = spousePerson.incomeYearStart ?? currentYear;
      spouseEmploymentIncomeEndYear = spousePerson.incomeYearEnd ?? currentYear;
    }
  
    // 5) Other incomes: separate self vs. spouse
    const allOtherIncomes = data.otherIncomes ?? [];
    const otherIncomes = allOtherIncomes
      .filter((inc: any) => inc.personType === "self")
      .map((inc: any) => ({
        startYear: inc.startYear ?? currentYear,
        endYear: inc.endYear ?? currentYear,
        amount: inc.amount ?? 0,
        description: inc.description ?? "",
      }));
  
    const spouseOtherIncomes = hasSpouse
      ? allOtherIncomes
          .filter((inc: any) => inc.personType === "spouse")
          .map((inc: any) => ({
            startYear: inc.startYear ?? currentYear,
            endYear: inc.endYear ?? currentYear,
            amount: inc.amount ?? 0,
            description: inc.description ?? "",
          }))
      : [];
  
    // 6) Expenses: combine (or keep separate if stages)
    const annualExpenses = (selfPerson.annualRetirementExpenses ?? 0) +
      (hasSpouse ? spousePerson.annualRetirementExpenses ?? 0 : 0);
  
    const annualHealthcareExpenses = (selfPerson.healthCareExpenses ?? 0) +
      (hasSpouse ? spousePerson.healthCareExpenses ?? 0 : 0);
  
    const useStages = !!(
      data.expensesChangeForEachStage ||
      data.expensesChangeForEachStageSpouse
    );
  
    const stageOneExpenses =
      (selfPerson.annualRetirementExpenses ?? 0) +
      (hasSpouse ? spousePerson.annualRetirementExpenses ?? 0 : 0);
    const stageOneHealthcare =
      (selfPerson.healthCareExpenses ?? 0) +
      (hasSpouse ? spousePerson.healthCareExpenses ?? 0 : 0);
  
    const stageTwoExpenses =
      (selfPerson.annualRetirementExpensesStage2 ?? 0) +
      (hasSpouse ? spousePerson.annualRetirementExpensesStage2 ?? 0 : 0);
    const stageTwoHealthcare =
      (selfPerson.healthCareExpensesStage2 ?? 0) +
      (hasSpouse ? spousePerson.healthCareExpensesStage2 ?? 0 : 0);
  
    const stageThreeExpenses =
      (selfPerson.annualRetirementExpensesStage3 ?? 0) +
      (hasSpouse ? spousePerson.annualRetirementExpensesStage3 ?? 0 : 0);
    const stageThreeHealthcare =
      (selfPerson.healthCareExpensesStage3 ?? 0) +
      (hasSpouse ? spousePerson.healthCareExpensesStage3 ?? 0 : 0);
  
    // 7) One-off expenses:
    //    The back-end `OneOffExpense` uses "year" as an integer, but 
    //    your code sample treats it as a calendar year. We'll pass 
    //    the UI's year directly, and let the back-end logic do (year - startYear + 1).
    let oneOffExpenses = (data.oneOffExpenses ?? []).map((exp: any) => ({
      year: exp.year ?? currentYear,
      amount: exp.amount ?? 0,
      description: exp.description ?? "",
    }));
  
    // 8) Non-registered investments
    const initialInvestment =
      (selfPerson.nonRegisteredInvestmentValue ?? 0) +
      (hasSpouse ? spousePerson.nonRegisteredInvestmentValue ?? 0 : 0);
    const initialBookValue =
      (selfPerson.nonRegisteredInvestmentBookValue ?? 0) +
      (hasSpouse ? spousePerson.nonRegisteredInvestmentBookValue ?? 0 : 0);
  
    // 9) Registered accounts
    function mapRegisteredInvestments(arr: any[] | undefined) {
      if (!arr) return [];
      return arr.map((ri) => ({
        type: ri.accountType ?? "RRSP",
        amount: ri.currentValue ?? 0,
      }));
    }
    const selfRegistered = mapRegisteredInvestments(selfPerson.registeredInvestments);
    const spouseRegistered = hasSpouse
      ? mapRegisteredInvestments(spousePerson.registeredInvestments)
      : [];
    const allRegisteredAccounts = [...selfRegistered, ...spouseRegistered];
  
    // 10) Home sale
    const willSellHome = !!data.primaryResidenceSell;
    const homeSaleYear = data.primaryResidenceSellYear ?? 0;
    const homeSaleAmount = data.primaryResidenceValue ?? 0;
  
    // 11) Estate + Insurance
    const estateGoal = data.desiredEstateValue ?? 0;
    const selfDeathBenefit = selfPerson.lifeInsuranceDeathBenefit ?? 0;
    const spouseDeathBenefit =
      hasSpouse && spousePerson.lifeInsuranceDeathBenefit
        ? spousePerson.lifeInsuranceDeathBenefit
        : 0;
    const deathBenefit = selfDeathBenefit + spouseDeathBenefit;
  
    // 12) OAS/CPP/DB for self
    const isReceivingCPP = !!(selfPerson.cppAmount && selfPerson.cppAmount > 0);
    const cppStartAge = selfPerson.cppStartAge
      ? selfPerson.cppStartAge
      : selfPerson.cppStartYear && selfPerson.birthYear
      ? selfPerson.cppStartYear - selfPerson.birthYear
      : 65;
  
    const isReceivingOAS = !!(selfPerson.oasAmount && selfPerson.oasAmount > 0);
    const oasStartAge = selfPerson.oasStartAge
      ? selfPerson.oasStartAge
      : selfPerson.oasStartYear && selfPerson.birthYear
      ? selfPerson.oasStartYear - selfPerson.birthYear
      : 65;
  
    const isReceivingDB = !!(
      selfPerson.definedBenefitPensionAmount &&
      selfPerson.definedBenefitPensionAmount > 0
    );
    const dbStartAge = selfPerson.definedBenefitPensionStartAge
      ? selfPerson.definedBenefitPensionStartAge
      : selfPerson.definedBenefitPensionStartYear && selfPerson.birthYear
      ? selfPerson.definedBenefitPensionStartYear - selfPerson.birthYear
      : 65;
  
    // 13) OAS/CPP/DB for spouse
    let spouseIsReceivingCPP = false;
    let spouseCppStartAge = 65;
    let spouseIsReceivingOAS = false;
    let spouseOasStartAge = 65;
    let spouseIsReceivingDB = false;
    let spouseDbStartAge = 65;
    let spouseDbAnnualAmount = 0;
    let spouseCppAnnualAmount = 0;
    let spouseOasAnnualAmount = 0;
    let spouseIsDBIndexed = false;
  
    if (hasSpouse && spousePerson) {
      spouseIsReceivingCPP = !!(
        spousePerson.cppAmount && spousePerson.cppAmount > 0
      );
      spouseCppStartAge = spousePerson.cppStartAge
        ? spousePerson.cppStartAge
        : spousePerson.cppStartYear && spousePerson.birthYear
        ? spousePerson.cppStartYear - spousePerson.birthYear
        : 65;
  
      spouseIsReceivingOAS = !!(
        spousePerson.oasAmount && spousePerson.oasAmount > 0
      );
      spouseOasStartAge = spousePerson.oasStartAge
        ? spousePerson.oasStartAge
        : spousePerson.oasStartYear && spousePerson.birthYear
        ? spousePerson.oasStartYear - spousePerson.birthYear
        : 65;
  
      spouseIsReceivingDB = !!(
        spousePerson.definedBenefitPensionAmount &&
        spousePerson.definedBenefitPensionAmount > 0
      );
      spouseDbStartAge = spousePerson.definedBenefitPensionStartAge
        ? spousePerson.definedBenefitPensionStartAge
        : spousePerson.definedBenefitPensionStartYear && spousePerson.birthYear
        ? spousePerson.definedBenefitPensionStartYear - spousePerson.birthYear
        : 65;
  
      spouseDbAnnualAmount = spousePerson.definedBenefitPensionAmount ?? 0;
      spouseCppAnnualAmount = spousePerson.cppAmount ?? 0;
      spouseOasAnnualAmount = spousePerson.oasAmount ?? 0;
      spouseIsDBIndexed = spousePerson.definedBenefitPensionIndexedToInflation ?? false;
    }
  
    // 14) Build final object
    //     Typically startYear is the current year or earliest retirement year
    const startYear = currentYear;
  
    const result = {
      // Primary
      currentAge: selfCurrentAge,
      province: mapProvince(data.province),
      lifeExpectancy: selfLifeExpectancy,
  
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
  
      registeredAccounts: allRegisteredAccounts,
  
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
      oasAnnualAmount: selfPerson.oasAmount ?? 0,
  
      isReceivingCPP,
      cppStartAge,
      cppAnnualAmount: selfPerson.cppAmount ?? 0,
  
      isReceivingDB,
      dbStartAge,
      dbAnnualAmount: selfPerson.definedBenefitPensionAmount ?? 0,
      isDBIndexed: selfPerson.definedBenefitPensionIndexedToInflation ?? false,
  
      oneOffExpenses,
  
      estateGoal,
      deathBenefit,
  
      // Spouse fields
      hasSpouse,
      spouseCurrentAge,
      spouseLifeExpectancy,
  
      spouseEmploymentIncome,
      spouseEmploymentIncomeStartYear,
      spouseEmploymentIncomeEndYear,
  
      spouseOtherIncomes,
  
      spouseIsReceivingOAS,
      spouseOasStartAge,
      spouseOasAnnualAmount,
  
      spouseIsReceivingCPP,
      spouseCppStartAge,
      spouseCppAnnualAmount,
  
      spouseIsReceivingDB,
      spouseDbStartAge,
      spouseDbAnnualAmount,
      spouseIsDBIndexed,
  
      // If you do stage-based expenses for spouse separately
      spouseAnnualExpenses: hasSpouse ? spousePerson.annualRetirementExpenses ?? 0 : 0,
      spouseAnnualHealthcareExpenses: hasSpouse ? spousePerson.healthCareExpenses ?? 0 : 0,
      spouseUseStages: data.expensesChangeForEachStageSpouse ?? false,
      spouseStageOneExpenses: hasSpouse ? spousePerson.annualRetirementExpenses ?? 0 : 0,
      spouseStageOneHealthcare: hasSpouse ? spousePerson.healthCareExpenses ?? 0 : 0,
      spouseStageTwoExpenses: hasSpouse ? spousePerson.annualRetirementExpensesStage2 ?? 0 : 0,
      spouseStageTwoHealthcare: hasSpouse ? spousePerson.healthCareExpensesStage2 ?? 0 : 0,
      spouseStageThreeExpenses: hasSpouse ? spousePerson.annualRetirementExpensesStage3 ?? 0 : 0,
      spouseStageThreeHealthcare: hasSpouse ? spousePerson.healthCareExpensesStage3 ?? 0 : 0,
  
      spouseOneOffExpenses: hasSpouse
        ? (data.oneOffExpenses ?? [])
            .filter((exp: any) => exp.personType === "spouse")
            .map((exp: any) => ({
              year: exp.year ?? currentYear,
              amount: exp.amount ?? 0,
              description: exp.description ?? "",
            }))
        : [],
    };
  
    return JSON.stringify(result, null, 2);
  };
  