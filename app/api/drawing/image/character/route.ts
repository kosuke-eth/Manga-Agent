import { generateImage, removeBg } from '@/lib/sd-webui';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { 
            prompt, 
            width = 512, 
            height = 512, 
            negativePrompt = "Low quality, blurry, or noisy images",
            referenceImage
        } = await request.json()

        const input = {
            prompt,
            negative_prompt: negativePrompt,
            width: Number(width),
            height: Number(height),
            ...(referenceImage ? {
                init_images: [referenceImage],
                denoising_strength: 0.75
            } : {})
        };
        const result = await generateImage(input);
        const images = [];
        for (const image of result.images) {
            images.push({
                ...image,
                url: await removeBg(image.url)
            });
        }

        return NextResponse.json({ images });
    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
