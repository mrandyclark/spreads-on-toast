'use client';

import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

import { getCurrentUserAction } from './actions';

const marketingNavLinks = [
	{ href: '#how-it-works', label: 'How it works' },
	{ href: '#leagues', label: 'Leagues' },
	{ href: '#faq', label: 'FAQ' },
];

interface SiteHeaderProps {
	variant?: 'app' | 'marketing';
}

export function SiteHeader({ variant = 'app' }: SiteHeaderProps) {
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
		<header className="border-border/50 bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur">
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
				{/* Logo */}
				<Link className="flex items-center gap-2 transition-opacity hover:opacity-80" href="/">
					<Image alt="spreadsontoast" height={32} src="/toast-icon.svg" width={32} />
					<span className="text-foreground font-serif text-xl font-medium">spreadsontoast</span>
				</Link>

				{/* Desktop Navigation - Marketing only */}
				{isMarketing && (
					<nav className="hidden items-center gap-8 md:flex">
						{marketingNavLinks.map((link) => (
							<Link
								className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
								href={link.href}
								key={link.href}>
								{link.label}
							</Link>
						))}
					</nav>
				)}

				{/* Desktop CTAs */}
				<div className="hidden items-center gap-3 md:flex">
					{isMarketing ? (
						<>
							<Button
								asChild
								className="text-muted-foreground hover:text-foreground"
								size="sm"
								variant="ghost">
								<LoginLink postLoginRedirectURL="/dashboard">Login</LoginLink>
							</Button>
							<Button asChild className="shadow-sm transition-shadow hover:shadow-md" size="sm">
								<RegisterLink postLoginRedirectURL="/dashboard">Create a league</RegisterLink>
							</Button>
						</>
					) : (
						<>
							{!isLoading && userName && (
								<span className="text-muted-foreground text-sm">{userName}</span>
							)}
							<Button asChild size="sm" variant="ghost">
								{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Intentionally using <a> to prevent prefetch on logout */}
								<a href="/api/auth/logout">Sign Out</a>
							</Button>
						</>
					)}
				</div>

				{/* Mobile Menu */}
				<Sheet onOpenChange={setMobileMenuOpen} open={mobileMenuOpen}>
					<SheetTrigger asChild className="md:hidden">
						<Button aria-label="Open menu" size="icon" variant="ghost">
							<Menu className="h-5 w-5" />
						</Button>
					</SheetTrigger>
					<SheetContent className="bg-background w-[280px]" side="right">
						<nav className="mt-8 flex flex-col gap-4">
							{isMarketing ? (
								<>
									{marketingNavLinks.map((link) => (
										<Link
											className="text-muted-foreground hover:text-foreground text-lg font-medium transition-colors"
											href={link.href}
											key={link.href}
											onClick={() => setMobileMenuOpen(false)}>
											{link.label}
										</Link>
									))}
									<div className="mt-6 flex flex-col gap-3">
										<Button asChild className="w-full bg-transparent" variant="outline">
											<LoginLink postLoginRedirectURL="/dashboard">Login</LoginLink>
										</Button>
										<Button asChild className="w-full">
											<RegisterLink postLoginRedirectURL="/dashboard">Create a league</RegisterLink>
										</Button>
									</div>
								</>
							) : (
								<>
									{!isLoading && userName && (
										<span className="text-muted-foreground text-lg">{userName}</span>
									)}
									<Button asChild className="w-full" variant="outline">
										{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Intentionally using <a> to prevent prefetch on logout */}
										<a href="/api/auth/logout">Sign Out</a>
									</Button>
								</>
							)}
						</nav>
					</SheetContent>
				</Sheet>
			</div>
		</header>
	);
}
