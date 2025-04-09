import axios from 'axios';

interface TaxBracket {
  min: number;
  max?: number;
  rate: number;
}

interface TaxData {
  stateTaxRate: number;
  taxBrackets: TaxBracket[];
  effectiveTaxRate: number;
  estimatedAnnualTax: number;
  specialNotes?: string;
  federalTaxRate: number;
  deductions: Array<{
    type: string;
    amount: number;
  }>;
}

export async function getStateTaxRates(state: string, annualIncome: number = 100000): Promise<TaxData> {
  return {
    stateTaxRate: 30,
    effectiveTaxRate: 30,
    taxBrackets: [{ min: 0, rate: 30 }],
    estimatedAnnualTax: (annualIncome * 30) / 100,
    specialNotes: 'Flat 30% tax rate applied',
    federalTaxRate: calculateFederalTaxRate(annualIncome),
    deductions: [
      { type: 'Standard Deduction', amount: 12950 },
      { type: 'Estimated Healthcare', amount: 2500 }
    ]
  };
}

function calculateEffectiveTaxRate(brackets: TaxBracket[], income: number): number {
  if (!brackets.length) return 0;
  
  let taxOwed = 0;
  let remainingIncome = income;

  // Sort brackets by minimum income
  const sortedBrackets = [...brackets].sort((a, b) => a.min - b.min);

  for (const bracket of sortedBrackets) {
    const bracketMax = bracket.max || Infinity;
    const taxableAmount = Math.min(remainingIncome, bracketMax - bracket.min);
    
    if (taxableAmount <= 0) break;
    
    taxOwed += taxableAmount * (bracket.rate / 100);
    remainingIncome -= taxableAmount;
    
    if (remainingIncome <= 0) break;
  }

  return Number(((taxOwed / income) * 100).toFixed(2));
}

/**
 * Calculate federal tax rate based on income (simplified 2023 brackets)
 */
/**
 * Provides static tax data for all states
 * This serves as a reliable fallback when APIs are unavailable
 */
