'use client';

import { ChevronRight, Plus, Trophy, Users } from 'lucide-react';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Group, Season, Sport } from '@/types';

import { createGroupAction, getGroupsAction, getSeasonsAction } from './actions';

export function DashboardClient() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isJoinOpen, setIsJoinOpen] = useState(false);
	const [groupName, setGroupName] = useState('');
	const [groupSport, setGroupSport] = useState('MLB');
	const [groupSeason, setGroupSeason] = useState('');
	const [inviteCode, setInviteCode] = useState('');
	const [groups, setGroups] = useState<Group[]>([]);
	const [seasons, setSeasons] = useState<Season[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [createError, setCreateError] = useState('');
	const [isCreating, setIsCreating] = useState(false);

	useEffect(() => {
		async function fetchGroups() {
			try {
				const result = await getGroupsAction();

				if (result.groups) {
					setGroups(result.groups);
				}
			} finally {
				setIsLoading(false);
			}
		}

		fetchGroups();
	}, []);

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

	const handleJoinGroup = () => {
		if (inviteCode.trim()) {
			// TODO: Implement join group API
			setInviteCode('');
			setIsJoinOpen(false);
		}
	};

	return (
		<div className="bg-background min-h-screen">
			<SiteHeader />

			<main className="mx-auto max-w-5xl px-4 py-8">
				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-foreground text-2xl font-bold sm:text-3xl">Your Groups</h1>
						<p className="text-muted-foreground mt-1">
							Manage your groups and track your standings
						</p>
					</div>

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
									Give your group a name to get started. You can invite friends after creating it.
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
							{createError && <p className="text-destructive text-sm">{createError}</p>}
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
				) : groups.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-16 text-center">
							<div className="bg-muted mb-4 rounded-full p-4">
								<Trophy className="text-muted-foreground h-8 w-8" />
							</div>
							<h3 className="text-foreground mb-2 text-lg font-semibold">No groups yet</h3>
							<p className="text-muted-foreground mb-6 max-w-sm">
								Create your first group to start making picks and competing with friends.
							</p>
							<Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
								<Plus className="h-4 w-4" />
								Create your first group
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4">
						{groups.map((group) => (
							<Link href={`/league/${group.id}`} key={group.id}>
								<Card className="group hover:border-primary/50 cursor-pointer transition-all hover:shadow-md">
									<CardContent className="flex items-center justify-between p-4 sm:p-6">
										<div className="flex items-center gap-4">
											<div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
												<Trophy className="h-6 w-6" />
											</div>
											<div>
												<h3 className="text-foreground group-hover:text-primary font-semibold transition-colors">
													{group.name}
												</h3>
												<div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
													<span className="inline-flex items-center gap-1">
														<span className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-xs font-medium">
															{group.sport}
														</span>
													</span>
													<span className="inline-flex items-center gap-1">
														<Users className="h-3.5 w-3.5" />
														{group.members.length} members
													</span>
													<span>{group.season}</span>
												</div>
											</div>
										</div>
										<div className="flex items-center gap-4">
											<ChevronRight className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-transform group-hover:translate-x-1" />
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				)}

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
							<DialogFooter>
								<Button onClick={() => setIsJoinOpen(false)} variant="outline">
									Cancel
								</Button>
								<Button disabled={!inviteCode.trim()} onClick={handleJoinGroup}>
									Join Group
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</main>
		</div>
	);
}
