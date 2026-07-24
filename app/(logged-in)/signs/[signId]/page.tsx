import SignDetailClient from '@/components/sign-detail/sign-detail-client';
import { getAuthUser } from '@/lib/auth';
import { getSignForMember, getTeamsForConfig } from '@/server/signs/sign.actions';

export default async function SignDetailPage({ params }: { params: Promise<{ signId: string }> }) {
	const { signId } = await params;
	const user = await getAuthUser();

	if (!user) {
		return null;
	}

	const sign = await getSignForMember(signId, user.id);

	if (!sign) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-muted-foreground">Sign not found</div>
			</div>
		);
	}

	const teams = await getTeamsForConfig();

	return <SignDetailClient initialSign={sign} initialTeams={teams} />;
}
