import SignsClient from '@/components/dashboard/signs-client';
import { getAuthUser } from '@/lib/auth';
import { getSignsForUser } from '@/server/signs/sign.actions';

export default async function SignsPage() {
	const user = await getAuthUser();

	if (!user) {
		return null;
	}

	const signs = await getSignsForUser(user.id);

	return <SignsClient initialSigns={signs} />;
}
