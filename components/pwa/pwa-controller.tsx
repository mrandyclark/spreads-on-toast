'use client';

import { Download, RefreshCw, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

import { useConnectionStatus } from './use-connection-status';

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PwaController = () => {
	const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [isDirty, setIsDirty] = useState(false);
	const [waitingWorker, setWaitingWorker] = useState<null | ServiceWorker>(null);
	const { checkConnection, isCheckingConnection, isOnline } = useConnectionStatus();

	useEffect(() => {
		const handleInstallPrompt = (event: Event) => {
			event.preventDefault();
			setInstallPrompt(event as BeforeInstallPromptEvent);
		};

		const handleInstalled = () => setInstallPrompt(null);

		const handleDirtyState = (event: Event) => {
			setIsDirty(Boolean((event as CustomEvent<{ dirty: boolean }>).detail?.dirty));
		};

		window.addEventListener('beforeinstallprompt', handleInstallPrompt);
		window.addEventListener('appinstalled', handleInstalled);
		window.addEventListener('pwa:dirty-state', handleDirtyState);

		return () => {
			window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
			window.removeEventListener('appinstalled', handleInstalled);
			window.removeEventListener('pwa:dirty-state', handleDirtyState);
		};
	}, []);

	useEffect(() => {
		if (!('serviceWorker' in navigator)) {
			return;
		}

		if (process.env.NODE_ENV !== 'production') {
			const clearDevelopmentPwaState = async () => {
				const registrations = await navigator.serviceWorker.getRegistrations();
				const appRegistrations = registrations.filter((registration) =>
					registration.scope.startsWith(window.location.origin),
				);
				const cacheKeys = 'caches' in window ? await caches.keys() : [];
				const appCacheKeys = cacheKeys.filter((key) => key.startsWith('spreads-on-toast-'));
				const wasControlled = Boolean(navigator.serviceWorker.controller);

				await Promise.all([
					...appRegistrations.map((registration) => registration.unregister()),
					...appCacheKeys.map((key) => caches.delete(key)),
				]);

				if ((appRegistrations.length > 0 || appCacheKeys.length > 0) && wasControlled) {
					window.location.reload();
				}
			};

			void clearDevelopmentPwaState().catch((error: unknown) => {
				console.warn('Development PWA cleanup failed', error);
			});
			return;
		}

		if (!window.isSecureContext) {
			return;
		}

		let reloading = false;
		let checkForUpdate: (() => void) | undefined;

		const register = async () => {
			const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
			setWaitingWorker(registration.waiting);

			registration.addEventListener('updatefound', () => {
				const worker = registration.installing;

				worker?.addEventListener('statechange', () => {
					if (worker.state === 'installed' && navigator.serviceWorker.controller) {
						setWaitingWorker(worker);
					}
				});
			});

			checkForUpdate = () => {
				if (document.visibilityState === 'visible') {
					void registration.update();
				}
			};

			document.addEventListener('visibilitychange', checkForUpdate);
		};

		const handleControllerChange = () => {
			if (!reloading) {
				reloading = true;
				window.location.reload();
			}
		};

		navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
		void register().catch((error: unknown) => {
			console.warn('Service worker registration failed', error);
		});

		return () => {
			navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);

			if (checkForUpdate) {
				document.removeEventListener('visibilitychange', checkForUpdate);
			}
		};
	}, []);

	const install = async () => {
		if (!installPrompt) {
			return;
		}

		await installPrompt.prompt();
		await installPrompt.userChoice;
		setInstallPrompt(null);
	};

	const applyUpdate = () => {
		if (!isDirty) {
			waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
		}
	};

	if (!isOnline) {
		return (
			<div
				aria-live="polite"
				className="bg-foreground text-background fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-[100] mx-auto flex max-w-lg items-center gap-3 rounded-xl px-4 py-3 shadow-xl">
				<WifiOff aria-hidden="true" className="h-5 w-5 shrink-0" />
				<p className="min-w-0 flex-1 text-sm">
					Can’t reach Spreads on Toast. Picks cannot be saved until the connection recovers.
				</p>
				<Button
					disabled={isCheckingConnection}
					onClick={() => void checkConnection()}
					size="sm"
					variant="secondary">
					<RefreshCw aria-hidden="true" className={isCheckingConnection ? 'animate-spin' : ''} />
					Retry
				</Button>
			</div>
		);
	}

	if (waitingWorker) {
		return (
			<div
				aria-live="polite"
				className="bg-card border-border fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-[100] mx-auto flex max-w-lg items-center gap-3 rounded-xl border p-3 shadow-xl">
				<RefreshCw aria-hidden="true" className="text-primary h-5 w-5 shrink-0" />
				<p className="min-w-0 flex-1 text-sm">
					{isDirty ? 'Update ready. Save your pick changes first.' : 'A fresh version is ready.'}
				</p>
				<Button disabled={isDirty} onClick={applyUpdate} size="sm">
					Update
				</Button>
			</div>
		);
	}

	if (installPrompt) {
		return (
			<div className="fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[90]">
				<Button className="shadow-lg" onClick={install} size="sm" variant="secondary">
					<Download aria-hidden="true" />
					Install app
				</Button>
			</div>
		);
	}

	return null;
};

export default PwaController;
