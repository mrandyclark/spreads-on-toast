'use client';

import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { CalendarDays, Home, Menu, Monitor, Trophy } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import ToastIcon from '@/components/toast-icon';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

import { getCurrentUserAction } from './actions';

const marketingNavLinks = [
	{ href: '#how-it-works', label: 'The game' },
	{ href: '#leagues', label: 'Why Spreads' },
	{ href: '#faq', label: 'FAQ' },
];

const appNavLinks = [
	{ href: '/dashboard', icon: Home, label: 'Clubhouse' },
	{ href: '/games', icon: CalendarDays, label: 'Scores' },
	{ href: '/signs', icon: Monitor, label: 'Signs' },
];

interface SiteHeaderProps {
	variant?: 'app' | 'marketing';
}

const SiteHeader = ({ variant = 'app' }: SiteHeaderProps) => {
	const pathname = usePathname();
	const [userName, setUserName] = useState<string | undefined>();
	const [isLoading, setIsLoading] = useState(variant === 'app');
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	useEffect(() => {
		if (variant === 'app') {
			void getCurrentUserAction().then(({ user }) => {
				if (user) {
					setUserName(
						user.nameFirst ? `${user.nameFirst} ${user.nameLast || ''}`.trim() : user.email,
					);
				}

				setIsLoading(false);
			});
		}
	}, [variant]);

	const isMarketing = variant === 'marketing';

	return (
		<>
			<header
				className={cn(
					'sticky top-0 z-50 w-full border-b pt-[env(safe-area-inset-top)] backdrop-blur-xl',
					isMarketing
						? 'border-white/10 bg-[#09141e]/92 text-white'
						: 'border-border/70 bg-background/90',
				)}>
				<div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
					<Link
						aria-label="Spreads on Toast home"
						className="group flex items-center gap-2.5"
						href={isMarketing ? '/' : '/dashboard'}>
						<ToastIcon className="h-9 w-9 transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-3" />
						<div className="leading-none">
							<span className="block text-[17px] font-extrabold tracking-[-0.035em]">
								Spreads on Toast
							</span>
							<span
								className={cn(
									'mt-1 hidden text-[9px] font-bold tracking-[0.2em] uppercase sm:block',
									isMarketing ? 'text-white/50' : 'text-muted-foreground',
								)}>
								Call your shot
							</span>
						</div>
					</Link>

					<nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
						{isMarketing
							? marketingNavLinks.map((link) => (
									<Link
										className="rounded-xl px-4 py-2 text-sm font-semibold text-white/65 transition-colors hover:bg-white/8 hover:text-white"
										href={link.href}
										key={link.href}>
										{link.label}
									</Link>
								))
							: appNavLinks.map((link) => {
									const active = pathname.startsWith(link.href);
									return (
										<Link
											aria-current={active ? 'page' : undefined}
											className={cn(
												'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors',
												active
													? 'bg-foreground text-background'
													: 'text-muted-foreground hover:bg-muted hover:text-foreground',
											)}
											href={link.href}
											key={link.href}>
											<link.icon className="h-4 w-4" />
											{link.label}
										</Link>
									);
								})}
					</nav>

					<div className="hidden items-center gap-2 md:flex">
						{isMarketing ? (
							<>
								<Button asChild className="text-white hover:bg-white/10" size="sm" variant="ghost">
									<LoginLink postLoginRedirectURL="/dashboard">Sign in</LoginLink>
								</Button>
								<Button asChild size="sm">
									<RegisterLink postLoginRedirectURL="/dashboard">Start a league</RegisterLink>
								</Button>
							</>
						) : (
							<>
								{!isLoading && userName && (
									<span className="text-muted-foreground max-w-36 truncate px-2 text-xs">
										{userName}
									</span>
								)}
								<Button asChild size="sm" variant="outline">
									{/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
									<a href="/api/auth/logout">Sign out</a>
								</Button>
							</>
						)}
					</div>

					{isMarketing && (
						<Sheet onOpenChange={setMobileMenuOpen} open={mobileMenuOpen}>
							<SheetTrigger asChild className="md:hidden">
								<Button
									aria-label="Open menu"
									className="text-white hover:bg-white/10"
									size="icon"
									variant="ghost">
									<Menu className="h-5 w-5" />
								</Button>
							</SheetTrigger>
							<SheetContent className="bg-background w-[300px]" side="right">
								<nav className="mt-10 flex flex-col gap-2">
									{marketingNavLinks.map((link) => (
										<Link
											className="rounded-xl px-4 py-3 text-lg font-bold"
											href={link.href}
											key={link.href}
											onClick={() => setMobileMenuOpen(false)}>
											{link.label}
										</Link>
									))}
									<div className="mt-6 grid gap-3">
										<Button asChild variant="outline">
											<LoginLink postLoginRedirectURL="/dashboard">Sign in</LoginLink>
										</Button>
										<Button asChild>
											<RegisterLink postLoginRedirectURL="/dashboard">Start a league</RegisterLink>
										</Button>
									</div>
								</nav>
							</SheetContent>
						</Sheet>
					)}
					{!isMarketing && (
						<Link
							aria-label="League competition"
							className="bg-muted text-foreground flex h-10 w-10 items-center justify-center rounded-xl md:hidden"
							href="/dashboard">
							<Trophy className="h-5 w-5" />
						</Link>
					)}
				</div>
			</header>

			{!isMarketing && (
				<nav
					aria-label="Mobile primary"
					className="border-border/70 bg-card/95 fixed right-0 bottom-0 left-0 z-50 border-t px-3 pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
					<div className="mx-auto grid max-w-md grid-cols-3 gap-1">
						{appNavLinks.map((link) => {
							const active = pathname.startsWith(link.href);
							return (
								<Link
									aria-current={active ? 'page' : undefined}
									className={cn(
										'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold transition-colors',
										active ? 'bg-foreground text-background' : 'text-muted-foreground',
									)}
									href={link.href}
									key={link.href}>
									<link.icon className="h-5 w-5" />
									{link.label}
								</Link>
							);
						})}
					</div>
				</nav>
			)}
		</>
	);
};

export default SiteHeader;
