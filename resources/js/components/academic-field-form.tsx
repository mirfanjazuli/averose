import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export type AcademicFieldFormField = {
    description?: string;
    name: string;
    status?: 'active' | 'draft' | 'inactive';
};

type AcademicFieldFormProps = {
    field?: AcademicFieldFormField;
    idPrefix: string;
    onSubmit?: () => void;
    submitLabel: string;
};

export function AcademicFieldForm({
    field,
    idPrefix,
    onSubmit,
    submitLabel,
}: AcademicFieldFormProps) {
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
                    defaultValue={field?.name}
                    placeholder="Field name"
                    autoComplete="off"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-description`}>Description</Label>
                <Textarea
                    id={`${idPrefix}-description`}
                    name="description"
                    defaultValue={field?.description}
                    placeholder="Short field description"
                    className="min-h-28 resize-none rounded-2xl bg-background px-4 text-sm"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-status`}>Status</Label>
                <Select defaultValue={field?.status ?? 'active'}>
                    <SelectTrigger
                        id={`${idPrefix}-status`}
                        className="w-full"
                    >
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
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
