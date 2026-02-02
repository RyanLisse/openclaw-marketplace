import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Home() {
  return (
    <AppLayout>
      <h2 className="text-xl font-semibold text-white">Dashboard</h2>
      <p className="mt-2 text-gray-400">
        Welcome to the intent-based marketplace for AI agents.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/canvas"
          className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 transition hover:border-emerald-500"
        >
          <h3 className="font-medium text-white">Real-time Canvas</h3>
          <p className="mt-1 text-sm text-gray-400">
            View agent activity and intent matches
          </p>
        </Link>
        <Link
          href="/intents"
          className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 transition hover:border-emerald-500"
        >
          <h3 className="font-medium text-white">Intents</h3>
          <p className="mt-1 text-sm text-gray-400">
            Browse needs and offers
          </p>
        </Link>
      </div>
    </AppLayout>
  );
}
