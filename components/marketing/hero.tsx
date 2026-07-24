import { RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { ArrowRight, Check, LockKeyhole, Sparkles } from 'lucide-react';

import LeaderboardMockup from '@/components/leaderboard-mockup';
import { Button } from '@/components/ui/button';

const Hero = () => {
	return (
		<section className="night-panel relative isolate overflow-hidden border-b border-white/10">
			<div
				aria-hidden="true"
				className="absolute inset-0 -z-10 opacity-30"
				style={{
					backgroundImage:
						'linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)',
					backgroundSize: '100% 42px,42px 100%',
				}}
			/>
			<div
				aria-hidden="true"
				className="absolute -right-32 -bottom-52 -z-10 h-[620px] w-[620px] rounded-full border border-white/10"
			/>
			<div className="mx-auto grid min-h-[calc(100svh-69px)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
				<div className="relative z-10">
					<div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-bold tracking-wide text-white/80">
						<Sparkles className="h-3.5 w-3.5 text-[#f2b84b]" />
						Opening Day starts right here
					</div>
					<h1 className="display-type max-w-3xl text-[clamp(3.6rem,12vw,7rem)] text-white">
						Call your shot.
						<span className="block text-[#f2b84b]">Live with the crumbs.</span>
					</h1>
					<p className="mt-7 max-w-xl text-lg leading-8 text-white/67 sm:text-xl">
						Pick every MLB win total before first pitch. Lock the card. Follow every score, swing,
						and friend you pass all summer.
					</p>
					<div className="mt-8 flex flex-col gap-3 sm:flex-row">
						<Button asChild className="h-14 px-6 text-base" size="lg">
							<RegisterLink postLoginRedirectURL="/dashboard">
								Start your league
								<ArrowRight className="h-4 w-4" />
							</RegisterLink>
						</Button>
						<a
							className="flex h-14 items-center justify-center rounded-xl border border-white/18 px-6 text-sm font-bold text-white transition-colors hover:bg-white/8"
							href="#how-it-works">
							See how it plays
						</a>
					</div>
					<ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-white/55">
						<li className="flex items-center gap-2">
							<Check className="h-4 w-4 text-[#50c7a2]" />
							Free to play
						</li>
						<li className="flex items-center gap-2">
							<LockKeyhole className="h-4 w-4 text-[#f2b84b]" />
							No real-money wagering
						</li>
					</ul>
				</div>
				<div className="relative flex justify-center lg:justify-end">
					<LeaderboardMockup />
				</div>
			</div>
		</section>
	);
};

export default Hero;
