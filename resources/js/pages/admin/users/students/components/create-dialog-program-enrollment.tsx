import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ProgramEnrollmentForm } from '@/pages/admin/users/students/components/program-enrollment-form';
import type { ProgramEnrollmentOption } from '@/pages/admin/users/students/components/program-enrollment-form';

export function CreateDialogProgramEnrollment({
    onOpenChange,
    open,
    programOptions,
    studentSlug,
}: {
    onOpenChange: (open: boolean) => void;
    open: boolean;
    programOptions: ProgramEnrollmentOption[];
    studentSlug: string;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add program enrollment</DialogTitle>
                    <DialogDescription>
                        Assign a program enrollment to this student.
                    </DialogDescription>
                </DialogHeader>
                <ProgramEnrollmentForm
                    studentSlug={studentSlug}
                    programOptions={programOptions}
                    onSuccess={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
