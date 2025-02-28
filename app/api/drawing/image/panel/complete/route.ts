import { generateImage } from '@/lib/sd-webui';
import { NextResponse } from 'next/server';

// POST /api/drawing/image/complete
export async function POST(request: Request) {
    try {
        const { backgroundSrc, maskImage, characters, prompt } = await request.json();
        
        const width = 512;
        const height = 512;


        // console.log(characterImages.length);
        // console.log(characterImages[0].slice(0, 10));
        console.log(characters[0].prompt, prompt);
        let args = [];
        if (characters.length > 0) {
            args = characters.map((character) => ({
                enabled: true,
                image: character.image,
                module: "reference_only",
                model: "diffusion_pytorch_model_promax [9460e4db]"
            }));
        }
        let maskParams = {};
        if (maskImage) {
            maskParams = {
                inpainting_fill: 1,
                mask_blur: 4,
                inpainting_mask_invert: 0,
                inpaint_full_res: false,
                mask: maskImage,
                denoising_strength: 0.75,
                mask_blur_x: 4,
                mask_blur_y: 4,
                sampler_name: "Euler",
                sampler_index: "Euler",    
            };
        }
        console.log(maskParams);
        
        const input = {
            prompt: prompt,
            negative_prompt: "Low quality, blurry, or noisy images, or text",
            init_images: [backgroundSrc],
            width,
            height,
            steps: 30,
            batch_size: 1,
            alwayson_scripts: {
                controlnet: {
                    args,
                }
            },
            ...maskParams,
        };
        

        const image = await generateImage(input);

        return NextResponse.json({ images: image.images });
    } catch (error: any) {
        console.error('Complete API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}