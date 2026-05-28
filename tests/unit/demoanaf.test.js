import { jest } from '@jest/globals';

const CACHED_ANAF_DATA = {
  cui: 39271439,
  name: "REBELDOT SOLUTIONS SRL",
  address: "JUD. CLUJ, SAT SĂLICEA COM. CIURILA, G SĂLICEA, NR.104F",
  registrationNumber: "J2018001724122",
  caenCode: "6210",
  vatRegistered: true,
  inactive: false
};

describe('demoanaf.js', () => {
  let demoanaf;

  beforeAll(async () => {
    demoanaf = await import('../../demoanaf.js');
  });

  describe('searchCompany', () => {
    it('should return array of companies for valid brand', async () => {
      const results = await demoanaf.searchCompany('RebelDot');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('cui');
      expect(results[0]).toHaveProperty('name');
    });

    it('should return empty array for non-existent brand', async () => {
      const results = await demoanaf.searchCompany('NonExistentBrandXYZ123');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should include statusLabel in results', async () => {
      const results = await demoanaf.searchCompany('RebelDot');

      expect(results[0]).toHaveProperty('statusLabel');
    });
  });

  describe('getCompanyFromANAF', () => {
    it('should return company data for valid CIF with fallback', async () => {
      const data = await demoanaf.getCompanyFromANAFWithFallback('39271439', CACHED_ANAF_DATA);

      expect(data).toBeDefined();
      expect(data.cui).toBe(39271439);
      expect(data.name).toBe('REBELDOT SOLUTIONS SRL');
      expect(data).toHaveProperty('address');
      expect(data).toHaveProperty('registrationNumber');
    }, 120000);

    it.skip('should throw error for invalid CIF (requires live ANAF API)', async () => {
      await expect(demoanaf.getCompanyFromANAF('99999999')).rejects.toThrow();
    }, 120000);
  });
});
