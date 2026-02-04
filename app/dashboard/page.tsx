import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { redirect } from 'next/navigation';

import { getAuthUser } from '@/lib/auth';

export default async function Dashboard() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/');
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <LogoutLink className="text-text-muted hover:text-text transition-colors">
            Sign Out
          </LogoutLink>
        </div>

        <div className="bg-bg-secondary border-border rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Welcome back!</h2>

          <div className="space-y-2">
            <p>
              <span className="text-text-muted">User ID:</span> {user.id}
            </p>
            <p>
              <span className="text-text-muted">Email:</span> {user.email}
            </p>
            {user.nameFirst && (
              <p>
                <span className="text-text-muted">Name:</span> {user.nameFirst} {user.nameLast}
              </p>
            )}
          </div>
        </div>

        <div className="bg-bg-secondary border-border mt-6 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Getting Started</h2>
          <ul className="text-text-muted space-y-2">
            <li>
              • Edit <code className="bg-bg-tertiary rounded px-1">app/dashboard/page.tsx</code> to
              customize this page
            </li>
            <li>
              • Add new models in <code className="bg-bg-tertiary rounded px-1">models/</code>
            </li>
            <li>
              • Create server functions in{' '}
              <code className="bg-bg-tertiary rounded px-1">server/</code>
            </li>
            <li>
              • Add API routes in <code className="bg-bg-tertiary rounded px-1">app/api/</code>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
