import { getZenKnots } from '@/lib/data/zen-reader';
import { getKaiKnots } from '@/lib/data/kai-reader';
import { KnotList } from '@/components/knots/knot-list';

export default function KnotsPage() {
  const zenKnots = getZenKnots();
  const kaiKnots = getKaiKnots();
  const allKnots = [...zenKnots, ...kaiKnots];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
        Knots
      </h1>
      <p className="mt-2 text-zinc-400">
        条件付き変形演算子（Knot）の一覧と管理
      </p>

      <div className="mt-6">
        <KnotList knots={allKnots} />
      </div>
    </div>
  );
}
