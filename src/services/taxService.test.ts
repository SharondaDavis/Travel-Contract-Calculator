import { getStateTaxRates, calculateFederalTaxRate } from './taxService';

describe('Tax Service', () => {
  describe('State Tax Calculations', () => {
    test('California has progressive tax brackets', async () => {
      const result = await getStateTaxRates('CA');
      expect(result.stateTaxRate).toBeGreaterThan(5);
      expect(result.taxBrackets.length).toBeGreaterThan(3);
      expect(result.specialNotes).toContain('highest');
    });

    test('Texas has no state income tax', async () => {
      const result = await getStateTaxRates('TX');
      expect(result.stateTaxRate).toBe(0);
      expect(result.taxBrackets).toEqual([{ min: 0, rate: 0 }]);
      expect(result.specialNotes).toContain('no state income tax');
    });

    test('Flat tax states return single bracket', async () => {
      const result = await getStateTaxRates('CO');
      expect(result.taxBrackets.length).toBe(1);
      expect(result.taxBrackets[0].min).toBe(0);
    });

    test('Unknown state falls back to default', async () => {
      const result = await getStateTaxRates('XX');
      expect(result.stateTaxRate).toBe(5);
      expect(result.taxBrackets).toEqual([{ min: 0, rate: 5 }]);
    });
  });

  describe('Federal Tax Calculations', () => {
    test('Low income falls in first bracket', () => {
      expect(calculateFederalTaxRate(5000)).toBe(10);
    });

    test('Middle income falls in middle brackets', () => {
      expect(calculateFederalTaxRate(50000)).toBe(22);
    });

    test('High income hits top bracket', () => {
      expect(calculateFederalTaxRate(600000)).toBe(37);
    });
  });

  describe('Integrated Tax Data', () => {
    test('Total tax calculation for CA high earner', async () => {
      const income = 200000;
      const stateTax = await getStateTaxRates('CA', income);
      const federalTax = calculateFederalTaxRate(income);
      
      expect(stateTax.effectiveTaxRate).toBeGreaterThan(7);
      expect(federalTax).toBe(32);
      expect(stateTax.estimatedAnnualTax).toBeCloseTo(income * stateTax.effectiveTaxRate / 100, -2);
    });
  });
});
