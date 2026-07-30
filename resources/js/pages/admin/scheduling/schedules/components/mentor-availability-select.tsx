import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';

type MentorOption = {
    available: boolean;
    conflict: {
        code: string;
        endAt: string;
        startAt: string;
        time: string;
    } | null;
    hourlyRate: string | null;
    id: string;
    level: string | null;
    name: string;
};

type MentorAvailabilitySelectProps = {
    disabledPlaceholder?: string;
    endpoint: string | null;
    onValueChange: (value: string) => void;
    value: string;
};

export function MentorAvailabilitySelect({
    disabledPlaceholder = 'Select date and time first',
    endpoint,
    onValueChange,
    value,
}: MentorAvailabilitySelectProps) {
    const [open, setOpen] = useState(false);
    const [mentors, setMentors] = useState<MentorOption[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(endpoint !== null);
    const selectedMentor = mentors.find((mentor) => mentor.id === value);

    useEffect(() => {
        if (!endpoint) {
            return;
        }

        const abortController = new AbortController();

        fetch(endpoint, {
            headers: { Accept: 'application/json' },
            signal: abortController.signal,
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Unable to load mentor availability.');
                }

                return (await response.json()) as {
                    mentors: MentorOption[];
                };
            })
            .then(({ mentors: availableMentors }) => {
                setMentors(availableMentors);
            })
            .catch((fetchError: unknown) => {
                if (
                    fetchError instanceof DOMException &&
                    fetchError.name === 'AbortError'
                ) {
                    return;
                }

                setError('Unable to load mentor availability.');
            })
            .finally(() => {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => abortController.abort();
    }, [endpoint]);

    if (!endpoint) {
        return (
            <Button
                type="button"
                variant="outline"
                disabled
                className="h-12 w-full justify-between rounded-2xl px-4 font-normal"
            >
                <span className="truncate text-muted-foreground">
                    {disabledPlaceholder}
                </span>
                <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </Button>
        );
    }

    if (loading) {
        return (
            <div className="flex h-12 items-center gap-2 rounded-2xl border px-4 text-sm text-muted-foreground">
                <Spinner />
                Loading mentors...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-12 items-center rounded-2xl border border-destructive/40 px-4 text-sm text-destructive">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="h-12 w-full justify-between rounded-2xl px-4 font-normal"
                    >
                        <span
                            className={
                                selectedMentor
                                    ? 'truncate'
                                    : 'truncate text-muted-foreground'
                            }
                        >
                            {selectedMentor?.name ?? 'Select mentor'}
                            {selectedMentor?.level
                                ? ` · ${selectedMentor.level}`
                                : ''}
                        </span>
                        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    className="w-(--radix-popover-trigger-width) p-0"
                >
                    <Command>
                        <CommandInput placeholder="Search mentor..." />
                        <CommandList>
                            <CommandEmpty>No mentor found.</CommandEmpty>
                            <CommandGroup>
                                {mentors.map((mentor) => (
                                    <CommandItem
                                        disabled={!mentor.available}
                                        key={mentor.id}
                                        value={`${mentor.name} ${mentor.level ?? ''} ${mentor.id}`}
                                        onSelect={() => {
                                            if (!mentor.available) {
                                                return;
                                            }

                                            onValueChange(mentor.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate">
                                                {mentor.name}
                                            </p>
                                            <p
                                                className={`truncate text-xs ${mentor.available ? 'text-muted-foreground' : 'text-destructive'}`}
                                            >
                                                {mentor.conflict
                                                    ? `Bentrok · ${mentor.conflict.time}`
                                                    : (mentor.level ?? '-')}
                                            </p>
                                        </div>
                                        <Check
                                            className={
                                                value === mentor.id
                                                    ? 'ml-auto size-4 opacity-100'
                                                    : 'ml-auto size-4 opacity-0'
                                            }
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {mentors.length > 0 &&
                mentors.every((mentor) => !mentor.available) && (
                    <p className="text-xs text-muted-foreground">
                        All active mentors have conflicting schedules.
                    </p>
                )}
        </div>
    );
}
