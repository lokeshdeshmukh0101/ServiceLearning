import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

const sdk = vi.hoisted(() => ({
  constructor: vi.fn(),
  generateContent: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: sdk.generateContent };

    constructor(options: unknown) {
      sdk.constructor(options);
    }
  },
}));

import {
  getAIProvider,
  mapAIProviderError,
  MockAIProvider,
  setAIProvider,
} from '../src/services/aiProvider.js';
import { backendEnvPath, loadBackendEnv } from '../src/config/loadEnv.js';

const envNames = ['LLM_PROVIDER', 'LLM_API_KEY', 'GEMINI_API_KEY', 'LLM_MODEL', 'LLM_BASE_URL'];
const originalEnv = new Map<string, string | undefined>();

beforeEach(() => {
  envNames.forEach((name) => {
    originalEnv.set(name, process.env[name]);
    delete process.env[name];
  });
  sdk.constructor.mockReset();
  sdk.generateContent.mockReset();
  setAIProvider(null);
});

afterEach(() => {
  envNames.forEach((name) => {
    const value = originalEnv.get(name);
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  });
  setAIProvider(null);
  vi.unstubAllGlobals();
});

describe('AI provider configuration', () => {
  it('loads dotenv from an explicit file path', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-env-'));
    const envPath = path.join(dir, '.env');
    fs.writeFileSync(
      envPath,
      'LLM_PROVIDER=" gemini "\nLLM_API_KEY=" test-key "\nLLM_MODEL=" test-model "\n'
    );

    try {
      loadBackendEnv(envPath);
      expect(path.basename(backendEnvPath)).toBe('.env');
      expect(process.env.LLM_PROVIDER).toBe(' gemini ');
      expect(process.env.LLM_API_KEY).toBe(' test-key ');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails explicitly when no API key is configured', async () => {
    const provider = getAIProvider();
    expect(provider.name).toBe('unconfigured');
    await expect(provider.generate('test')).rejects.toMatchObject({
      code: 'AI_NOT_CONFIGURED',
    });
  });

  it('does not cache the unconfigured provider and trims values when configured later', async () => {
    const unconfigured = getAIProvider();
    process.env.LLM_PROVIDER = '  gEmInI  ';
    process.env.LLM_API_KEY = '  " test-key "  ';
    process.env.LLM_MODEL = '  gemini-test-model  ';
    sdk.generateContent.mockResolvedValue({ text: 'A real answer.' });

    const configured = getAIProvider();
    expect(configured.name).toBe('gemini');
    expect(configured).not.toBe(unconfigured);
    await expect(configured.generate('document-based prompt')).resolves.toBe('A real answer.');
    expect(sdk.constructor).toHaveBeenCalledWith({
      apiKey: 'test-key',
      httpOptions: expect.objectContaining({
        timeout: 30_000,
        retryOptions: expect.objectContaining({ attempts: 2 }),
      }),
    });
    expect(sdk.generateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-test-model',
      contents: 'document-based prompt',
    }));
  });

  it('preserves setAIProvider overrides and permits resetting them', () => {
    const mock = new MockAIProvider(new Map(), 'test response');
    setAIProvider(mock);
    expect(getAIProvider()).toBe(mock);
    setAIProvider(null);
    expect(getAIProvider().name).toBe('unconfigured');
  });

  it('selects an OpenAI-compatible provider from environment', async () => {
    process.env.LLM_PROVIDER = 'OPENAI_COMPATIBLE';
    process.env.LLM_API_KEY = 'test-key';
    process.env.LLM_MODEL = 'test-model';
    process.env.LLM_BASE_URL = 'https://example.test/v1/';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Generated response.' } }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getAIProvider().generate('document content');
    expect(result).toBe('Generated response.');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.test/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
        body: expect.stringContaining('"model":"test-model"'),
      })
    );
  });
});

describe('AI provider error mapping', () => {
  it.each([
    [{ status: 401 }, 'AI_INVALID_KEY', 401],
    [{ status: 403 }, 'AI_INVALID_KEY', 403],
    [{ message: 'ACCESS_TOKEN_TYPE_UNSUPPORTED' }, 'AI_INVALID_KEY', 401],
    [{ status: 429 }, 'AI_QUOTA_EXCEEDED', 429],
    [{ status: 404 }, 'AI_UNSUPPORTED_MODEL', 404],
    [{ status: 503 }, 'AI_ERROR', 503],
    [Object.assign(new SyntaxError('upstream error body'), { status: 503 }), 'AI_ERROR', 503],
    [new TypeError('fetch failed'), 'AI_NETWORK_ERROR', 503],
    [new SyntaxError('unexpected response'), 'AI_MALFORMED_RESPONSE', 502],
  ] as const)('sanitizes %o into %s', (source, code, status) => {
    const error = mapAIProviderError(source);
    expect(error.code).toBe(code);
    expect(error.status).toBe(status);
    expect(error.message).not.toContain('ACCESS_TOKEN_TYPE_UNSUPPORTED');
  });
});
