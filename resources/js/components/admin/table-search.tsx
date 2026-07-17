import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

type TableSearchProps = {
    onChange: (value: string) => void;
    placeholder: string;
    value: string;
};

export function TableSearch({
    onChange,
    placeholder,
    value,
}: TableSearchProps) {
    return (
        <div className="flex h-10 min-w-64 items-center gap-2 rounded-2xl border bg-background px-3 text-sm text-muted-foreground">
            <Search className="size-4" />
            <Input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
            />
        </div>
    );
}
