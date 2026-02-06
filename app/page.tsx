import {
	FAQ,
	Features,
	Footer,
	Header,
	Hero,
	HowItWorks,
	SupportedLeagues,
} from '@/components/marketing';

export default function Home() {
	return (
		<main className="bg-background min-h-screen">
			<Header />
			<Hero />
			<HowItWorks />
			<SupportedLeagues />
			<Features />
			<FAQ />
			<Footer />
		</main>
	);
}
