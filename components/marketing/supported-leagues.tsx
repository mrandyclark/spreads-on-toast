import { Badge } from '@/components/ui/badge';

const leagues = [
	// { name: 'NFL', emoji: '🏈' },
	// { name: 'NBA', emoji: '🏀' },
	{ emoji: '⚾', name: 'MLB' },
	// { name: 'NHL', emoji: '🏒' },
	// { name: 'CFB', emoji: '🎓' },
];

const SupportedLeagues = () => {
	return (
		<section className="scorebook-rule py-20 sm:py-28" id="leagues">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<p className="text-primary eyebrow">One sport. All in.</p>
					<h2 className="display-type text-foreground mt-3 text-5xl sm:text-6xl">
						Built for baseball.
					</h2>
					<p className="text-muted-foreground mt-4 text-lg leading-relaxed">
						MLB is not a logo in a generic sports template. The rhythms of the season shape every
						pick, score, and league view.
					</p>

					{/* League badges */}
					<div className="mt-8 flex flex-wrap justify-center gap-3">
						{leagues.map((league) => (
							<Badge
								className="bg-foreground text-background cursor-default rounded-xl px-5 py-3 text-base font-black"
								key={league.name}
								variant="secondary">
								<span aria-hidden="true" className="mr-2">
									{league.emoji}
								</span>
								{league.name}
							</Badge>
						))}
					</div>

					<p className="text-muted-foreground mt-6 text-sm">
						Thirty clubs. One hundred sixty-two games. Zero fake parlays.
					</p>
				</div>
			</div>
		</section>
	);
};

export default SupportedLeagues;
