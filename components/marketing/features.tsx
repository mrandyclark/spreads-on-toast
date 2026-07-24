import { BellRing, ChartNoAxesCombined, Flame, Smartphone } from 'lucide-react';

const features = [
	{
		description:
			'Install it to your home screen. Fast launches, safe areas, and controls built for thumbs.',
		icon: Smartphone,
		title: 'Feels at home on your phone',
	},
	{
		description:
			'The slate leads with game state, score, teams, and pitchers—not rows of database fields.',
		icon: BellRing,
		title: 'Live means live',
	},
	{
		description:
			'Track projected wins against the exact line you called before the season started.',
		icon: ChartNoAxesCombined,
		title: 'Every call stays visible',
	},
	{
		description:
			'Movement, close calls, and misses turn a standings table into a season-long group chat.',
		icon: Flame,
		title: 'Competition with a pulse',
	},
];

const Features = () => {
	return (
		<section className="night-panel py-20 sm:py-28">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="max-w-3xl">
					<p className="eyebrow text-[#f2b84b]">Built for the long season</p>
					<h2 className="display-type mt-3 text-5xl text-white sm:text-6xl">
						Baseball at the speed of a glance.
					</h2>
				</div>
				<div className="mt-12 grid gap-px overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
					{features.map((feature) => (
						<article className="bg-[#0b1924] p-6 sm:p-8" key={feature.title}>
							<feature.icon className="h-6 w-6 text-[#f2b84b]" />
							<h3 className="mt-8 text-xl font-black tracking-[-.025em] text-white">
								{feature.title}
							</h3>
							<p className="mt-3 text-sm leading-6 text-white/55">{feature.description}</p>
						</article>
					))}
				</div>
			</div>
		</section>
	);
};

export default Features;
