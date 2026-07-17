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
import { FormUser } from '@/pages/admin/users/components/form-user';

type CreateDialogUserProps = {
    action: string;
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
    submitLabel: string;
    title: string;
    triggerLabel: string;
};

export function CreateDialogUser({
    action,
    description,
    idPrefix,
    onError,
    onOpenChange,
    onSuccess,
    open,
    roleOptions,
    submitLabel,
    title,
    triggerLabel,
}: CreateDialogUserProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="size-4" />
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <Form
                    action={action}
                    method="post"
                    resetOnSuccess
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
                                    {submitLabel}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
