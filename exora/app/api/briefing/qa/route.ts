import { NextResponse } from 'next/server'
import { safeGenerateText, ProviderConfig } from '@/lib/llm-service'
import { exaAdHocSearch } from '@/lib/exa-service'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const question: string = (body?.question || '').toString().trim()
    const context = body?.context || null

    if (!question) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 })
    }
    if (!context) {
      return NextResponse.json({ error: 'Missing briefing context' }, { status: 400 })
    }

    // Prefer keys supplied by client (BYOK) via headers, fallback to server env
    const headers = req.headers
    const groqKey = (headers.get('x-groq-api-key') || process.env.GROQ_API_KEY || '').trim()
    const openAiKey = (headers.get('x-openai-api-key') || process.env.OPENAI_API_KEY || '').trim()
    const geminiKey = (headers.get('x-gemini-api-key') || process.env.GEMINI_API_KEY || '').trim()

  const providers: ProviderConfig[] = []
    if (groqKey) providers.push({ provider: 'groq', apiKey: groqKey })
    if (geminiKey) providers.push({ provider: 'gemini', apiKey: geminiKey })
    if (openAiKey) providers.push({ provider: 'openai', apiKey: openAiKey })

    if (providers.length === 0) {
      return NextResponse.json({ error: 'No LLM provider keys available. Supply at least one provider key in headers or server env.' }, { status: 400 })
    }

    // Build strict prompt that forces the model to use ONLY the provided briefing data.
    // If the answer isn't present in the briefing data, the model must reply with a fixed refusal phrase.
    const refusal = "I don't know based on the briefing data.";

    const prompt = `You are a concise assistant answering follow-up questions about a previously-run competitive briefing.
    IMPORTANT: You MUST answer using ONLY the JSON briefing data provided below. Do NOT use any external knowledge, web access, or your own memory. If the answer cannot be found or reliably inferred from the briefing JSON, reply exactly with: ${refusal}

    Rules:
    - Search the provided briefing JSON for facts, numbers, news items, and summaries. Use only that information.
    - If citing a news item, include its publishedDate and url when helpful.
    - Keep answers short and factual. If multiple items support the answer, explicitly reference them.
    - If asked for an opinion outside the briefing, reply with the refusal sentence.

    BRIEFING JSON:
    ${JSON.stringify(context)}

    USER QUESTION: ${question}

    Provide a single, direct answer now.`

    const answerText = await safeGenerateText(prompt, providers)
      .catch((e) => {
        console.error('LLM error in briefing QA:', e)
        return ''
      })

    let answer = (answerText || '').trim() || refusal

    // If the model refused because info not in briefing, try a live web search (Exa) when available.
    if (answer === refusal) {
      const exaKey = (headers.get('x-exa-api-key') || process.env.EXA_API_KEY || '').trim()
      if (exaKey) {
        try {
          const results = await exaAdHocSearch(exaKey, question, 6)
          const hits = (results?.results || []) as any[]
          if (hits.length > 0) {
            const webContent = hits.map((h, i) => `Source ${i + 1} (${h.url}): ${h.title || ''}\n${h.text || ''}`).join('\n\n')
            const webPrompt = `You are a concise assistant. You have the original briefing JSON below and additional web search results.
Rules:
- First, try to answer the USER QUESTION using ONLY the briefing JSON.
- If the briefing does not contain the answer, you MAY use the web search results provided below to answer. Cite the source URL when referencing web facts.
- Do NOT use any other external data.
- If the answer cannot be determined even after using the web results, reply exactly with: ${refusal}

BRIEFING JSON:
${JSON.stringify(context)}

WEB SEARCH RESULTS:
${webContent}

USER QUESTION: ${question}

Provide a single, direct answer now.`

            const webAnswer = await safeGenerateText(webPrompt, providers).catch(() => '')
            answer = (webAnswer || '').trim() || refusal
          }
        } catch (err) {
          console.warn('Exa ad-hoc search failed for QA fallback:', err)
        }
      }
    }

    return NextResponse.json({ answer })
  } catch (err: any) {
    console.error('Briefing QA route error:', err)
    return NextResponse.json({ error: 'Internal error', details: err?.message || String(err) }, { status: 500 })
  }
}
