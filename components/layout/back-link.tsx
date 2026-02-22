import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface BackLinkProps {
	href: string;
	label: string;
}

const BackLink = ({ href, label }: BackLinkProps) => {
	return (
		<Link
			className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm transition-colors"
			href={href}>
			<ArrowLeft className="h-4 w-4" />
			{label}
		</Link>
	);
}

export default BackLink;
