
import OpenAI from 'openai';

// Lazy-load OpenAI client to avoid build-time errors when env var isn't set
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

export type OutputType = 'Persona' | 'Journey' | 'Summary' | 'Brief' | 'Presentation' | 'Insights' | 'Prompt';

export async function generateProjectOutput(context: string, goal: string, type: string, options?: any) {
    let systemPrompt = "You are an expert User Researcher assistant.";

    // Default goal if empty
    if (!goal || !goal.trim()) {
        goal = "Analyze the provided context files and generate the requested output.";
    }

    switch (type) {
        case 'Insights':
            systemPrompt = `You are an expert research analyst specializing in extracting actionable insights from qualitative and quantitative research data.

Your task is to analyze the provided documents and extract KEY INSIGHTS that are actionable and supported by evidence.

For each insight you identify:
1. Categorize it appropriately
2. Provide a clear, concise description
3. Include supporting evidence or quotes from the documents
4. Rate the confidence level (High/Medium/Low) based on how much supporting data exists

Format your output as structured Markdown with clear category headings.`;

            if (options?.categories && Array.isArray(options.categories) && options.categories.length > 0) {
                systemPrompt += `\n\nOrganize insights into EXACTLY these categories: ${options.categories.join(', ')}.`;
                systemPrompt += "\nIf a category has no relevant insights, include it with a note that no insights were found for that category.";
            } else {
                systemPrompt += `\n\nOrganize insights into these default categories: Key Findings, Pain Points, Opportunities, Recommendations.`;
            }

            systemPrompt += `

Use this format for each insight:
## [Category Emoji] [Category Name]

### [Insight Title]
**Description:** [Clear, actionable insight]

**Evidence:** "[Direct quote or paraphrase from documents]"

**Confidence:** [High/Medium/Low] - [Brief justification, e.g., "Mentioned by 7/10 participants"]

---`;
            break;
        case 'Prompt':
            systemPrompt = `You are an expert research analyst. Answer the user's question based on the provided research documents.

Be direct and helpful. Use evidence from the documents to support your answer. Format your response in clear, readable Markdown.`;
            break;
        case 'Persona':
            systemPrompt += " Create a detailed User Persona based on the provided context.";
            if (options?.sections && Array.isArray(options.sections) && options.sections.length > 0) {
                systemPrompt += ` Include EXACTLY the following sections: ${options.sections.join(', ')}.`;
                systemPrompt += " If a requested section name appears to be a typo or unclear, infer the most likely intended user research topic and include it using the corrected name.";
            } else {
                systemPrompt += " Include Demographics, Behaviors, Needs, and Pain Points.";
            }
            systemPrompt += " Format as Markdown.";
            break;
        case 'Journey':
            systemPrompt += ` Map out the User Journey based on the context. 
            Output strictly valid JSON. The output must be a JSON object with a "stages" key containing an array of stage objects.`;

            if (options?.sections && Array.isArray(options.sections) && options.sections.length > 0) {
                const sections = options.sections.map((s: string) => s.toLowerCase());
                systemPrompt += ` Each stage object must have: "name", and the following keys as arrays of strings: ${sections.map((s: string) => `"${s}"`).join(', ')}.`;
                systemPrompt += " If a requested swimlane name appears to be a typo or unclear, infer the most likely intended user research topic and include it using the corrected name.";
            } else {
                systemPrompt += ` Each stage object must have: "name", "objectives" (array), "needs" (array), "feelings" (array), and "barriers" (array).`;
            }

            systemPrompt += `
            Format:
            {
              "stages": [
                {
                  "name": "Discovery",
                  ...requested swimlanes as arrays
                }
              ]
            }`;
            break;
        case 'Summary':
            systemPrompt += " Summarize the key findings from the provided research context. Group into Themes and Insights.";
            break;
        case 'Brief':
            systemPrompt += " Create a Research Brief or Plan based on the context and goal.";
            break;
        case 'Presentation':
            systemPrompt += ` You are a presentation generator. Analyze the context and create a structure for a PowerPoint presentation.
            Output strictly valid JSON. The output must be a JSON object with a "slides" key containing an array of slide objects.
            Format:
            {
              "slides": [
                { "title": "Main Title", "type": "Title", "content": ["Subtitle or brief description"] },
                { "title": "Slide Title", "type": "Content", "content": ["Bullet point 1", "Bullet point 2"], "notes": "Speaker notes here" }
              ]
            }`;
            if (options?.slides && Array.isArray(options.slides) && options.slides.length > 0) {
                systemPrompt += ` Include EXACTLY the following slide types: ${options.slides.join(', ')}.`;
                systemPrompt += ` If a requested slide type appears to be custom or unclear, infer the most appropriate content for that slide based on the research context.`;
            } else {
                systemPrompt += ` Create around 5-8 slides summarizing the research status, key findings, and next steps.`;
            }
            break;
        default:
            systemPrompt += " Analyze the provided context to answer the user's goal.";
    }

    const userMessage = `
    GOAL: ${goal}
    
    CONTEXT FILES:
    ${context}
    `;

    const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o", // Defaulting to 4o for best results, can fallback
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        response_format: (type === 'Presentation' || type === 'Journey') ? { type: "json_object" } : undefined
    });

    return response.choices[0].message.content || "No response generated.";
}
