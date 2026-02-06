import { Check, TrendingUp, Trophy } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

const leaderboardData = [
	{ correct: 18, initials: 'MT', name: 'Marcus T.', rank: 1, total: 24, trend: 'up' },
	{ correct: 16, initials: 'SK', name: 'Sarah K.', rank: 2, total: 24, trend: 'up' },
	{ correct: 15, initials: 'JW', name: 'Jake W.', rank: 3, total: 24, trend: 'same' },
	{ correct: 14, initials: 'YO', isUser: true, name: 'You', rank: 4, total: 24, trend: 'down' },
];

export function LeaderboardMockup() {
	return (
		<div className="relative">
			{/* Phone frame */}
			<div className="relative mx-auto w-[280px] sm:w-[320px]">
				{/* Phone bezel */}
				<div className="border-foreground/10 bg-card rounded-[2.5rem] border-4 p-2 shadow-2xl">
					{/* Screen */}
					<div className="bg-background overflow-hidden rounded-[2rem]">
						{/* Status bar mockup */}
						<div className="bg-muted/50 flex h-6 items-center justify-center">
							<div className="bg-foreground/10 h-4 w-20 rounded-full" />
						</div>

						{/* App content */}
						<div className="p-4">
							{/* League header */}
							<div className="mb-4 text-center">
								<p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
									NFL 2025
								</p>
								<h3 className="text-foreground font-serif text-lg font-medium">
									The Toast Masters
								</h3>
							</div>

							{/* Leaderboard */}
							<Card className="border-border/50 bg-card overflow-hidden shadow-sm">
								<div className="border-border/50 bg-muted/30 border-b px-3 py-2">
									<div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
										<Trophy className="text-primary h-3.5 w-3.5" />
										<span>Standings</span>
									</div>
								</div>
								<div className="divide-border/50 divide-y">
									{leaderboardData.map((player) => (
										<div
											className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
												player.isUser ? 'bg-primary/5' : ''
											}`}
											key={player.rank}>
											{/* Rank */}
											<span
												className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
													player.rank === 1
														? 'bg-primary text-primary-foreground'
														: 'bg-muted text-muted-foreground'
												}`}>
												{player.rank}
											</span>

											{/* Avatar */}
											<Avatar className="border-border/50 h-8 w-8 border">
												<AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
													{player.initials}
												</AvatarFallback>
											</Avatar>

											{/* Name */}
											<span
												className={`flex-1 text-sm font-medium ${player.isUser ? 'text-primary' : 'text-foreground'}`}>
												{player.name}
											</span>

											{/* Score */}
											<div className="flex items-center gap-1.5">
												<div className="flex items-center gap-0.5 text-xs">
													<Check className="text-primary h-3 w-3" />
													<span className="text-foreground font-semibold">{player.correct}</span>
													<span className="text-muted-foreground">/{player.total}</span>
												</div>
												{player.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
											</div>
										</div>
									))}
								</div>
							</Card>

							{/* Bottom indicator */}
							<div className="mt-4 flex justify-center">
								<div className="bg-foreground/10 h-1 w-24 rounded-full" />
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Decorative elements */}
			<div className="bg-accent/30 absolute -top-4 -right-4 h-24 w-24 rounded-full blur-2xl" />
			<div className="bg-primary/10 absolute -bottom-4 -left-4 h-32 w-32 rounded-full blur-2xl" />
		</div>
	);
}
