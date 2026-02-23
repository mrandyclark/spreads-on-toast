import PageShell from '@/components/layout/page-shell';
import SectionSkeleton from '@/components/team-detail/section-skeleton';
import Skeleton from '@/components/ui/skeleton';

const SignDetailLoading = () => {
	return (
		<PageShell>
			<div className="mb-8 space-y-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-8 w-48" />
			</div>

			<div className="grid gap-6">
				<SectionSkeleton height="h-32" />
				<SectionSkeleton height="h-48" />
			</div>
		</PageShell>
	);
};

export default SignDetailLoading;