function getStaticTaxData(state: string): { baseRate: number; brackets: TaxBracket[]; notes?: string } {
  // State tax information (2023 data)
  const stateTaxInfo: { [key: string]: { baseRate: number; brackets: TaxBracket[]; notes?: string } } = {
    'AL': {
      baseRate: 5,
      brackets: [
        { min: 0, max: 500, rate: 2 },
        { min: 501, max: 3000, rate: 4 },
        { min: 3001, max: Infinity, rate: 5 }
      ],
      notes: 'Alabama has a standard deduction of $2,500 for single filers.'
    },
    'AK': {
      baseRate: 0,
      brackets: [{ min: 0, rate: 0 }],
      notes: 'Alaska has no state income tax.'
    },
    'AZ': {
      baseRate: 2.5,
      brackets: [{ min: 0, rate: 2.5 }],
      notes: 'Arizona has a flat income tax rate.'
    },
    'AR': {
      baseRate: 4.9,
      brackets: [{ min: 0, rate: 4.9 }],
      notes: 'Arkansas implemented a flat tax in 2023.'
    },
    'CA': {
      baseRate: 9.3,
      brackets: [
        { min: 0, max: 10099, rate: 1 },
        { min: 10100, max: 23942, rate: 2 },
        { min: 23943, max: 37788, rate: 4 },
        { min: 37789, max: 52455, rate: 6 },
        { min: 52456, max: 66295, rate: 8 },
        { min: 66296, max: 338639, rate: 9.3 },
        { min: 338640, max: 406364, rate: 10.3 },
        { min: 406365, max: 677275, rate: 11.3 },
        { min: 677276, max: Infinity, rate: 12.3 }
      ],
      notes: 'California has the highest top marginal income tax rate in the country.'
    },
    'CO': {
      baseRate: 4.4,
      brackets: [{ min: 0, rate: 4.4 }],
      notes: 'Colorado has a flat tax rate on federal taxable income.'
    },
    'CT': {
      baseRate: 5.5,
      brackets: [
        { min: 0, max: 10000, rate: 3 },
        { min: 10001, max: 50000, rate: 5 },
        { min: 50001, max: 100000, rate: 5.5 },
        { min: 100001, max: 200000, rate: 6 },
        { min: 200001, max: 250000, rate: 6.5 },
        { min: 250001, max: 500000, rate: 6.9 },
        { min: 500001, max: Infinity, rate: 6.99 }
      ]
    },
    'DE': {
      baseRate: 6.6,
      brackets: [
        { min: 0, max: 2000, rate: 0 },
        { min: 2001, max: 5000, rate: 2.2 },
        { min: 5001, max: 10000, rate: 3.9 },
        { min: 10001, max: 20000, rate: 4.8 },
        { min: 20001, max: 25000, rate: 5.2 },
        { min: 25001, max: 60000, rate: 5.55 },
        { min: 60001, max: Infinity, rate: 6.6 }
      ]
    },
    'FL': {
      baseRate: 0,
      brackets: [{ min: 0, rate: 0 }],
      notes: 'Florida has no state income tax.'
    },
    'GA': {
      baseRate: 5.75,
      brackets: [{ min: 0, rate: 5.75 }],
      notes: 'Georgia implemented a flat tax in 2023.'
    },
    'HI': {
      baseRate: 8.25,
      brackets: [
        { min: 0, max: 2400, rate: 1.4 },
        { min: 2401, max: 4800, rate: 3.2 },
        { min: 4801, max: 9600, rate: 5.5 },
        { min: 9601, max: 14400, rate: 6.4 },
        { min: 14401, max: 19200, rate: 6.8 },
        { min: 19201, max: 24000, rate: 7.2 },
        { min: 24001, max: 36000, rate: 7.6 },
        { min: 36001, max: 48000, rate: 7.9 },
        { min: 48001, max: 150000, rate: 8.25 },
        { min: 150001, max: 175000, rate: 9 },
        { min: 175001, max: 200000, rate: 10 },
        { min: 200001, max: Infinity, rate: 11 }
      ]
    },
    'ID': {
      baseRate: 5.8,
      brackets: [{ min: 0, rate: 5.8 }],
      notes: 'Idaho has a flat tax rate as of 2023.'
    },
    'IL': {
      baseRate: 4.95,
      brackets: [{ min: 0, rate: 4.95 }],
      notes: 'Illinois has a flat tax rate.'
    },
    'IN': {
      baseRate: 3.15,
      brackets: [{ min: 0, rate: 3.15 }],
      notes: 'Indiana has a flat tax rate. Counties may charge an additional income tax.'
    },
    'IA': {
      baseRate: 6,
      brackets: [
        { min: 0, max: 6000, rate: 4.4 },
        { min: 6001, max: 30000, rate: 4.82 },
        { min: 30001, max: 75000, rate: 5.7 },
        { min: 75001, max: Infinity, rate: 6 }
      ]
    },
    'KS': {
      baseRate: 5.7,
      brackets: [
        { min: 0, max: 15000, rate: 3.1 },
        { min: 15001, max: 30000, rate: 5.25 },
        { min: 30001, max: Infinity, rate: 5.7 }
      ]
    },
    'KY': {
      baseRate: 4.5,
      brackets: [{ min: 0, rate: 4.5 }],
      notes: 'Kentucky has a flat tax rate as of 2023.'
    },
    'LA': {
      baseRate: 4.25,
      brackets: [
        { min: 0, max: 12500, rate: 1.85 },
        { min: 12501, max: 50000, rate: 3.5 },
        { min: 50001, max: Infinity, rate: 4.25 }
      ]
    },
    'ME': {
      baseRate: 7.15,
      brackets: [
        { min: 0, max: 23000, rate: 5.8 },
        { min: 23001, max: 54450, rate: 6.75 },
        { min: 54451, max: Infinity, rate: 7.15 }
      ]
    },
    'MD': {
      baseRate: 5.75,
      brackets: [
        { min: 0, max: 1000, rate: 2 },
        { min: 1001, max: 2000, rate: 3 },
        { min: 2001, max: 3000, rate: 4 },
        { min: 3001, max: 100000, rate: 4.75 },
        { min: 100001, max: 125000, rate: 5 },
        { min: 125001, max: 150000, rate: 5.25 },
        { min: 150001, max: 250000, rate: 5.5 },
        { min: 250001, max: Infinity, rate: 5.75 }
      ]
    },
    'MA': {
      baseRate: 5,
      brackets: [{ min: 0, rate: 5 }],
      notes: 'Massachusetts has a flat tax rate.'
    },
    'MI': {
      baseRate: 4.25,
      brackets: [{ min: 0, rate: 4.25 }],
      notes: 'Michigan has a flat tax rate.'
    },
    'MN': {
      baseRate: 7.85,
      brackets: [
        { min: 0, max: 28080, rate: 5.35 },
        { min: 28081, max: 92230, rate: 6.8 },
        { min: 92231, max: 171220, rate: 7.85 },
        { min: 171221, max: Infinity, rate: 9.85 }
      ]
    },
    'MS': {
      baseRate: 5,
      brackets: [{ min: 0, rate: 5 }],
      notes: 'Mississippi implemented a flat tax in 2023.'
    },
    'MO': {
      baseRate: 5.3,
      brackets: [
        { min: 0, max: 1088, rate: 0 },
        { min: 1089, max: 2176, rate: 1.5 },
        { min: 2177, max: 3264, rate: 2 },
        { min: 3265, max: 4352, rate: 2.5 },
        { min: 4353, max: 5440, rate: 3 },
        { min: 5441, max: 6528, rate: 3.5 },
        { min: 6529, max: 7616, rate: 4 },
        { min: 7617, max: 8704, rate: 4.5 },
        { min: 8705, max: Infinity, rate: 5.3 }
      ]
    },
    'MT': {
      baseRate: 6.75,
      brackets: [
        { min: 0, max: 3300, rate: 1 },
        { min: 3301, max: 5800, rate: 2 },
        { min: 5801, max: 8900, rate: 3 },
        { min: 8901, max: 12000, rate: 4 },
        { min: 12001, max: 15400, rate: 5 },
        { min: 15401, max: 19800, rate: 6 },
        { min: 19801, max: Infinity, rate: 6.75 }
      ]
    },
    'NE': {
      baseRate: 6.84,
      brackets: [
        { min: 0, max: 3340, rate: 2.46 },
        { min: 3341, max: 19990, rate: 3.51 },
        { min: 19991, max: 32210, rate: 5.01 },
        { min: 32211, max: Infinity, rate: 6.84 }
      ]
    },
    'NV': {
      baseRate: 0,
      brackets: [{ min: 0, rate: 0 }],
      notes: 'Nevada has no state income tax.'
    },
    'NH': {
      baseRate: 5,
      brackets: [{ min: 0, rate: 5 }],
      notes: 'New Hampshire only taxes interest and dividend income, not salary or wages.'
    },
    'NJ': {
      baseRate: 5.525,
      brackets: [
        { min: 0, max: 20000, rate: 1.4 },
        { min: 20001, max: 35000, rate: 1.75 },
        { min: 35001, max: 40000, rate: 3.5 },
        { min: 40001, max: 75000, rate: 5.525 },
        { min: 75001, max: 500000, rate: 6.37 },
        { min: 500001, max: 1000000, rate: 8.97 },
        { min: 1000001, max: Infinity, rate: 10.75 }
      ]
    },
    'NM': {
      baseRate: 5.9,
      brackets: [
        { min: 0, max: 5500, rate: 1.7 },
        { min: 5501, max: 11000, rate: 3.2 },
        { min: 11001, max: 16000, rate: 4.7 },
        { min: 16001, max: 210000, rate: 4.9 },
        { min: 210001, max: Infinity, rate: 5.9 }
      ]
    },
    'NY': {
      baseRate: 6.33,
      brackets: [
        { min: 0, max: 8500, rate: 4 },
        { min: 8501, max: 11700, rate: 4.5 },
        { min: 11701, max: 13900, rate: 5.25 },
        { min: 13901, max: 80650, rate: 5.85 },
        { min: 80651, max: 215400, rate: 6.25 },
        { min: 215401, max: 1077550, rate: 6.85 },
        { min: 1077551, max: 5000000, rate: 9.65 },
        { min: 5000001, max: 25000000, rate: 10.3 },
        { min: 25000001, max: Infinity, rate: 10.9 }
      ],
      notes: 'New York City residents pay additional city income tax.'
    },
    'NC': {
      baseRate: 4.75,
      brackets: [{ min: 0, rate: 4.75 }],
      notes: 'North Carolina has a flat tax rate.'
    },
    'ND': {
      baseRate: 2.9,
      brackets: [
        { min: 0, max: 40525, rate: 1.1 },
        { min: 40526, max: 98100, rate: 2.04 },
        { min: 98101, max: 204675, rate: 2.27 },
        { min: 204676, max: 445000, rate: 2.64 },
        { min: 445001, max: Infinity, rate: 2.9 }
      ]
    },
    'OH': {
      baseRate: 3.99,
      brackets: [
        { min: 0, max: 25000, rate: 2.75 },
        { min: 25001, max: 44250, rate: 3.23 },
        { min: 44251, max: 88450, rate: 3.71 },
        { min: 88451, max: 110650, rate: 3.99 },
        { min: 110651, max: Infinity, rate: 3.99 }
      ]
    },
    'OK': {
      baseRate: 4.75,
      brackets: [
        { min: 0, max: 7200, rate: 0.25 },
        { min: 7201, max: 8700, rate: 0.75 },
        { min: 8701, max: 9800, rate: 1.75 },
        { min: 9801, max: 12200, rate: 2.75 },
        { min: 12201, max: 15000, rate: 3.75 },
        { min: 15001, max: Infinity, rate: 4.75 }
      ]
    },
    'OR': {
      baseRate: 9.9,
      brackets: [
        { min: 0, max: 3650, rate: 4.75 },
        { min: 3651, max: 9200, rate: 6.75 },
        { min: 9201, max: 125000, rate: 8.75 },
        { min: 125001, max: Infinity, rate: 9.9 }
      ],
      notes: 'Oregon has no state sales tax, which partially offsets high income tax rates.'
    },
    'PA': {
      baseRate: 3.07,
      brackets: [{ min: 0, rate: 3.07 }],
      notes: 'Pennsylvania has a flat tax rate.'
    },
    'RI': {
      baseRate: 5.99,
      brackets: [
        { min: 0, max: 68200, rate: 3.75 },
        { min: 68201, max: 155050, rate: 4.75 },
        { min: 155051, max: Infinity, rate: 5.99 }
      ]
    },
    'SC': {
      baseRate: 6.5,
      brackets: [
        { min: 0, max: 3200, rate: 0 },
        { min: 3201, max: 16040, rate: 3 },
        { min: 16041, max: Infinity, rate: 6.5 }
      ]
    },
    'SD': {
      baseRate: 0,
      brackets: [{ min: 0, rate: 0 }],
      notes: 'South Dakota has no state income tax.'
    },
    'TN': {
      baseRate: 0,
      brackets: [{ min: 0, rate: 0 }],
      notes: 'Tennessee has no income tax on wages and salaries.'
    },
    'TX': {
      baseRate: 0,
      brackets: [{ min: 0, rate: 0 }],
      notes: 'Texas has no state income tax.'
    },
    'UT': {
      baseRate: 4.85,
      brackets: [{ min: 0, rate: 4.85 }],
      notes: 'Utah has a flat tax rate.'
    },
    'VT': {
      baseRate: 6.6,
      brackets: [
        { min: 0, max: 42150, rate: 3.35 },
        { min: 42151, max: 102200, rate: 6.6 },
        { min: 102201, max: 213150, rate: 7.6 },
        { min: 213151, max: Infinity, rate: 8.75 }
      ]
    },
    'VA': {
      baseRate: 5.75,
      brackets: [
        { min: 0, max: 3000, rate: 2 },
        { min: 3001, max: 5000, rate: 3 },
        { min: 5001, max: 17000, rate: 5 },
        { min: 17001, max: Infinity, rate: 5.75 }
      ]
    },
    'WA': {
      baseRate: 0,
      brackets: [{ min: 0, rate: 0 }],
      notes: 'Washington has no state income tax, but has capital gains tax on high earners.'
    },
    'WV': {
      baseRate: 6.5,
      brackets: [
        { min: 0, max: 10000, rate: 3 },
        { min: 10001, max: 25000, rate: 4 },
        { min: 25001, max: 40000, rate: 4.5 },
        { min: 40001, max: 60000, rate: 6 },
        { min: 60001, max: Infinity, rate: 6.5 }
      ]
    },
    'WI': {
      baseRate: 7.65,
      brackets: [
        { min: 0, max: 12760, rate: 3.54 },
        { min: 12761, max: 25520, rate: 4.65 },
        { min: 25521, max: 280950, rate: 5.3 },
        { min: 280951, max: Infinity, rate: 7.65 }
      ]
    },
    'WY': {
      baseRate: 0,
      brackets: [{ min: 0, rate: 0 }],
      notes: 'Wyoming has no state income tax.'
    },
    'DC': {
      baseRate: 8.95,
      brackets: [
        { min: 0, max: 10000, rate: 4 },
        { min: 10001, max: 40000, rate: 6 },
        { min: 40001, max: 60000, rate: 6.5 },
        { min: 60001, max: 250000, rate: 8.5 },
        { min: 250001, max: 500000, rate: 9.25 },
        { min: 500001, max: 1000000, rate: 9.75 },
        { min: 1000001, max: Infinity, rate: 10.75 }
      ],
      notes: 'Washington DC has separate tax rates and is treated as a state for tax purposes.'
    }
  };
  
  // Return data for requested state, or default if not found
  return stateTaxInfo[state] || {
    baseRate: 5,
    brackets: [{ min: 0, rate: 5 }],
    notes: 'Using estimated tax rate.'
  };
}

