import { Form } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { FormField } from '@/pages/admin/academics/fields/components/form-field';

type CreateDialogFieldProps = {
    onError: () => void;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    open: boolean;
};

export function CreateDialogField({
    onError,
    onOpenChange,
    onSuccess,
    open,
}: CreateDialogFieldProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="size-4" />
                    Add field
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add field</DialogTitle>
                    <DialogDescription>
                        Create an academic field for grouping programs and
                        subjects.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    action="/academics/fields"
                    method="post"
                    resetOnSuccess
                    disableWhileProcessing
                    onSuccess={onSuccess}
                    onError={onError}
                    className="grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <FormField errors={errors} idPrefix="field" />
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
                                    Save field
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
