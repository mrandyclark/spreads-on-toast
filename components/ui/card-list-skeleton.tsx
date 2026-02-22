import { Card, CardContent } from '@/components/ui/card';
import Skeleton from '@/components/ui/skeleton';

interface CardListSkeletonProps {
	count?: number;
}

const CardListSkeleton = ({ count = 2 }: CardListSkeletonProps) => {
	return (
		<div className="grid gap-4">
			{Array.from({ length: count }, (_, i) => (
				<Card key={i}>
					<CardContent className="flex items-center gap-4 p-4 sm:p-6">
						<Skeleton className="h-12 w-12 rounded-xl" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-48" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export default CardListSkeleton;
