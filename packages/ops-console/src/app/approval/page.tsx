import { getInboxItems } from '@/lib/data/inbox';
import { ApproveCard } from '@/components/approval/approve-card';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ApprovalPage() {
  const items = getInboxItems({ status: 'pending' });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          承認待ち
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          shared-ops/inbox の判断待ち item を一覧表示。 承認 / 修正 / 却下 を
          1 click で実行 (Yuino セキュリティ v0 axis 10 Approval Gate UI)
        </p>
      </div>

      <div className="flex items-center gap-3 text-sm text-zinc-400">
        <span>
          pending <span className="text-zinc-100">{items.length}</span> 件
        </span>
      </div>

      {items.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">
              pending な判断はありません
            </CardTitle>
            <CardDescription className="text-zinc-500">
              新しい判断待ち item が `~/.shared-ops/inbox/` に入ると、
              ここに表示されます。
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ApproveCard key={item.filename} inboxItem={item} />
          ))}
        </div>
      )}
    </div>
  );
}
