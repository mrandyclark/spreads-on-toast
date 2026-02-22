import Link from 'next/link';

import ToastIcon from '@/components/toast-icon';

const footerLinks = [
	{ href: '/privacy', label: 'Privacy' },
	{ href: '/terms', label: 'Terms' },
	{ href: '/contact', label: 'Contact' },
];

const Footer = () => {
	return (
		<footer className="border-border/50 bg-muted/20 border-t">
			<div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="flex flex-col items-center gap-6">
					{/* Logo */}
					<Link className="flex items-center gap-2 transition-opacity hover:opacity-80" href="/">
						<ToastIcon className="h-6 w-6" />
						<span className="text-foreground font-serif text-lg font-medium">spreadsontoast</span>
					</Link>

					{/* Links */}
					<nav className="flex flex-wrap justify-center gap-6">
						{footerLinks.map((link) => (
							<Link
								className="text-muted-foreground hover:text-foreground text-sm transition-colors"
								href={link.href}
								key={link.href}>
								{link.label}
							</Link>
						))}
					</nav>

					{/* Disclaimer */}
					<p className="text-muted-foreground/70 max-w-md text-center text-xs leading-relaxed">
						For entertainment only. No real-money wagering. spreadsontoast is not affiliated with
						any sportsbook or gambling operation.
					</p>

					{/* Copyright */}
					<p className="text-muted-foreground/50 text-xs">
						&copy; {new Date().getFullYear()} spreadsontoast. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
