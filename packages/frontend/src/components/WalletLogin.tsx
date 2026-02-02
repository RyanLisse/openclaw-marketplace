import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { ethers } from 'ethers';

export function WalletLogin() {
    const generateNonce = useMutation(api.auth.generateNonce);
    const signInWithWallet = useMutation(api.auth.signInWithWallet);
    const signOut = useMutation(api.auth.signOut);

    const [session, setSession] = useState<{ token: string; userId: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            if (!window.ethereum) {
                throw new Error("No crypto wallet found. Please install MetaMask.");
            }

            // Connect Wallet
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const walletAddress = await signer.getAddress();

            // Get Nonce
            const nonce = await generateNonce({ walletAddress });

            // Sign Message
            const message = `Sign in to OpenClaw: ${nonce}`;
            const signature = await signer.signMessage(message);

            // Verify and Login
            const result = await signInWithWallet({ walletAddress, signature });

            setSession(result);
            localStorage.setItem('claw_session', result.token);

        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        if (session?.token) {
            await signOut({ token: session.token });
            setSession(null);
            localStorage.removeItem('claw_session');
        }
    };

    if (session) {
        return (
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                <p className="text-green-600">Logged in as {session.userId}</p>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <button
                onClick={handleLogin}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
    );
}

// Add window.ethereum type
declare global {
    interface Window {
        ethereum: any;
    }
}
