import { Form } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type AcademicFieldFormField = {
    description?: string;
    name: string;
    status?: 'active' | 'draft' | 'inactive';
};

type AcademicFieldFormProps = {
    action: string;
    field?: AcademicFieldFormField;
    idPrefix: string;
    method?: 'post' | 'put';
    onError: () => void;
    onSuccess: () => void;
    resetOnSuccess?: boolean;
    submitLabel: string;
};

export function AcademicFieldForm({
    action,
    field,
    idPrefix,
    method = 'post',
    onError,
    onSuccess,
    resetOnSuccess = false,
    submitLabel,
}: AcademicFieldFormProps) {
    return (
        <Form
            action={action}
            method={method}
            resetOnSuccess={resetOnSuccess}
            disableWhileProcessing
            onSuccess={onSuccess}
            onError={onError}
            className="grid gap-4"
        >
            {({ processing, errors }) => (
                <>
                    <input
                        type="hidden"
                        name="status"
                        value={field?.status ?? 'active'}
                    />
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
                        <Label htmlFor={`${idPrefix}-description`}>
                            Description
                        </Label>
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
                    <DialogFooter className="pt-2">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {submitLabel}
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}
