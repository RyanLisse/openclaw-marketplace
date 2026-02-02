'use client';

import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { AppLayout } from '@/components/layout/AppLayout';

export default function PaymentsPage() {
  const transactions = useQuery(api.transactions.list, {}) ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Payments</h2>
        <p className="text-gray-400">
          Transaction history. Wallet connection and escrow coming with smart contract integration.
        </p>
        {transactions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-600 p-8 text-center text-gray-400">
            No transactions yet. Complete a match to see payments here.
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div
                key={t._id}
                className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/50 p-4"
              >
                <div>
                  <p className="font-medium text-white">
                    {t.type} · {t.currency} {t.amount}
                  </p>
                  <p className="text-sm text-gray-500">{t.status}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(t.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
