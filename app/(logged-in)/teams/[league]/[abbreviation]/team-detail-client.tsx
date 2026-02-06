'use client';

import { ArrowDown, ArrowLeft, ArrowUp, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
	XAxis,
	YAxis,
} from 'recharts';

import { ScheduleDifficulty } from '@/components/league/schedule-difficulty';
import { TeamChips } from '@/components/league/team-chip';
import { WinProfile } from '@/components/league/win-profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';
import { DatePicker } from '@/components/ui/date-picker';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ScheduleDifficultyData, SeasonWithDates, TeamDetailData, TeamHistoryDataPoint } from '@/types';

interface TeamDetailClientProps {
	availableDates: string[];
	current: null | TeamDetailData;
	history: TeamHistoryDataPoint[];
	scheduleDifficulty: null | ScheduleDifficultyData;
	season: string;
	seasons: SeasonWithDates[];
	selectedDate: string;
	teamAbbreviation: string;
	teamCity: string;
	teamName: string;
}

const chartConfig = {
	line: {
		color: 'hsl(30, 10%, 50%)',
		label: 'Vegas Line',
	},
	projectedWins: {
		color: 'hsl(35, 50%, 55%)',
		label: 'Pace Projection',
	},
	pythagoreanWins: {
		color: 'hsl(12, 70%, 45%)',
		label: 'Pythagorean Projection',
	},
	wins: {
		color: 'hsl(30, 40%, 40%)',
		label: 'Actual Wins',
	},
} satisfies ChartConfig;

function StatCard({
	description,
	title,
	trend,
	value,
}: {
	description?: string;
	title: string;
	trend?: 'down' | 'neutral' | 'up';
	value: React.ReactNode;
}) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardDescription className="text-xs">{title}</CardDescription>
				<CardTitle className="flex items-center gap-2 text-2xl">
					{value}
					{trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
					{trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
				</CardTitle>
			</CardHeader>
			{description && (
				<CardContent>
					<p className="text-muted-foreground text-xs">{description}</p>
				</CardContent>
			)}
		</Card>
	);
}

function OverUnderBadge({ line, projected }: { line: number; projected: number }) {
	const diff = projected - line;

	if (Math.abs(diff) < 0.5) {
		return (
			<span className="text-muted-foreground inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium dark:bg-gray-800">
				<Minus className="h-4 w-4" />
				Push
			</span>
		);
	}

	if (diff > 0) {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
				<ArrowUp className="h-4 w-4" />
				Over by {diff.toFixed(1)}
			</span>
		);
	}

	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
			<ArrowDown className="h-4 w-4" />
			Under by {Math.abs(diff).toFixed(1)}
		</span>
	);
}

