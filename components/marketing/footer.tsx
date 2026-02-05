import Link from 'next/link';

import { ToastIcon } from '@/components/toast-icon';

const footerLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/contact', label: 'Contact' },
];

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <Link className="flex items-center gap-2 transition-opacity hover:opacity-80" href="/">
            <ToastIcon className="h-6 w-6" />
            <span className="font-serif text-lg font-medium text-foreground">spreadsontoast</span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6">
            {footerLinks.map((link) => (
              <Link
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Disclaimer */}
          <p className="max-w-md text-center text-xs leading-relaxed text-muted-foreground/70">
            For entertainment only. No real-money wagering. spreadsontoast is not affiliated with any sportsbook or
            gambling operation.
          </p>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} spreadsontoast. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
