const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Free models in priority order — updated based on availability.
 * The list is tried in order; first successful response wins.
 */
const FREE_MODELS = [
  'openai/gpt-oss-20b:free',       // Fast, reliable
  'openai/gpt-oss-120b:free',      // Larger, good quality
  'google/gemma-4-31b-it:free',    // Google model, good fallback
  'liquid/lfm-2.5-1.2b-instruct:free', // Small but fast
  'meta-llama/llama-3.3-70b-instruct:free', // Best quality when available
];

const REQUEST_TIMEOUT_MS = 15000; // 15 seconds per model attempt

/**
 * Call OpenRouter API with timeout and automatic model fallback
 */
const callOpenRouter = async (messages, maxTokens = 600) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey === 'your_openrouter_key') {
    return null;
  }

  for (const model of FREE_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'BlogSpace AI Assistant',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      clearTimeout(timeoutId);

      // Skip rate-limited or unavailable models
      if (response.status === 429 || response.status === 503) {
        console.warn(`[AI] Model ${model} rate-limited (${response.status}), trying next...`);
        continue;
      }

      if (!response.ok) {
        const err = await response.text();
        console.warn(`[AI] Model ${model} failed (${response.status}): ${err.substring(0, 100)}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (content && content.length > 10) {
        console.log(`[AI] Success with model: ${model}`);
        return { content, model };
      }

    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.warn(`[AI] Model ${model} timed out after ${REQUEST_TIMEOUT_MS}ms, trying next...`);
      } else {
        console.warn(`[AI] Model ${model} error: ${err.message}`);
      }
      continue;
    }
  }

  console.warn('[AI] All models failed or timed out, using template fallback');
  return null;
};

/**
 * @route   POST /api/ai/generate
 * @desc    Generate blog content from a topic
 * @access  Author+
 */
const generateContent = asyncHandler(async (req, res) => {
  const { topic, tone = 'professional' } = req.body;

  if (!topic || topic.trim().length < 3) {
    throw new ApiError(400, 'Topic is required (minimum 3 characters)');
  }

  const messages = [
    {
      role: 'system',
      content: `You are an expert blog writer. Write well-structured, engaging blog posts in HTML format using h2, h3, p, ul, li tags only. Do not use markdown. Tone: ${tone}.`,
    },
    {
      role: 'user',
      content: `Write a comprehensive blog post about: "${topic}". 
Requirements:
- Use HTML tags (h2, h3, p, ul, li) for formatting — NO markdown
- Include an introduction paragraph
- 3-4 main sections with h2 headings
- A conclusion paragraph
- Keep it focused and practical`,
    },
  ];

  const result = await callOpenRouter(messages, 900);

  if (result) {
    // Clean up any markdown that slipped through
    const cleanContent = cleanMarkdownToHtml(result.content);
    return ApiResponse.success(res, {
      content: cleanContent,
      source: 'openrouter',
      model: result.model,
    }, 'Content generated successfully');
  }

  ApiResponse.success(res, {
    content: generateFallbackContent(topic, tone),
    source: 'template',
    note: 'AI models temporarily unavailable, using template',
  }, 'Content generated (template mode)');
});

/**
 * @route   POST /api/ai/improve
 * @desc    Improve existing writing
 * @access  Author+
 */
const improveWriting = asyncHandler(async (req, res) => {
  const { text, instruction = 'improve clarity, flow, and engagement' } = req.body;

  if (!text || text.trim().length < 10) {
    throw new ApiError(400, 'Text is required (minimum 10 characters)');
  }

  const messages = [
    {
      role: 'system',
      content: 'You are an expert editor. Improve the provided text while preserving its meaning. Return only the improved text in plain paragraphs, no explanations, no markdown.',
    },
    {
      role: 'user',
      content: `Please ${instruction} for this text:\n\n"${text.substring(0, 1500)}"`,
    },
  ];

  const result = await callOpenRouter(messages, 600);

  if (result) {
    return ApiResponse.success(res, {
      improved: result.content,
      source: 'openrouter',
      model: result.model,
    });
  }

  ApiResponse.success(res, {
    improved: text,
    source: 'passthrough',
    note: 'AI models temporarily unavailable',
  });
});

/**
 * @route   POST /api/ai/suggest-headings
 * @desc    Suggest headings for a blog post
 * @access  Author+
 */
const suggestHeadings = asyncHandler(async (req, res) => {
  const { topic, count = 5 } = req.body;

  if (!topic) {
    throw new ApiError(400, 'Topic is required');
  }

  const messages = [
    {
      role: 'system',
      content: 'You are a content strategist. Generate compelling blog post titles. Return ONLY the titles, one per line, no numbering, no bullet points, no extra text.',
    },
    {
      role: 'user',
      content: `Generate exactly ${count} compelling blog post titles for the topic: "${topic}". One title per line.`,
    },
  ];

  const result = await callOpenRouter(messages, 300);

  if (result) {
    const headings = result.content
      .split('\n')
      .map((h) => h.replace(/^[-*•\d.)\s"]+/, '').replace(/["]+$/, '').trim())
      .filter((h) => h.length > 5 && h.length < 150)
      .slice(0, count);

    if (headings.length > 0) {
      return ApiResponse.success(res, {
        headings,
        source: 'openrouter',
        model: result.model,
      });
    }
  }

  ApiResponse.success(res, {
    headings: generateFallbackHeadings(topic, count),
    source: 'template',
    note: 'AI models temporarily unavailable',
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert common markdown patterns to HTML
 * (some models return markdown despite instructions)
 */
function cleanMarkdownToHtml(text) {
  return text
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Bullet lists — convert consecutive lines to ul/li
    .replace(/((?:^[*-] .+\n?)+)/gm, (match) => {
      const items = match.trim().split('\n')
        .map(l => `<li>${l.replace(/^[*-] /, '').trim()}</li>`)
        .join('');
      return `<ul>${items}</ul>`;
    })
    // Numbered lists
    .replace(/((?:^\d+\. .+\n?)+)/gm, (match) => {
      const items = match.trim().split('\n')
        .map(l => `<li>${l.replace(/^\d+\. /, '').trim()}</li>`)
        .join('');
      return `<ol>${items}</ol>`;
    })
    // Wrap bare paragraphs (lines not already in tags)
    .replace(/^(?!<[a-z]).+$/gm, (line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      return `<p>${trimmed}</p>`;
    })
    // Clean up multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function generateFallbackContent(topic, tone) {
  return `<h2>Introduction to ${topic}</h2>
<p>In today's rapidly evolving landscape, understanding ${topic} has become more important than ever. This comprehensive guide will walk you through everything you need to know.</p>

<h2>Why ${topic} Matters</h2>
<p>The significance of ${topic} cannot be overstated. Whether you're a beginner or an experienced professional, grasping the core concepts will help you navigate challenges more effectively.</p>

<h2>Key Concepts</h2>
<ul>
<li>Understanding the fundamentals</li>
<li>Practical applications in real-world scenarios</li>
<li>Common challenges and how to overcome them</li>
<li>Best practices from industry experts</li>
</ul>

<h2>Getting Started</h2>
<p>The journey into ${topic} begins with a single step. Start by familiarizing yourself with the core terminology and gradually build your knowledge base through hands-on practice.</p>

<h2>Conclusion</h2>
<p>Mastering ${topic} is a rewarding journey that opens up new possibilities. With dedication and the right resources, you'll be well on your way to becoming proficient.</p>`;
}

function generateFallbackHeadings(topic, count) {
  const templates = [
    `The Complete Guide to ${topic}`,
    `${topic}: Everything You Need to Know`,
    `How to Master ${topic} Step by Step`,
    `Top Strategies for ${topic} Success`,
    `${topic} Best Practices for Professionals`,
    `Why ${topic} is Changing the Game`,
    `Getting Started with ${topic}: A Beginner's Guide`,
    `Advanced ${topic} Techniques That Actually Work`,
  ];
  return templates.slice(0, count);
}

module.exports = { generateContent, improveWriting, suggestHeadings };
