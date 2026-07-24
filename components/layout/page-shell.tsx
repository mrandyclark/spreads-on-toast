import { cn } from '@/lib/utils';

import SiteHeader from './site-header';

interface PageShellProps {
	children: React.ReactNode;
	className?: string;
	maxWidth?: '3xl' | '4xl' | '5xl' | '6xl';
}

const maxWidthClasses = {
	'3xl': 'max-w-3xl',
	'4xl': 'max-w-4xl',
	'5xl': 'max-w-5xl',
	'6xl': 'max-w-6xl',
};

const PageShell = ({ children, className, maxWidth = '5xl' }: PageShellProps) => {
	return (
		<div className="bg-background min-h-dvh">
			<SiteHeader />

			<main
				className={cn(
					'mx-auto px-4 pt-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-8 md:pb-12',
					maxWidthClasses[maxWidth],
					className,
				)}>
				{children}
			</main>
		</div>
	);
};

export default PageShell;
