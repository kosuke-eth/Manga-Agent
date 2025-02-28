import {z} from "zod";

export interface ImageGenerationResult {
    images: string[];
    response: string;
    imageMetadata: Record<string, any>;
}
export interface GenerationPayload {
    prompt: string;
    negative_prompt: string;
    sampler_index?: string;
    steps?: number;
    cfg_scale?: number;
    batch_size?: number;
    width?: number,
    height?: number,
    inpainting_fill?: number,
    init_images?: string[];
    denoising_strength?: number;
    alwayson_scripts?: {
        controlnet?: {
            args: {
                enabled: boolean;
                image: string;
                module: string;
                model: string;
            }[];
        };
    };
    mask?: string;
    mask_blur?: number;
    inpainting_mask_invert?: number;
    mask_blur_x?: number;
    mask_blur_y?: number;
    inpaint_full_res?: boolean;
    resize_mode?: number;
    image_cfg_scale?: number;
    initial_noise_multiplier?: number;
    inpaint_full_res_padding?: number;
    styles?: string[];
    seed?: number;
    subseed?: number;
    subseed_strength?: number;
    seed_resize_from_h?: number;
    seed_resize_from_w?: number;
    sampler_name?: string;
    n_iter?: number;
}

const GenerateImgResponseSchema = z.object({
    images: z.array(z.object({
        url: z.string(),
        prompt: z.string(),
        negative_prompt: z.string(),
    })),
    parameters: z.object({}).passthrough(),
});
type GenerateImgResponse = z.infer<typeof GenerateImgResponseSchema>;

export async function generateImage(payload: GenerationPayload): Promise<GenerateImgResponse> {
    const sd_api = process.env.SD_WEBUI_BASE_URL;
    const password = process.env.SD_WEBUI_PASSWORD;
    let url = `${sd_api}/sdapi/v1/txt2img`;
    // 仮で固定
    payload.batch_size = payload.batch_size || 2;
    payload.steps = payload.steps || 30;
    payload.cfg_scale = payload.cfg_scale || 7.0;

    if (payload.init_images && payload.init_images.length > 0) {
        url = `${sd_api}/sdapi/v1/img2img`;
        payload.denoising_strength = payload.denoising_strength || 0.75;
    }
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${password}`
        },
        body: JSON.stringify(payload),
    }); 

    const data = await response.json();
    const parsedData = GenerateImgResponseSchema.parse({
        ...data,
        images: data.images.map(img => ({
            url: img.startsWith('data:') ? img : `data:image/webp;base64,${img}`,
            prompt: payload.prompt,
            negative_prompt: payload.negative_prompt,
        }))
    });

    return parsedData;
}

async function getCnModels() {
    const sd_api = process.env.SD_WEBUI_BASE_URL;
    const password = process.env.SD_WEBUI_PASSWORD;
    try {
        const response = await fetch(`${sd_api}/controlnet/model_list`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${password}`
            },
        });
        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error("Error fetching controlnet models:", error);
        throw error;
    }
}

export async function removeBg(image: string): Promise<string> {
    const sd_api = process.env.SD_WEBUI_BASE_URL;
    const password = process.env.SD_WEBUI_PASSWORD;
    try {
        const url = new URL('/rembg', sd_api).toString();
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${password}`
            },
            body: JSON.stringify({
                "input_image": image,
            }),
        });
        const img = (await response.json()).image;
        return img.startsWith('data:') ? img : `data:image/webp;base64,${img}`;
    } catch (error: any) {
        console.error("Error removing background:", error);
        throw error;
    }
}

export async function streamToBase64Img(stream: ReadableStream): Promise<string> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }
    
    const blob = new Blob(chunks);
    const buffer = await blob.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const formattedBase64 = `data:image/webp;base64,${base64Image}`;
    return formattedBase64;
}
