import { compressHeuristic } from './heuristicStrategy.js';

describe('compressHeuristic', () => {
  test('returns original text when ratio is zero', async () => {
    const input = 'First sentence. Second sentence.';
    const result = await compressHeuristic({ text: input, ratio: 0, intent: '' });
    expect(result.compressedText).toBe(input);
    expect(result.metrics.finalTokens).toBe(result.metrics.originalTokens);
  });

  test('reduces token count when ratio is positive', async () => {
    const input = 'This is the first important sentence. This second sentence is less important. Another detail worth keeping. Final note.';
    const result = await compressHeuristic({ text: input, ratio: 0.4, intent: '' });
    expect(result.metrics.finalTokens).toBeLessThan(result.metrics.originalTokens);
    expect(result.compressedText.length).toBeGreaterThan(0);
  });

  test('prioritises sentences containing intent keywords', async () => {
    const input = 'Discuss onboarding metrics. Provide roadmap milestones. Mention revenue projections.';
    const result = await compressHeuristic({ text: input, ratio: 0.5, intent: 'Focus on roadmap milestones' });
    expect(result.compressedText.toLowerCase()).toContain('roadmap');
  });
});
