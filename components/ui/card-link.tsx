import { ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';

interface CardLinkProps {
	children?: React.ReactNode;
	href: string;
	icon: LucideIcon;
	title: string;
}

const CardLink = ({ children, href, icon: Icon, title }: CardLinkProps) => {
	return (
		<Link href={href}>
			<Card className="group hover:border-primary/50 cursor-pointer transition-all hover:shadow-md">
				<CardContent className="flex items-center justify-between p-4 sm:p-6">
					<div className="flex items-center gap-4">
						<div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
							<Icon className="h-6 w-6" />
						</div>
						<div>
							<h3 className="text-foreground group-hover:text-primary font-semibold transition-colors">
								{title}
							</h3>
							{children && (
								<div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
									{children}
								</div>
							)}
						</div>
					</div>
					<ChevronRight className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-transform group-hover:translate-x-1" />
				</CardContent>
			</Card>
		</Link>
	);
}

export default CardLink;
