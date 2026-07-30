import { CalendarIcon, Clock3 } from 'lucide-react';
import { useState } from 'react';
import type { WheelEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

function dateFromInput(value: string) {
    if (!value) {
        return undefined;
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return undefined;
    }

    return new Date(year, month - 1, day);
}

function dateToInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string) {
    const date = dateFromInput(value);

    if (!date) {
        return 'Select date';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

const scheduleHours = Array.from({ length: 24 }, (_, index) =>
    String(index).padStart(2, '0'),
);
const scheduleMinutes = Array.from({ length: 12 }, (_, index) =>
    String(index * 5).padStart(2, '0'),
);

function scrollTimeColumn(event: WheelEvent<HTMLDivElement>) {
    const target = event.currentTarget;

    if (target.scrollHeight <= target.clientHeight) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    target.scrollTop += event.deltaY;
}

export function ScheduleDatePicker({
    onValueChange,
    value,
}: {
    onValueChange: (value: string) => void;
    value: string;
}) {
    const [open, setOpen] = useState(false);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full justify-between rounded-xl px-3 font-normal"
                >
                    <span
                        className={
                            value ? 'truncate' : 'truncate text-muted-foreground'
                        }
                    >
                        {formatDateLabel(value)}
                    </span>
                    <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={dateFromInput(value)}
                    onSelect={(date) => {
                        if (!date) {
                            return;
                        }

                        onValueChange(dateToInput(date));
                        setOpen(false);
                    }}
                    disabled={{ before: today }}
                />
            </PopoverContent>
        </Popover>
    );
}

export function ScheduleTimePicker({
    onValueChange,
    value,
}: {
    onValueChange: (value: string) => void;
    value: string;
}) {
    const [open, setOpen] = useState(false);
    const [selectedHour = '', selectedMinute = ''] = value.split(':');

    const chooseHour = (hour: string) => {
        onValueChange(`${hour}:${selectedMinute || '00'}`);
    };

    const chooseMinute = (minute: string) => {
        onValueChange(`${selectedHour || '09'}:${minute}`);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full justify-between rounded-xl px-3 font-normal"
                >
                    <span
                        className={
                            value ? 'truncate' : 'truncate text-muted-foreground'
                        }
                    >
                        {value || 'Select time'}
                    </span>
                    <Clock3 className="size-4 shrink-0 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 p-3">
                <div className="grid grid-cols-2 gap-2">
                    {[
                        ['Hour', scheduleHours, selectedHour, chooseHour],
                        ['Minute', scheduleMinutes, selectedMinute, chooseMinute],
                    ].map(([label, options, selected, choose]) => (
                        <div key={label as string} className="min-w-0">
                            <p className="px-1 pb-2 text-center text-xs font-medium text-muted-foreground">
                                {label as string}
                            </p>
                            <div
                                className="h-52 overflow-y-auto overscroll-contain pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                onWheel={scrollTimeColumn}
                            >
                                <div className="grid gap-1">
                                    {(options as string[]).map((option) => (
                                        <Button
                                            key={option}
                                            type="button"
                                            size="sm"
                                            variant={
                                                selected === option
                                                    ? 'default'
                                                    : 'ghost'
                                            }
                                            className="h-8 rounded-lg"
                                            onClick={() =>
                                                (choose as (value: string) => void)(
                                                    option,
                                                )
                                            }
                                        >
                                            {option}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
