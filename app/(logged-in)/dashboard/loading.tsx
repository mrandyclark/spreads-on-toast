import PageShell from '@/components/layout/page-shell';
import Skeleton from '@/components/ui/skeleton';

const DashboardLoading = () => {
	return (
		<PageShell>
			<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<Skeleton className="h-8 w-48" />
				<div className="flex gap-2">
					<Skeleton className="h-9 w-28 rounded-md" />
					<Skeleton className="h-9 w-28 rounded-md" />
				</div>
			</div>

			<div className="grid gap-4">
				{Array.from({ length: 3 }, (_, i) => (
					<div className="border-border rounded-lg border p-4 sm:p-6" key={i}>
						<div className="flex items-center gap-4">
							<Skeleton className="h-12 w-12 rounded-xl" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="h-3 w-56" />
							</div>
						</div>
					</div>
				))}
			</div>
		</PageShell>
	);
};

export default DashboardLoading;
