import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';

export default async function LoggedInLayout({ children }: { children: React.ReactNode }) {
	const { isAuthenticated } = getKindeServerSession();

	if (!(await isAuthenticated())) {
		redirect('/api/auth/login?post_login_redirect_url=/dashboard');
	}

	return <>{children}</>;
}
