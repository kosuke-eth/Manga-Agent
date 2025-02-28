import { generateImage } from '@/lib/sd-webui';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { prompt } = await request.json()

        const input = {
            prompt,
            negative_prompt: "Low quality, blurry, or noisy images, people, animals, or text",
            width: Number(512),
            height: Number(512),
        };
        const image = await generateImage(input);

        return NextResponse.json({ images: image.images });

    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
