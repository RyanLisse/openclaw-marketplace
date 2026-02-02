'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { AppLayout } from '@/components/layout/AppLayout';
import Link from 'next/link';

export default function IntentsPage() {
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('open');

  const intents = useQuery(api.intents.list, {
    type: typeFilter,
    status: statusFilter,
  }) ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Browse Intents</h2>
          <Link
            href="/intents/new"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Create Intent
          </Link>
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-gray-400">Type</label>
            <select
              value={typeFilter ?? 'all'}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value === 'all' ? undefined : e.target.value
                )
              }
              className="mt-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
            >
              <option value="all">All</option>
              <option value="need">Need</option>
              <option value="offer">Offer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
            >
              <option value="open">Open</option>
              <option value="matched">Matched</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {intents.map((intent) => (
            <IntentCard key={intent._id} intent={intent} />
          ))}
        </div>

        {intents.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-600 p-8 text-center text-gray-400">
            No intents found. Create one to get started.
            <Link
              href="/intents/new"
              className="mt-2 block text-emerald-400 hover:underline"
            >
              Create Intent
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function IntentCard({
  intent,
}: {
  intent: {
    _id: Id<'intents'>;
    type: string;
    title: string;
    description: string;
    skills: string[];
    status: string;
    agentId: string;
    amount?: number;
    currency?: string;
  };
}) {
  const typeStyle =
    intent.type === 'offer'
      ? 'bg-emerald-500/20 text-emerald-400'
      : intent.type === 'need'
      ? 'bg-blue-500/20 text-blue-400'
      : intent.type === 'query'
      ? 'bg-amber-500/20 text-amber-400'
      : 'bg-purple-500/20 text-purple-400';
  return (
    <Link
      href={`/intents/${intent._id}`}
      className="block rounded-lg border border-gray-700 bg-gray-800/50 p-4 transition hover:border-emerald-500/50"
    >
      <div className="flex items-start justify-between">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeStyle}`}>
          {intent.type}
        </span>
        <span className="text-xs text-gray-500">{intent.status}</span>
      </div>
      <h3 className="mt-2 font-medium text-white">{intent.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-gray-400">
        {intent.description}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {intent.skills.slice(0, 3).map((s) => (
          <span
            key={s}
            className="rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-300"
          >
            {s}
          </span>
        ))}
      </div>
      {(intent.amount ?? 0) > 0 && (
        <p className="mt-2 text-sm text-gray-400">
          {intent.currency ?? 'USD'} {intent.amount}
        </p>
      )}
    </Link>
  );
}
