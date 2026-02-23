import PageShell from '@/components/layout/page-shell';
import SectionSkeleton from '@/components/team-detail/section-skeleton';
import Skeleton from '@/components/ui/skeleton';

const TeamLoading = () => {
	return (
		<PageShell>
			<div className="mb-8 space-y-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-8 w-64" />
				<div className="flex gap-2">
					<Skeleton className="h-9 w-28 rounded-md" />
					<Skeleton className="h-9 w-28 rounded-md" />
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }, (_, i) => (
					<SectionSkeleton key={i} />
				))}
			</div>

			<div className="mt-6 grid gap-6 lg:grid-cols-2">
				<SectionSkeleton height="h-64" />
				<SectionSkeleton height="h-64" />
			</div>
		</PageShell>
	);
};

export default TeamLoading;
