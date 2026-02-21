'use client';

import { ChevronRight, Monitor, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { SiteHeader } from '@/components/layout/site-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sign } from '@/types';

import { createSignAction, getSignsAction } from './actions';

export function SignsClient() {
	const [signs, setSigns] = useState<Sign[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [signName, setSignName] = useState('');
	const [createError, setCreateError] = useState('');
	const [isCreating, setIsCreating] = useState(false);

	useEffect(() => {
		async function fetchSigns() {
			try {
				const result = await getSignsAction();

				if (result.signs) {
					setSigns(result.signs);
				}
			} finally {
				setIsLoading(false);
			}
		}

		fetchSigns();
	}, []);

	const handleCreateSign = async () => {
		if (signName.trim()) {
			setCreateError('');
			setIsCreating(true);

			const result = await createSignAction(signName.trim());

			if (result.sign) {
				setSigns([result.sign, ...signs]);
				setSignName('');
				setIsCreateOpen(false);
			} else {
				setCreateError(result.error || 'Failed to create sign');
			}

			setIsCreating(false);
		}
	};

	return (
		<div className="bg-background min-h-screen">
			<SiteHeader />

			<main className="mx-auto max-w-5xl px-4 py-8">
				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-foreground text-2xl font-bold sm:text-3xl">Your Signs</h1>
						<p className="text-muted-foreground mt-1">
							Manage your digital signs and their display settings
						</p>
					</div>

					<Dialog onOpenChange={setIsCreateOpen} open={isCreateOpen}>
						<DialogTrigger asChild>
							<Button className="gap-2">
								<Plus className="h-4 w-4" />
								New Sign
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Add a new sign</DialogTitle>
								<DialogDescription>
									Give your sign a name to get started. You can configure what it displays after creating it.
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label htmlFor="sign-name">Sign name</Label>
									<Input
										id="sign-name"
										onChange={(e) => setSignName(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												handleCreateSign();
											}
										}}
										placeholder="e.g. Living Room Sign"
										value={signName}
									/>
								</div>
							</div>
							{createError && <p className="text-destructive text-sm">{createError}</p>}
							<DialogFooter>
								<Button onClick={() => setIsCreateOpen(false)} variant="outline">
									Cancel
								</Button>
								<Button
									disabled={!signName.trim() || isCreating}
									onClick={handleCreateSign}>
									{isCreating ? 'Creating...' : 'Create Sign'}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>

				{isLoading ? (
					<div className="grid gap-4">
						{[1, 2].map((i) => (
							<Card key={i}>
								<CardContent className="flex items-center gap-4 p-4 sm:p-6">
									<div className="bg-muted h-12 w-12 animate-pulse rounded-xl" />
									<div className="flex-1 space-y-2">
										<div className="bg-muted h-4 w-32 animate-pulse rounded" />
										<div className="bg-muted h-3 w-48 animate-pulse rounded" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : signs.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-16 text-center">
							<div className="bg-muted mb-4 rounded-full p-4">
								<Monitor className="text-muted-foreground h-8 w-8" />
							</div>
							<h3 className="text-foreground mb-2 text-lg font-semibold">
								No signs yet
							</h3>
							<p className="text-muted-foreground mb-6 max-w-sm">
								Add your first sign to start displaying live MLB data on your digital display.
							</p>
							<Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
								<Plus className="h-4 w-4" />
								Add your first sign
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4">
						{signs.map((sign) => (
							<Link href={`/signs/${sign.id}`} key={sign.id}>
								<Card className="group hover:border-primary/50 cursor-pointer transition-all hover:shadow-md">
									<CardContent className="flex items-center justify-between p-4 sm:p-6">
										<div className="flex items-center gap-4">
											<div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
												<Monitor className="h-6 w-6" />
											</div>
											<div>
												<h3 className="text-foreground group-hover:text-primary font-semibold transition-colors">
													{sign.title}
												</h3>
												<div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
													<span>
														{sign.config.content.standingsDivisions.length} divisions
													</span>
													<span>·</span>
													<span>
														{new Set([
															...sign.config.content.lastGameTeamIds,
															...sign.config.content.nextGameTeamIds,
															...(sign.config.content.openerCountdownTeamIds ?? []),
														]).size} teams
													</span>
													{sign.config.schedule.enabled && (
														<>
															<span>·</span>
															<span>
																{sign.config.schedule.onTime}–{sign.config.schedule.offTime}
															</span>
														</>
													)}
												</div>
											</div>
										</div>
										<ChevronRight className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-transform group-hover:translate-x-1" />
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				)}
			</main>
		</div>
	);
}
