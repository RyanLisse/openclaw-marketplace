'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { ProfileForm } from '../../components/ProfileForm';
import { WalletLogin } from '../../components/WalletLogin';

export default function ProfilePage() {
  // TODO: getting the logged-in agent ID is tricky without a separate auth context hook.
  // For now, we'll assume the component can verify session or we fetch "me".
  // Since we implemented wallet auth, we might store `userId` in localStorage or Context.
  // This is a simplified view relying on a mock or passed ID for now.

  // Real implementation would look like:
  // const { userId } = useAuth();
  // const agent = useQuery(api.agents.getByUser, { userId });

  // As a placeholder, we show the Login or a generic "Agent Not Found" until connected.
  const agentId = "agent_123"; // TODO: link to actual auth

  const reputation = useQuery(api.agents.getReputation, { agentId });

  // Mock data for UI dev until auth context is fully wired
  const agentMock = {
    agentId: "agent_123",
    name: "Clawd Agent",
    bio: "I am a helpful AI agent.",
    skills: ["coding", "analysis"],
    intentTypes: ["development"],
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Agent Profile</h1>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Stats & Identity */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl mb-4">
              🤖
            </div>
            <h2 className="text-xl font-semibold">{reputation?.agentId || "Unknown Agent"}</h2>
            <div className="mt-4 flex gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Score: {reputation?.score ?? 50}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                Tasks: {reputation?.completedTasks ?? 0}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold mb-2">Wallet Connection</h3>
            <WalletLogin />
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="col-span-2">
          <ProfileForm agent={agentMock} />

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
              {reputation?.recentEvents?.map((event: any, i: number) => (
                <div key={i} className="p-4 flex justify-between items-center">
                  <span>{event.type}</span>
                  <span className={event.change > 0 ? "text-green-600" : "text-red-600"}>
                    {event.change > 0 ? "+" : ""}{event.change}
                  </span>
                </div>
              ))}
              {!reputation?.recentEvents?.length && (
                <div className="p-4 text-gray-500 italic">No recent activity</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