function calculateFederalTaxRate(annualIncome: number): number {
  // 2023 Federal tax brackets (simplified)
  const federalBrackets = [
    { min: 0, max: 11000, rate: 10 },
    { min: 11001, max: 44725, rate: 12 },
    { min: 44726, max: 95375, rate: 22 },
    { min: 95376, max: 182100, rate: 24 },
    { min: 182101, max: 231250, rate: 32 },
    { min: 231251, max: 578125, rate: 35 },
    { min: 578126, max: Infinity, rate: 37 }
  ];
  
  let taxAmount = 0;
  let remainingIncome = annualIncome;
  
  for (const bracket of federalBrackets) {
    if (remainingIncome <= 0) break;
    
    const taxableAmount = Math.min(
      remainingIncome,
      (bracket.max || Infinity) - bracket.min
    );
    
    taxAmount += taxableAmount * (bracket.rate / 100);
    remainingIncome -= taxableAmount;
  }
  
  // Return effective federal tax rate
  return Number(((taxAmount / annualIncome) * 100).toFixed(1));
}

function getFallbackTaxData(state: string, annualIncome: number): TaxData {
  // Default fallback data with state-specific estimations
  const stateRates: {[key: string]: number} = {
    'CA': 9.3,
    'NY': 6.85,
    'TX': 0,
    'FL': 0,
    'WA': 0,
    // Add more states as needed
  };

  const stateTaxRate = stateRates[state] || 5; // Default 5% if state not found
  const effectiveTaxRate = stateTaxRate;
  const estimatedAnnualTax = (annualIncome * effectiveTaxRate) / 100;

  // Calculate federal tax rate based on income (simplified 2023 brackets)
  const federalTaxRate = calculateFederalTaxRate(annualIncome);
  
  return {
    stateTaxRate,
    taxBrackets: [{ min: 0, rate: stateTaxRate }],
    effectiveTaxRate,
    estimatedAnnualTax,
    specialNotes: `Using estimated tax rates for ${state} - could not fetch live data`,
    federalTaxRate,
    deductions: [
      { type: 'Standard Deduction', amount: 12950 },
      { type: 'Estimated Healthcare', amount: 2500 }
    ]
  };
}

export async function runTaxServiceTests() {
  const testCases = [
    {
      name: 'California Progressive Tax',
      run: async () => {
        const result = await getStateTaxRates('CA');
        return result.taxBrackets.length > 3;
      }
    },
    {
      name: 'Texas No State Tax',
      run: async () => {
        const result = await getStateTaxRates('TX');
        return result.stateTaxRate === 0;
      }
    },
    {
      name: 'Federal Tax Brackets',
      run: async () => {
        return calculateFederalTaxRate(50000) === 22;
      }
    }
  ];

  const results = [];
  for (const test of testCases) {
    try {
      const passed = await test.run();
      results.push({
        name: test.name,
        status: passed ? 'passed' : 'failed'
      });
    } catch {
      results.push({
        name: test.name,
        status: 'failed'
      });
    }
  }

  return results;
}
