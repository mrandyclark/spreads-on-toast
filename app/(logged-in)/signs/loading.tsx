import CardListSkeleton from '@/components/ui/card-list-skeleton';
import PageShell from '@/components/layout/page-shell';
import Skeleton from '@/components/ui/skeleton';

const SignsLoading = () => {
	return (
		<PageShell>
			<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-9 w-28 rounded-md" />
			</div>

			<CardListSkeleton count={2} />
		</PageShell>
	);
};

export default SignsLoading;
