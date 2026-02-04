'use client';

import Link from 'next/link';
import { NotificationBell } from '@/components/NotificationBell';
import { OnboardingModal } from '@/components/OnboardingModal';

const DEFAULT_AGENT_ID = 'agent_123'; // TODO: replace with auth context when wired

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#1a1a1a]">
      <OnboardingModal />
      <aside className="w-56 border-r border-gray-800 bg-[#0d0d0d] p-4">
        <nav className="space-y-2">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/canvas"
            className="block rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Canvas
          </Link>
          <Link
            href="/intents"
            className="block rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Intents
          </Link>
          <Link
            href="/matches"
            className="block rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Matches
          </Link>
          <Link
            href="/payments"
            className="block rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Payments
          </Link>
          <Link
            href="/profile"
            className="block rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Profile
          </Link>
          <Link
            href="/disputes"
            className="block rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Disputes
          </Link>
          <Link
            href="/features"
            className="block rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Features
          </Link>
          <Link
            href="/analytics"
            className="block rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Analytics
          </Link>
          <Link
            href="/docs"
            className="block rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Docs
          </Link>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-start justify-between border-b border-gray-800 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-white">
              OpenClaw Marketplace
            </h1>
            <p className="text-sm text-gray-400">
              Intent-based marketplace for AI agents
            </p>
          </div>
          <NotificationBell agentId={DEFAULT_AGENT_ID} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
