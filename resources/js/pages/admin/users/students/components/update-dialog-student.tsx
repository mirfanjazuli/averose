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
import { FormStudent } from '@/pages/admin/users/students/components/form-student';
import type { StudentFormUser } from '@/pages/admin/users/students/components/form-student';

type UpdateDialogStudentProps<TUser extends StudentFormUser> = {
    onError: () => void;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    open: boolean;
    user: (TUser & { id: number; slug: string }) | null;
};

export function UpdateDialogStudent<TUser extends StudentFormUser>({
    onError,
    onOpenChange,
    onSuccess,
    open,
    user,
}: UpdateDialogStudentProps<TUser>) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit student</DialogTitle>
                    <DialogDescription>
                        Update student account details.
                    </DialogDescription>
                </DialogHeader>
                {user && (
                    <Form
                        key={user.id}
                        action={`/users/${user.slug}`}
                        method="put"
                        disableWhileProcessing
                        onSuccess={onSuccess}
                        onError={onError}
                        className="grid gap-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <FormStudent
                                    errors={errors}
                                    idPrefix="edit-student"
                                    user={user}
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
