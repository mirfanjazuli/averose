import { Check, ChevronsUpDown, LibraryBig } from 'lucide-react';
import { DynamicIcon, iconNames } from 'lucide-react/dynamic';
import type { IconName } from 'lucide-react/dynamic';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const iconOptions = iconNames
    .map((name) => ({
        value: name,
        label: name
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' '),
    }))
    .sort((first, second) => first.label.localeCompare(second.label));

export type AcademicSubjectFormSubject = {
    description?: string;
    icon?: IconName;
    name: string;
};

type AcademicSubjectFormProps = {
    idPrefix: string;
    onSubmit?: () => void;
    subject?: AcademicSubjectFormSubject;
    submitLabel: string;
};

export function AcademicSubjectForm({
    idPrefix,
    onSubmit,
    subject,
    submitLabel,
}: AcademicSubjectFormProps) {
    const [iconPickerOpen, setIconPickerOpen] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState<IconName>(
        subject?.icon ?? 'book-open-check',
    );
    const selectedIconOption = useMemo(
        () =>
            iconOptions.find((iconOption) => iconOption.value === selectedIcon),
        [selectedIcon],
    );

    return (
        <form
            className="grid gap-4"
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit?.();
            }}
        >
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-name`}>Name</Label>
                <Input
                    id={`${idPrefix}-name`}
                    name="name"
                    defaultValue={subject?.name}
                    placeholder="Subject name"
                    autoComplete="off"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-description`}>Description</Label>
                <Textarea
                    id={`${idPrefix}-description`}
                    name="description"
                    defaultValue={subject?.description}
                    placeholder="Short subject description"
                    className="min-h-28 resize-none rounded-2xl bg-background px-4 text-sm"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-icon`}>Icons</Label>
                <input type="hidden" name="icon" value={selectedIcon} />
                <Popover
                    open={iconPickerOpen}
                    onOpenChange={setIconPickerOpen}
                >
                    <PopoverTrigger asChild>
                        <Button
                            id={`${idPrefix}-icon`}
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={iconPickerOpen}
                            className="h-14 justify-between rounded-2xl px-4 font-normal"
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                <DynamicIcon
                                    name={selectedIcon}
                                    fallback={() => (
                                        <LibraryBig className="size-4 shrink-0" />
                                    )}
                                    className="size-4 shrink-0"
                                />
                                <span className="truncate">
                                    {selectedIconOption?.label}
                                </span>
                            </span>
                            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        align="start"
                        className="w-(--radix-popover-trigger-width) p-0"
                    >
                        <Command>
                            <CommandInput placeholder="Search lucide icons..." />
                            <CommandList>
                                <CommandEmpty>No icon found.</CommandEmpty>
                                <CommandGroup>
                                    {iconOptions.map((item) => (
                                        <CommandItem
                                            key={item.value}
                                            value={`${item.label} ${item.value}`}
                                            onSelect={() => {
                                                setSelectedIcon(item.value);
                                                setIconPickerOpen(false);
                                            }}
                                        >
                                            <span className="truncate">
                                                {item.label}
                                            </span>
                                            <Check
                                                className={cn(
                                                    'ml-auto size-4',
                                                    selectedIcon === item.value
                                                        ? 'opacity-100'
                                                        : 'opacity-0',
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            <DialogFooter className="pt-2">
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                        Cancel
                    </Button>
                </DialogClose>
                <Button type="submit">{submitLabel}</Button>
            </DialogFooter>
        </form>
    );
}
