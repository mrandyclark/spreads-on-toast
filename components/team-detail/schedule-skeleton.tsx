import SectionSkeleton from '@/components/team-detail/section-skeleton';

const ScheduleSkeleton = () => {
	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<SectionSkeleton />
			<SectionSkeleton />
		</div>
	);
};

export default ScheduleSkeleton;
