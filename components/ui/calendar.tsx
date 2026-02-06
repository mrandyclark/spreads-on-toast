'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      className={cn('p-3', className)}
      classNames={{
        button_next: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        button_previous: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        caption_label: 'text-sm font-medium truncate',
        day: 'h-8 w-8 p-0 font-normal',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-8 w-8 p-0 font-normal aria-selected:opacity-100',
        ),
        disabled: 'text-muted-foreground opacity-50',
        hidden: 'invisible',
        month: 'space-y-4',
        month_caption: 'flex justify-center items-center h-7',
        month_grid: 'w-full border-collapse space-y-1',
        months: 'relative',
        nav: 'absolute top-0 left-0 right-0 flex justify-between z-10',
        outside:
          'day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground',
        range_end: 'day-range-end',
        range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        range_start: 'day-range-start',
        selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        today: 'bg-accent text-accent-foreground',
        week: 'flex w-full mt-2',
        weekday:
          'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
        weekdays: 'flex',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
      }}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
