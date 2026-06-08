import { Form } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type ManagedUser = {
    email: string;
    name: string;
};

type UserManagementFormProps = {
    action: string;
    idPrefix: string;
    method?: 'post' | 'put';
    onError: () => void;
    onSuccess: () => void;
    resetOnSuccess?: boolean;
    submitLabel: string;
    user?: ManagedUser;
};

export function UserManagementForm({
    action,
    idPrefix,
    method = 'post',
    onError,
    onSuccess,
    resetOnSuccess = false,
    submitLabel,
    user,
}: UserManagementFormProps) {
    return (
        <Form
            action={action}
            method={method}
            resetOnSuccess={resetOnSuccess}
            disableWhileProcessing
            onSuccess={onSuccess}
            onError={onError}
            className="grid gap-4"
        >
            {({ processing, errors }) => (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
                        <Input
                            id={`${idPrefix}-name`}
                            name="name"
                            defaultValue={user?.name}
                            placeholder="Full name"
                            autoComplete="name"
                            aria-invalid={!!errors.name}
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${idPrefix}-email`}>Email</Label>
                        <Input
                            id={`${idPrefix}-email`}
                            name="email"
                            type="email"
                            defaultValue={user?.email}
                            placeholder="user@example.com"
                            autoComplete="email"
                            aria-invalid={!!errors.email}
                        />
                        <InputError message={errors.email} />
                    </div>
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
    );
}
