interface ToastIconProps {
	className?: string;
}

const ToastIcon = ({ className }: ToastIconProps) => {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="none"
			viewBox="0 0 64 64"
			xmlns="http://www.w3.org/2000/svg">
			<rect className="fill-ink" height="64" rx="18" width="64" />
			<path
				className="fill-accent"
				d="M16 25.5C16 17.49 22.49 11 30.5 11H33.5C41.51 11 48 17.49 48 25.5V46C48 50.42 44.42 54 40 54H24C19.58 54 16 50.42 16 46V25.5Z"
			/>
			<path
				className="fill-[#fff5d8]"
				d="M20 25.5C20 19.7 24.7 15 30.5 15H33.5C39.3 15 44 19.7 44 25.5V45.5C44 48 42 50 39.5 50H24.5C22 50 20 48 20 45.5V25.5Z"
			/>
			<path className="fill-primary" d="M23 34.5L32 47L41 34.5H23Z" />
			<path
				className="stroke-primary"
				d="M25 27.5C29.5 24.5 34.5 24.5 39 27.5"
				strokeLinecap="round"
				strokeWidth="2.5"
			/>
			<path
				className="stroke-primary"
				d="M27 24L25 20.5M32 22.5V18.5M37 24L39 20.5"
				strokeLinecap="round"
				strokeWidth="2"
			/>
		</svg>
	);
};

export default ToastIcon;
