import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/50">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
// ```

// **Why check `isLoading`?** When the app first loads, it fires the `/auth/me` request but hasn't gotten a response yet. During this brief window, `user` is `null` — but that doesn't mean the user isn't logged in, it just means we don't know yet. Without the loading check, every logged-in user would get briefly flashed to the login page on every refresh.

// ---

// ## Step 6 — Pages

// Create the folder structure first:
// ```
// client/src/pages/