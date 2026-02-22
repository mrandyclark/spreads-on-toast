'use client';

import { Plus, Trophy, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { createGroupAction, getSeasonsAction, joinGroupAction } from '@/app/(logged-in)/dashboard/actions';
import PageHeader from '@/components/layout/page-header';
import PageShell from '@/components/layout/page-shell';
import StandingsBoard from '@/components/standings/standings-board';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { countAndPluralize } from '@/lib/format-utils';
import { cn } from '@/lib/utils';
import { Group, GroupVisibility, Season, SeasonWithDates, Sport } from '@/types';

interface DashboardClientProps {
	initialGroups: Group[];
	initialSeasons: Season[];
	initialStandingsSeasons: SeasonWithDates[];
}

const DashboardClient = ({ initialGroups, initialSeasons, initialStandingsSeasons }: DashboardClientProps) => {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isJoinOpen, setIsJoinOpen] = useState(false);
	const [groupName, setGroupName] = useState('');
	const [groupSport, setGroupSport] = useState('MLB');
	const [groupSeason, setGroupSeason] = useState(initialSeasons[0]?.season ?? '');
	const [inviteCode, setInviteCode] = useState('');
	const [groups, setGroups] = useState<Group[]>(initialGroups);
	const [seasons, setSeasons] = useState<Season[]>(initialSeasons);
	const [createError, setCreateError] = useState('');
	const [isCreating, setIsCreating] = useState(false);
	const [joinError, setJoinError] = useState('');
	const [isJoining, setIsJoining] = useState(false);
	const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

	useEffect(() => {
		async function fetchSeasons() {
			const result = await getSeasonsAction(groupSport as Sport);

			if (result.seasons) {
				setSeasons(result.seasons);
				setGroupSeason(result.seasons[0]?.season ?? '');
			}
		}

		fetchSeasons();
	}, [groupSport]);

	const handleCreateGroup = async () => {
		if (groupName.trim()) {
			setCreateError('');
			setIsCreating(true);

			const result = await createGroupAction({
				lockDate: new Date(`${groupSeason}-03-28`).toISOString(),
				name: groupName.trim(),
				season: groupSeason,
				sport: groupSport as Sport,
			});

			if (result.group) {
				setGroups([result.group, ...groups]);
				setGroupName('');
				setGroupSport('MLB');
				setGroupSeason(seasons[0]?.season ?? '');
				setIsCreateOpen(false);
			} else {
				setCreateError(result.error || 'Failed to create group');
			}

			setIsCreating(false);
		}
	};

	const handleJoinGroup = async () => {
		if (inviteCode.trim()) {
			setJoinError('');
			setIsJoining(true);

			const result = await joinGroupAction(inviteCode.trim());

			if (result.group) {
				setGroups([result.group, ...groups]);
				setInviteCode('');
				setIsJoinOpen(false);
			} else {
				setJoinError(result.error || 'Failed to join group');
			}

			setIsJoining(false);
		}
	};

	return (
		<PageShell>
			<PageHeader
				actions={
					<div className="flex items-center justify-end gap-3">
						{viewMode === 'active' && (
							<Dialog onOpenChange={setIsCreateOpen} open={isCreateOpen}>
								<DialogTrigger asChild>
									<Button className="gap-2">
										<Plus className="h-4 w-4" />
										Create Group
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-md">
									<DialogHeader>
										<DialogTitle>Create a new group</DialogTitle>
										<DialogDescription>
											Give your group a name to get started. You can invite friends after creating
											it.
										</DialogDescription>
									</DialogHeader>
									<div className="grid gap-4 py-4">
										<div className="grid gap-2">
											<Label htmlFor="group-name">Group name</Label>
											<Input
												id="group-name"
												onChange={(e) => setGroupName(e.target.value)}
												onKeyDown={(e) => {
													if (e.key === 'Enter') {
														handleCreateGroup();
													}
												}}
												placeholder="e.g. Sunday Squad"
												value={groupName}
											/>
										</div>
										<div className="grid gap-2">
											<Label htmlFor="group-sport">Sport</Label>
											<Select onValueChange={setGroupSport} value={groupSport}>
												<SelectTrigger id="group-sport">
													<SelectValue placeholder="Select a sport" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="MLB">MLB</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="grid gap-2">
											<Label htmlFor="group-season">Season</Label>
											<Select
												disabled={seasons.length === 0}
												onValueChange={setGroupSeason}
												value={groupSeason}>
												<SelectTrigger id="group-season">
													<SelectValue
														placeholder={
															seasons.length === 0 ? 'No seasons available' : 'Select a season'
														}
													/>
												</SelectTrigger>
												<SelectContent>
													{seasons.map((s) => (
														<SelectItem key={s.id} value={s.season}>
															{s.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
									<FormError message={createError} />
									<DialogFooter>
										<Button onClick={() => setIsCreateOpen(false)} variant="outline">
											Cancel
										</Button>
										<Button
											disabled={!groupName.trim() || !groupSeason || isCreating}
											onClick={handleCreateGroup}>
											{isCreating ? 'Creating...' : 'Create Group'}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						)}
						{groups.some((g) => g.visibility === GroupVisibility.Archived) && (
							<div className="bg-muted flex rounded-lg p-1">
								<button
									className={cn(
										'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
										viewMode === 'active'
											? 'bg-background text-foreground shadow-sm'
											: 'text-muted-foreground hover:text-foreground',
									)}
									onClick={() => setViewMode('active')}
									type="button">
									Active
								</button>
								<button
									className={cn(
										'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
										viewMode === 'archived'
											? 'bg-background text-foreground shadow-sm'
											: 'text-muted-foreground hover:text-foreground',
									)}
									onClick={() => setViewMode('archived')}
									type="button">
									Archived
								</button>
							</div>
						)}
					</div>
				}
				subtitle="Manage your groups and track your standings"
				title="Your Groups"
			/>

			{(() => {
				const filteredGroups = groups.filter((g) =>
					viewMode === 'archived'
						? g.visibility === GroupVisibility.Archived
						: g.visibility !== GroupVisibility.Archived,
				);

				if (filteredGroups.length === 0) {
					return (
						<EmptyState
							action={
								viewMode === 'active'
									? (
										<Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
											<Plus className="h-4 w-4" />
											Create your first group
										</Button>
									)
									: undefined
							}
							description={
								viewMode === 'archived'
									? 'Groups you archive will appear here.'
									: 'Create your first group to start making picks and competing with friends.'
							}
							icon={Trophy}
							title={viewMode === 'archived' ? 'No archived groups' : 'No groups yet'}
						/>
					);
				}

				return (
					<div className="grid gap-4">
						{filteredGroups.map((group) => (
							<CardLink
								href={`/league/${group.id}`}
								icon={Trophy}
								key={group.id}
								title={group.name}>
								<span className="inline-flex items-center gap-1">
									<span className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-xs font-medium">
										{group.sport}
									</span>
								</span>
								<span className="inline-flex items-center gap-1">
									<Users className="h-3.5 w-3.5" />
									{countAndPluralize(group.members.length, 'member')}
								</span>
								<span>{group.season}</span>
							</CardLink>
						))}
					</div>
				);
			})()}

			{viewMode === 'active' && (
				<div className="border-border bg-muted/30 mt-8 rounded-xl border border-dashed p-6 text-center">
					<p className="text-muted-foreground mb-3">Have an invite code from a friend?</p>
					<Dialog onOpenChange={setIsJoinOpen} open={isJoinOpen}>
						<DialogTrigger asChild>
							<Button variant="outline">Join an existing group</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Join a group</DialogTitle>
								<DialogDescription>
									Enter the invite code you received from a friend to join their group.
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label htmlFor="invite-code">Invite code</Label>
									<Input
										id="invite-code"
										onChange={(e) => setInviteCode(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												handleJoinGroup();
											}
										}}
										placeholder="e.g. ABC123"
										value={inviteCode}
									/>
								</div>
							</div>
							<FormError message={joinError} />
							<DialogFooter>
								<Button onClick={() => setIsJoinOpen(false)} variant="outline">
									Cancel
								</Button>
								<Button disabled={!inviteCode.trim() || isJoining} onClick={handleJoinGroup}>
									{isJoining ? 'Joining...' : 'Join Group'}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			)}

			<div className="mt-12">
				<StandingsBoard initialSeasons={initialStandingsSeasons} />
			</div>
		</PageShell>
	);
};

export default DashboardClient;
