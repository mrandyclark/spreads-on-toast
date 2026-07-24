interface PageHeaderProps {
	actions?: React.ReactNode;
	children?: React.ReactNode;
	subtitle?: React.ReactNode;
	title: string;
}

const PageHeader = ({ actions, children, subtitle, title }: PageHeaderProps) => {
	return (
		<div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p className="text-primary eyebrow mb-2">Your season</p>
				<h1 className="display-type text-foreground text-4xl sm:text-5xl">{title}</h1>
				{subtitle && (
					<p className="text-muted-foreground mt-2 max-w-xl text-sm sm:text-base">{subtitle}</p>
				)}
			</div>

			{actions}
			{children}
		</div>
	);
};

export default PageHeader;
