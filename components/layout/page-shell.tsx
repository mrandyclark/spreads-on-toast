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
		<div className="bg-background min-h-screen">
			<SiteHeader />

			<main className={cn('mx-auto px-4 py-8', maxWidthClasses[maxWidth], className)}>
				{children}
			</main>
		</div>
	);
}

export default PageShell;
