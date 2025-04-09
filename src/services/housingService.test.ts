import { getHousingData } from './housingService';

describe('Housing Service', () => {
  test('San Francisco high cost data', async () => {
    const result = await getHousingData('San Francisco', 'CA');
    expect(result.medianRent).toBeGreaterThan(2500);
    expect(result.costIndex).toBeGreaterThan(150);
  });

  test('Memphis low cost data', async () => {
    const result = await getHousingData('Memphis', 'TN');
    expect(result.medianRent).toBeLessThan(1500);
    expect(result.costIndex).toBeLessThan(100);
  });

  test('Unknown location falls back', async () => {
    const result = await getHousingData('Unknown City', 'ZZ');
    expect(result.medianRent).toBe(1500);
    expect(result.costIndex).toBe(100);
  });
});
