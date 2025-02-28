import { NextResponse } from 'next/server'
import { z } from "zod";
import { PanelResponseSchema, PanelRequestSchema } from '@/types/project';
import { generateContentFromMessages, GeminiMessage } from '@/lib/vertex_gemini';

const systemContent = `あなたはマンガのコマ割りの専門家です。

以下の要件と演出意図を踏まえて、ページ全体の構成がプロらしくなるようにコマ割りを提案してください：

1. **コマ情報のフォーマット** 
   - id: コマ番号
   - points: (右上,右下,左下,左上)の順で時計回りに4つの座標を指定(0-100)
   - content: コマの内容を説明するテキスト（キャラ、背景、カメラアングル、構図を含む）
   - background_prompt: 画像生成用の詳細な背景プロンプト（英語）

2. **コマの配置ルール**
   - 日本の漫画スタイルに従い、右上から左下へ向かって読み進められるように配置
   - コマ同士は必ず1~2ポイントの間隔を空ける（0-100スケールにおいて）
   - コマの頂点座標は重複を避ける
   - コマのない部分（空白）をできるだけ無くすようにし、ページ全体を埋めるように配置（コマの数や大きさを適切に調整する）
   - コマが極端に小さくなりすぎないよう、最小サイズは15x15以上を確保する

3. **構図・視点の指示**  
   - 必ず各コマで想定するカメラアングル（ローアングル、俯瞰、クローズアップなど）や画角（ロングショット、ミドルショット、アップ）を意識して描写する。

4. **コマ間のつながり**  
   - コマからコマへどう視線を動かしたいか、ストーリーの流れを重視してコマを配置する。
   - 重要度に応じてコマのサイズや形状を工夫し、メリハリをつける。

5. **視覚的演出**  
   - キャラクターの動きや背景の描写を細かく説明し、読者にとってわかりやすくかつドラマチックに見えるように構成する。
   - 感情表現を強調するために、あえてコマを斜めに配置したり、大ゴマを使うなどの演出を考慮する。

6. **ページ全体の意図説明**  
   - なぜそのようにコマを配置・形状設定したのか、意図や狙いを要所で補足説明する。
   - 物語上の山場や転換点などは大きなコマにする、緊張感を出すために斜めコマを使うなど、プロのテクニックを活かす。

以上を踏まえ、以下の作品情報をもとにプロの視点でコマ割りを提案してください：`;

export async function POST(request: Request) {
    try {
        const rawData = await request.json();
        const data = PanelRequestSchema.parse(rawData);
        console.log('panel/: ', JSON.stringify(data));
        
        const currentPanelsInfo = data.currentPanels 
            ? `現在のコマ数: ${data.currentPanels.count}\n現在のコマの配置と内容:\n${
                data.currentPanels.panels.map(p => 
                    `- ${p.content} (座標: ${JSON.stringify(p.points)})`
                ).join('\n')
              }`
            : '';

        const messages: GeminiMessage[] = [
            {
                role: 'user',
                parts: [{ text: systemContent }]
            },
            {
                role: 'assistant',
                parts: [{ text: 'はい、承知しました。作品の情報を教えてください。' }]
            },
            {
                role: 'user',
                parts: [{ text: `以下の情報に基づいてコマ割りを提案してください：
作品の概要: ${data.storySummary}
登場人物: ${data.storyCharacters.join(', ')}
ページの内容: ${data.pageSummary}
${currentPanelsInfo}
コマ割りの指示: ${data.message}

重要: 必ず生のJSONオブジェクトのみを出力してください。
- マークダウンの\`\`\`jsonコードブロックは使用しないでください
- 説明テキストは一切含めないでください
- コメントも含めないでください
- 前後に余計な改行や空白を入れないでください

以下の構造の JSON オブジェクトのみを出力してください:
{
  "panels": [
    {
      "id": number,
      "points": [
        { "x": number, "y": number }
      ],
      "content": string,
      "background_prompt": "score_9, score_8_up, score_7_up, detailed description",
    }
  ],
  "reasoning": string
}
` }]
            }
        ];

        const jsonResponse = await generateContentFromMessages(messages);
        const result = PanelResponseSchema.parse(JSON.parse(jsonResponse));
        
        console.log('panel result/: ', result);
        return NextResponse.json(result);
    } catch (error) {
        console.error('APIエラー:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid Request Format', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
