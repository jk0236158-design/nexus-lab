import {
  getLatestYuinoDigest,
  getYuinoDigestList,
  type YuinoDigest,
} from '@/lib/data/yuino-digest';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function YuinoPreviewPage() {
  const latest = getLatestYuinoDigest();
  const list = getYuinoDigestList();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-muted-foreground">
          Yuino Preview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          judgment digest 出力の公開 form と内部 evidence を並行確認 (Yuino 公開 brand = Aira 内部実装の同体)
        </p>
      </div>

      {!latest ? (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-muted-foreground">digest 未生成</CardTitle>
            <CardDescription className="text-muted-foreground">
              `aira/data/digests/` に file が存在しません。 Yuino dogfood
              実行後に再表示されます。
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-muted-foreground">
                  最新 digest: {latest.date}
                </CardTitle>
                <CardDescription className="text-muted-foreground break-all">
                  source: {latest.sourcePath}
                </CardDescription>
              </div>
              <div className="flex shrink-0 gap-2">
                <Badge variant="secondary">
                  WAIT {latest.waitObservations.length}
                </Badge>
                <Badge variant="secondary">
                  Contradiction {latest.contradictionNotes.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="public">
              <TabsList>
                <TabsTrigger value="public">公開 form (利用者向け)</TabsTrigger>
                <TabsTrigger value="evidence">
                  内部 evidence (raw markdown)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="public" className="pt-4">
                <PublicForm digest={latest} />
              </TabsContent>

              <TabsContent value="evidence" className="pt-4">
                <EvidenceForm digest={latest} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {list.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-muted-foreground">過去 digest</CardTitle>
            <CardDescription className="text-muted-foreground">
              {list.length} 件
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {list.map((entry) => (
                <li
                  key={entry.filename}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{entry.date}</span>
                  <span className="text-muted-foreground truncate ml-4">
                    {entry.filename}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PublicForm({ digest }: { digest: YuinoDigest }) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
          確認待ちの行動 ({digest.waitObservations.length})
        </h3>
        {digest.waitObservations.length === 0 ? (
          <p className="text-sm text-muted-foreground">なし</p>
        ) : (
          <ul className="space-y-1">
            {digest.waitObservations.map((line, i) => (
              <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                {line.replace(/^-\s*/, '')}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
          食い違いノート ({digest.contradictionNotes.length})
        </h3>
        {digest.contradictionNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">なし</p>
        ) : (
          <ul className="space-y-1">
            {digest.contradictionNotes.map((line, i) => (
              <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                {line.replace(/^-\s*/, '')}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted-foreground pt-2 border-t border-border">
        数字源: {digest.sourcePath}
      </p>
    </div>
  );
}

function EvidenceForm({ digest }: { digest: YuinoDigest }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">source: {digest.sourcePath}</p>
      <pre className="overflow-auto rounded-md border border-border bg-card p-4 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
        {digest.content}
      </pre>
    </div>
  );
}
