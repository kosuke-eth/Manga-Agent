import { NextResponse } from 'next/server';
import { StoryRequestSchema } from '@/types/project';
import { generateContentFromMessages, GeminiMessage } from '@/lib/vertex_gemini';

export async function POST(request: Request) {
    try {
        const rawData = await request.json();
        const data = StoryRequestSchema.parse(rawData);

        const messages: GeminiMessage[] = [
            {
                role: 'user',
                parts: [{
                    text: `あなたはプロのマンガの物語設定の専門家です。

以下のいずれかの対応を行ってください：

A) 物語設定の提案
1. タイトルと概要の改善
2. 既存の登場人物の改善
3. 不要なキャラクターの削除提案
4. 新しいキャラクターの追加提案

B) ページ構成の提案
1. 必要なページ数
2. 各ページの内容

C) 物語についての相談対応
ストーリー展開やキャラクター設定について、具体的なアドバイスや意見を提供します。

ユーザーの意図を分析し、A、B、Cのいずれかを選択してください：
- 「キャラクターを追加したい」「ストーリーを変更したい」といった提案の要望には物語設定の提案(A)
    - キャラクターの提案について
        - キャラクターの名前は具体的に決めて下さい
        - キャラクターの特徴や役割を変更したい場合は、既存の登場人物の改善
        - 既存のキャラの名前を変更する場合は、そのキャラを削除して新しい名前でキャラを追加
- 「何ページ必要か」「どう展開するか」といった具体的な質問にはページ構成の提案(B)
- その他の相談や質問には物語についての相談対応(C)を行います

重要: 必ず生のJSONオブジェクトのみを出力してください。
- マークダウンの\`\`\`jsonコードブロックは使用しないでください
- 説明テキストは一切含めないでください
- コメントも含めないでください
- 前後に余計な改行や空白を入れないでください

以下の構造の JSON オブジェクトのみを出力してください:
{
    "suggestion": {
        "type": "story" | "pages" | "chat",
        "type_reasoning": "選択理由を説明する文字列",
        "reasoning": "提案の詳細な理由を説明する文字列",
        "story": {
            "title": "タイトル",
            "summary": "概要",
            "characters": {
                "add": [{"name": "名前", "traits": "詳細な特徴"}],
                "update": [{"name": "名前", "traits": "詳細な特徴"}],
                "remove": [{"name": "名前"}]
            }
        } | null,
        "pages": [{"pageNumber": ページ番号, "content": "内容"}] | null,
        "chat_response": "相談対応の回答文字列" | null
    }
}`
                }]
            }
        ];

        if (data.messageHistory) {
            data.messageHistory.forEach(msg => {
                messages.push({
                    role: msg.isUser ? 'user' : 'assistant',
                    parts: [{ text: msg.text }]
                });
            });
        }

        // Add current context
        messages.push({
            role: 'user',
            parts: [{
                text: `現在のタイトル: ${data.currentTitle}
現在の概要: ${data.currentSummary}
既存の登場人物:
${data.characters.map(c => `- ${c.name}: ${c.traits}`).join('\n')}

ユーザーからの指示: ${data.message}`
            }]
        });

        const response = await generateContentFromMessages(messages);
        console.log("Messages:", JSON.stringify(messages));
        
        console.log('APIレスポンス:', response);
        
        const result = JSON.parse(response);
        
        return NextResponse.json(result);
    } catch (error) {
        console.error('APIエラー:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
