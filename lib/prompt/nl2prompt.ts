import { PanelPromptRequest } from '@/types/project';
import { generateContent } from '@/lib/vertex_gemini';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export async function createPersonPrompt(traits: string, messages?: Message[]): Promise<{prompt: string, negative_prompt: string}> {
    try {
        const promptTemplate = `Generate a valid JSON output with exactly two properties: "prompt" and "negative_prompt". Do not include any extra text.
{
    "prompt": "a brief comma-separated description including appearance, clothing, and expression on a solid white background",
    "negative_prompt": "a comma-separated list of issues like extra people, detailed backgrounds, unwanted elements, and technical problems"
}
Ensure:
- Use only double quotes.
- Output strictly matches the JSON structure above without any additional characters.

Character description:
${traits}

${messages?.length ? `\nConversation history:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}` : ''}
`;

        const jsonResponse = await generateContent(promptTemplate);
        const promptData = JSON.parse(jsonResponse);
        return {
            prompt: `score_9, score_8_up, score_7_up, character only, ${promptData.prompt}`,
            negative_prompt: promptData.negative_prompt
        };
    } catch (error) {
        console.error('Error generating prompt:', error);
        throw error;
    }
}

export async function createPanelPrompt(request: PanelPromptRequest): Promise<string> {
    try {
        const prompt = `Please convert this manga panel description into an image generation prompt.
Rules:
- Output only English words
- Use comma-separated format
- Focus on visual elements and composition
- Include character actions, expressions, and scene details
- Keep it concise and specific
- Do not include any explanations, just the prompt

Context:
Story: ${request.story.title}
${request.story.summary}

Characters:
${request.characters.map(c => `- ${c.name}: ${c.traits}`).join('\n')}

Page Context: ${request.pageStory}

Panel Content: ${request.panel.content}
Additional Instructions: ${request.message}`;

        const response = await generateContent(prompt);
        return `score_9, score_8_up, score_7_up, ${response}`;
    } catch (error) {
        console.error('Error generating panel prompt:', error);
        throw error;
    }
}

