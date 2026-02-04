import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import Link from 'next/link';

export default async function Home() {
  const { isAuthenticated } = getKindeServerSession();
  const isLoggedIn = await isAuthenticated();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-4xl font-bold">Next.js Starter Template</h1>
        <p className="text-text-muted mb-8 text-lg">
          A production-ready starter with Next.js, Vercel, MongoDB, and Kinde authentication.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {isLoggedIn ? (
            <Link
              className="bg-primary hover:bg-primary-dark rounded-lg px-6 py-3 font-medium text-white transition-colors"
              href="/dashboard">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <LoginLink className="bg-primary hover:bg-primary-dark rounded-lg px-6 py-3 font-medium text-white transition-colors">
                Sign In
              </LoginLink>
              <RegisterLink className="border-border hover:bg-bg-secondary rounded-lg border px-6 py-3 font-medium transition-colors">
                Create Account
              </RegisterLink>
            </>
          )}
        </div>

        <div className="border-border mt-12 border-t pt-8">
          <h2 className="mb-4 text-xl font-semibold">Included Features</h2>
          <ul className="text-text-muted grid gap-2 text-left sm:grid-cols-2">
            <li>✓ Next.js 16 App Router</li>
            <li>✓ TypeScript</li>
            <li>✓ Tailwind CSS v4</li>
            <li>✓ MongoDB + Mongoose</li>
            <li>✓ Kinde Authentication</li>
            <li>✓ Vercel Analytics</li>
            <li>✓ ESLint + Prettier</li>
            <li>✓ Utility Functions</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
