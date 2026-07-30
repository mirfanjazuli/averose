import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type MentorLevelOption = {
    hourlyRate: string;
    id: string;
    label: string;
};

export type SubjectOption = {
    id: string;
    label: string;
};

export type MentorFormUser = {
    email: string;
    expertise?: string[];
    mentorLevel?: {
        hourlyRate: string;
        id: number;
        name: string;
        status: string;
    } | null;
    mentorLevelId?: number | null;
    name: string;
};

type FormMentorProps = {
    errors: Partial<Record<string, string>>;
    idPrefix: string;
    mentorLevelOptions: MentorLevelOption[];
    subjectOptions: SubjectOption[];
    user?: MentorFormUser;
};

export function FormMentor({
    errors,
    idPrefix,
    mentorLevelOptions,
    subjectOptions,
    user,
}: FormMentorProps) {
    const [mentorLevelId, setMentorLevelId] = useState(
        user?.mentorLevelId ? String(user.mentorLevelId) : '',
    );
    const [expertiseOpen, setExpertiseOpen] = useState(false);
    const [selectedExpertise, setSelectedExpertise] = useState<string[]>(
        user?.expertise ?? [],
    );
    const selectableMentorLevelOptions =
        user?.mentorLevel &&
        !mentorLevelOptions.some(
            (level) => level.id === String(user.mentorLevel?.id),
        )
            ? [
                  ...mentorLevelOptions,
                  {
                      hourlyRate: user.mentorLevel.hourlyRate,
                      id: String(user.mentorLevel.id),
                      label: `${user.mentorLevel.name} (Inactive)`,
                  },
              ]
            : mentorLevelOptions;
    const selectedSubjects = subjectOptions.filter((subject) =>
        selectedExpertise.includes(subject.id),
    );
    const toggleExpertise = (subjectId: string) => {
        setSelectedExpertise((current) =>
            current.includes(subjectId)
                ? current.filter((id) => id !== subjectId)
                : [...current, subjectId],
        );
    };

    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-name`}>Name</Label>
                <Input
                    id={`${idPrefix}-name`}
                    name="name"
                    defaultValue={user?.name}
                    placeholder="Full name"
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                />
                <InputError message={errors.name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-email`}>Email</Label>
                <Input
                    id={`${idPrefix}-email`}
                    name="email"
                    type="email"
                    defaultValue={user?.email}
                    placeholder="user@example.com"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                />
                <InputError message={errors.email} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-mentor-level-id`}>
                    Mentor level
                </Label>
                <input
                    type="hidden"
                    name="mentor_level_id"
                    value={mentorLevelId}
                />
                <Select
                    value={mentorLevelId || undefined}
                    onValueChange={setMentorLevelId}
                >
                    <SelectTrigger
                        id={`${idPrefix}-mentor-level-id`}
                        className="w-full"
                    >
                        <SelectValue placeholder="Select mentor level" />
                    </SelectTrigger>
                    <SelectContent>
                        {selectableMentorLevelOptions.map((level) => (
                            <SelectItem key={level.id} value={level.id}>
                                {level.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.mentor_level_id} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-expertise`}>Expertise</Label>
                {selectedExpertise.length === 0 ? (
                    <input type="hidden" name="expertise[]" value="" />
                ) : (
                    selectedExpertise.map((subjectId) => (
                        <input
                            key={subjectId}
                            type="hidden"
                            name="expertise[]"
                            value={subjectId}
                        />
                    ))
                )}
                <Popover open={expertiseOpen} onOpenChange={setExpertiseOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            id={`${idPrefix}-expertise`}
                            type="button"
                            variant="outline"
                            className="h-14 w-full justify-between gap-3 px-4"
                        >
                            <div className="min-w-0 flex-1 truncate text-left">
                                {selectedSubjects.length === 0 ? (
                                    <span className="text-muted-foreground">
                                        Select expertise
                                    </span>
                                ) : selectedSubjects.length === 1 ? (
                                    selectedSubjects[0].label
                                ) : (
                                    `${selectedSubjects.length} subjects selected`
                                )}
                            </div>
                            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        align="start"
                        className="w-(--radix-popover-trigger-width) p-0"
                    >
                        <Command>
                            <CommandInput placeholder="Search subjects..." />
                            <CommandList>
                                <CommandEmpty>No subjects found.</CommandEmpty>
                                <CommandGroup>
                                    {subjectOptions.map((subject) => {
                                        const selected =
                                            selectedExpertise.includes(
                                                subject.id,
                                            );

                                        return (
                                            <CommandItem
                                                key={subject.id}
                                                value={subject.label}
                                                onSelect={() =>
                                                    toggleExpertise(subject.id)
                                                }
                                            >
                                                <Check
                                                    className={cn(
                                                        'size-4',
                                                        selected
                                                            ? 'opacity-100'
                                                            : 'opacity-0',
                                                    )}
                                                />
                                                {subject.label}
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                {selectedSubjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {selectedSubjects.map((subject) => (
                            <Badge
                                key={subject.id}
                                variant="secondary"
                                className="gap-1 rounded-lg"
                                onClick={() => toggleExpertise(subject.id)}
                            >
                                {subject.label}
                                <X className="size-3" />
                            </Badge>
                        ))}
                    </div>
                ) : null}
                <InputError message={errors.expertise} />
            </div>
        </>
    );
}
