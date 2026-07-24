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
		<Link className="block" href={href}>
			<Card className="group hover:border-foreground/25 cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
				<CardContent className="relative flex items-center justify-between p-4 sm:p-5">
					<div className="bg-primary absolute top-0 bottom-0 left-0 w-1 transition-[width] group-hover:w-1.5" />
					<div className="flex items-center gap-4">
						<div className="bg-foreground text-background flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm">
							<Icon className="h-6 w-6" />
						</div>
						<div>
							<h3 className="text-foreground group-hover:text-primary text-lg font-black tracking-[-.025em] transition-colors">
								{title}
							</h3>
							{children && (
								<div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
									{children}
								</div>
							)}
						</div>
					</div>
					<div className="bg-muted flex h-9 w-9 items-center justify-center rounded-full">
						<ChevronRight className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-transform group-hover:translate-x-0.5" />
					</div>
				</CardContent>
			</Card>
		</Link>
	);
};

export default CardLink;
