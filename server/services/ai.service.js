/**
 * AI repository analysis service.
 * All AI API calls live here. Secrets stay server-side via process.env.
 */

const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    techStack: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          technology: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['technology', 'reason'],
      },
    },
    architecture: { type: 'string' },
    strengths: {
      type: 'array',
      items: { type: 'string' },
    },
    potentialImprovements: {
      type: 'array',
      items: { type: 'string' },
    },
    beginnerExplanation: { type: 'string' },
  },
  required: [
    'summary',
    'techStack',
    'architecture',
    'strengths',
    'potentialImprovements',
    'beginnerExplanation',
  ],
};

const SYSTEM_PROMPT = `You are RepoLens, an expert software engineering and codebase analysis assistant.
Analyze the provided repository context carefully. Infer purpose, tech stack, architecture, strengths, and improvements.
Be specific and practical. Do not invent files that are not evidenced by the context.
If information is missing (README, package.json, etc.), note that briefly and still provide the best analysis possible.
Return ONLY valid JSON matching the required schema. No markdown fences. No commentary outside JSON.`;

function createAiError(message, status = 502, cause) {
  const error = new Error(message);
  error.status = status;
  error.code = 'AI_ERROR';
  if (cause) {
    error.cause = cause;
  }
  return error;
}

function getAiConfig() {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(
    /\/$/,
    ''
  );
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  return { apiKey, baseUrl, model };
}

function buildUserPrompt(context) {
  const payload = {
    repository: {
      name: context.name,
      fullName: context.fullName,
      description: context.description,
      primaryLanguage: context.primaryLanguage,
      languages: context.languages,
      topics: context.topics,
    },
    packageJson: context.packageJson || null,
    readme: context.readme || null,
    fileStructure: context.structure || [],
    structureTruncated: Boolean(context.structureTruncated),
    selectedSourceFiles: context.sourceFiles || [],
  };

  return `Analyze this GitHub repository context and respond with JSON matching the schema.

Required JSON shape:
{
  "summary": "string",
  "techStack": [{ "technology": "string", "reason": "string" }],
  "architecture": "string",
  "strengths": ["string"],
  "potentialImprovements": ["string"],
  "beginnerExplanation": "string"
}

Repository context:
${JSON.stringify(payload, null, 2)}`;
}

function extractMessageContent(data) {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part?.type === 'text' && typeof part.text === 'string') return part.text;
        return '';
      })
      .join('');
  }

  return null;
}

function stripCodeFences(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function normalizeAnalysis(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw createAiError('AI response was not a JSON object', 502);
  }

  const techStack = Array.isArray(parsed.techStack)
    ? parsed.techStack
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          technology: String(item.technology || '').trim(),
          reason: String(item.reason || '').trim(),
        }))
        .filter((item) => item.technology)
    : [];

  return {
    summary: String(parsed.summary || '').trim(),
    techStack,
    architecture: String(parsed.architecture || '').trim(),
    strengths: Array.isArray(parsed.strengths)
      ? parsed.strengths.map((item) => String(item).trim()).filter(Boolean)
      : [],
    potentialImprovements: Array.isArray(parsed.potentialImprovements)
      ? parsed.potentialImprovements
          .map((item) => String(item).trim())
          .filter(Boolean)
      : [],
    beginnerExplanation: String(parsed.beginnerExplanation || '').trim(),
  };
}

function parseAnalysisJson(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    throw createAiError('AI returned an empty response', 502);
  }

  const cleaned = stripCodeFences(rawContent);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error('[ai] Invalid JSON from model:', error.message);
    throw createAiError('AI returned invalid JSON', 502, error);
  }

  const analysis = normalizeAnalysis(parsed);

  if (!analysis.summary && !analysis.architecture && !analysis.beginnerExplanation) {
    throw createAiError('AI response was missing required analysis fields', 502);
  }

  return analysis;
}

async function callChatCompletions({ apiKey, baseUrl, model, messages, useSchema }) {
  const body = {
    model,
    temperature: 0.3,
    messages,
  };

  if (useSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'repo_analysis',
        strict: true,
        schema: ANALYSIS_SCHEMA,
      },
    };
  } else {
    body.response_format = { type: 'json_object' };
  }

  let response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('[ai] Network error contacting AI provider:', error.message);
    throw createAiError('Unable to reach the AI provider', 502, error);
  }

  const rawText = await response.text();
  let data = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const providerMessage =
      data?.error?.message || `AI provider request failed (${response.status})`;

    // Schema mode unsupported — let caller fall back to json_object
    if (
      useSchema &&
      (response.status === 400 || response.status === 422) &&
      /json_schema|response_format|unsupported/i.test(providerMessage)
    ) {
      const fallbackError = createAiError(providerMessage, response.status);
      fallbackError.retryWithoutSchema = true;
      throw fallbackError;
    }

    console.error('[ai] Provider error:', response.status, providerMessage);
    throw createAiError(
      response.status === 401
        ? 'AI API key is invalid or unauthorized'
        : providerMessage,
      response.status >= 400 && response.status < 600 ? response.status : 502
    );
  }

  return data;
}

/**
 * Analyze a curated repository context and return structured analysis JSON.
 */
async function analyzeRepository(context) {
  const { apiKey, baseUrl, model } = getAiConfig();

  if (!apiKey) {
    throw createAiError(
      'AI analysis is not configured. Set AI_API_KEY on the server.',
      503
    );
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(context) },
  ];

  let data;
  try {
    data = await callChatCompletions({
      apiKey,
      baseUrl,
      model,
      messages,
      useSchema: true,
    });
  } catch (error) {
    if (error.retryWithoutSchema) {
      console.warn(
        '[ai] Structured json_schema unsupported; falling back to json_object'
      );
      data = await callChatCompletions({
        apiKey,
        baseUrl,
        model,
        messages,
        useSchema: false,
      });
    } else {
      throw error;
    }
  }

  const content = extractMessageContent(data);
  return parseAnalysisJson(content);
}

module.exports = {
  analyzeRepository,
  ANALYSIS_SCHEMA,
};
