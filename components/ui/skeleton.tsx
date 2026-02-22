import { cn } from '@/lib/utils';

interface SkeletonProps {
	className?: string;
}

const Skeleton = ({ className }: SkeletonProps) => {
	return (
		<div className={cn('bg-muted animate-pulse rounded', className)} />
	);
}

export default Skeleton;
