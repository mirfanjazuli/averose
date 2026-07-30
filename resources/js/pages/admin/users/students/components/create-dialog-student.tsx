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
import { FormStudent } from '@/pages/admin/users/students/components/form-student';

type CreateDialogStudentProps = {
    onError: () => void;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    open: boolean;
};

export function CreateDialogStudent({
    onError,
    onOpenChange,
    onSuccess,
    open,
}: CreateDialogStudentProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="size-4" />
                    Add student
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add student</DialogTitle>
                    <DialogDescription>
                        Create a student account with default access.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    action="/users/students"
                    method="post"
                    resetOnSuccess
                    disableWhileProcessing
                    onSuccess={onSuccess}
                    onError={onError}
                    className="grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <FormStudent
                                errors={errors}
                                idPrefix="student"
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
                                    Save student
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
