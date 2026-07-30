import type { ReactNode } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type StatusFilterOption = {
    label: ReactNode;
    value: string;
};

type AdminStatusFilterProps = {
    onValueChange: (value: string) => void;
    options: StatusFilterOption[];
    value: string;
    widthClassName?: string;
};

export function AdminStatusFilter({
    onValueChange,
    options,
    value,
    widthClassName = 'w-44',
}: AdminStatusFilterProps) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger
                size="sm"
                className={`h-10 min-h-10 rounded-2xl py-0 ${widthClassName}`}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="p-1.5">
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
