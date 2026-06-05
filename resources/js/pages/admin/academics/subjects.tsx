import { Head } from '@inertiajs/react';
import { Check, ChevronsUpDown, Clock3, LibraryBig, Plus } from 'lucide-react';
import { DynamicIcon, iconNames } from 'lucide-react/dynamic';
import type { IconName } from 'lucide-react/dynamic';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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

const subjects = [
    {
        name: 'React Fundamentals',
        program: 'Frontend Engineering',
        duration: '6 sessions',
        status: 'Active',
    },
    {
        name: 'Database Design',
        program: 'Laravel Backend',
        duration: '5 sessions',
        status: 'Active',
    },
    {
        name: 'Design Systems',
        program: 'Product Design',
        duration: '4 sessions',
        status: 'Draft',
    },
];

export default function Subjects() {
    const [iconPickerOpen, setIconPickerOpen] = useState(false);
    const [selectedIcon, setSelectedIcon] =
        useState<IconName>('book-open-check');
    const selectedIconOption = useMemo(
        () =>
            iconOptions.find((iconOption) => iconOption.value === selectedIcon),
        [selectedIcon],
    );

    return (
        <>
            <Head title="Subjects" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Subjects
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage subject modules inside each learning program.
                        </p>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add subject
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add subject</DialogTitle>
                                <DialogDescription>
                                    Create a subject module and assign its
                                    display icon.
                                </DialogDescription>
                            </DialogHeader>
                            <form
                                className="grid gap-4"
                                onSubmit={(event) => event.preventDefault()}
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="subject-name">Name</Label>
                                    <Input
                                        id="subject-name"
                                        name="name"
                                        placeholder="Subject name"
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="subject-description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="subject-description"
                                        name="description"
                                        placeholder="Short subject description"
                                        className="min-h-28 resize-none rounded-2xl bg-background px-4 text-sm"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="subject-icon">Icons</Label>
                                    <input
                                        type="hidden"
                                        name="icon"
                                        value={selectedIcon}
                                    />
                                    <Popover
                                        open={iconPickerOpen}
                                        onOpenChange={setIconPickerOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="subject-icon"
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
                                                        {
                                                            selectedIconOption?.label
                                                        }
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
                                                    <CommandEmpty>
                                                        No icon found.
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {iconOptions.map(
                                                            (item) => (
                                                                <CommandItem
                                                                    key={
                                                                        item.value
                                                                    }
                                                                    value={`${item.label} ${item.value}`}
                                                                    onSelect={() => {
                                                                        setSelectedIcon(
                                                                            item.value,
                                                                        );
                                                                        setIconPickerOpen(
                                                                            false,
                                                                        );
                                                                    }}
                                                                >
                                                                    <span className="truncate">
                                                                        {
                                                                            item.label
                                                                        }
                                                                    </span>
                                                                    <Check
                                                                        className={cn(
                                                                            'ml-auto size-4',
                                                                            selectedIcon ===
                                                                                item.value
                                                                                ? 'opacity-100'
                                                                                : 'opacity-0',
                                                                        )}
                                                                    />
                                                                </CommandItem>
                                                            ),
                                                        )}
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
                                    <Button type="submit">Save subject</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <LibraryBig className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total subjects
                                </p>
                                <p className="text-2xl font-semibold">
                                    {subjects.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Clock3 className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Active sessions
                                </p>
                                <p className="text-2xl font-semibold">15</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Subject list</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {subjects.map((subject) => (
                            <div
                                key={subject.name}
                                className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_12rem_8rem_auto]"
                            >
                                <h2 className="font-semibold">
                                    {subject.name}
                                </h2>
                                <Badge variant="outline">
                                    {subject.program}
                                </Badge>
                                <p className="text-sm text-muted-foreground">
                                    {subject.duration}
                                </p>
                                <Badge
                                    variant={
                                        subject.status === 'Active'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {subject.status}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Subjects.layout = {
    breadcrumbs: [
        {
            title: 'Subjects',
            href: '/subjects',
        },
    ],
};
