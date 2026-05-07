import { NextRequest, NextResponse } from 'next/server';

// Yuino セキュリティ v0 axis 21: Local-first 固定 (5/07 PM jun directive 「絶対妥協なし」)
// 「あなたのデータはあなたの PC から出ません」 = 127.0.0.1 / localhost 以外の host は 403
// 環境変数 OPS_CONSOLE_ALLOW_PUBLIC=1 で override (Phase 3 SaaS 化 prep、 default は禁止)

const ALLOWED_HOSTS = new Set([
  '127.0.0.1',
  'localhost',
  '[::1]',
]);

function isAllowedHost(host: string | null): boolean {
  if (!host) return false;
  // host header may include port (e.g., "127.0.0.1:3100")、 port 部分除去して check
  const hostnameOnly = host.split(':')[0];
  return ALLOWED_HOSTS.has(hostnameOnly);
}

export function middleware(request: NextRequest) {
  // Phase 3 SaaS 化 prep: env var で override 可能
  if (process.env.OPS_CONSOLE_ALLOW_PUBLIC === '1') {
    return NextResponse.next();
  }

  const host = request.headers.get('host');
  if (!isAllowedHost(host)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Local-first only',
        message:
          'Ops Console は localhost からのみアクセス可能です (Yuino セキュリティ v0 axis 21)。 ' +
          '127.0.0.1 / localhost 以外の host からはアクセスできません。',
      },
      { status: 403 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
