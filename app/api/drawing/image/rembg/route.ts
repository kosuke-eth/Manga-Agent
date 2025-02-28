import { removeBg } from '@/lib/sd-webui';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { image_url } = await request.json()

        const image = await removeBg(image_url);
        return NextResponse.json({ image });

    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
