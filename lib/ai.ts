
import OpenAI from 'openai';

// NOTE: This will fail if env var is missing, handled in UI via Error Boundary or Try/Catch
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export type OutputType = 'Persona' | 'Journey' | 'Summary' | 'Brief' | 'Presentation';

export async function generateProjectOutput(context: string, goal: string, type: string, options?: any) {
    let systemPrompt = "You are an expert User Researcher assistant.";

    // Default goal if empty
    if (!goal || !goal.trim()) {
        goal = "Analyze the provided context files and generate the requested output.";
    }

    switch (type) {
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

    const response = await openai.chat.completions.create({
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
