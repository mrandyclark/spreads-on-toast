interface PageHeaderProps {
	actions?: React.ReactNode;
	children?: React.ReactNode;
	subtitle?: React.ReactNode;
	title: string;
}

const PageHeader = ({ actions, children, subtitle, title }: PageHeaderProps) => {
	return (
		<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 className="text-foreground text-2xl font-bold sm:text-3xl">{title}</h1>
				{subtitle && (
					<p className="text-muted-foreground mt-1">{subtitle}</p>
				)}
			</div>

			{actions}
			{children}
		</div>
	);
}

export default PageHeader;
