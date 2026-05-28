describe('Integration: Workflow Components', () => {
  it('should load all modules without errors', async () => {
    const demoanaf = await import('../../demoanaf.js');
    const company = await import('../../company.js');
    const solr = await import('../../solr.js');
    const index = await import('../../index.js');

    expect(demoanaf).toBeDefined();
    expect(company).toBeDefined();
    expect(solr).toBeDefined();
    expect(index).toBeDefined();
  });
});
