'use client';

import { useState } from 'react';
import type { UnifiedKnot } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { KnotCard } from './knot-card';

interface KnotListProps {
  knots: UnifiedKnot[];
}

function KnotGrid({ knots }: { knots: UnifiedKnot[] }) {
  if (knots.length === 0) {
    return <p className="mt-6 text-zinc-500 text-sm">Knots not found.</p>;
  }
  return (
    <div className="mt-4 flex flex-col gap-3">
      {knots.map((knot) => (
        <KnotCard key={`${knot.agent}-${knot.id}`} knot={knot} />
      ))}
    </div>
  );
}

export function KnotList({ knots }: KnotListProps) {
  const zenKnots = knots.filter((k) => k.agent === 'zen');
  const kaiKnots = knots.filter((k) => k.agent === 'kai');

  return (
    <Tabs defaultValue="all">
      <TabsList variant="line">
        <TabsTrigger value="all">All ({knots.length})</TabsTrigger>
        <TabsTrigger value="zen">Zen ({zenKnots.length})</TabsTrigger>
        <TabsTrigger value="kai">Kai ({kaiKnots.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <KnotGrid knots={knots} />
      </TabsContent>
      <TabsContent value="zen">
        <KnotGrid knots={zenKnots} />
      </TabsContent>
      <TabsContent value="kai">
        <KnotGrid knots={kaiKnots} />
      </TabsContent>
    </Tabs>
  );
}
