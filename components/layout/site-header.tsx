'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

import { getCurrentUserAction } from './actions';

export function SiteHeader() {
	const [userName, setUserName] = useState<string | undefined>();

	useEffect(() => {
		getCurrentUserAction().then(({ user }) => {
			if (user) {
				setUserName(
					user.nameFirst ? `${user.nameFirst} ${user.nameLast || ''}`.trim() : user.email,
				);
			}
		});
	}, []);

	return (
		<header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
			<div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
				<Link className="flex items-center gap-2" href="/">
					<Image alt="spreadsontoast" height={32} src="/toast-icon.svg" width={32} />
					<span className="text-foreground text-lg font-semibold">spreads on toast</span>
				</Link>
				<nav className="flex items-center gap-4">
					{userName && <span className="text-muted-foreground text-sm">{userName}</span>}
					<Button asChild size="sm" variant="ghost">
						{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Intentionally using <a> to prevent prefetch on logout */}
						<a href="/api/auth/logout">Sign Out</a>
					</Button>
				</nav>
			</div>
		</header>
	);
}
