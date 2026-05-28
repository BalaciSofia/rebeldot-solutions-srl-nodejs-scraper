import { jest } from '@jest/globals';

describe('index.js Component Tests', () => {
  let index;

  beforeAll(async () => {
    index = await import('../../index.js');
  });

  describe('transformJobsForSOLR', () => {
    it('should filter locations to only Romanian cities', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', location: ['Romania'] },
          { url: 'https://test.com/2', title: 'Job 2', location: ['Cluj-Napoca'] },
          { url: 'https://test.com/3', title: 'Job 3', location: ['Bulgaria'] },
          { url: 'https://test.com/4', title: 'Job 4', location: ['Brașov'] },
          { url: 'https://test.com/5', title: 'Job 5', location: [] }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].location).toEqual(['România']);
      expect(result.jobs[1].location).toEqual(['Cluj-Napoca']);
      expect(result.jobs[2].location).toEqual(['România']);
      expect(result.jobs[3].location).toEqual(['Brașov']);
      expect(result.jobs[4].location).toEqual(['România']);
    });

    it('should keep company uppercase', () => {
      const payload = {
        source: 'rebeldot.com',
        company: 'rebeldot solutions srl',
        cif: '39271439',
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', company: 'rebeldot solutions', cif: '39271439' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.company).toBe('REBELDOT SOLUTIONS SRL');
    });

    it('should normalize workmode values', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', workmode: 'Remote' },
          { url: 'https://test.com/2', title: 'Job 2', workmode: 'ON-SITE' },
          { url: 'https://test.com/3', title: 'Job 3', workmode: 'Hybrid' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].workmode).toBe('remote');
      expect(result.jobs[1].workmode).toBe('on-site');
      expect(result.jobs[2].workmode).toBe('hybrid');
    });
  });

  describe('mapToJobModel', () => {
    it('should map raw job to job model format', () => {
      const rawJob = {
        url: 'https://careers.rebeldot.com/jobs/123',
        title: 'Senior Developer',
        location: ['Cluj-Napoca'],
        tags: ['Java', 'Spring'],
        workmode: 'hybrid'
      };

      const COMPANY_NAME = 'REBELDOT SOLUTIONS S.R.L.';
      const COMPANY_CIF = '39271439';

      const result = index.mapToJobModel(rawJob, COMPANY_CIF, COMPANY_NAME);

      expect(result.url).toBe(rawJob.url);
      expect(result.title).toBe(rawJob.title);
      expect(result.company).toBe(COMPANY_NAME);
      expect(result.cif).toBe(COMPANY_CIF);
      expect(result.location).toEqual(rawJob.location);
      expect(result.tags).toEqual(rawJob.tags);
      expect(result.workmode).toBe(rawJob.workmode);
      expect(result.status).toBe('scraped');
      expect(result.date).toBeDefined();
    });

    it('should remove undefined fields', () => {
      const rawJob = {
        url: 'https://test.com/1',
        title: 'Job 1'
      };

      const result = index.mapToJobModel(rawJob, '39271439');

      expect(result.location).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.workmode).toBeUndefined();
    });
  });

  describe('parseJobsFromHtml', () => {
    it('should extract jobs from HTML', () => {
      const html = `
        <html>
          <body>
            <a href="/jobs/java-software-engineer">
              <div>Java Software Engineer</div>
              <span>Web Development</span>
              <span>Cluj-Napoca, Brasov, Oradea</span>
              <span>Hybrid</span>
            </a>
            <a href="/jobs/devops-engineer">
              <div>DevOps Engineer</div>
              <span>Cluj-Napoca</span>
              <span>Remote</span>
            </a>
          </body>
        </html>
      `;

      const result = index.parseJobsFromHtml(html);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });
});
