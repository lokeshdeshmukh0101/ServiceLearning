import { GoogleGenAI } from '@google/genai';

export interface GenerateOptions {
  maxOutputTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  generate(prompt: string, opts?: GenerateOptions): Promise<string>;
  readonly name: string;
}

export type AIProviderErrorCode =
  | 'AI_NOT_CONFIGURED'
  | 'AI_INVALID_KEY'
  | 'AI_QUOTA_EXCEEDED'
  | 'AI_UNSUPPORTED_MODEL'
  | 'AI_NETWORK_ERROR'
  | 'AI_MALFORMED_RESPONSE'
  | 'AI_ERROR';

const PUBLIC_ERROR_MESSAGES: Record<AIProviderErrorCode, string> = {
  AI_NOT_CONFIGURED: 'AI provider is not configured. Check LLM_PROVIDER and its required credentials.',
  AI_INVALID_KEY: 'The configured AI API key was rejected. Check the key or select another provider.',
  AI_QUOTA_EXCEEDED: 'The AI provider quota has been exceeded. Please try again later.',
  AI_UNSUPPORTED_MODEL: 'The configured AI model is not available for this provider.',
  AI_NETWORK_ERROR: 'Could not reach the AI provider. Check the network connection and try again.',
  AI_MALFORMED_RESPONSE: 'The AI provider returned a malformed response. Please try again.',
  AI_ERROR: 'The AI provider failed to generate a response. Please try again.',
};

const HTTP_STATUS: Record<AIProviderErrorCode, number> = {
  AI_NOT_CONFIGURED: 503,
  AI_INVALID_KEY: 401,
  AI_QUOTA_EXCEEDED: 429,
  AI_UNSUPPORTED_MODEL: 404,
  AI_NETWORK_ERROR: 503,
  AI_MALFORMED_RESPONSE: 502,
  AI_ERROR: 502,
};

export class AIProviderError extends Error {
  readonly status: number;

  constructor(readonly code: AIProviderErrorCode, status = HTTP_STATUS[code]) {
    super(PUBLIC_ERROR_MESSAGES[code]);
    this.name = 'AIProviderError';
    this.status = status;
  }
}

export function isAIProviderErrorCode(code: string): code is AIProviderErrorCode {
  return Object.hasOwn(PUBLIC_ERROR_MESSAGES, code);
}

export function getAIProviderHttpStatus(code: AIProviderErrorCode): number {
  return HTTP_STATUS[code];
}

export function mapAIProviderError(error: unknown): AIProviderError {
  if (error instanceof AIProviderError) return error;

  const value = error as {
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
    message?: unknown;
  } | null;
  const status = Number(value?.status ?? value?.statusCode);
  const message = typeof value?.message === 'string' ? value.message : '';

  if (status === 401 || status === 403 || /ACCESS_TOKEN_TYPE_UNSUPPORTED/i.test(message)) {
    return new AIProviderError('AI_INVALID_KEY', status === 403 ? 403 : 401);
  }
  if (status === 429) return new AIProviderError('AI_QUOTA_EXCEEDED');
  if (status === 404) return new AIProviderError('AI_UNSUPPORTED_MODEL');
  if (
    error instanceof TypeError ||
    ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED'].includes(
      String(value?.code ?? '')
    ) ||
    /network|fetch failed|socket hang up/i.test(message)
  ) {
    return new AIProviderError('AI_NETWORK_ERROR');
  }
  if (status > 0) return new AIProviderError('AI_ERROR', status >= 500 ? status : 502);
  if (error instanceof SyntaxError) {
    return new AIProviderError('AI_MALFORMED_RESPONSE');
  }
  return new AIProviderError('AI_ERROR');
}

function cleanEnvValue(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function getApiKey(): string {
  return cleanEnvValue(process.env.LLM_API_KEY) || cleanEnvValue(process.env.GEMINI_API_KEY);
}

export function getConfiguredAIModel(): string {
  return cleanEnvValue(process.env.LLM_MODEL) || 'gemini-flash-lite-latest';
}

class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 30_000,
        retryOptions: {
          attempts: 2,
          initialDelay: 1,
          maxDelay: 3,
          jitter: 0.2,
        },
      },
    });
  }

  async generate(prompt: string, opts: GenerateOptions = {}): Promise<string> {
    try {
      const response = await this.genAI.models.generateContent({
        model: getConfiguredAIModel(),
        contents: prompt,
        config: {
          maxOutputTokens: opts.maxOutputTokens ?? 2048,
          temperature: opts.temperature ?? 0.3,
        },
      });
      const text = response.text;
      if (typeof text !== 'string' || !text.trim()) {
        throw new AIProviderError('AI_MALFORMED_RESPONSE');
      }
      return text.trim();
    } catch (error) {
      throw mapAIProviderError(error);
    }
  }
}

export class MockAIProvider implements AIProvider {
  readonly name = 'mock';
  private responses: Map<string, string>;
  private defaultResponse: string;

  constructor(responses: Map<string, string> = new Map(), defaultResponse = 'Mock AI response.') {
    this.responses = responses;
    this.defaultResponse = defaultResponse;
  }

  async generate(prompt: string, _opts?: GenerateOptions): Promise<string> {
    for (const [key, val] of this.responses) {
      if (prompt.includes(key)) return val;
    }
    return this.defaultResponse;
  }
}

class OpenAICompatibleProvider implements AIProvider {
  readonly name = 'openai-compatible';

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string
  ) {}

  async generate(prompt: string, opts: GenerateOptions = {}): Promise<string> {
    const baseUrl = this.baseUrl.replace(/\/+$/, '');
    const endpoint = baseUrl.endsWith('/chat/completions')
      ? baseUrl
      : `${baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`}/chat/completions`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: getConfiguredAIModel(),
          messages: [{ role: 'user', content: prompt }],
          max_tokens: opts.maxOutputTokens ?? 2048,
          temperature: opts.temperature ?? 0.3,
        }),
      });
      if (!response.ok) {
        throw { status: response.status };
      }
      const body: unknown = await response.json();
      const content = (body as {
        choices?: Array<{ message?: { content?: unknown } }>;
      })?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) {
        throw new AIProviderError('AI_MALFORMED_RESPONSE');
      }
      return content.trim();
    } catch (error) {
      throw mapAIProviderError(error);
    }
  }
}

class UnconfiguredProvider implements AIProvider {
  readonly name = 'unconfigured';

  async generate(): Promise<string> {
    throw new AIProviderError('AI_NOT_CONFIGURED');
  }
}

let providerOverride: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (providerOverride) return providerOverride;

  const providerName = cleanEnvValue(process.env.LLM_PROVIDER).toUpperCase() || 'GEMINI';
  const apiKey = getApiKey();
  if (!apiKey) return new UnconfiguredProvider();

  if (providerName === 'GEMINI') {
    return new GeminiProvider(apiKey);
  }

  if (providerName === 'OPENAI' || providerName === 'OPENAI_COMPATIBLE') {
    const baseUrl = cleanEnvValue(process.env.LLM_BASE_URL);
    return baseUrl ? new OpenAICompatibleProvider(apiKey, baseUrl) : new UnconfiguredProvider();
  }

  return new UnconfiguredProvider();
}

/** Override the provider (used in tests). */
export function setAIProvider(provider: AIProvider | null): void {
  providerOverride = provider;
}
