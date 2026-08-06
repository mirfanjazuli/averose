import { router } from '@inertiajs/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useBrowserTimezone } from '@/hooks/use-user-timezone';
import { cn } from '@/lib/utils';

type TimezoneOption = {
    label: string;
    value: string;
};

type TimezonePreferenceFormProps = {
    mode: 'auto' | 'manual';
    timezone: string;
    timezones: TimezoneOption[];
};

export function TimezonePreferenceForm({
    mode,
    timezone,
    timezones,
}: TimezonePreferenceFormProps) {
    const browserTimezone = useBrowserTimezone();
    const [automatic, setAutomatic] = useState(mode === 'auto');
    const [selectedTimezone, setSelectedTimezone] = useState(timezone);
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const save = (nextMode: 'auto' | 'manual', nextTimezone: string) => {
        router.patch(
            '/settings/timezone',
            { mode: nextMode, timezone: nextTimezone },
            {
                onFinish: () => setProcessing(false),
                onError: () => {
                    setAutomatic(mode === 'auto');
                    setSelectedTimezone(timezone);
                },
                onStart: () => setProcessing(true),
                preserveScroll: true,
            },
        );
    };

    const toggleAutomatic = (checked: boolean) => {
        const nextTimezone = checked
            ? browserTimezone || selectedTimezone
            : selectedTimezone;

        setAutomatic(checked);
        setSelectedTimezone(nextTimezone);
        save(checked ? 'auto' : 'manual', nextTimezone);
    };

    const selectTimezone = (value: string) => {
        setSelectedTimezone(value);
        setOpen(false);
        save('manual', value);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                    <Label htmlFor="automatic-timezone">Set automatically</Label>
                    <p className="text-sm text-muted-foreground">
                        Use the time zone detected by this device.
                    </p>
                </div>
                <Switch
                    id="automatic-timezone"
                    checked={automatic}
                    disabled={processing}
                    onCheckedChange={toggleAutomatic}
                />
            </div>

            {!automatic && (
                <div className="grid gap-2">
                    <Label>Time zone</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between font-normal"
                            >
                                <span className="truncate">
                                    {selectedTimezone.replaceAll('_', ' ')}
                                </span>
                                <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                            <Command>
                                <CommandInput placeholder="Search time zone..." />
                                <CommandList>
                                    <CommandEmpty>No time zone found.</CommandEmpty>
                                    <CommandGroup>
                                        {timezones.map((option) => (
                                            <CommandItem
                                                key={option.value}
                                                value={`${option.value} ${option.label}`}
                                                onSelect={() => selectTimezone(option.value)}
                                            >
                                                <Check
                                                    className={cn(
                                                        'size-4',
                                                        selectedTimezone === option.value
                                                            ? 'opacity-100'
                                                            : 'opacity-0',
                                                    )}
                                                />
                                                <span className="truncate">{option.label}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            )}

            <p className="text-sm text-muted-foreground">
                Active time zone: {selectedTimezone.replaceAll('_', ' ')}
            </p>
        </div>
    );
}
