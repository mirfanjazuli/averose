import { Form } from '@inertiajs/react';
import type { ReactNode } from 'react';
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
import { FormZoomAccount } from '@/pages/admin/zoom-accounts/components/form-zoom-account';
import type { ZoomAccountFormAccount } from '@/pages/admin/zoom-accounts/components/form-zoom-account';

type UpdateDialogZoomAccountProps<TAccount extends ZoomAccountFormAccount> = {
    account: (TAccount & { id: number; slug: string }) | null;
    action?: string;
    onError: () => void;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    open: boolean;
    trigger?: ReactNode;
};

export function UpdateDialogZoomAccount<TAccount extends ZoomAccountFormAccount>({
    account,
    action,
    onError,
    onOpenChange,
    onSuccess,
    open,
    trigger,
}: UpdateDialogZoomAccountProps<TAccount>) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Zoom account</DialogTitle>
                    <DialogDescription>
                        Update account details or rotate credentials.
                    </DialogDescription>
                </DialogHeader>
                {account && (
                    <Form
                        key={account.id}
                        action={action ?? `/zoom-accounts/${account.slug}`}
                        method="put"
                        disableWhileProcessing
                        onSuccess={onSuccess}
                        onError={onError}
                        className="grid gap-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <FormZoomAccount
                                    account={account}
                                    errors={errors}
                                    idPrefix="edit-zoom"
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
