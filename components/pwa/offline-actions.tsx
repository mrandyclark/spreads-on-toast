'use client';

import { RefreshCw, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

const OfflineActions = () => {
	const retry = () => window.location.reload();

	const resetCaches = async () => {
		const keys = await caches.keys();
		await Promise.all(keys.map((key) => caches.delete(key)));

		const registrations = await navigator.serviceWorker?.getRegistrations();
		await Promise.all(registrations?.map((registration) => registration.unregister()) ?? []);
		window.location.assign('/');
	};

	return (
		<div className="flex flex-col gap-3 sm:flex-row">
			<Button onClick={retry}>
				<RefreshCw aria-hidden="true" />
				Try again
			</Button>
			<Button onClick={resetCaches} variant="outline">
				<Trash2 aria-hidden="true" />
				Reset offline data
			</Button>
		</div>
	);
};

export default OfflineActions;
