import { createPersonPrompt } from '@/lib/prompt/nl2prompt';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { traits, messages } = await request.json();        
        const { prompt, negative_prompt } = await createPersonPrompt(traits, messages);
        return NextResponse.json({ prompt, negative_prompt });
    } catch (error) {
        console.error('Error in nl2prompt:', error);
        return NextResponse.json({ error: 'Failed to generate prompt' }, { status: 500 });
    }
}
