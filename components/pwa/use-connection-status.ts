'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { probeApplicationHealth } from './connection-status';

const RECHECK_INTERVAL_MS = 30_000;

export const useConnectionStatus = () => {
	const [isCheckingConnection, setIsCheckingConnection] = useState(false);
	const [isOnline, setIsOnline] = useState(true);
	const checkGeneration = useRef(0);
	const isMounted = useRef(false);

	const checkConnection = useCallback(async () => {
		const generation = ++checkGeneration.current;
		setIsCheckingConnection(true);

		const isHealthy = await probeApplicationHealth();

		if (!isMounted.current || generation !== checkGeneration.current) {
			return;
		}

		setIsOnline(isHealthy);
		setIsCheckingConnection(false);
	}, []);

	useEffect(() => {
		isMounted.current = true;

		const handleConnectionHint = () => {
			void checkConnection();
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				void checkConnection();
			}
		};

		window.addEventListener('online', handleConnectionHint);
		window.addEventListener('offline', handleConnectionHint);
		window.addEventListener('focus', handleConnectionHint);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		// The probe is authoritative; navigator.onLine and its events are only hints.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void checkConnection();
		const interval = window.setInterval(() => {
			void checkConnection();
		}, RECHECK_INTERVAL_MS);

		return () => {
			isMounted.current = false;
			window.clearInterval(interval);
			window.removeEventListener('online', handleConnectionHint);
			window.removeEventListener('offline', handleConnectionHint);
			window.removeEventListener('focus', handleConnectionHint);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [checkConnection]);

	return { checkConnection, isCheckingConnection, isOnline };
};
