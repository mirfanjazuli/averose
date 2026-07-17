import { Form } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/pages/admin/academics/fields/components/form-field';
import type { AcademicFieldFormField } from '@/pages/admin/academics/fields/components/form-field';

type UpdateDialogFieldProps<TField extends AcademicFieldFormField> = {
    field: (TField & { id: number; slug: string }) | null;
    onError: () => void;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    open: boolean;
};

export function UpdateDialogField<TField extends AcademicFieldFormField>({
    field,
    onError,
    onOpenChange,
    onSuccess,
    open,
}: UpdateDialogFieldProps<TField>) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit field</DialogTitle>
                    <DialogDescription>
                        Update this academic field.
                    </DialogDescription>
                </DialogHeader>
                {field && (
                    <Form
                        key={field.id}
                        action={`/academics/fields/${field.slug}`}
                        method="put"
                        disableWhileProcessing
                        onSuccess={onSuccess}
                        onError={onError}
                        className="grid gap-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <FormField
                                    errors={errors}
                                    field={field}
                                    idPrefix="edit-field"
                                />
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
                                        Save changes
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