export function TeamDetailClient({
	availableDates,
	current,
	history,
	scheduleDifficulty,
	season,
	seasons,
	selectedDate,
	teamAbbreviation,
	teamCity,
	teamName,
}: TeamDetailClientProps) {
	const router = useRouter();

	// Get date range for date picker
	const minDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : undefined;
	const maxDate = availableDates.length > 0 ? availableDates[0] : undefined;

	const handleSeasonChange = (newSeason: string) => {
		router.push(`/teams/mlb/${teamAbbreviation}?season=${newSeason}`);
	};

	const handleDateChange = (newDate: string | undefined) => {
		if (newDate) {
			router.push(`/teams/mlb/${teamAbbreviation}?season=${season}&date=${newDate}`);
		}
	};

	if (!current) {
		return (
			<div>
				<Link
					className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm transition-colors"
					href="/dashboard">
					<ArrowLeft className="h-4 w-4" />
					Dashboard
				</Link>

				<h1 className="text-foreground mt-4 text-2xl font-bold sm:text-3xl">
					{teamCity} {teamName}
				</h1>

				<p className="text-muted-foreground mt-4">
					No standings data available for the {season} season yet.
				</p>
			</div>
		);
	}

	// Calculate win percentage
	const winPct = current.gamesPlayed > 0 ? current.wins / current.gamesPlayed : 0;

	// Calculate runs per game
	const runsPerGame = current.gamesPlayed > 0 && current.runsScored
		? (current.runsScored / current.gamesPlayed).toFixed(2)
		: null;
	const runsAllowedPerGame = current.gamesPlayed > 0 && current.runsAllowed
		? (current.runsAllowed / current.gamesPlayed).toFixed(2)
		: null;

	// Filter history to only show data up to the selected date
	const filteredHistory = selectedDate
		? history.filter((point) => point.date <= selectedDate)
		: history;

	// Prepare chart data - add the line value to each point
	const chartData = filteredHistory.map((point) => ({
		...point,
		line: current.line,
	}));

	// Get division display name
	const divisionDisplay = current.division.replace('_', ' ');

	return (
		<div className="space-y-6">
			{/* Back link */}
			<Link
				className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm transition-colors"
				href="/dashboard">
				<ArrowLeft className="h-4 w-4" />
				Dashboard
			</Link>

			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-foreground text-2xl font-bold sm:text-3xl">
						{teamCity} {teamName}
					</h1>
					<p className="text-muted-foreground mt-1">
						{divisionDisplay} • {season} Season
					</p>
				</div>

				<div className="flex items-center gap-3">
					<Select onValueChange={handleSeasonChange} value={season}>
						<SelectTrigger className="w-[120px]">
							<SelectValue placeholder="Season" />
						</SelectTrigger>
						<SelectContent>
							{seasons.map((s) => (
								<SelectItem key={s.season} value={s.season}>
									{s.season}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<DatePicker
						maxDate={maxDate}
						minDate={minDate}
						onChange={handleDateChange}
						placeholder="Select date"
						value={selectedDate}
					/>
				</div>
			</div>

			{/* Badges */}
			<div className="flex flex-wrap items-center gap-3">
				{current.streak && (
					<span
						className={cn(
							'rounded-full px-3 py-1 text-sm font-medium',
							current.streak.type === 'wins'
								? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
								: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
						)}>
						{current.streak.code}
					</span>
				)}
				<OverUnderBadge line={current.line} projected={current.pythagoreanWins ?? current.projectedWins} />
			</div>

			{/* Key Stats Row */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<StatCard
					description={`${current.gamesPlayed} games played`}
					title="Record"
					value={`${current.wins}-${current.losses}`}
				/>
				<StatCard
					description={`.${(winPct * 1000).toFixed(0).padStart(3, '0')} win pct`}
					title="Vegas Line"
					value={current.line}
				/>
				<StatCard
					description="Based on run differential"
					title="Pythagorean Wins"
					trend={
						current.pythagoreanWins
							? current.pythagoreanWins > current.line
								? 'up'
								: current.pythagoreanWins < current.line
									? 'down'
									: 'neutral'
							: undefined
					}
					value={current.pythagoreanWins?.toFixed(1) ?? '—'}
				/>
				<StatCard
					description="Based on current pace"
					title="Pace Projection"
					trend={
						current.projectedWins > current.line
							? 'up'
							: current.projectedWins < current.line
								? 'down'
								: 'neutral'
					}
					value={current.projectedWins.toFixed(1)}
				/>
			</div>

			{/* Team Chips */}
			<TeamChips chips={current.chips} />

			{/* Win Profile */}
			{current.winProfile && <WinProfile conference={current.conference} data={current.winProfile} />}

			{/* Projections Chart */}
			<Card>
				<CardHeader>
					<CardTitle>Season Projections</CardTitle>
					<CardDescription>
						Tracking projected wins over the season against the Vegas line of {current.line}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-[300px] w-full">
						<ChartContainer className="h-full w-full" config={chartConfig}>
							<LineChart data={chartData} margin={{ bottom: 5, left: 0, right: 10, top: 5 }}>
								<CartesianGrid className="stroke-border" strokeDasharray="3 3" />
								<XAxis
									axisLine={false}
									dataKey="date"
									tickFormatter={(value) => {
										const date = new Date(String(value));
										return `${date.getMonth() + 1}/${date.getDate()}`;
									}}
									tickLine={false}
									tickMargin={8}
								/>
								<YAxis
									axisLine={false}
									domain={['auto', 'auto']}
									tickLine={false}
									tickMargin={8}
								/>
								<ChartTooltip
									content={
										<ChartTooltipContent
											labelFormatter={(value) => {
												const date = new Date(String(value));
												return date.toLocaleDateString('en-US', {
													day: 'numeric',
													month: 'short',
													year: 'numeric',
												});
											}}
										/>
									}
								/>
								<ChartLegend content={<ChartLegendContent />} />
								<ReferenceLine
									stroke={chartConfig.line.color}
									strokeDasharray="5 5"
									strokeWidth={2}
									y={current.line}
								/>
								<Line
									connectNulls
									dataKey="pythagoreanWins"
									dot={false}
									stroke={chartConfig.pythagoreanWins.color}
									strokeWidth={2}
									type="monotone"
								/>
								<Line
									connectNulls
									dataKey="projectedWins"
									dot={false}
									stroke={chartConfig.projectedWins.color}
									strokeWidth={2}
									type="monotone"
								/>
							</LineChart>
						</ChartContainer>
					</div>
				</CardContent>
			</Card>

			{/* Schedule Difficulty */}
			{scheduleDifficulty && <ScheduleDifficulty data={scheduleDifficulty} />}

			{/* Run Production & Rankings */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Run Production */}
				<Card>
					<CardHeader>
						<CardTitle>Run Production</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Runs Scored</span>
								<span className="font-medium">
									{current.runsScored ?? '—'}
									{runsPerGame && (
										<span className="text-muted-foreground ml-2 text-sm">
											({runsPerGame}/game)
										</span>
									)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Runs Allowed</span>
								<span className="font-medium">
									{current.runsAllowed ?? '—'}
									{runsAllowedPerGame && (
										<span className="text-muted-foreground ml-2 text-sm">
											({runsAllowedPerGame}/game)
										</span>
									)}
								</span>
							</div>
							<div className="border-border border-t pt-4">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Run Differential</span>
									<span
										className={cn(
											'font-bold',
											current.runDifferential && current.runDifferential > 0 && 'text-green-600',
											current.runDifferential && current.runDifferential < 0 && 'text-red-600',
										)}>
										{current.runDifferential !== undefined
											? current.runDifferential > 0
												? `+${current.runDifferential}`
												: current.runDifferential
											: '—'}
									</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Rankings */}
				<Card>
					<CardHeader>
						<CardTitle>Standings</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Division Rank</span>
								<span className="font-medium">
									{current.divisionRank ? `${current.divisionRank}${getOrdinalSuffix(current.divisionRank)}` : '—'}
									{current.gamesBack && current.gamesBack !== '-' && (
										<span className="text-muted-foreground ml-2 text-sm">
											({current.gamesBack} GB)
										</span>
									)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">League Rank</span>
								<span className="font-medium">
									{current.leagueRank ? `${current.leagueRank}${getOrdinalSuffix(current.leagueRank)}` : '—'}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Wild Card</span>
								<span className="font-medium">
									{current.wildCardRank ? `${current.wildCardRank}${getOrdinalSuffix(current.wildCardRank)}` : '—'}
									{current.wildCardGamesBack && current.wildCardGamesBack !== '-' && (
										<span className="text-muted-foreground ml-2 text-sm">
											({current.wildCardGamesBack} GB)
										</span>
									)}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Actual Wins Chart */}
			<Card>
				<CardHeader>
					<CardTitle>Win Accumulation</CardTitle>
					<CardDescription>
						Actual wins over the season
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-[250px] w-full">
						<ChartContainer className="h-full w-full" config={chartConfig}>
							<LineChart data={chartData} margin={{ bottom: 5, left: 0, right: 10, top: 5 }}>
								<CartesianGrid className="stroke-border" strokeDasharray="3 3" />
								<XAxis
									axisLine={false}
									dataKey="date"
									tickFormatter={(value) => {
										const date = new Date(String(value));
										return `${date.getMonth() + 1}/${date.getDate()}`;
									}}
									tickLine={false}
									tickMargin={8}
								/>
								<YAxis
									axisLine={false}
									domain={[0, 'auto']}
									tickLine={false}
									tickMargin={8}
								/>
								<ChartTooltip
									content={
										<ChartTooltipContent
											labelFormatter={(value) => {
												const date = new Date(String(value));
												return date.toLocaleDateString('en-US', {
													day: 'numeric',
													month: 'short',
													year: 'numeric',
												});
											}}
										/>
									}
								/>
								<Line
									connectNulls
									dataKey="wins"
									dot={false}
									stroke={chartConfig.wins.color}
									strokeWidth={2}
									type="monotone"
								/>
							</LineChart>
						</ChartContainer>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function getOrdinalSuffix(n: number): string {
	const s = ['th', 'st', 'nd', 'rd'];
	const v = n % 100;
	return s[(v - 20) % 10] || s[v] || s[0];
}
