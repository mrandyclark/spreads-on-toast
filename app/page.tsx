import SiteHeader from '@/components/layout/site-header';
import FAQ from '@/components/marketing/faq';
import Features from '@/components/marketing/features';
import Footer from '@/components/marketing/footer';
import Hero from '@/components/marketing/hero';
import HowItWorks from '@/components/marketing/how-it-works';
import SupportedLeagues from '@/components/marketing/supported-leagues';

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
