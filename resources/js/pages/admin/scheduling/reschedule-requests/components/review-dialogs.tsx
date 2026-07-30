import { Form, useForm } from '@inertiajs/react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ReviewDialogProps = {
    onOpenChange: (open: boolean) => void;
    open: boolean;
    requestId: string | null;
};

export function ApproveRescheduleDialog({
    onOpenChange,
    open,
    requestId,
}: ReviewDialogProps) {
    const approveForm = useForm({});
    const approveError = Object.values(approveForm.errors).find(
        (error): error is string => typeof error === 'string',
    );

    const approveRequest = () => {
        if (!requestId) {
            return;
        }

        approveForm.put(
            `/scheduling/reschedule-requests/${requestId}/approve`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    toast.success('Reschedule request approved.');
                },
                onError: () => toast.error('Unable to approve this request.'),
            },
        );
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Approve reschedule?</AlertDialogTitle>
                    <AlertDialogDescription>
                        The session will move to the requested schedule and the
                        student and mentor will be notified.
                    </AlertDialogDescription>
                    <InputError message={approveError} />
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        type="button"
                        disabled={approveForm.processing || !requestId}
                        onClick={(event) => {
                            event.preventDefault();
                            approveRequest();
                        }}
                    >
                        <Check className="size-4" />
                        Approve
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function RejectRescheduleDialog({
    onOpenChange,
    open,
    requestId,
}: ReviewDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <Form
                    action={
                        requestId
                            ? `/scheduling/reschedule-requests/${requestId}/reject`
                            : '#'
                    }
                    method="put"
                    disableWhileProcessing
                    resetOnSuccess
                    onSuccess={() => {
                        onOpenChange(false);
                        toast.success('Reschedule request rejected.');
                    }}
                    onError={() =>
                        toast.error('Unable to reject this request.')
                    }
                >
                    {({ errors, processing }) => (
                        <div className="grid gap-6">
                            <DialogHeader>
                                <DialogTitle>Reject reschedule</DialogTitle>
                                <DialogDescription>
                                    Give the student a clear reason why the
                                    requested schedule cannot be approved.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-2">
                                <Label htmlFor="reschedule-rejection-reason">
                                    Reason
                                </Label>
                                <Textarea
                                    id="reschedule-rejection-reason"
                                    name="admin_note"
                                    required
                                    maxLength={1000}
                                    placeholder="Explain why this request was rejected..."
                                    aria-invalid={!!errors.admin_note}
                                />
                                <InputError message={errors.admin_note} />
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={processing || !requestId}
                                >
                                    <X className="size-4" />
                                    Reject
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
