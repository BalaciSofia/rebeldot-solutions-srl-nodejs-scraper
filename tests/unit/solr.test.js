import { jest } from '@jest/globals';

describe('solr.js', () => {
  let solr;

  beforeAll(async () => {
    solr = await import('../../solr.js');
  });

  describe('querySOLR', () => {
    it('should return response object with docs', async () => {
      const result = await solr.querySOLR('39271439');

      expect(result).toHaveProperty('numFound');
      expect(result).toHaveProperty('docs');
      expect(Array.isArray(result.docs)).toBe(true);
    });

    it('should return jobs for specific CIF', async () => {
      const result = await solr.querySOLR('39271439');

      expect(result).toHaveProperty('numFound');
      if (result.numFound > 0) {
        expect(result.docs[0]).toHaveProperty('cif', '39271439');
      }
    });
  });

  describe('queryCompanySOLR', () => {
    it('should return company data', async () => {
      const result = await solr.queryCompanySOLR('company:RebelDot*');

      expect(result).toHaveProperty('numFound');
      if (result.numFound > 0) {
        expect(result.docs[0]).toHaveProperty('brand', 'RebelDot');
      }
    });
  });

  describe('upsertJobs', () => {
    it.skip('should accept array of jobs', async () => {
      const testJob = {
        url: 'https://test.com/job1',
        title: 'Test Job',
        company: 'TEST COMPANY',
        cif: '12345678',
        status: 'scraped'
      };

      await expect(solr.upsertJobs([testJob])).resolves.not.toThrow();
    });
  });

  describe('getSolrAuth', () => {
    it('should return SOLR_AUTH from environment', () => {
      const auth = solr.getSolrAuth();

      expect(auth).toBeDefined();
      expect(typeof auth).toBe('string');
    });
  });

  describe('Data Integrity', () => {
    it('should not have duplicate URLs for same CIF', async () => {
      const result = await solr.querySOLR('39271439');

      const urls = result.docs.map(j => j.url);
      const uniqueUrls = new Set(urls);

      expect(uniqueUrls.size).toBe(result.numFound);
    });

    it('should have valid CIF format for all jobs', async () => {
      const result = await solr.querySOLR('39271439');

      for (const job of result.docs) {
        expect(job.cif).toMatch(/^\d{8}$/);
      }
    });

    it('should have valid status values', async () => {
      const result = await solr.querySOLR('39271439');
      const validStatuses = ['scraped', 'tested', 'verified', 'published'];

      for (const job of result.docs) {
        expect(validStatuses).toContain(job.status);
      }
    });
  });

  describe('Company Core Validation', () => {
    it('should have required fields for RebelDot in company core', async () => {
      const result = await solr.queryCompanySOLR('id:39271439');

      if (result.numFound > 0) {
        const rd = result.docs[0];

        expect(rd).toHaveProperty('id', '39271439');
        expect(rd).toHaveProperty('company');
        expect(rd.company).toBe('REBELDOT SOLUTIONS S.R.L.');

        expect(rd).toHaveProperty('brand', 'RebelDot');
        expect(rd).toHaveProperty('status', 'activ');
        expect(rd).toHaveProperty('location');
        expect(Array.isArray(rd.location)).toBe(true);
        expect(rd).toHaveProperty('lastScraped');
        expect(rd.lastScraped).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(rd).toHaveProperty('scraperFile');
        expect(rd.scraperFile).toMatch(/^https:\/\/raw\.githubusercontent\.com\//);
      }
    });
  });
});
