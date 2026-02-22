import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
	{
		answer:
			"Nope! spreadsontoast is purely for bragging rights. There's no real money involved—just friendly competition among friends.",
		question: 'Is this real-money betting?',
	},
	{
		answer:
			"We currently support MLB with live standings, scores, and win totals updated daily throughout the season. More sports are on the way.",
		question: 'What sports do you support?',
	},
	{
		answer:
			"It's simple: for each team, you pick over or under on their season win total. At the end of the season, whoever has the most correct picks wins. Ties go to whoever was closest on the margin.",
		question: 'How does scoring work?',
	},
	{
		answer:
			"No way! That's the whole point. Picks lock when the season starts, so you have to commit to your preseason predictions. No second-guessing allowed.",
		question: 'Can I change my picks mid-season?',
	},
	{
		answer:
			"Yes! spreadsontoast is free to use. We may introduce optional premium features down the road, but the core experience will always be free.",
		question: 'Is it free?',
	},
];

const FAQ = () => {
	return (
		<section className="py-16 sm:py-24" id="faq">
			<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
				{/* Section header */}
				<div className="text-center">
					<h2 className="text-foreground font-serif text-3xl font-medium tracking-tight sm:text-4xl">
						Questions? We{"'"}ve got answers.
					</h2>
					<p className="text-muted-foreground mt-4 text-lg leading-relaxed">
						Everything you need to know about spreadsontoast.
					</p>
				</div>

				{/* FAQ accordion */}
				<Accordion className="mt-12" collapsible type="single">
					{faqs.map((faq, index) => (
						<AccordionItem
							className="border-border/50 data-[state=open]:bg-muted/30"
							key={index}
							value={`item-${index}`}>
							<AccordionTrigger className="hover:text-primary px-4 text-left text-base font-medium hover:no-underline">
								{faq.question}
							</AccordionTrigger>
							<AccordionContent className="text-muted-foreground px-4 pb-4">
								{faq.answer}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</section>
	);
}

export default FAQ;
