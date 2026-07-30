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
import { FormMentor } from '@/pages/admin/users/mentors/components/form-mentor';
import type {
    MentorFormUser,
    MentorLevelOption,
    SubjectOption,
} from '@/pages/admin/users/mentors/components/form-mentor';

type UpdateDialogMentorProps<TUser extends MentorFormUser> = {
    mentorLevelOptions: MentorLevelOption[];
    onError: () => void;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    open: boolean;
    subjectOptions: SubjectOption[];
    user: (TUser & { id: number; slug: string }) | null;
};

export function UpdateDialogMentor<TUser extends MentorFormUser>({
    mentorLevelOptions,
    onError,
    onOpenChange,
    onSuccess,
    open,
    subjectOptions,
    user,
}: UpdateDialogMentorProps<TUser>) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit mentor</DialogTitle>
                    <DialogDescription>
                        Update mentor account details.
                    </DialogDescription>
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
                                <FormMentor
                                    errors={errors}
                                    idPrefix="edit-mentor"
                                    mentorLevelOptions={mentorLevelOptions}
                                    subjectOptions={subjectOptions}
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
