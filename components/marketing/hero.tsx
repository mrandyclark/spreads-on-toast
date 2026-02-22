import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';

import LeaderboardMockup from '@/components/leaderboard-mockup';
import { Button } from '@/components/ui/button';

const Hero = () => {
	return (
		<section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
			{/* Subtle background pattern */}
			<div className="absolute inset-0 -z-10 overflow-hidden">
				<div className="bg-accent/20 absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full blur-3xl" />
			</div>

			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
					{/* Content */}
					<div className="text-center lg:text-left">
						<h1 className="text-foreground font-serif text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-6xl">
							Lock your preseason spreads. <span className="text-primary">Watch them toast.</span>
						</h1>
						<p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty lg:mx-0">
							Pick season win totals vs the line, lock them in, and see who comes out on top by
							season{"'"}s end.
						</p>
						<div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
							<Button
								asChild
								className="w-full shadow-md transition-all hover:shadow-lg sm:w-auto"
								size="lg">
								<RegisterLink postLoginRedirectURL="/dashboard">Create a league</RegisterLink>
							</Button>
							<Button
								asChild
								className="w-full bg-transparent sm:w-auto"
								size="lg"
								variant="outline">
								<LoginLink postLoginRedirectURL="/dashboard">Join a league</LoginLink>
							</Button>
						</div>
					</div>

					{/* Hero Visual */}
					<div className="flex justify-center lg:justify-end">
						<LeaderboardMockup />
					</div>
				</div>
			</div>
		</section>
	);
}

export default Hero;
