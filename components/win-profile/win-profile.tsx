'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WinProfileData } from '@/types';

import ContributionBar from './contribution-bar';
import SituationalBar from './situational-bar';

interface WinProfileProps {
	conference: string;
	data: WinProfileData;
}

const WinProfile = ({ conference, data }: WinProfileProps) => {
	const isNationalLeague = conference === 'NL' || conference === 'National League';
	return (
		<Card>
			<CardHeader className="pb-4">
				<CardTitle>Win Profile</CardTitle>
				<CardDescription>How this team performs across different game types</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-6 md:grid-cols-2">
					{/* Situational Performance */}
					<div className="space-y-4">
						{data.situational.map((record) => (
							<SituationalBar
								isNationalLeague={isNationalLeague}
								key={record.label}
								label={record.label}
								pct={record.pct}
								record={`.${(record.pct * 1000).toFixed(0).padStart(3, '0')}`}
							/>
						))}
					</div>

					{/* Offense vs Pitching Split */}
					<div className="flex flex-col justify-center">
						<ContributionBar
							offense={data.offenseContribution}
							pitching={data.pitchingContribution}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default WinProfile;
