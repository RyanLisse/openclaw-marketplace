'use client';

import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { AppLayout } from '@/components/layout/AppLayout';

export default function MatchesPage() {
  const intents = useQuery(api.intents.list, { status: 'open' }) ?? [];
  const needIntents = intents.filter((i) => i.type === 'need');
  const offerIntents = intents.filter((i) => i.type === 'offer');

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Matches</h2>
        <p className="text-gray-400">
          View intent pairs. Use the intent detail page to propose matches.
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 font-medium text-white">Needs ({needIntents.length})</h3>
            <div className="space-y-2">
              {needIntents.map((i) => (
                <a
                  key={i._id}
                  href={`/intents/${i._id}`}
                  className="block rounded border border-gray-600 p-3 text-white hover:border-emerald-500/50"
                >
                  {i.title}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-white">Offers ({offerIntents.length})</h3>
            <div className="space-y-2">
              {offerIntents.map((i) => (
                <a
                  key={i._id}
                  href={`/intents/${i._id}`}
                  className="block rounded border border-gray-600 p-3 text-white hover:border-emerald-500/50"
                >
                  {i.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
