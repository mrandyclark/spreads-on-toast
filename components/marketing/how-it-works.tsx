import { CalendarDays, LockKeyhole, Trophy } from 'lucide-react';

const moments = [
	{
		description:
			'Make all 30 calls against the preseason line. Big team identity, clear progress, zero spreadsheet energy.',
		eyebrow: '01 · Preseason',
		icon: LockKeyhole,
		stat: '30 teams. One card.',
		title: 'Draft Day',
	},
	{
		description:
			'Open the app and know what is live, who is pitching, and which results are moving your picks.',
		eyebrow: '02 · Every day',
		icon: CalendarDays,
		stat: '162 games of proof.',
		title: 'Daily Baseball',
	},
	{
		description:
			'See the table move, inspect every card, and turn a long season into a league-sized rivalry.',
		eyebrow: '03 · All season',
		icon: Trophy,
		stat: 'Bragging rights, earned.',
		title: 'League Competition',
	},
];

const HowItWorks = () => {
	return (
		<section className="bg-background py-20 sm:py-28" id="how-it-works">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
					<div>
						<p className="text-primary eyebrow">A whole season in your pocket</p>
						<h2 className="display-type mt-3 max-w-md text-5xl sm:text-6xl">
							Three moments. One obsession.
						</h2>
					</div>
					<p className="text-muted-foreground max-w-2xl text-lg leading-8 lg:justify-self-end">
						Most prediction games disappear after the draft. Spreads gets better once the first
						pitch is thrown.
					</p>
				</div>

				<div className="mt-12 grid gap-4 lg:grid-cols-3">
					{moments.map((moment, index) => (
						<article
							className="group bg-card hover:border-foreground/25 relative overflow-hidden rounded-[1.5rem] border p-6 transition-all duration-300 hover:-translate-y-1 sm:p-8"
							key={moment.title}>
							<div
								aria-hidden="true"
								className="text-foreground/[.035] display-type absolute -right-3 -bottom-8 text-[9rem]">
								{index + 1}
							</div>
							<div className="bg-foreground text-background flex h-12 w-12 items-center justify-center rounded-2xl">
								<moment.icon className="h-5 w-5" />
							</div>
							<p className="text-primary eyebrow mt-8">{moment.eyebrow}</p>
							<h3 className="mt-2 text-2xl font-black tracking-[-.035em]">{moment.title}</h3>
							<p className="text-muted-foreground mt-4 min-h-24 leading-7">{moment.description}</p>
							<p className="mt-8 border-t pt-4 text-sm font-extrabold">{moment.stat}</p>
						</article>
					))}
				</div>
			</div>
		</section>
	);
};

export default HowItWorks;
