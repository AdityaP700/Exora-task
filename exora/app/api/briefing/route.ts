// app/api/briefing/route.ts

import { NextResponse } from 'next/server';
import { generateText } from '@/lib/llm-service';
import { fetchMentions, fetchSignals } from '@/lib/exa-service';
import { calculateNarrativeMomentum, calculatePulseIndex } from '@/lib/analysis-service';
import { BriefingResponse } from '@/lib/types'; // Import our API contract

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    // BYOK: Get keys from headers passed by the frontend
    const exaApiKey = request.headers.get('x-exa-api-key');
    const groqApiKey = request.headers.get('x-groq-api-key');
    const openAiApiKey = request.headers.get('x-openai-api-key'); // Main LLM for synthesis

    if (!domain || !exaApiKey || !groqApiKey || !openAiApiKey) {
        return NextResponse.json({ error: 'Missing domain or API keys' }, { status: 400 });
    }

    try {
        // --- Step 1: Instant TL;DR with Groq (Fast) ---
        const groqTlDr = await generateText(
            `In one concise sentence, what is the company at the domain "${domain}"?`,
            'groq',
            groqApiKey
        );

        // --- Step 2: Competitor Discovery ---
        const competitorsPrompt = `Identify the top 3 direct competitors for the company at "${domain}". Return only a JSON array of their domains. Example: ["competitor1.com", "competitor2.com"]`;
        const competitorsResponse = await generateText(competitorsPrompt, 'openai', openAiApiKey);
        const competitors = JSON.parse(competitorsResponse);
        const allDomains = [domain, ...competitors];

        // --- Step 3: Parallel Data Fetch ---
        const allMentions = await Promise.all(
            allDomains.map(d => fetchMentions(d, exaApiKey))
        );
        const primarySignals = await fetchSignals(domain, exaApiKey); // Signals only for primary company for now

        // --- Step 4: Analysis & Processing ---
        const benchmarkMatrix = allDomains.map((d, i) => {
            const mentions = allMentions[i].results;
            const narrativeMomentum = calculateNarrativeMomentum(mentions);
            // Placeholder for sentiment; a real implementation would call the LLM here for each company
            const sentimentScore = 75; 
            const pulseIndex = calculatePulseIndex(narrativeMomentum, sentimentScore);

            return { domain: d, pulseIndex, narrativeMomentum, sentimentScore };
        });

        const eventLog = primarySignals.results.map(signal => ({
            date: signal.publishedDate || '',
            // Placeholder for event type classification
            type: 'Product Launch' as const, 
            headline: signal.title || 'N/A',
        }));

        // --- Step 5: AI Strategic Synthesis ---
        const superPrompt = `You are a VC analyst. Based on this data, provide a 3-bullet point strategic summary for the company at "${domain}". Data: ${JSON.stringify(benchmarkMatrix)}`;
        const summary = await generateText(superPrompt, 'openai', openAiApiKey);

        // --- Step 6: Bundle Response ---
        const response: BriefingResponse = {
            requestDomain: domain,
            executiveCard: {
                pulseIndex: benchmarkMatrix[0].pulseIndex,
                narrativeMomentum: benchmarkMatrix[0].narrativeMomentum,
                sentimentScore: benchmarkMatrix[0].sentimentScore,
                keyMetrics: {}, // Placeholder
            },
            benchmarkMatrix,
            eventLog,
            aiSummary: {
                summary: summary.split('\n').filter(s => s.length > 5), // Basic formatting
                groqTlDr,
            },
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Full error:', error);
        return NextResponse.json({ error: 'Failed to generate briefing.' }, { status: 500 });
    }
}