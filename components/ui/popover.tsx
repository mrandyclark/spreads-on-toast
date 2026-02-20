'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
	React.ElementRef<typeof PopoverPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ align = 'center', className, sideOffset = 4, ...props }, ref) => (
	<PopoverPrimitive.Portal>
		<PopoverPrimitive.Content
			align={align}
			className={cn(
				'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 rounded-md border p-4 shadow-md outline-none',
				className,
			)}
			ref={ref}
			sideOffset={sideOffset}
			{...props}
		/>
	</PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

/**
 * A Popover wrapper that automatically closes when the user scrolls.
 * Drop-in replacement for <Popover> — accepts children with PopoverTrigger/PopoverContent.
 */
function ScrollDismissPopover({ children, ...props }: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>) {
	const [open, setOpen] = React.useState(false);

	const handleScroll = React.useCallback(() => {
		setOpen(false);
	}, []);

	React.useEffect(() => {
		if (!open) {
			return;
		}

		window.addEventListener('scroll', handleScroll, { capture: true, passive: true });

		return () => {
			window.removeEventListener('scroll', handleScroll, { capture: true });
		};
	}, [open, handleScroll]);

	return (
		<PopoverPrimitive.Root onOpenChange={setOpen} open={open} {...props}>
			{children}
		</PopoverPrimitive.Root>
	);
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger, ScrollDismissPopover };
