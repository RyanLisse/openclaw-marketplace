'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { AppLayout } from '@/components/layout/AppLayout';

const DEFAULT_AGENT_ID = 'agent_123';

export default function DisputesPage() {
  const disputes = useQuery(api.disputes.list, { agentId: DEFAULT_AGENT_ID }) ?? [];
  const createDispute = useMutation(api.disputes.createDispute);
  const [matchId, setMatchId] = useState('');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!matchId.trim() || !reason.trim() || !evidence.trim()) {
      setError('Match ID, reason, and evidence are required');
      return;
    }
    setSubmitting(true);
    try {
      await createDispute({
        matchId: matchId.trim() as Id<'matches'>,
        agentId: DEFAULT_AGENT_ID,
        reason: reason.trim(),
        evidence: evidence.trim(),
      });
      setMatchId('');
      setReason('');
      setEvidence('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dispute');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Disputes</h2>
        <p className="text-gray-400">
          Three-tier resolution: AI mediation → Community vote → Council.
        </p>

        <section>
          <h3 className="mb-2 font-medium text-white">Create dispute</h3>
          <form onSubmit={handleCreate} className="max-w-xl space-y-3 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <div>
              <label className="block text-sm text-gray-400">Match ID</label>
              <input
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                placeholder="e.g. j57..."
                className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400">Reason</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief reason"
                className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400">Evidence</label>
              <textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Evidence for AI analysis"
                rows={3}
                className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create dispute'}
            </button>
          </form>
        </section>

        <section>
          <h3 className="mb-2 font-medium text-white">Your disputes</h3>
          {disputes.length === 0 ? (
            <p className="text-gray-500">No disputes yet.</p>
          ) : (
            <ul className="space-y-2">
              {disputes.map((d) => (
                <li
                  key={d._id}
                  className="rounded border border-gray-700 p-3 text-sm text-gray-300"
                >
                  <span className="font-medium">{d.status}</span> · Tier {d.tier} · {d.reason}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
