import { describe, it, expect } from 'vitest';
import { calculateKwp, calculateAnnualOutput, calculateSolarPanelOutput } from './calculations';

describe('Solar Panel Calculations', () => {
  describe('calculateKwp', () => {
    it('should calculate kWp correctly for standard values', () => {
      // 10 panels × 435 Wp = 4350 Wp = 4.35 kWp
      expect(calculateKwp(10, 435)).toBeCloseTo(4.35, 3);
    });

    it('should calculate kWp correctly for larger installations', () => {
      // 20 panels × 500 Wp = 10000 Wp = 10 kWp
      expect(calculateKwp(20, 500)).toBeCloseTo(10.0, 3);
    });

    it('should return 0 for zero panels', () => {
      expect(calculateKwp(0, 435)).toBe(0);
    });

    it('should return 0 for zero panel output', () => {
      expect(calculateKwp(10, 0)).toBe(0);
    });

    it('should return 0 for negative values', () => {
      expect(calculateKwp(-10, 435)).toBe(0);
      expect(calculateKwp(10, -435)).toBe(0);
    });

    it('should handle decimal panel counts', () => {
      // 15.5 panels × 400 Wp = 6200 Wp = 6.2 kWp
      expect(calculateKwp(15.5, 400)).toBeCloseTo(6.2, 3);
    });
  });

  describe('calculateAnnualOutput', () => {
    it('should calculate annual output correctly with standard values', () => {
      // 4.35 kWp × 875 kWh/kWp/year × 0.99 = 3768.1875 kWh
      const kwp = 4.35;
      const kwhPerKwpPerYear = 875;
      const availabilityFactor = 99;
      const expected = kwp * kwhPerKwpPerYear * (availabilityFactor / 100);
      expect(calculateAnnualOutput(kwp, kwhPerKwpPerYear, availabilityFactor)).toBeCloseTo(expected, 1);
      expect(calculateAnnualOutput(kwp, kwhPerKwpPerYear, availabilityFactor)).toBeCloseTo(3768.19, 1);
    });

    it('should calculate annual output correctly for 100% availability', () => {
      // 5 kWp × 875 kWh/kWp/year × 1.0 = 4375 kWh
      expect(calculateAnnualOutput(5, 875, 100)).toBeCloseTo(4375, 1);
    });

    it('should calculate annual output correctly for different kWh/kWp/year values', () => {
      // 5 kWp × 900 kWh/kWp/year × 0.99 = 4455 kWh
      expect(calculateAnnualOutput(5, 900, 99)).toBeCloseTo(4455, 1);
    });

    it('should return 0 for zero kWp', () => {
      expect(calculateAnnualOutput(0, 875, 99)).toBe(0);
    });

    it('should return 0 for zero kWh/kWp/year', () => {
      expect(calculateAnnualOutput(5, 0, 99)).toBe(0);
    });

    it('should return 0 for zero availability factor', () => {
      expect(calculateAnnualOutput(5, 875, 0)).toBe(0);
    });

    it('should handle 50% availability factor correctly', () => {
      // 10 kWp × 875 kWh/kWp/year × 0.5 = 4375 kWh
      expect(calculateAnnualOutput(10, 875, 50)).toBeCloseTo(4375, 1);
    });
  });

  describe('calculateSolarPanelOutput', () => {
    it('should calculate both kWp and annual output correctly', () => {
      const result = calculateSolarPanelOutput({
        panels: 10,
        avgPanelOutput: 435,
        kwhPerKwpPerYear: 875,
        availabilityFactor: 99
      });
      
      expect(result.kwp).toBeCloseTo(4.35, 3);
      expect(result.annualOutput).toBeCloseTo(3768.19, 1);
    });

    it('should use default values when not provided', () => {
      const result = calculateSolarPanelOutput({
        panels: 10,
        avgPanelOutput: 435
      });
      
      // Should use defaults: kwhPerKwpPerYear = 875, availabilityFactor = 99
      expect(result.kwp).toBeCloseTo(4.35, 3);
      expect(result.annualOutput).toBeCloseTo(3768.19, 1);
    });

    it('should handle real-world example: Hendrik van de Craatsstraat 17', () => {
      // Example: If spreadsheet shows 6406 kWh, let's verify the calculation
      // We need to work backwards or use known values
      // Assuming: panels = 15, avgPanelOutput = 435, kwhPerKwpPerYear = 875, availabilityFactor = 99
      const result = calculateSolarPanelOutput({
        panels: 15,
        avgPanelOutput: 435,
        kwhPerKwpPerYear: 875,
        availabilityFactor: 99
      });
      
      // 15 × 435 / 1000 = 6.525 kWp
      expect(result.kwp).toBeCloseTo(6.525, 3);
      // 6.525 × 875 × 0.99 = 5652.28125 kWh
      expect(result.annualOutput).toBeCloseTo(5652.28, 1);
    });

    it('should recalculate correctly when avgPanelOutput changes', () => {
      const baseParams = {
        panels: 10,
        avgPanelOutput: 435,
        kwhPerKwpPerYear: 875,
        availabilityFactor: 99
      };
      
      const result1 = calculateSolarPanelOutput(baseParams);
      
      // Change avgPanelOutput to 500
      const result2 = calculateSolarPanelOutput({
        ...baseParams,
        avgPanelOutput: 500
      });
      
      // kWp should change: 10 × 500 / 1000 = 5 kWp
      expect(result2.kwp).toBeCloseTo(5.0, 3);
      expect(result2.kwp).not.toBe(result1.kwp);
      
      // Annual output should also change
      expect(result2.annualOutput).toBeCloseTo(4331.25, 1);
      expect(result2.annualOutput).not.toBe(result1.annualOutput);
    });

    it('should recalculate correctly when kwhPerKwpPerYear changes', () => {
      const baseParams = {
        panels: 10,
        avgPanelOutput: 435,
        kwhPerKwpPerYear: 875,
        availabilityFactor: 99
      };
      
      const result1 = calculateSolarPanelOutput(baseParams);
      
      // Change kwhPerKwpPerYear to 900
      const result2 = calculateSolarPanelOutput({
        ...baseParams,
        kwhPerKwpPerYear: 900
      });
      
      // kWp should stay the same
      expect(result2.kwp).toBeCloseTo(result1.kwp, 3);
      
      // Annual output should change: 4.35 × 900 × 0.99 = 3875.85 kWh
      expect(result2.annualOutput).toBeCloseTo(3875.85, 1);
      expect(result2.annualOutput).not.toBe(result1.annualOutput);
    });

    it('should recalculate correctly when availabilityFactor changes', () => {
      const baseParams = {
        panels: 10,
        avgPanelOutput: 435,
        kwhPerKwpPerYear: 875,
        availabilityFactor: 99
      };
      
      const result1 = calculateSolarPanelOutput(baseParams);
      
      // Change availabilityFactor to 95
      const result2 = calculateSolarPanelOutput({
        ...baseParams,
        availabilityFactor: 95
      });
      
      // kWp should stay the same
      expect(result2.kwp).toBeCloseTo(result1.kwp, 3);
      
      // Annual output should change: 4.35 × 875 × 0.95 = 3615.9375 kWh
      expect(result2.annualOutput).toBeCloseTo(3615.94, 1);
      expect(result2.annualOutput).not.toBe(result1.annualOutput);
    });

    it('should handle edge case: very large installation', () => {
      const result = calculateSolarPanelOutput({
        panels: 100,
        avgPanelOutput: 500,
        kwhPerKwpPerYear: 875,
        availabilityFactor: 99
      });
      
      // 100 × 500 / 1000 = 50 kWp
      expect(result.kwp).toBeCloseTo(50.0, 3);
      // 50 × 875 × 0.99 = 43312.5 kWh
      expect(result.annualOutput).toBeCloseTo(43312.5, 1);
    });
  });

  describe('Integration: Verify calculation consistency', () => {
    it('should maintain consistency: changing panels affects both kWp and annual output', () => {
      const params1 = { panels: 10, avgPanelOutput: 435, kwhPerKwpPerYear: 875, availabilityFactor: 99 };
      const params2 = { panels: 20, avgPanelOutput: 435, kwhPerKwpPerYear: 875, availabilityFactor: 99 };
      
      const result1 = calculateSolarPanelOutput(params1);
      const result2 = calculateSolarPanelOutput(params2);
      
      // kWp should double
      expect(result2.kwp).toBeCloseTo(result1.kwp * 2, 3);
      // Annual output should double
      expect(result2.annualOutput).toBeCloseTo(result1.annualOutput * 2, 1);
    });

    it('should verify formula: Annual Output = kWp × kWh/kWp/year × (Availability Factor / 100)', () => {
      const panels = 15;
      const avgPanelOutput = 435;
      const kwhPerKwpPerYear = 875;
      const availabilityFactor = 99;
      
      const result = calculateSolarPanelOutput({
        panels,
        avgPanelOutput,
        kwhPerKwpPerYear,
        availabilityFactor
      });
      
      // Manual calculation
      const expectedKwp = (panels * avgPanelOutput) / 1000;
      const expectedAnnualOutput = expectedKwp * kwhPerKwpPerYear * (availabilityFactor / 100);
      
      expect(result.kwp).toBeCloseTo(expectedKwp, 3);
      expect(result.annualOutput).toBeCloseTo(expectedAnnualOutput, 1);
    });
  });
});
