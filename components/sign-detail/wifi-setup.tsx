'use client';

import { Bluetooth, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import FormError from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// BLE UUIDs — must match the Pi's wifi-setup.ts
const BLE_SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
const BLE_SSID_UUID = '12345678-1234-5678-1234-56789abcdef1';
const BLE_PASSWORD_UUID = '12345678-1234-5678-1234-56789abcdef2';
const BLE_COMMAND_UUID = '12345678-1234-5678-1234-56789abcdef3';
const BLE_WIFI_LIST_UUID = '12345678-1234-5678-1234-56789abcdef4';
const BLE_STATUS_UUID = '12345678-1234-5678-1234-56789abcdef5';

type SetupStep = 'scan' | 'connected' | 'configuring' | 'success' | 'error';

const WifiSetup = () => {
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<SetupStep>('scan');
	const [error, setError] = useState<string | null>(null);
	const [ssid, setSsid] = useState('');
	const [password, setPassword] = useState('');
	const [wifiNetworks, setWifiNetworks] = useState<string[]>([]);
	const [status, setStatus] = useState('');
	const [isConnecting, setIsConnecting] = useState(false);
	const [isScanning, setIsScanning] = useState(false);

	const deviceRef = useRef<BluetoothDevice | null>(null);
	const serverRef = useRef<BluetoothRemoteGATTServer | null>(null);
	const serviceRef = useRef<BluetoothRemoteGATTService | null>(null);

	const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

	const resetState = useCallback(() => {
		setStep('scan');
		setError(null);
		setSsid('');
		setPassword('');
		setWifiNetworks([]);
		setStatus('');
		setIsConnecting(false);
		setIsScanning(false);

		if (serverRef.current?.connected) {
			serverRef.current.disconnect();
		}

		deviceRef.current = null;
		serverRef.current = null;
		serviceRef.current = null;
	}, []);

	const connectToSign = useCallback(async () => {
		try {
			setError(null);
			setIsConnecting(true);

			const device = await navigator.bluetooth.requestDevice({
				filters: [{ namePrefix: 'MLB-Sign' }],
				optionalServices: [BLE_SERVICE_UUID],
			});

			deviceRef.current = device;

			const server = await device.gatt!.connect();
			serverRef.current = server;

			const service = await server.getPrimaryService(BLE_SERVICE_UUID);
			serviceRef.current = service;

			// Subscribe to status notifications
			const statusChar = await service.getCharacteristic(BLE_STATUS_UUID);
			await statusChar.startNotifications();
			statusChar.addEventListener('characteristicvaluechanged', (event: Event) => {
				const target = event.target as BluetoothRemoteGATTCharacteristic;
				const value = new TextDecoder().decode(target.value!);
				setStatus(value);

				if (value.startsWith('success')) {
					setStep('success');
				} else if (value.startsWith('failed')) {
					setError(value.split(':')[1] || 'Connection failed');
					setStep('connected');
				}
			});

			// Read available WiFi networks
			try {
				const wifiListChar = await service.getCharacteristic(BLE_WIFI_LIST_UUID);
				const wifiListValue = await wifiListChar.readValue();
				const wifiListJson = new TextDecoder().decode(wifiListValue);
				const networks = JSON.parse(wifiListJson) as string[];
				setWifiNetworks(networks);
			} catch {
				console.warn('Could not read WiFi networks list');
			}

			setStep('connected');

			// Handle disconnection
			device.addEventListener('gattserverdisconnected', () => {
				setStep('scan');
				setStatus('');
				deviceRef.current = null;
				serverRef.current = null;
				serviceRef.current = null;
			});
		} catch (err: unknown) {
			if (err instanceof Error && err.name === 'NotFoundError') {
				return;
			}

			setError(err instanceof Error ? err.message : 'Failed to connect');
			setStep('error');
		} finally {
			setIsConnecting(false);
		}
	}, []);

	const sendWifiCredentials = useCallback(async () => {
		if (!serviceRef.current || !ssid) {
			return;
		}

		try {
			setError(null);
			setStep('configuring');

			const service = serviceRef.current;

			const ssidChar = await service.getCharacteristic(BLE_SSID_UUID);
			await ssidChar.writeValue(new TextEncoder().encode(ssid));

			const passwordChar = await service.getCharacteristic(BLE_PASSWORD_UUID);
			await passwordChar.writeValue(new TextEncoder().encode(password));

			const commandChar = await service.getCharacteristic(BLE_COMMAND_UUID);
			await commandChar.writeValue(new TextEncoder().encode('connect'));

			setStatus('connecting');
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to send credentials');
			setStep('connected');
		}
	}, [ssid, password]);

	const rescanNetworks = useCallback(async () => {
		if (!serviceRef.current) {
			return;
		}

		try {
			setIsScanning(true);
			const service = serviceRef.current;

			const commandChar = await service.getCharacteristic(BLE_COMMAND_UUID);
			await commandChar.writeValue(new TextEncoder().encode('scan'));

			await new Promise((r) => setTimeout(r, 3000));

			const wifiListChar = await service.getCharacteristic(BLE_WIFI_LIST_UUID);
			const wifiListValue = await wifiListChar.readValue();
			const wifiListJson = new TextDecoder().decode(wifiListValue);
			const networks = JSON.parse(wifiListJson) as string[];
			setWifiNetworks(networks);
		} catch {
			console.warn('Rescan failed');
		} finally {
			setIsScanning(false);
		}
	}, []);

	const handleOpenChange = useCallback((value: boolean) => {
		setOpen(value);

		if (!value) {
			resetState();
		}
	}, [resetState]);

	return (
		<Dialog onOpenChange={handleOpenChange} open={open}>
			<DialogTrigger asChild>
				<Button className="gap-2" variant="outline">
					<Wifi className="h-4 w-4" />
					Setup WiFi
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>WiFi Setup</DialogTitle>
					<DialogDescription>
						Connect to your sign via Bluetooth to configure its WiFi connection
					</DialogDescription>
				</DialogHeader>

				{!isSupported && (
					<div className="space-y-3">
						<div className="bg-destructive/10 border-destructive/20 rounded-lg border p-3">
							<p className="text-destructive text-sm font-medium">
								Web Bluetooth is not supported in this browser.
							</p>
						</div>
						<p className="text-muted-foreground text-sm">
							Please use Chrome on Android or Desktop. Safari and iOS browsers do not support
							Web Bluetooth. On iOS, try the Bluefy browser from the App Store.
						</p>
					</div>
				)}

				{isSupported && (
					<div className="space-y-4">
						<FormError message={error ?? undefined} />

						{/* Step 1: Scan */}
						{step === 'scan' && (
							<div className="space-y-4">
								<div className="bg-muted/50 flex flex-col items-center gap-3 rounded-lg p-6">
									<Bluetooth className="text-muted-foreground h-10 w-10" />
									<p className="text-muted-foreground text-center text-sm">
										Make sure your sign is powered on and showing &quot;WIFI SETUP&quot; on the display
									</p>
								</div>
								<Button
									className="w-full gap-2"
									disabled={isConnecting}
									onClick={connectToSign}>
									{isConnecting ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											Scanning...
										</>
									) : (
										<>
											<Bluetooth className="h-4 w-4" />
											Connect to Sign
										</>
									)}
								</Button>
							</div>
						)}

						{/* Step 2: Connected — enter WiFi credentials */}
						{step === 'connected' && (
							<div className="space-y-4">
								<div className="bg-primary/10 border-primary/20 rounded-lg border p-3 text-center">
									<p className="text-primary text-sm font-medium">
										Connected via Bluetooth
									</p>
								</div>

								{/* WiFi network picker */}
								{wifiNetworks.length > 0 && (
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label>Available Networks</Label>
											<Button
												className="h-auto gap-1 px-0 py-0"
												disabled={isScanning}
												onClick={rescanNetworks}
												variant="link">
												{isScanning ? (
													<Loader2 className="h-3 w-3 animate-spin" />
												) : (
													<RefreshCw className="h-3 w-3" />
												)}
												Rescan
											</Button>
										</div>
										<div className="bg-muted/30 max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
											{wifiNetworks.map((network) => (
												<button
													className={cn(
														'w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
														ssid === network
															? 'bg-primary text-primary-foreground'
															: 'text-foreground hover:bg-muted',
													)}
													key={network}
													onClick={() => setSsid(network)}
													type="button">
													{network}
												</button>
											))}
										</div>
									</div>
								)}

								{/* Manual SSID input */}
								<div className="grid gap-2">
									<Label htmlFor="wifi-ssid">WiFi Network Name</Label>
									<Input
										id="wifi-ssid"
										onChange={(e) => setSsid(e.target.value)}
										placeholder="Enter SSID"
										value={ssid}
									/>
								</div>

								<div className="grid gap-2">
									<Label htmlFor="wifi-password">WiFi Password</Label>
									<Input
										id="wifi-password"
										onChange={(e) => setPassword(e.target.value)}
										placeholder="Enter password"
										type="password"
										value={password}
									/>
								</div>

								<Button
									className="w-full gap-2"
									disabled={!ssid}
									onClick={sendWifiCredentials}>
									<Wifi className="h-4 w-4" />
									Connect to WiFi
								</Button>

								<Button
									className="w-full"
									onClick={() => {
										if (serverRef.current?.connected) {
											serverRef.current.disconnect();
										}

										setStep('scan');
									}}
									variant="ghost">
									Disconnect
								</Button>
							</div>
						)}

						{/* Step 3: Configuring */}
						{step === 'configuring' && (
							<div className="flex flex-col items-center gap-4 py-6">
								<Loader2 className="text-primary h-10 w-10 animate-spin" />
								<div className="space-y-1 text-center">
									<p className="text-foreground font-medium">
										Connecting to &quot;{ssid}&quot;...
									</p>
									<p className="text-muted-foreground text-sm">
										This may take up to 30 seconds
									</p>
								</div>
							</div>
						)}

						{/* Step 4: Success */}
						{step === 'success' && (
							<div className="flex flex-col items-center gap-4 py-6">
								<div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
									<Wifi className="text-primary h-8 w-8" />
								</div>
								<div className="space-y-1 text-center">
									<p className="text-foreground text-lg font-semibold">
										WiFi Connected!
									</p>
									<p className="text-muted-foreground text-sm">
										Your sign is now connected to &quot;{ssid}&quot; and will start
										displaying MLB data shortly.
									</p>
								</div>
								<Button
									className="mt-2"
									onClick={() => handleOpenChange(false)}>
									Done
								</Button>
							</div>
						)}

						{/* Error state */}
						{step === 'error' && (
							<div className="flex flex-col items-center gap-4 py-6">
								<div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
									<WifiOff className="text-destructive h-8 w-8" />
								</div>
								<p className="text-muted-foreground text-sm">
									Something went wrong. Make sure the sign is powered on and in setup mode.
								</p>
								<Button
									onClick={() => {
										setStep('scan');
										setError(null);
									}}
									variant="outline">
									Try Again
								</Button>
							</div>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default WifiSetup;
