// DRAFT — Cloudflare Pages Functions
// Route: /t/:template
// 役割:
//   1. UTM 付きリンクを受け取り、対象テンプレートの Gumroad URL へ 302 redirect
//   2. UTM パラメータ + 最小限のリクエスト情報を非同期で Analytics Engine に書き込む
//      (ctx.waitUntil で redirect を遅延させない)
//
// 境界の原則:
//   - ここには secret を書かない。Analytics Engine binding は wrangler.toml / Pages dashboard で設定
//   - 通貨・価格はこの層では扱わない (publish-premium.py の JPY バグ再発防止)
//   - Gumroad の URL はクライアント側共通定数 (packages/create-mcp-server/src/premium-urls.ts) と
//     同じ真実を参照する。現時点はこのファイル内に const 複製を置き、Iwa が shared パッケージ化
//     したら import に切り替える (TODO)。
//
// Env bindings (Pages dashboard で設定する):
//   - ANALYTICS: AnalyticsEngineDataset   (無料枠で十分)
//   - PREMIUM_URL_DATABASE: string         (Gumroad URL を env から差し込む形に寄せる)
//   - PREMIUM_URL_AUTH: string
//   - PREMIUM_URL_API_PROXY: string

interface Env {
  ANALYTICS?: AnalyticsEngineDataset;
  PREMIUM_URL_DATABASE?: string;
  PREMIUM_URL_AUTH?: string;
  PREMIUM_URL_API_PROXY?: string;
}

interface AnalyticsEngineDataset {
  writeDataPoint(event: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

type Ctx = EventContext<Env, 'template', Record<string, unknown>>;

// Iwa が packages/create-mcp-server/src/premium-urls.ts を shared パッケージ化したら
// この fallback は削除する。env 未設定時のフェイルセーフとしてのみ置く。
const FALLBACK_URLS: Record<string, string> = {
  database: 'https://nexuslabzen.gumroad.com/l/ijuvn',
  auth: 'https://nexuslabzen.gumroad.com/l/dghzas',
  'api-proxy': 'https://nexuslabzen.gumroad.com/l/bktllv',
};

function resolveTargetUrl(env: Env, template: string): string | undefined {
  const envKey = `PREMIUM_URL_${template.toUpperCase().replace(/-/g, '_')}`;
  const fromEnv = (env as Record<string, unknown>)[envKey];
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv;
  }
  return FALLBACK_URLS[template];
}

function sanitize(value: string | null, maxLen = 128): string {
  if (!value) return '';
  return value.slice(0, maxLen).replace(/[\r\n\t]/g, ' ');
}

export const onRequestGet = async (ctx: Ctx): Promise<Response> => {
  const { params, request, env } = ctx;
  const template = String(params.template ?? '').toLowerCase();

  const target = resolveTargetUrl(env, template);
  if (!target) {
    return new Response(`Unknown template: ${template}`, { status: 404 });
  }

  const url = new URL(request.url);
  const utm = {
    source: sanitize(url.searchParams.get('utm_source')),
    medium: sanitize(url.searchParams.get('utm_medium')),
    campaign: sanitize(url.searchParams.get('utm_campaign')),
    content: sanitize(url.searchParams.get('utm_content')),
  };

  // UTM パラメータは downstream にも伝えたい (Gumroad 側の参照用)。
  // Gumroad が UTM を解釈しない場合でも、referrer として残す用途あり。
  const targetUrl = new URL(target);
  for (const [k, v] of Object.entries(utm)) {
    if (v) targetUrl.searchParams.set(`utm_${k}`, v);
  }

  // 非同期ログ書き込み — redirect 自体を遅延させない。
  if (env.ANALYTICS) {
    const write = async () => {
      try {
        env.ANALYTICS!.writeDataPoint({
          indexes: [template], // sampling/queryのキー
          blobs: [
            template,
            utm.source,
            utm.medium,
            utm.campaign,
            utm.content,
            sanitize(request.headers.get('referer')),
            sanitize(request.headers.get('user-agent'), 256),
            sanitize(request.headers.get('cf-ipcountry'), 8),
          ],
          doubles: [Date.now()],
        });
      } catch {
        // Analytics 書き込み失敗は redirect を壊さない。観測のみ。
      }
    };
    ctx.waitUntil(write());
  }

  return Response.redirect(targetUrl.toString(), 302);
};
