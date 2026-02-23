import PageShell from '@/components/layout/page-shell';
import Skeleton from '@/components/ui/skeleton';

const GameLoading = () => {
	return (
		<PageShell maxWidth="4xl">
			<div className="mb-6">
				<Skeleton className="h-4 w-32" />
			</div>

			<div className="border-border mb-6 rounded-lg border p-6 sm:p-8">
				<div className="flex flex-col items-center gap-6">
					<Skeleton className="h-6 w-20 rounded-full" />

					<div className="flex w-full items-center justify-center gap-8">
						<div className="flex flex-1 flex-col items-center gap-2">
							<Skeleton className="h-16 w-16 rounded-full" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-6 w-20" />
						</div>

						<Skeleton className="h-12 w-24" />

						<div className="flex flex-1 flex-col items-center gap-2">
							<Skeleton className="h-16 w-16 rounded-full" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-6 w-20" />
						</div>
					</div>
				</div>
			</div>

			<div className="border-border rounded-lg border p-6">
				<Skeleton className="h-48 w-full" />
			</div>
		</PageShell>
	);
};

export default GameLoading;
