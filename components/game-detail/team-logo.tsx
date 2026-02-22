interface TeamLogoProps {
	abbreviation: string;
	colors?: { primary: string; secondary: string };
}

const TeamLogo = ({ abbreviation, colors }: TeamLogoProps) => {
	return (
		<div
			className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold shadow-sm sm:h-20 sm:w-20 sm:text-2xl"
			style={{
				backgroundColor: colors?.primary ?? '#6b7280',
				color: colors?.secondary ?? '#ffffff',
			}}>
			{abbreviation}
		</div>
	);
};

export default TeamLogo;
