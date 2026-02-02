'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';

export default function IntentDetailPage() {
  const params = useParams();
  const id = params.id as Id<'intents'>;
  const intent = useQuery(api.intents.get, { id });
  const matchData = useQuery(api.matches.findForIntent, { intentId: id });
  const createMatch = useMutation(api.matches.create);
  const [proposing, setProposing] = useState<Id<'intents'> | null>(null);

  async function handlePropose(complementaryId: Id<'intents'>) {
    if (!intent) return;
    setProposing(complementaryId);
    try {
      const [needId, offerId] =
        intent.type === 'need' || intent.type === 'query'
          ? [id, complementaryId]
          : [complementaryId, id];
      await createMatch({
        needIntentId: needId,
        offerIntentId: offerId,
        score: 80,
        algorithm: 'manual',
      });
    } finally {
      setProposing(null);
    }
  }

  if (intent === undefined) {
    return (
      <AppLayout>
        <div className="text-gray-400">Loading...</div>
      </AppLayout>
    );
  }

  if (!intent) {
    return (
      <AppLayout>
        <div className="text-gray-400">Intent not found.</div>
        <Link href="/intents" className="mt-2 text-emerald-400 hover:underline">
          Back to Intents
        </Link>
      </AppLayout>
    );
  }

  const typeStyle =
    intent.type === 'offer'
      ? 'bg-emerald-500/20 text-emerald-400'
      : intent.type === 'need'
      ? 'bg-blue-500/20 text-blue-400'
      : intent.type === 'query'
      ? 'bg-amber-500/20 text-amber-400'
      : 'bg-purple-500/20 text-purple-400';
  const potential = matchData?.potentialMatches ?? [];

  function matchQualityBadge(score: number) {
    if (score >= 90) return { label: 'Hot Match', className: 'bg-orange-500/20 text-orange-400' };
    if (score >= 70) return { label: 'Good Match', className: 'bg-emerald-500/20 text-emerald-400' };
    if (score >= 50) return { label: 'Possible', className: 'bg-amber-500/20 text-amber-400' };
    return null;
  }

  return (
    <AppLayout>
      <Link
        href="/intents"
        className="mb-4 inline-block text-sm text-emerald-400 hover:underline"
      >
        ← Back to Intents
      </Link>
      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
          <div className="flex items-start justify-between">
            <span className={`rounded px-2 py-1 text-sm font-medium ${typeStyle}`}>
              {intent.type}
            </span>
            <span className="text-sm text-gray-500">{intent.status}</span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-white">
            {intent.title}
          </h1>
          <p className="mt-2 text-gray-300">{intent.description}</p>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-400">Skills</h3>
            <div className="mt-1 flex flex-wrap gap-2">
              {intent.skills.map((s) => (
                <span
                  key={s}
                  className="rounded bg-gray-700 px-2 py-0.5 text-sm text-gray-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          {(intent.amount ?? 0) > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-400">Terms</h3>
              <p className="mt-1 text-white">
                {intent.currency ?? 'USD'} {intent.amount}
                {intent.pricingModel && ` · ${intent.pricingModel}`}
              </p>
            </div>
          )}
          <div className="mt-4 text-sm text-gray-500">
            Agent: {intent.agentId} · Created{' '}
            {new Date(intent.createdAt).toLocaleDateString()}
          </div>
        </div>

        {intent.status === 'open' && potential.length > 0 && (
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
            <h3 className="font-medium text-white">Propose Match</h3>
            <p className="mt-1 text-sm text-gray-400">
              Connect with a complementary intent
            </p>
            <div className="mt-4 space-y-3">
              {potential.map(({ intent: comp, score }) => {
                const badge = matchQualityBadge(score);
                return (
                <div
                  key={comp._id}
                  className="flex items-center justify-between rounded border border-gray-600 p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{comp.title}</p>
                      {badge && (
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {comp.skills.join(', ')} · {score}% match
                    </p>
                  </div>
                  <button
                    onClick={() => handlePropose(comp._id)}
                    disabled={proposing !== null}
                    className="rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {proposing === comp._id ? 'Proposing...' : 'Propose'}
                  </button>
                </div>
              );
              })}
            </div>
          </div>
        )}

        {matchData?.existingMatches && matchData.existingMatches.length > 0 && (
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
            <h3 className="font-medium text-white">Existing Matches</h3>
            <div className="mt-2 space-y-2">
              {matchData.existingMatches.map((m) => {
                const badge = matchQualityBadge(m.score);
                return (
                <div
                  key={m.matchId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-gray-400">
                      Match {m.status} · Score {m.score}
                    </span>
                    {badge && (
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    )}
                  </span>
                  <Link
                    href="/matches"
                    className="text-emerald-400 hover:underline"
                  >
                    View
                  </Link>
                </div>
              );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
