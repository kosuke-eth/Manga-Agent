import { NextResponse } from 'next/server';

/**
 * 定数時間比較（constant-time comparison）を行う関数
 * タイミング攻撃対策として、文字列の長さが同じ場合でも全桁比較します。
 */
function safeCompare(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}

/**
 * 認証に失敗した場合に 401 レスポンスを返すヘルパー関数
 */
function unauthorizedResponse() {
    return new NextResponse('認証が必要です', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Secure Area"',
        },
    });
}

/**
 * Next.js Middleware エントリーポイント
 */
export async function middleware(request: any) {
    // リクエストヘッダーから Authorization を取得
    const authHeader = request.headers.get('authorization');

    if (authHeader) {
        // ヘッダーの内容は "Basic <base64エンコードされた文字列>" の形式になっている
        const [scheme, encoded] = authHeader.split(' ');
        if (scheme === 'Basic' && encoded) {
            let decoded = '';
            try {
                // Edge Runtime では atob() が利用可能
                decoded = atob(encoded);
            } catch (err) {
                return unauthorizedResponse();
            }
            // decoded は "username:password" となっているので、分割して取得
            const [username, password] = decoded.split(':');

            // 環境変数から正しいユーザー名とパスワードを取得
            const validUsername = process.env.NEXT_PUBLIC_BASIC_AUTH_USERNAME || '';
            const validPassword = process.env.NEXT_PUBLIC_BASIC_AUTH_PASSWORD || '';

            // 定数時間比較を使ってユーザー名とパスワードを検証
            if (safeCompare(username, validUsername) && safeCompare(password, validPassword)) {
                // 認証成功 → 通常通り次の処理へ
                return NextResponse.next();
            }
        }
    }

    // 認証に失敗した場合は 401 を返す
    return unauthorizedResponse();
}

/**
 * この middleware を適用するパスを指定（ここでは全てのパスに適用）
 */
export const config = {
    matcher: '/:path*',
};
