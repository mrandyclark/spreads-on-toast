'use client';

import { ArrowLeft, Calendar, Check, Copy, Lock, Pencil, Users, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SiteHeader } from '@/components/layout/site-header';
import {
	MlbLeaderboard,
	MlbLockedResults,
	MlbMemberSheet,
	MlbPicksForm,
	SelectedMember,
} from '@/components/league/mlb';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sheet as SheetUI } from '@/components/ui/sheet';
import { toDateString } from '@/lib/date-utils';
import { populatedToId } from '@/lib/mongo-utils';
import { Group, GroupRole, PostseasonPicks, Sheet, WorldSeriesPicks } from '@/types';

import {
	CopyableSheet,
	copyPicksFromSheetAction,
	getCopyableSheetsAction,
	getGroupAction,
	getSheetAction,
	savePicksAction,
	updateGroupNameAction,
} from './actions';

export default function LeagueDetailPage() {
	const params = useParams();
	const groupId = params.id as string;

	const [group, setGroup] = useState<Group | null>(null);
	const [sheet, setSheet] = useState<null | Sheet>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState<'error' | 'idle' | 'success'>('idle');
	const [teamPicks, setTeamPicks] = useState<Record<string, 'over' | 'under' | null>>({});
	const [postseasonPicks, setPostseasonPicks] = useState<null | PostseasonPicks>(null);
	const [worldSeriesPicks, setWorldSeriesPicks] = useState<null | WorldSeriesPicks>(null);
	const [selectedMember, setSelectedMember] = useState<null | SelectedMember>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
	const [copiedInvite, setCopiedInvite] = useState(false);
	const [editNameOpen, setEditNameOpen] = useState(false);
	const [editingName, setEditingName] = useState('');
	const [isSavingName, setIsSavingName] = useState(false);
	const [copyPicksOpen, setCopyPicksOpen] = useState(false);
	const [copyableSheets, setCopyableSheets] = useState<CopyableSheet[]>([]);
	const [isCopyingPicks, setIsCopyingPicks] = useState(false);

	useEffect(() => {
		async function fetchData() {
			try {
				const [groupResult, sheetResult, copyableSheetsResult] = await Promise.all([
					getGroupAction(groupId),
					getSheetAction(groupId),
					getCopyableSheetsAction(groupId),
				]);

				if (groupResult.group) {
					setGroup(groupResult.group);
				}

				if (sheetResult.sheet) {
					setSheet(sheetResult.sheet);

					// Initialize teamPicks from sheet data
					const initialPicks: Record<string, 'over' | 'under' | null> = {};

					sheetResult.sheet.teamPicks.forEach((tp) => {
						const teamId = typeof tp.team === 'object' ? tp.team.id : tp.team;

						if (tp.pick) {
							initialPicks[teamId] = tp.pick as 'over' | 'under';
						}
					});

					setTeamPicks(initialPicks);
				}

				if (copyableSheetsResult.sheets) {
					setCopyableSheets(copyableSheetsResult.sheets);
				}
			} finally {
				setIsLoading(false);
			}
		}

		fetchData();
	}, [groupId]);

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		);
	}

	if (!group) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-muted-foreground">Group not found</div>
			</div>
		);
	}

	const lockDate = new Date(group.lockDate);
	const isLocked = lockDate < new Date();
	const daysUntilLock = Math.max(
		0,
		Math.ceil((lockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
	);

	// Check if current user is owner or admin
	const currentUserMember = group.members.find(
		(m) => typeof m.user === 'object' && m.user.id === sheet?.user,
	);
	const canEditGroup =
		currentUserMember?.role === GroupRole.Owner || currentUserMember?.role === GroupRole.Admin;

	const handleCopyInviteCode = async () => {
		if (!group?.inviteCode) {
			return;
		}

		await navigator.clipboard.writeText(group.inviteCode);
		setCopiedInvite(true);

		setTimeout(() => {
			setCopiedInvite(false);
		}, 2000);
	};

	const handleOpenEditName = () => {
		setEditingName(group.name);
		setEditNameOpen(true);
	};

	const handleSaveGroupName = async () => {
		if (!editingName.trim()) {
			return;
		}

		setIsSavingName(true);

		try {
			const result = await updateGroupNameAction(groupId, editingName.trim());

			if (result.success) {
				setGroup({ ...group, name: editingName.trim() });
				setEditNameOpen(false);
			}
		} finally {
			setIsSavingName(false);
		}
	};

	const handleCopyPicks = async (sourceSheetId: string) => {
		setIsCopyingPicks(true);

		try {
			const result = await copyPicksFromSheetAction(groupId, sourceSheetId);

			if (result.success) {
				// Reload the page to get the updated picks
				window.location.reload();
			}
		} finally {
			setIsCopyingPicks(false);
			setCopyPicksOpen(false);
		}
	};

	const handleSavePicks = async () => {
		setIsSaving(true);
		setSaveStatus('idle');

		try {
			const result = await savePicksAction(groupId, {
				postseasonPicks: postseasonPicks ?? undefined,
				teamPicks,
				worldSeriesPicks: worldSeriesPicks ?? undefined,
			});

			if (result.sheet) {
				setSaveStatus('success');

				setTimeout(() => {
					setSaveStatus('idle');
				}, 3000);
			} else if (result.error) {
				setSaveStatus('error');

				setTimeout(() => {
					setSaveStatus('idle');
				}, 3000);
			}
		} catch {
			setSaveStatus('error');

			setTimeout(() => {
				setSaveStatus('idle');
			}, 3000);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="bg-background min-h-screen">
			<SiteHeader />

			<main className="mx-auto max-w-5xl px-4 py-8">
				{/* Back link */}
				<Link
					className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm transition-colors"
					href="/dashboard">
					<ArrowLeft className="h-4 w-4" />
					Dashboard
				</Link>

				{/* League title and info */}
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-2">
						<h1 className="text-foreground text-2xl font-bold sm:text-3xl">{group.name}</h1>
						{canEditGroup && (
							<Button
								aria-label="Edit group name"
								className="h-8 w-8"
								onClick={handleOpenEditName}
								size="icon"
								variant="ghost">
								<Pencil className="h-4 w-4" />
							</Button>
						)}
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<Badge variant="secondary">
							{group.sport} {group.season}
						</Badge>
						<div className="text-muted-foreground flex items-center gap-1.5 text-sm">
							<Users className="h-4 w-4" />
							<span>{group.members.length}</span>
						</div>
						<Button
							className="h-8 gap-1.5 text-xs"
							onClick={handleCopyInviteCode}
							size="sm"
							variant="outline">
							{copiedInvite ? (
								<>
									<Check className="h-3 w-3" />
									Copied!
								</>
							) : (
								<>
									<Copy className="h-3 w-3" />
									Invite: {group.inviteCode}
								</>
							)}
						</Button>
					</div>
				</div>

				{/* Lock status card */}
				<Card
					className={`mb-8 ${isLocked ? 'border-primary/30 bg-primary/5' : 'border-accent bg-accent/20'}`}>
					<CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-3">
							{isLocked ? (
								<>
									<div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
										<Lock className="text-primary h-5 w-5" />
									</div>
									<div>
										<p className="font-medium">Picks are locked</p>
										<p className="text-muted-foreground text-sm">
											Season is in progress. Track your standings below.
										</p>
									</div>
								</>
							) : (
								<>
									<div className="bg-accent flex h-10 w-10 items-center justify-center rounded-full">
										<Calendar className="text-foreground h-5 w-5" />
									</div>
									<div>
										<p className="font-medium">{daysUntilLock} days until picks lock</p>
										<p className="text-muted-foreground text-sm">
											Locks on{' '}
											{lockDate.toLocaleDateString('en-US', {
												day: 'numeric',
												month: 'long',
												weekday: 'long',
											})}
										</p>
									</div>
								</>
							)}
						</div>
					</CardContent>
				</Card>

				{isLocked ? (
					<div className="space-y-8">
						{/* Date picker for historical view */}
						{group.seasonStartDate && group.seasonEndDate && (
							<div className="flex flex-col items-end gap-1">
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground text-sm">View as of:</span>
									<DatePicker
										maxDate={toDateString(group.seasonEndDate)}
										minDate={toDateString(group.seasonStartDate)}
										onChange={setSelectedDate}
										value={selectedDate ?? toDateString(group.seasonEndDate)}
									/>
								</div>
								{selectedDate && (
									<Button
										className="h-auto p-0"
										onClick={() => setSelectedDate(undefined)}
										size="sm"
										variant="link">
										Show Final Results
									</Button>
								)}
							</div>
						)}

						<MlbLeaderboard
							currentUserId="e8291a50-6e79-4842-b85d-dc5ba36fec80"
							groupId={groupId}
							onMemberSelect={(member) => {
								setSelectedMember(member);
								setSheetOpen(true);
							}}
							selectedDate={selectedDate}
						/>

						{sheet && (
							<MlbLockedResults
								groupId={groupId}
								selectedDate={selectedDate}
								sheet={sheet}
								userId="e8291a50-6e79-4842-b85d-dc5ba36fec80"
							/>
						)}
					</div>
				) : (
					<div className="space-y-8">
						<section>
							<div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-16 z-40 -mx-4 mb-4 flex items-center justify-between border-b px-4 py-3 backdrop-blur">
								<h2 className="text-xl font-semibold">Your Picks</h2>
								<div className="flex items-center gap-2">
									{copyableSheets.length > 0 && (
										<Button
											className="text-xs"
											onClick={() => setCopyPicksOpen(true)}
											size="sm"
											variant="ghost">
											Copy from another group
										</Button>
									)}
									<Button
										disabled={isSaving}
										onClick={handleSavePicks}
										size="sm"
										variant={saveStatus === 'success' ? 'outline' : saveStatus === 'error' ? 'destructive' : 'default'}>
										{isSaving ? (
											'Saving...'
										) : saveStatus === 'success' ? (
											<>
												<Check className="mr-1 h-4 w-4" />
												Saved
											</>
										) : saveStatus === 'error' ? (
											<>
												<X className="mr-1 h-4 w-4" />
												Error
											</>
										) : (
											'Save All Picks'
										)}
									</Button>
								</div>
							</div>

							{/* Sport-specific picks form - renders based on group.sport */}
							{sheet && (
								<MlbPicksForm
									onPostseasonPicksChange={setPostseasonPicks}
									onTeamPicksChange={setTeamPicks}
									onWorldSeriesPicksChange={setWorldSeriesPicks}
									sheet={sheet}
								/>
							)}
						</section>

						<section>
							<h2 className="mb-4 text-xl font-semibold">League Members</h2>
							<Card>
								<CardContent className="p-4">
									<p className="text-muted-foreground mb-4 text-sm">
										Other members{"'"} picks will be visible after the lock date.
									</p>
									<div className="flex flex-wrap gap-3">
										{group.members.map((member) => {
											const user = typeof member.user === 'object' ? member.user : null;
											const displayName = user
												? `${user.nameFirst ?? ''} ${user.nameLast ?? ''}`.trim() || 'Member'
												: 'Member';
											const initials = user?.nameFirst
												? user.nameFirst.slice(0, 2).toUpperCase()
												: '??';
											return (
												<div
													className="bg-muted flex items-center gap-2 rounded-full px-3 py-1.5"
													key={populatedToId(member.user)}>
													<Avatar className="h-6 w-6">
														<AvatarFallback className="bg-primary text-primary-foreground text-xs">
															{initials}
														</AvatarFallback>
													</Avatar>
													<span className="text-sm">{displayName}</span>
												</div>
											);
										})}
									</div>
								</CardContent>
							</Card>
						</section>
					</div>
				)}
			</main>

			<SheetUI onOpenChange={setSheetOpen} open={sheetOpen}>
				{selectedMember && group && (
					<MlbMemberSheet
						groupId={groupId}
						isCurrentUser={selectedMember.isCurrentUser}
						memberInitials={selectedMember.userInitials}
						memberName={selectedMember.userName}
						onDateChange={setSelectedDate}
						seasonEndDate={group.seasonEndDate?.toString()}
						seasonStartDate={group.seasonStartDate?.toString()}
						selectedDate={selectedDate}
						userId={selectedMember.userId}
					/>
				)}
			</SheetUI>

			{/* Edit Group Name Dialog */}
			<Dialog onOpenChange={setEditNameOpen} open={editNameOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Edit League Name</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<Input
							onChange={(e) => setEditingName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									void handleSaveGroupName();
								}
							}}
							placeholder="League name"
							value={editingName}
						/>
					</div>
					<DialogFooter>
						<Button onClick={() => setEditNameOpen(false)} variant="outline">
							Cancel
						</Button>
						<Button disabled={isSavingName || !editingName.trim()} onClick={handleSaveGroupName}>
							{isSavingName ? 'Saving...' : 'Save'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Copy Picks Dialog */}
			<Dialog onOpenChange={setCopyPicksOpen} open={copyPicksOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Copy Picks from Another League</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						{copyableSheets.length === 0 ? (
							<p className="text-muted-foreground text-center text-sm">
								No other leagues found for this sport and season.
							</p>
						) : (
							<div className="space-y-2">
								{copyableSheets.map((s) => (
									<Button
										className="w-full justify-start"
										disabled={isCopyingPicks}
										key={s.sheetId}
										onClick={() => handleCopyPicks(s.sheetId)}
										variant="outline">
										{isCopyingPicks ? 'Copying...' : s.groupName}
									</Button>
								))}
							</div>
						)}
					</div>
					<DialogFooter>
						<Button onClick={() => setCopyPicksOpen(false)} variant="outline">
							Cancel
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
