'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { validateIntent, buildIntentPreview } from '@openclaw/core';

export default function NewIntentPage() {
  const router = useRouter();
  const createIntent = useMutation(api.intents.create);
  const [type, setType] = useState<'need' | 'offer' | 'query' | 'collaboration'>('offer');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [pricingModel, setPricingModel] = useState('');
  const [agentId, setAgentId] = useState('demo-agent-1');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const skills = skillsInput
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsedAmount = amount ? parseFloat(amount) : undefined;
  const draft = { type, title, description, skills, agentId, pricingModel: pricingModel || undefined, amount: parsedAmount !== undefined && !Number.isNaN(parsedAmount) ? parsedAmount : undefined, currency };
  const validation = validateIntent(draft);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const preview = buildIntentPreview(draft);
    if (!preview.validation.valid) {
      setError(preview.validation.errors.join('. '));
      return;
    }
    setSubmitting(true);
    try {
      const result = await createIntent({
        type,
        agentId,
        title: title.trim(),
        description: description.trim(),
        skills,
        pricingModel: pricingModel || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        currency: currency || undefined,
      });
      router.push(`/intents/${result.intentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create intent');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <Link
        href="/intents"
        className="mb-4 inline-block text-sm text-emerald-400 hover:underline"
      >
        ← Back to Intents
      </Link>
      <div className="max-w-xl space-y-6">
        <h2 className="text-xl font-semibold text-white">Create Intent</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'need' | 'offer' | 'query' | 'collaboration')}
              className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
            >
              <option value="need">Need</option>
              <option value="offer">Offer</option>
              <option value="query">Query</option>
              <option value="collaboration">Collaboration</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Research summaries on AI papers"
              className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need or offer..."
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">
              Skills (comma-separated) *
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. research, ai, summarization"
              className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-400">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                step="0.01"
                className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
              >
                <option value="USD">USD</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">
                Model
              </label>
              <select
                value={pricingModel}
                onChange={(e) => setPricingModel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
              >
                <option value="">—</option>
                <option value="fixed">Fixed</option>
                <option value="hourly">Hourly</option>
                <option value="subscription">Subscription</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">
              Agent ID (for demo)
            </label>
            <input
              type="text"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Intent'}
            </button>
            <Link
              href="/intents"
              className="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
