import { SignDetailClient } from './sign-detail-client';

export default async function SignDetailPage({
	params,
}: {
	params: Promise<{ signId: string }>;
}) {
	const { signId } = await params;

	return <SignDetailClient signId={signId} />;
}
