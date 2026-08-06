import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { TryOutAccessForm } from '@/pages/admin/users/students/components/try-out-access-form';
import type { TryOutAccessOption } from '@/pages/admin/users/students/components/try-out-access-form';

export function CreateDialogTryOutAccess({
    onOpenChange,
    open,
    studentSlug,
    tryOutOptions,
}: {
    onOpenChange: (open: boolean) => void;
    open: boolean;
    studentSlug: string;
    tryOutOptions: TryOutAccessOption[];
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add try out access</DialogTitle>
                    <DialogDescription>
                        Grant private try out access to this student.
                    </DialogDescription>
                </DialogHeader>
                <TryOutAccessForm
                    studentSlug={studentSlug}
                    tryOutOptions={tryOutOptions}
                    onSuccess={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
