import Image from 'next/image';

import OfflineActions from '@/components/pwa/offline-actions';

const OfflinePage = () => (
	<main className="bg-background flex min-h-dvh items-center justify-center px-5 py-16">
		<section className="bg-card border-border w-full max-w-lg rounded-3xl border p-7 shadow-sm sm:p-10">
			<Image alt="" height={56} src="/toast-icon.svg" width={56} />
			<p className="text-primary mt-8 text-xs font-bold tracking-[0.18em] uppercase">
				No connection
			</p>
			<h1 className="mt-2 font-serif text-4xl leading-tight">The clubhouse is offline.</h1>
			<p className="text-muted-foreground mt-4 leading-7">
				Live scores, standings, authentication, and pick changes need the server. Nothing will be
				queued or marked saved while you’re offline.
			</p>
			<p className="text-muted-foreground mt-3 mb-7 text-sm">
				Reconnect and retry. If an old version keeps appearing, reset the offline data.
			</p>
			<OfflineActions />
		</section>
	</main>
);

export default OfflinePage;
