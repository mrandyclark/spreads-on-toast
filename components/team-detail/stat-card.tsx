import { TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
	description?: string;
	title: string;
	trend?: 'down' | 'neutral' | 'up';
	value: React.ReactNode;
}

const StatCard = ({ description, title, trend, value }: StatCardProps) => {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardDescription className="text-xs">{title}</CardDescription>
				<CardTitle className="flex items-center gap-2 text-2xl">
					{value}
					{trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
					{trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
				</CardTitle>
			</CardHeader>
			{description && (
				<CardContent>
					<p className="text-muted-foreground text-xs">{description}</p>
				</CardContent>
			)}
		</Card>
	);
};

export default StatCard;
