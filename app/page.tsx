import { FAQ } from '@/components/faq';
import { Features } from '@/components/features';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { HowItWorks } from '@/components/how-it-works';
import { SupportedLeagues } from '@/components/supported-leagues';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
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
