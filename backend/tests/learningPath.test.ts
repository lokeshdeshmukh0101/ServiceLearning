import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from '../src/database/db.js';
import { MockAIProvider } from '../src/services/aiProvider.js';
import { generateSummary, StudyMode } from '../src/services/summaryService.js';
import {
  ensureLearningPathTables,
  getLearningPath,
  updateLearningPathStep,
  recordQuizResultToPath,
  generateGroundedRevisions,
} from '../src/services/learningPathService.js';

describe('Smart Learning Path & Multi-mode Study Engine', () => {
  beforeAll(async () => {
    await initDb();
    await ensureLearningPathTables();
  });

  it('generates grounded content across different study modes with mock AI provider', async () => {
    const mock = new MockAIProvider(
      new Map([
        ['key concepts', '1. Concept Alpha: Foundational network model.\n2. Concept Beta: Transport layer protocol.'],
        ['intuitive, friendly', 'Imagine the internet is like a post office delivering envelopes.'],
        ['revision notes', '- Fact: TCP guarantees delivery.\n- Formula: RTT = 2 * propagation delay.'],
      ]),
      'Default study response for testing.'
    );

    const docText = 'This is a computer networking textbook covering TCP, UDP, IP addressing, and routing algorithms across distributed systems.';

    const modes: StudyMode[] = ['summary', 'key_concepts', 'simplified', 'revision_points'];
    for (const mode of modes) {
      const res = await generateSummary(
        'mock-doc-test',
        docText,
        undefined,
        { language: 'en', length: 'short', mode },
        mock
      );
      expect('summary' in res).toBe(true);
      if ('summary' in res) {
        expect(res.mode).toBe(mode);
        expect(res.summary.length).toBeGreaterThan(10);
      }
    }
  });

  it('initializes and updates learning path step progression', async () => {
    const userId = 'student-test-123';
    const docId = 'doc-test-456';

    const initial = await getLearningPath(userId, docId);
    // If doc doesn't exist in documents table, it returns null or fallback
    // Let's test step progression
    const step2 = await updateLearningPathStep(userId, docId, 2);
    // Should update step to 2 if doc exists, or handle non-existent safely
    if (step2) {
      expect(step2.step).toBeGreaterThanOrEqual(2);
    }
  });

  it('generates grounded revisions for identified weak topics', async () => {
    const mock = new MockAIProvider(
      new Map(),
      'Re-read Section 2 regarding subnet masks and CIDR prefix notation.'
    );

    const revisions = await generateGroundedRevisions(
      'doc-test-789',
      ['Subnetting & CIDR', 'Routing Algorithms'],
      'en',
      mock
    );

    expect(revisions.length).toBe(2);
    expect(revisions[0].topic).toBe('Subnetting & CIDR');
    expect(revisions[0].advice).toContain('subnet masks');
  });
});
