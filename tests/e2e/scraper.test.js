import { jest } from '@jest/globals';

describe('E2E: Full Scraping Workflow', () => {
  const TEST_CIF = '39271439';
  const TEST_BRAND = 'RebelDot';

  it('should handle inactive company gracefully', async () => {
    const demoanaf = await import('../../demoanaf.js');

    const searchResults = await demoanaf.searchCompany('InactiveCompany');
    const inactiveCompany = searchResults.find(c => c.statusLabel !== 'Funcțiune');

    if (inactiveCompany) {
      const anafData = await demoanaf.getCompanyFromANAF(inactiveCompany.cui.toString());
      expect(anafData.inactive).toBe(true);
    }
  });
});
