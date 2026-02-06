'use client';

import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
	/** Max date string in YYYY-MM-DD format */
	maxDate?: string;
	/** Min date string in YYYY-MM-DD format */
	minDate?: string;
	onChange?: (value: string | undefined) => void;
	placeholder?: string;
	/** Date string in YYYY-MM-DD format */
	value?: string;
}

// Parse YYYY-MM-DD to { year, month, day } without timezone issues
function parseYMD(dateStr: string): { year: number; month: number; day: number } {
	if (!dateStr || typeof dateStr !== 'string') {
		// Fallback to today
		const now = new Date();
		return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() };
	}

	// Handle case where dateStr might be an ISO string or Date toString
	if (dateStr.includes('T')) {
		dateStr = dateStr.split('T')[0];
	}

	const parts = dateStr.split('-');
	const year = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10);
	const day = parseInt(parts[2], 10);
	return {
		day: isNaN(day) ? 1 : day,
		month: isNaN(month) ? 1 : month,
		year: isNaN(year) ? new Date().getFullYear() : year,
	};
}

// Format { year, month, day } to YYYY-MM-DD
function formatYMD(year: number, month: number, day: number): string {
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Format for display: "September 3rd, 2025"
function formatDisplay(dateStr: string): string {
	const { day, month, year } = parseYMD(dateStr);
	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];

	if (isNaN(day) || isNaN(month) || isNaN(year)) {
		return 'Invalid date';
	}

	const suffix =
		day === 1 || day === 21 || day === 31
			? 'st'
			: day === 2 || day === 22
				? 'nd'
				: day === 3 || day === 23
					? 'rd'
					: 'th';
	return `${monthNames[month - 1]} ${day}${suffix}, ${year}`;
}

// Get days in month
function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

// Get day of week for first day of month (0 = Sunday)
function getFirstDayOfWeek(year: number, month: number): number {
	return new Date(year, month - 1, 1).getDay();
}

// Compare date strings
function compareDates(a: string, b: string): number {
	return a.localeCompare(b);
}

export function DatePicker({
	maxDate,
	minDate,
	onChange,
	placeholder = 'Pick a date',
	value,
}: DatePickerProps) {
	const [open, setOpen] = useState(false);

	// Current view month/year
	const initialDate = value
		? parseYMD(value)
		: maxDate
			? parseYMD(maxDate)
			: { day: 1, month: new Date().getMonth() + 1, year: new Date().getFullYear() };
	const [viewYear, setViewYear] = useState(initialDate.year);
	const [viewMonth, setViewMonth] = useState(initialDate.month);

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];
	const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

	const daysInMonth = getDaysInMonth(viewYear, viewMonth);
	const firstDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth);

	const prevMonth = () => {
		if (viewMonth === 1) {
			setViewMonth(12);
			setViewYear(viewYear - 1);
		} else {
			setViewMonth(viewMonth - 1);
		}
	};

	const nextMonth = () => {
		if (viewMonth === 12) {
			setViewMonth(1);
			setViewYear(viewYear + 1);
		} else {
			setViewMonth(viewMonth + 1);
		}
	};

	const selectDate = (day: number) => {
		const dateStr = formatYMD(viewYear, viewMonth, day);
		onChange?.(dateStr);
		setOpen(false);
	};

	const isDisabled = (day: number): boolean => {
		const dateStr = formatYMD(viewYear, viewMonth, day);

		if (minDate && compareDates(dateStr, minDate) < 0) {
			return true;
		}

		if (maxDate && compareDates(dateStr, maxDate) > 0) {
			return true;
		}
		return false;
	};

	const isSelected = (day: number): boolean => {
		if (!value) {
			return false;
		}

		const dateStr = formatYMD(viewYear, viewMonth, day);
		return dateStr === value;
	};

	// Reset view to selected date when opening
	React.useEffect(() => {
		if (open && value) {
			const { month, year } = parseYMD(value);
			setViewYear(year);
			setViewMonth(month);
		}
	}, [open, value]);

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					className={cn('justify-start text-left font-normal', !value && 'text-muted-foreground')}
					variant="ghost">
					<CalendarIcon className="mr-2 h-4 w-4" />
					{value ? formatDisplay(value) : <span>{placeholder}</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-auto p-3">
				{/* Header with month/year and nav */}
				<div className="mb-2 flex items-center justify-between">
					<Button
						className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
						onClick={prevMonth}
						variant="ghost">
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<span className="text-sm font-medium">
						{monthNames[viewMonth - 1]} {viewYear}
					</span>
					<Button
						className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
						onClick={nextMonth}
						variant="ghost">
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>

				{/* Day names header */}
				<div className="mb-1 grid grid-cols-7 gap-1">
					{dayNames.map((day) => (
						<div
							className="text-muted-foreground flex h-8 w-8 items-center justify-center text-center text-xs"
							key={day}>
							{day}
						</div>
					))}
				</div>

				{/* Calendar grid */}
				<div className="grid grid-cols-7 gap-1">
					{/* Empty cells for days before first of month */}
					{Array.from({ length: firstDayOfWeek }).map((_, i) => (
						<div className="h-8 w-8" key={`empty-${i}`} />
					))}

					{/* Day cells */}
					{Array.from({ length: daysInMonth }).map((_, i) => {
						const day = i + 1;
						const disabled = isDisabled(day);
						const selected = isSelected(day);

						return (
							<Button
								className={cn(
									'h-8 w-8 p-0 font-normal',
									selected &&
										'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
									disabled && 'text-muted-foreground pointer-events-none opacity-50',
								)}
								disabled={disabled}
								key={day}
								onClick={() => selectDate(day)}
								variant="ghost">
								{day}
							</Button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}
