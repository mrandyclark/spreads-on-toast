'use client';

import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { updateSignConfigAction } from '@/app/(logged-in)/signs/actions';
import BackLink from '@/components/layout/back-link';
import PageShell from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DIVISION_LABELS } from '@/lib/constants';
import { toggleValue } from '@/lib/state-utils';
import { cn } from '@/lib/utils';
import { Division, Sign, SignConfig, Team } from '@/types';

import TeamPicker from './team-picker';

interface SignDetailClientProps {
	initialSign: Sign;
	initialTeams: Team[];
}

const SignDetailClient = ({ initialSign, initialTeams }: SignDetailClientProps) => {
	const [sign, setSign] = useState<Sign>(initialSign);
	const [isSaving, setIsSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [error, setError] = useState('');

	// Content config state
	const [standingsDivisions, setStandingsDivisions] = useState<string[]>(initialSign.config.content.standingsDivisions ?? []);
	const [lastGameTeamIds, setLastGameTeamIds] = useState<string[]>(initialSign.config.content.lastGameTeamIds ?? []);
	const [nextGameTeamIds, setNextGameTeamIds] = useState<string[]>(initialSign.config.content.nextGameTeamIds ?? []);
	const [openerCountdownTeamIds, setOpenerCountdownTeamIds] = useState<string[]>(initialSign.config.content.openerCountdownTeamIds ?? []);

	// Display config state
	const [brightness, setBrightness] = useState(initialSign.config.display.brightness);
	const [rotationInterval, setRotationInterval] = useState(initialSign.config.display.rotationIntervalSeconds);

	// Schedule config state
	const [scheduleEnabled, setScheduleEnabled] = useState(initialSign.config.schedule.enabled);
	const [onTime, setOnTime] = useState(initialSign.config.schedule.onTime);
	const [offTime, setOffTime] = useState(initialSign.config.schedule.offTime);
	const [timezone, setTimezone] = useState(initialSign.config.schedule.timezone);

	const handleSave = async () => {
		setIsSaving(true);
		setError('');
		setSaveSuccess(false);

		const config: Partial<SignConfig> = {
			content: {
				lastGameTeamIds,
				nextGameTeamIds,
				openerCountdownTeamIds,
				standingsDivisions: standingsDivisions as Division[],
			},
			display: {
				brightness,
				rotationIntervalSeconds: rotationInterval,
			},
			schedule: {
				enabled: scheduleEnabled,
				offTime,
				onTime,
				timezone,
			},
		};

		const result = await updateSignConfigAction(sign.id, config);

		if (result.sign) {
			setSign(result.sign);
			setSaveSuccess(true);
			setTimeout(() => setSaveSuccess(false), 2000);
		} else {
			setError(result.error || 'Failed to save');
		}

		setIsSaving(false);
	};

	const toggleDivision = (div: string) => {
		setStandingsDivisions((prev) => toggleValue(prev, div));
	};

	const toggleTeamInList = (
		teamId: string,
		list: string[],
		setList: (val: string[]) => void,
	) => {
		setList(toggleValue(list, teamId));
	};

	const teamsByDivision = initialTeams.reduce<Record<string, Team[]>>((acc, team) => {
		const div = team.division;

		if (!acc[div]) {
			acc[div] = [];
		}

		acc[div].push(team);

		return acc;
	}, {});

	return (
		<PageShell maxWidth="3xl">
			{/* Header */}
			<div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-16 z-40 -mx-4 mb-8 px-4 py-4 backdrop-blur sm:-mx-0 sm:px-0">
				<BackLink href="/signs" label="Back to Signs" />
				<div className="flex items-center justify-between">
					<h1 className="text-foreground text-2xl font-bold sm:text-3xl">{sign.title}</h1>
					<Button
						className="gap-2"
						disabled={isSaving}
						onClick={handleSave}>
						{isSaving ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
									Saving...
							</>
						) : saveSuccess ? (
							<>
								<Check className="h-4 w-4" />
									Saved!
							</>
						) : (
							'Save Changes'
						)}
					</Button>
				</div>
				{error && <p className="text-destructive mt-2 text-sm">{error}</p>}
			</div>

			<div className="space-y-6">
				{/* Standings Divisions */}
				<Card>
					<CardContent className="p-6">
						<h2 className="text-foreground mb-1 text-lg font-semibold">Standings</h2>
						<p className="text-muted-foreground mb-4 text-sm">
								Select which divisions to show standings for
						</p>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{Object.values(Division).map((div) => (
								<button
									className={cn(
										'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
										standingsDivisions.includes(div)
											? 'border-primary bg-primary/10 text-primary'
											: 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
									)}
									key={div}
									onClick={() => toggleDivision(div)}
									type="button">
									{DIVISION_LABELS[div] ?? div}
								</button>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Opener Countdown Teams */}
				<Card>
					<CardContent className="p-6">
						<h2 className="text-foreground mb-1 text-lg font-semibold">Opening Day Countdown</h2>
						<p className="text-muted-foreground mb-4 text-sm">
								Show a countdown to opening day for these teams (only appears in the offseason)
						</p>
						<TeamPicker
							onToggle={(id) => toggleTeamInList(id, openerCountdownTeamIds, setOpenerCountdownTeamIds)}
							selectedTeamIds={openerCountdownTeamIds}
							teamsByDivision={teamsByDivision}
						/>
					</CardContent>
				</Card>

				{/* Last Game Teams */}
				<Card>
					<CardContent className="p-6">
						<h2 className="text-foreground mb-1 text-lg font-semibold">Last Game Scores</h2>
						<p className="text-muted-foreground mb-4 text-sm">
								Show the most recent box score for these teams
						</p>
						<TeamPicker
							onToggle={(id) => toggleTeamInList(id, lastGameTeamIds, setLastGameTeamIds)}
							selectedTeamIds={lastGameTeamIds}
							teamsByDivision={teamsByDivision}
						/>
					</CardContent>
				</Card>

				{/* Next Game Teams */}
				<Card>
					<CardContent className="p-6">
						<h2 className="text-foreground mb-1 text-lg font-semibold">Next Game Preview</h2>
						<p className="text-muted-foreground mb-4 text-sm">
								Show the next upcoming game for these teams
						</p>
						<TeamPicker
							onToggle={(id) => toggleTeamInList(id, nextGameTeamIds, setNextGameTeamIds)}
							selectedTeamIds={nextGameTeamIds}
							teamsByDivision={teamsByDivision}
						/>
					</CardContent>
				</Card>

				{/* Display Settings */}
				<Card>
					<CardContent className="p-6">
						<h2 className="text-foreground mb-4 text-lg font-semibold">Display</h2>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="grid gap-2">
								<Label htmlFor="brightness">Brightness ({brightness}%)</Label>
								<input
									className="w-full"
									id="brightness"
									max={100}
									min={0}
									onChange={(e) => setBrightness(Number(e.target.value))}
									type="range"
									value={brightness}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="rotation">Rotation interval (seconds)</Label>
								<Input
									id="rotation"
									min={3}
									onChange={(e) => setRotationInterval(Number(e.target.value))}
									type="number"
									value={rotationInterval}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Schedule Settings */}
				<Card>
					<CardContent className="p-6">
						<h2 className="text-foreground mb-4 text-lg font-semibold">Schedule</h2>
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								<button
									className={cn(
										'relative h-6 w-11 rounded-full transition-colors',
										scheduleEnabled ? 'bg-primary' : 'bg-muted',
									)}
									onClick={() => setScheduleEnabled(!scheduleEnabled)}
									type="button">
									<span
										className={cn(
											'bg-background absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow transition-transform',
											scheduleEnabled ? 'translate-x-5' : 'translate-x-0',
										)}
									/>
								</button>
								<Label>Auto on/off schedule</Label>
							</div>

							{scheduleEnabled && (
								<div className="grid gap-4 sm:grid-cols-3">
									<div className="grid gap-2">
										<Label htmlFor="on-time">On time</Label>
										<Input
											id="on-time"
											onChange={(e) => setOnTime(e.target.value)}
											type="time"
											value={onTime}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="off-time">Off time</Label>
										<Input
											id="off-time"
											onChange={(e) => setOffTime(e.target.value)}
											type="time"
											value={offTime}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="timezone">Timezone</Label>
										<Select onValueChange={setTimezone} value={timezone}>
											<SelectTrigger id="timezone">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="America/New_York">Eastern</SelectItem>
												<SelectItem value="America/Chicago">Central</SelectItem>
												<SelectItem value="America/Denver">Mountain</SelectItem>
												<SelectItem value="America/Los_Angeles">Pacific</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</PageShell>
	);
};

export default SignDetailClient;
