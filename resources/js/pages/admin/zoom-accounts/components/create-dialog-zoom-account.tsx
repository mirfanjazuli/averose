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
import { FormZoomAccount } from '@/pages/admin/zoom-accounts/components/form-zoom-account';

type CreateDialogZoomAccountProps = {
    onError: () => void;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    open: boolean;
};

export function CreateDialogZoomAccount({
    onError,
    onOpenChange,
    onSuccess,
    open,
}: CreateDialogZoomAccountProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="size-4" />
                    Add account
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Zoom account</DialogTitle>
                    <DialogDescription>
                        Store Zoom credentials used to create and manage meeting
                        rooms.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    action="/zoom-accounts"
                    method="post"
                    resetOnSuccess
                    disableWhileProcessing
                    onSuccess={onSuccess}
                    onError={onError}
                    className="grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <FormZoomAccount errors={errors} idPrefix="zoom" />
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
                                    Save account
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
