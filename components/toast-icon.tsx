interface ToastIconProps {
	className?: string;
}

const ToastIcon = ({ className }: ToastIconProps) => {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="none"
			viewBox="0 0 32 32"
			xmlns="http://www.w3.org/2000/svg">
			{/* Toast slice */}
			<rect
				className="fill-secondary stroke-foreground"
				height="22"
				rx="4"
				strokeWidth="2"
				width="24"
				x="4"
				y="6"
			/>
			{/* Crust top */}
			<path
				className="fill-accent"
				d="M6 10C6 7.79086 7.79086 6 10 6H22C24.2091 6 26 7.79086 26 10V12H6V10Z"
			/>
			{/* Toast marks */}
			<rect className="fill-muted-foreground/30" height="2" rx="1" width="12" x="10" y="16" />
			<rect className="fill-muted-foreground/30" height="2" rx="1" width="8" x="12" y="21" />
		</svg>
	);
}

export default ToastIcon;
