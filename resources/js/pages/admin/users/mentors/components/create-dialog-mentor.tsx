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
import { FormMentor } from '@/pages/admin/users/mentors/components/form-mentor';
import type {
    MentorLevelOption,
    SubjectOption,
} from '@/pages/admin/users/mentors/components/form-mentor';

type CreateDialogMentorProps = {
    mentorLevelOptions: MentorLevelOption[];
    onError: () => void;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    open: boolean;
    subjectOptions: SubjectOption[];
};

export function CreateDialogMentor({
    mentorLevelOptions,
    onError,
    onOpenChange,
    onSuccess,
    open,
    subjectOptions,
}: CreateDialogMentorProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="size-4" />
                    Add mentor
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add mentor</DialogTitle>
                    <DialogDescription>
                        Create a mentor account with default access.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    action="/users/mentors"
                    method="post"
                    resetOnSuccess
                    disableWhileProcessing
                    onSuccess={onSuccess}
                    onError={onError}
                    className="grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <FormMentor
                                errors={errors}
                                idPrefix="mentor"
                                mentorLevelOptions={mentorLevelOptions}
                                subjectOptions={subjectOptions}
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
                                    Save mentor
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
