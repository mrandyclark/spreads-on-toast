'use client';

import { Monitor, Plus } from 'lucide-react';
import { useState } from 'react';

import { createSignAction } from '@/app/(logged-in)/signs/actions';
import PageHeader from '@/components/layout/page-header';
import PageShell from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import CardLink from '@/components/ui/card-link';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import EmptyState from '@/components/ui/empty-state';
import FormError from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sign } from '@/types';

interface SignsClientProps {
	initialSigns: Sign[];
}

const SignsClient = ({ initialSigns }: SignsClientProps) => {
	const [signs, setSigns] = useState<Sign[]>(initialSigns);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [signName, setSignName] = useState('');
	const [createError, setCreateError] = useState('');
	const [isCreating, setIsCreating] = useState(false);

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
		<PageShell>
			<PageHeader
				actions={
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
									Give your sign a name to get started. You can configure what it displays after
									creating it.
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
							<FormError message={createError} />
							<DialogFooter>
								<Button onClick={() => setIsCreateOpen(false)} variant="outline">
									Cancel
								</Button>
								<Button disabled={!signName.trim() || isCreating} onClick={handleCreateSign}>
									{isCreating ? 'Creating...' : 'Create Sign'}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				}
				subtitle="Manage your digital signs and their display settings"
				title="Your Signs"
			/>

			{signs.length === 0 && (
				<EmptyState
					action={
						<Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
							<Plus className="h-4 w-4" />
							Add your first sign
						</Button>
					}
					description="Add your first sign to start displaying live MLB data on your digital display."
					icon={Monitor}
					title="No signs yet"
				/>
			)}

			{signs.length > 0 && (
				<div className="grid gap-4">
					{signs.map((sign) => (
						<CardLink href={`/signs/${sign.id}`} icon={Monitor} key={sign.id} title={sign.title}>
							<span>{sign.config.content.standingsDivisions.length} divisions</span>
							<span>·</span>
							<span>
								{
									new Set([
										...sign.config.content.lastGameTeamIds,
										...sign.config.content.nextGameTeamIds,
										...(sign.config.content.openerCountdownTeamIds ?? []),
									]).size
								}{' '}
								teams
							</span>
							{sign.config.schedule.enabled && (
								<>
									<span>·</span>
									<span>
										{sign.config.schedule.onTime}–{sign.config.schedule.offTime}
									</span>
								</>
							)}
						</CardLink>
					))}
				</div>
			)}
		</PageShell>
	);
};

export default SignsClient;
