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
import { FormInternal } from '@/pages/admin/users/internal/components/form-internal';
import type { InternalRoleOption } from '@/pages/admin/users/internal/components/form-internal';

type CreateDialogInternalProps = {
    onError: () => void;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    open: boolean;
    roleOptions: InternalRoleOption[];
};

export function CreateDialogInternal({
    onError,
    onOpenChange,
    onSuccess,
    open,
    roleOptions,
}: CreateDialogInternalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="size-4" />
                    Add internal
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add internal user</DialogTitle>
                    <DialogDescription>
                        Create an internal user account.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    action="/users/internal"
                    method="post"
                    resetOnSuccess
                    disableWhileProcessing
                    onSuccess={onSuccess}
                    onError={onError}
                    className="grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <FormInternal
                                errors={errors}
                                idPrefix="internal"
                                roleOptions={roleOptions}
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
                                    Save internal user
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
