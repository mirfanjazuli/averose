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
import { FormSubject } from '@/pages/admin/academics/subjects/components/form-subject';
import type { AcademicSubjectFormSubject } from '@/pages/admin/academics/subjects/components/form-subject';

type UpdateDialogSubjectProps<TSubject extends AcademicSubjectFormSubject> = {
    onError: () => void;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    open: boolean;
    subject: (TSubject & { id: number; slug: string }) | null;
};

export function UpdateDialogSubject<TSubject extends AcademicSubjectFormSubject>({
    onError,
    onOpenChange,
    onSuccess,
    open,
    subject,
}: UpdateDialogSubjectProps<TSubject>) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit subject</DialogTitle>
                    <DialogDescription>Update this subject module.</DialogDescription>
                </DialogHeader>
                {subject && (
                    <Form
                        key={subject.id}
                        action={`/academics/subjects/${subject.slug}`}
                        method="put"
                        disableWhileProcessing
                        onSuccess={onSuccess}
                        onError={onError}
                        className="grid gap-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <FormSubject
                                    errors={errors}
                                    idPrefix="edit-subject"
                                    subject={subject}
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
