import { SiteHeader } from '@/components/layout/site-header';
import { FAQ, Features, Footer, Hero, HowItWorks, SupportedLeagues } from '@/components/marketing';

export default function Home() {
	return (
		<main className="bg-background min-h-screen">
			<SiteHeader variant="marketing" />
			<Hero />
			<HowItWorks />
			<SupportedLeagues />
			<Features />
			<FAQ />
			<Footer />
		</main>
	);
}
