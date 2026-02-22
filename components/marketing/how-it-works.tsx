import { Lock, Target, Trophy, Users } from 'lucide-react';

const steps = [
	{
		description: 'Invite your friends and set up your group for the season.',
		icon: Users,
		title: 'Create a league',
	},
	{
		description: "Predict over/under on each team's season win total vs the Vegas line.",
		icon: Target,
		title: 'Make your picks',
	},
	{
		description: 'Once the season starts, picks are locked. No second-guessing allowed.',
		icon: Lock,
		title: 'Lock them in',
	},
	{
		description: 'Follow live leaderboards, dig into team stats, and see who called it best by season\u2019s end.',
		icon: Trophy,
		title: 'Crown a winner',
	},
];

const HowItWorks = () => {
	return (
		<section className="bg-muted/30 py-16 sm:py-24" id="how-it-works">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				{/* Section header */}
				<div className="mx-auto max-w-2xl text-center">
					<h2 className="text-foreground font-serif text-3xl font-medium tracking-tight sm:text-4xl">
						How it works
					</h2>
					<p className="text-muted-foreground mt-4 text-lg leading-relaxed">
						Four simple steps from draft day to bragging rights.
					</p>
				</div>

				{/* Steps */}
				<div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
					{steps.map((step, index) => (
						<div className="group relative" key={step.title}>
							{/* Connector line (hidden on mobile and last item) */}
							{index < steps.length - 1 && (
								<div className="bg-border absolute top-10 left-1/2 hidden h-0.5 w-full lg:block" />
							)}

							<div className="relative flex flex-col items-center text-center">
								{/* Step number + icon */}
								<div className="relative">
									<div className="bg-card ring-border/50 group-hover:ring-primary/20 flex h-20 w-20 items-center justify-center rounded-2xl shadow-sm ring-1 transition-all group-hover:shadow-md">
										<step.icon className="text-primary h-8 w-8 transition-transform group-hover:scale-110" />
									</div>
									<span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
										{index + 1}
									</span>
								</div>

								{/* Content */}
								<h3 className="text-foreground mt-6 text-lg font-semibold">{step.title}</h3>
								<p className="text-muted-foreground mt-2 text-sm leading-relaxed">
									{step.description}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export default HowItWorks;
