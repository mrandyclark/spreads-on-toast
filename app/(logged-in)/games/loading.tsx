import PageShell from '@/components/layout/page-shell';
import { Card, CardContent } from '@/components/ui/card';
import Skeleton from '@/components/ui/skeleton';

const GamesLoading = () => {
	return (
		<PageShell>
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<Skeleton className="mb-2 h-8 w-40" />
					<Skeleton className="h-4 w-56" />
				</div>
				<Skeleton className="h-10 w-40" />
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<Card key={i}>
						<CardContent className="p-4">
							<Skeleton className="mb-3 h-3 w-32" />
							<Skeleton className="mb-2 h-5 w-full" />
							<Skeleton className="mb-3 h-5 w-full" />
							<Skeleton className="h-3 w-48" />
						</CardContent>
					</Card>
				))}
			</div>
		</PageShell>
	);
};

export default GamesLoading;
