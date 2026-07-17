import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type AcademicFieldFormField = {
    description?: string;
    name: string;
    status?: 'active' | 'draft' | 'inactive';
};

type FormFieldProps = {
    errors: Partial<Record<string, string>>;
    field?: AcademicFieldFormField;
    idPrefix: string;
};

export function FormField({ errors, field, idPrefix }: FormFieldProps) {
    return (
        <>
            <input type="hidden" name="status" value={field?.status ?? 'active'} />
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-name`}>Name</Label>
                <Input
                    id={`${idPrefix}-name`}
                    name="name"
                    defaultValue={field?.name}
                    placeholder="Field name"
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
                    defaultValue={field?.description}
                    placeholder="Short field description"
                    className="min-h-28 resize-none rounded-2xl bg-background px-4 text-sm"
                    aria-invalid={!!errors.description}
                />
                <InputError message={errors.description} />
            </div>
        </>
    );
}
