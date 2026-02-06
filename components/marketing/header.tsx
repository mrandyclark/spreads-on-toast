'use client';

import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ToastIcon } from '@/components/toast-icon';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navLinks = [
	{ href: '#how-it-works', label: 'How it works' },
	{ href: '#leagues', label: 'Leagues' },
	{ href: '#faq', label: 'FAQ' },
];

export function Header() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<header className="border-border/50 bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur">
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
				{/* Logo */}
				<Link className="flex items-center gap-2 transition-opacity hover:opacity-80" href="/">
					<ToastIcon className="h-8 w-8" />
					<span className="text-foreground font-serif text-xl font-medium">spreadsontoast</span>
				</Link>

				{/* Desktop Navigation */}
				<nav className="hidden items-center gap-8 md:flex">
					{navLinks.map((link) => (
						<Link
							className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
							href={link.href}
							key={link.href}>
							{link.label}
						</Link>
					))}
				</nav>

				{/* Desktop CTAs */}
				<div className="hidden items-center gap-3 md:flex">
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
				</div>

				{/* Mobile Menu */}
				<Sheet onOpenChange={setIsOpen} open={isOpen}>
					<SheetTrigger asChild className="md:hidden">
						<Button aria-label="Open menu" size="icon" variant="ghost">
							<Menu className="h-5 w-5" />
						</Button>
					</SheetTrigger>
					<SheetContent className="bg-background w-[280px]" side="right">
						<nav className="mt-8 flex flex-col gap-4">
							{navLinks.map((link) => (
								<Link
									className="text-muted-foreground hover:text-foreground text-lg font-medium transition-colors"
									href={link.href}
									key={link.href}
									onClick={() => setIsOpen(false)}>
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
						</nav>
					</SheetContent>
				</Sheet>
			</div>
		</header>
	);
}
