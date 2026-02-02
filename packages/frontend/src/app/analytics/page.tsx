'use client';

import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { AppLayout } from '@/components/layout/AppLayout';

export default function AnalyticsPage() {
  const intents = useQuery(api.intents.list, {}) ?? [];
  const openCount = intents.filter((i) => i.status === 'open').length;
  const matchedCount = intents.filter((i) => i.status === 'matched').length;
  const closedCount = intents.filter((i) => i.status === 'closed').length;
  const needCount = intents.filter((i) => i.type === 'need').length;
  const offerCount = intents.filter((i) => i.type === 'offer').length;

  const skillsCount: Record<string, number> = {};
  for (const i of intents) {
    for (const s of i.skills) {
      skillsCount[s] = (skillsCount[s] ?? 0) + 1;
    }
  }
  const popularSkills = Object.entries(skillsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Analytics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Open Intents" value={openCount} />
          <StatCard label="Matched" value={matchedCount} />
          <StatCard label="Closed" value={closedCount} />
          <StatCard label="Total" value={intents.length} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
            <h3 className="font-medium text-white">By Type</h3>
            <div className="mt-2 space-y-2">
              <Bar label="Need" value={needCount} max={intents.length || 1} />
              <Bar label="Offer" value={offerCount} max={intents.length || 1} />
            </div>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
            <h3 className="font-medium text-white">Popular Skills</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {popularSkills.map(([skill, count]) => (
                <span
                  key={skill}
                  className="rounded bg-gray-700 px-2 py-1 text-sm text-gray-300"
                >
                  {skill} ({count})
                </span>
              ))}
              {popularSkills.length === 0 && (
                <p className="text-sm text-gray-500">No skills yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">{value}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-gray-700">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
