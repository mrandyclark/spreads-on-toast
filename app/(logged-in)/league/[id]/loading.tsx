import PageShell from '@/components/layout/page-shell';
import Skeleton from '@/components/ui/skeleton';

const LeagueLoading = () => {
	return (
		<PageShell>
			<div className="mb-8 space-y-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-4 w-40" />
			</div>

			<div className="mb-6">
				<div className="flex gap-2">
					<Skeleton className="h-9 w-24 rounded-md" />
					<Skeleton className="h-9 w-24 rounded-md" />
					<Skeleton className="h-9 w-24 rounded-md" />
				</div>
			</div>

			<div className="grid gap-4">
				{Array.from({ length: 5 }, (_, i) => (
					<div key={i} className="border-border flex items-center gap-4 rounded-lg border p-4">
						<Skeleton className="h-10 w-10 rounded-full" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-20" />
						</div>
						<Skeleton className="h-6 w-16" />
					</div>
				))}
			</div>
		</PageShell>
	);
};

export default LeagueLoading;
