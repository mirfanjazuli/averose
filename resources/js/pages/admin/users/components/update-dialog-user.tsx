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
import { FormUser } from '@/pages/admin/users/components/form-user';
import type { ManagedUser } from '@/pages/admin/users/components/form-user';

type UpdateDialogUserProps<TUser extends ManagedUser> = {
    description: string;
    idPrefix: string;
    onError: () => void;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    open: boolean;
    roleOptions?: {
        id: string;
        label: string;
    }[];
    title: string;
    user: (TUser & { id: number; slug: string }) | null;
};

export function UpdateDialogUser<TUser extends ManagedUser>({
    description,
    idPrefix,
    onError,
    onOpenChange,
    onSuccess,
    open,
    roleOptions,
    title,
    user,
}: UpdateDialogUserProps<TUser>) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
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
                                <FormUser
                                    errors={errors}
                                    idPrefix={idPrefix}
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
