import SignDetailClient from '@/components/sign-detail/sign-detail-client';
import { getAuthUser } from '@/lib/auth';
import { getSign, getTeamsForConfig } from '@/server/signs/sign.actions';

export default async function SignDetailPage({
	params,
}: {
	params: Promise<{ signId: string }>;
}) {
	const { signId } = await params;
	const user = await getAuthUser();

	if (!user) {
		return null;
	}

	const [sign, teams] = await Promise.all([
		getSign(signId),
		getTeamsForConfig(),
	]);

	if (!sign) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-muted-foreground">Sign not found</div>
			</div>
		);
	}

	return <SignDetailClient initialSign={sign} initialTeams={teams} />;
}
