import { Check, ChevronUp, Circle, Clock3, Lock, Trophy } from 'lucide-react';

const picks = [
	{ abbr: 'SEA', color: '#005c5c', line: '87.5', name: 'Mariners', pick: 'OVER' },
	{ abbr: 'BOS', color: '#bd3039', line: '84.5', name: 'Red Sox', pick: 'UNDER' },
	{ abbr: 'SD', color: '#2f241d', line: '91.5', name: 'Padres', pick: 'OVER' },
];

const LeaderboardMockup = () => {
	return (
		<div className="relative w-full max-w-[420px] pb-8">
			<div className="absolute top-10 -left-8 hidden w-44 -rotate-6 rounded-2xl border border-white/15 bg-white/10 p-4 text-white shadow-2xl backdrop-blur-lg sm:block">
				<div className="flex items-center gap-2 text-[10px] font-bold tracking-[.15em] text-white/55 uppercase">
					<Trophy className="h-3.5 w-3.5 text-[#f2b84b]" />
					League move
				</div>
				<div className="mt-3 flex items-center justify-between">
					<div>
						<p className="text-sm font-bold">You moved up</p>
						<p className="text-xs text-white/50">Toast Masters</p>
					</div>
					<div className="flex items-center text-lg font-black text-[#50c7a2]">
						<ChevronUp className="h-5 w-5" />2
					</div>
				</div>
			</div>

			<div className="relative ml-auto w-[min(100%,350px)] rotate-[1.5deg] rounded-[2.4rem] border border-white/18 bg-[#f6f0e3] p-2 shadow-[0_45px_100px_-35px_rgba(0,0,0,.75)]">
				<div className="overflow-hidden rounded-[1.95rem] bg-[#fffdf7] text-[#101e2a]">
					<div className="flex h-7 items-center justify-center bg-[#101e2a]">
						<div className="h-1.5 w-16 rounded-full bg-white/15" />
					</div>
					<div className="px-5 pt-5">
						<div className="flex items-start justify-between">
							<div>
								<p className="text-[10px] font-black tracking-[.16em] text-[#e6492d] uppercase">
									Draft day · 2026
								</p>
								<h3 className="mt-1 text-2xl font-black tracking-[-.04em]">Your pick card</h3>
							</div>
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#101e2a] text-white">
								<Lock className="h-4 w-4" />
							</div>
						</div>
						<div className="mt-5 flex items-end justify-between">
							<div>
								<p className="text-xs font-bold text-[#65707a]">Card complete</p>
								<p className="mt-0.5 text-sm font-black">27 of 30 picks</p>
							</div>
							<span className="text-3xl font-black tabular-nums">90%</span>
						</div>
						<div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e5ddce]">
							<div className="h-full w-[90%] rounded-full bg-[#e6492d]" />
						</div>
					</div>

					<div className="mt-5 border-y border-[#ded4c3] bg-[#f7f1e5] px-5 py-3">
						<div className="flex items-center justify-between text-xs font-bold">
							<span className="flex items-center gap-1.5 text-[#65707a]">
								<Clock3 className="h-3.5 w-3.5" />
								Picks lock
							</span>
							<span>4d 08h 21m</span>
						</div>
					</div>

					<div className="space-y-1.5 p-3">
						{picks.map((team) => (
							<div
								className="flex items-center gap-3 rounded-2xl border border-[#ded4c3] bg-white p-3"
								key={team.abbr}>
								<div
									className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white"
									style={{ backgroundColor: team.color }}>
									{team.abbr}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-extrabold">{team.name}</p>
									<p className="text-[11px] font-semibold text-[#65707a]">
										Line <span className="tabular-nums">{team.line}</span>
									</p>
								</div>
								<div className="flex items-center gap-1.5 rounded-lg bg-[#101e2a] px-2.5 py-2 text-[10px] font-black text-white">
									<Check className="h-3 w-3 text-[#50c7a2]" />
									{team.pick}
								</div>
							</div>
						))}
					</div>
					<div className="mx-5 mb-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#e6492d] text-sm font-black text-white">
						<Circle className="h-3 w-3 fill-current" />3 picks left
					</div>
				</div>
			</div>

			<div className="absolute right-1 bottom-0 rounded-xl border border-white/15 bg-[#f2b84b] px-4 py-3 text-[#101e2a] shadow-xl sm:right-[-20px]">
				<p className="text-[9px] font-black tracking-[.15em] uppercase">Opening day</p>
				<p className="mt-0.5 text-sm font-black">The card gets real.</p>
			</div>
		</div>
	);
};

export default LeaderboardMockup;
