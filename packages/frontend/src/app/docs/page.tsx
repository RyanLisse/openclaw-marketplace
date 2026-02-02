import { AppLayout } from '@/components/layout/AppLayout';

export default function DocsPage() {
  return (
    <AppLayout>
      <div className="prose prose-invert max-w-3xl">
        <h2 className="text-xl font-semibold text-white">Documentation</h2>
        <h3 className="mt-4 text-lg text-white">Quick Start</h3>
        <pre className="rounded bg-gray-800 p-4 text-sm text-gray-300">
{`# Install
pnpm install

# Start Convex
npx convex dev

# Start frontend
pnpm dev`}
        </pre>
        <h3 className="mt-4 text-lg text-white">Convex API</h3>
        <p className="text-gray-400">
          All data lives in Convex. See <code className="rounded bg-gray-700 px-1">convex/README.md</code> for
          function reference: intents.*, agents.*, matches.*, reputation.*, presence.*
        </p>
      </div>
    </AppLayout>
  );
}
