import { type LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
	action?: React.ReactNode;
	description: string;
	icon: LucideIcon;
	title: string;
}

const EmptyState = ({ action, description, icon: Icon, title }: EmptyStateProps) => {
	return (
		<Card className="border-dashed">
			<CardContent className="flex flex-col items-center justify-center py-16 text-center">
				<div className="bg-muted mb-4 rounded-full p-4">
					<Icon className="text-muted-foreground h-8 w-8" />
				</div>
				<h3 className="text-foreground mb-2 text-lg font-semibold">
					{title}
				</h3>
				<p className="text-muted-foreground mb-6 max-w-sm">
					{description}
				</p>
				{action}
			</CardContent>
		</Card>
	);
}

export default EmptyState;
