import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SectionSkeletonProps {
	height?: string;
}

const SectionSkeleton = ({ height = 'h-48' }: SectionSkeletonProps) => {
	return (
		<Card>
			<CardHeader>
				<div className="bg-muted h-5 w-40 animate-pulse rounded" />
			</CardHeader>
			<CardContent>
				<div className={cn('bg-muted w-full animate-pulse rounded', height)} />
			</CardContent>
		</Card>
	);
};

export default SectionSkeleton;
