import { VertexAI } from '@google-cloud/vertexai';

const vertexAI = new VertexAI({project: process.env.GOOGLE_PROJECT_ID, location: 'us-central1'});
const model = vertexAI.getGenerativeModel({
    model: 'gemini-2.0-flash-001',
});

export async function generateContent(prompt: string): Promise<string> {
    try {
        const response = await model.generateContent(prompt);
        const contentResponse = await response.response;

        if (!contentResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('No response from Vertex AI');
        }

        return cleanJson(contentResponse.candidates[0].content.parts[0].text.trim());
    } catch (error) {
        console.error('Error generating content:', error);
        throw error;
    }
}

export interface GeminiMessage {
    role: 'user' | 'assistant';
    parts: (TextPart | ImagePart)[];
}

interface TextPart {
    text: string;
}

interface ImagePart {
    inlineData: {
        data: string;
        mimeType: string;
    };
}

export function cleanJson(json: string): string {
    // ```jsonと```を削除
    return json.replace(/^```json/, '').replace(/```$/, '');
}

export async function generateContentFromMessages(messages: GeminiMessage[]): Promise<string> {
    try {
        const request = {
            contents: messages,
        };
        
        const response = await model.generateContent(request);
        const contentResponse = await response.response;

        if (!contentResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('No response from Vertex AI');
        }
        return cleanJson(contentResponse.candidates[0].content.parts[0].text.trim());
    } catch (error) {
        console.error('Error generating content from messages:', error);
        throw error;
    }
}
