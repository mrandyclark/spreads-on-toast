import { FAQ, Features, Footer, Header, Hero, HowItWorks, SupportedLeagues } from '@/components/marketing';

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
