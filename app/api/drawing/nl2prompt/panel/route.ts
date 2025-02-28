import { createPanelPrompt } from '@/lib/prompt/nl2prompt';
import { NextResponse } from 'next/server';
import { PanelPromptRequestSchema } from '@/types/project';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = PanelPromptRequestSchema.parse(body);
        const prompt = await createPanelPrompt(validatedData);
        
        return NextResponse.json({ prompt });
    } catch (error) {
        console.error('Error in nl2prompt:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to generate prompt' 
        }, { 
            status: 500 
        });
    }
}
