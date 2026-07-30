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
import { FormInternal } from '@/pages/admin/users/internal/components/form-internal';
import type {
    InternalFormUser,
    InternalRoleOption,
} from '@/pages/admin/users/internal/components/form-internal';

type UpdateDialogInternalProps<TUser extends InternalFormUser> = {
    onError: () => void;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    open: boolean;
    roleOptions: InternalRoleOption[];
    user: (TUser & { id: number; slug: string }) | null;
};

export function UpdateDialogInternal<TUser extends InternalFormUser>({
    onError,
    onOpenChange,
    onSuccess,
    open,
    roleOptions,
    user,
}: UpdateDialogInternalProps<TUser>) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit internal user</DialogTitle>
                    <DialogDescription>
                        Update internal user details and role.
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
                                <FormInternal
                                    errors={errors}
                                    idPrefix="edit-internal"
                                    roleOptions={roleOptions}
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
