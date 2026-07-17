import { ChevronsUpDown, LibraryBig } from 'lucide-react';
import { DynamicIcon, iconNames } from 'lucide-react/dynamic';
import type { IconName } from 'lucide-react/dynamic';
import { memo, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
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

type FormSubjectProps = {
    errors: Partial<Record<string, string>>;
    idPrefix: string;
    subject?: AcademicSubjectFormSubject;
};

type IconGridItemProps = {
    isSelected: boolean;
    item: (typeof iconOptions)[number];
    onSelect: (value: IconName) => void;
};

const IconGridItem = memo(function IconGridItem({
    isSelected,
    item,
    onSelect,
}: IconGridItemProps) {
    return (
        <CommandItem
            value={`${item.label} ${item.value}`}
            title={item.label}
            aria-label={item.label}
            className={cn(
                'flex size-9 items-center justify-center rounded-xl p-0',
                isSelected && 'bg-primary/10 text-primary ring-1 ring-primary/30',
            )}
            onSelect={() => onSelect(item.value)}
        >
            <DynamicIcon
                name={item.value}
                fallback={() => <LibraryBig className="size-4" />}
                className="size-4"
            />
        </CommandItem>
    );
});

export function FormSubject({ errors, idPrefix, subject }: FormSubjectProps) {
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
        <>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-name`}>Name</Label>
                <Input
                    id={`${idPrefix}-name`}
                    name="name"
                    defaultValue={subject?.name}
                    placeholder="Subject name"
                    autoComplete="off"
                    aria-invalid={!!errors.name}
                />
                <InputError message={errors.name} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-description`}>Description</Label>
                <Textarea
                    id={`${idPrefix}-description`}
                    name="description"
                    defaultValue={subject?.description}
                    placeholder="Short subject description"
                    className="min-h-28 resize-none rounded-2xl bg-background px-4 text-sm"
                    aria-invalid={!!errors.description}
                />
                <InputError message={errors.description} />
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
                            aria-invalid={!!errors.icon}
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
                            <CommandList
                                className="max-h-[min(18rem,var(--radix-popover-content-available-height))] overscroll-contain"
                                onTouchMoveCapture={(event) =>
                                    event.stopPropagation()
                                }
                                onWheelCapture={(event) =>
                                    event.stopPropagation()
                                }
                            >
                                <CommandEmpty>No icon found.</CommandEmpty>
                                <CommandGroup className="p-2 [&_[cmdk-group-items]]:grid [&_[cmdk-group-items]]:grid-cols-6 [&_[cmdk-group-items]]:gap-1">
                                    {iconOptions.map((item) => (
                                        <IconGridItem
                                            key={item.value}
                                            item={item}
                                            isSelected={
                                                selectedIcon === item.value
                                            }
                                            onSelect={(value) => {
                                                setSelectedIcon(value);
                                                setIconPickerOpen(false);
                                            }}
                                        />
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                <InputError message={errors.icon} />
            </div>
        </>
    );
}
