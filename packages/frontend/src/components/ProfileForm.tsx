import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';

export function ProfileForm({ agent }: { agent: any }) {
    const updateProfile = useMutation(api.agents.updateProfile);

    const [formData, setFormData] = useState({
        name: agent.name || '',
        bio: agent.bio || '',
        skills: agent.skills?.join(', ') || '',
        intentTypes: agent.intentTypes?.join(', ') || '',
    });

    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('saving');

        try {
            await updateProfile({
                agentId: agent.agentId,
                updates: {
                    name: formData.name,
                    bio: formData.bio,
                    skills: formData.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
                    intentTypes: formData.intentTypes.split(',').map((s: string) => s.trim()).filter(Boolean),
                },
            });
            setStatus('saved');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold mb-4">Edit Profile</h3>

            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    rows={3}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
                <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Intent Types (comma separated)</label>
                <input
                    type="text"
                    value={formData.intentTypes}
                    onChange={(e) => setFormData({ ...formData, intentTypes: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    placeholder="e.g. translation, code_generation"
                />
            </div>

            <div className="flex items-center gap-4">
                <button
                    type="submit"
                    disabled={status === 'saving'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {status === 'saving' ? 'Saving...' : 'Save Changes'}
                </button>

                {status === 'saved' && <span className="text-green-600">Saved successfully!</span>}
                {status === 'error' && <span className="text-red-600">Error saving profile.</span>}
            </div>
        </form>
    );
}
