import {
    endOfMonth,
    endOfWeek,
    endOfYear,
    format,
    isSameDay,
    startOfMonth,
    startOfWeek,
    startOfYear,
} from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export type DateRangeQuickFilter = 'custom' | 'monthly' | 'weekly' | 'yearly';

const quickFilterOptions: {
    label: string;
    value: DateRangeQuickFilter;
}[] = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
    { label: 'Custom', value: 'custom' },
];

export function parseDateForRange(value: string) {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
}

export function formatDateForRangeQuery(date: Date) {
    return format(date, 'yyyy-MM-dd');
}

export function getThisMonthDateRange(): DateRange {
    const today = new Date();

    return {
        from: startOfMonth(today),
        to: endOfMonth(today),
    };
}

export function getQuickFilterDateRange(
    quickFilter: Exclude<DateRangeQuickFilter, 'custom'>,
): DateRange {
    const today = new Date();

    if (quickFilter === 'weekly') {
        return {
            from: startOfWeek(today, { weekStartsOn: 1 }),
            to: endOfWeek(today, { weekStartsOn: 1 }),
        };
    }

    if (quickFilter === 'yearly') {
        return {
            from: startOfYear(today),
            to: endOfYear(today),
        };
    }

    return getThisMonthDateRange();
}

export function getMatchingQuickFilter(
    dateRange: DateRange | undefined,
): DateRangeQuickFilter {
    if (!dateRange?.from || !dateRange.to) {
        return 'custom';
    }

    for (const quickFilter of ['weekly', 'monthly', 'yearly'] as const) {
        const quickFilterDateRange = getQuickFilterDateRange(quickFilter);

        if (!quickFilterDateRange.from || !quickFilterDateRange.to) {
            continue;
        }

        if (
            isSameDay(dateRange.from, quickFilterDateRange.from) &&
            isSameDay(dateRange.to, quickFilterDateRange.to)
        ) {
            return quickFilter;
        }
    }

    return 'custom';
}

export function getDateRangeLabel(
    dateRange: DateRange | undefined,
    placeholder = 'Select date range',
) {
    if (dateRange?.from && dateRange.to) {
        return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(
            dateRange.to,
            'MMM d, yyyy',
        )}`;
    }

    if (dateRange?.from) {
        return format(dateRange.from, 'MMM d, yyyy');
    }

    return placeholder;
}

export function DateRangeFilter({
    align = 'end',
    className,
    numberOfMonths = 2,
    onChange,
    placeholder = 'Select date range',
    value,
}: {
    align?: 'center' | 'end' | 'start';
    className?: string;
    numberOfMonths?: number;
    onChange: (dateRange: DateRange | undefined) => void;
    placeholder?: string;
    value: DateRange | undefined;
}) {
    const selectedQuickFilter = getMatchingQuickFilter(value);
    const updateQuickFilter = (quickFilter: string) => {
        if (!quickFilter || quickFilter === 'custom') {
            return;
        }

        onChange(
            getQuickFilterDateRange(
                quickFilter as Exclude<DateRangeQuickFilter, 'custom'>,
            ),
        );
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        'w-full justify-start gap-2 text-left font-normal sm:w-auto',
                        !value?.from && 'text-muted-foreground',
                        className,
                    )}
                >
                    <CalendarIcon className="size-4" />
                    <span className="truncate">
                        {getDateRangeLabel(value, placeholder)}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align={align} className="w-auto gap-0 p-0">
                <div className="border-b p-3">
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        size="sm"
                        spacing={0}
                        value={selectedQuickFilter}
                        onValueChange={updateQuickFilter}
                        className="grid w-full grid-cols-4"
                    >
                        {quickFilterOptions.map((option) => (
                            <ToggleGroupItem
                                key={option.value}
                                value={option.value}
                                className="w-full rounded-none first:rounded-l-md last:rounded-r-md"
                            >
                                {option.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
                <Calendar
                    mode="range"
                    defaultMonth={value?.from}
                    selected={value}
                    onSelect={onChange}
                    numberOfMonths={numberOfMonths}
                />
            </PopoverContent>
        </Popover>
    );
}
