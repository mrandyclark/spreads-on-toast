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
		<section className="py-16 sm:py-24" id="leagues">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<h2 className="text-foreground font-serif text-3xl font-medium tracking-tight sm:text-4xl">
						Starting with baseball
					</h2>
					<p className="text-muted-foreground mt-4 text-lg leading-relaxed">
						MLB is live with real-time standings and scores updated daily. More sports coming soon.
					</p>

					{/* League badges */}
					<div className="mt-8 flex flex-wrap justify-center gap-3">
						{leagues.map((league) => (
							<Badge
								className="hover:bg-secondary/80 cursor-default px-4 py-2 text-base font-medium transition-all hover:shadow-sm"
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
						More leagues coming soon. Have a request?{' '}
						<a className="text-primary underline-offset-4 hover:underline" href="#">
							Let us know
						</a>
					</p>
				</div>
			</div>
		</section>
	);
}

export default SupportedLeagues;
