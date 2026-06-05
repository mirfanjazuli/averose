import { Form } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type ZoomAccountFormAccount = {
    name: string;
    accountId: string;
    clientId: string;
    clientSecret?: string;
    tokenSecret?: string;
};

type ZoomAccountFormProps = {
    account?: ZoomAccountFormAccount;
    action: string;
    cancelLabel?: string;
    idPrefix: string;
    method: 'post' | 'put';
    onError: () => void;
    onSuccess: () => void;
    resetOnSuccess?: boolean;
    submitLabel: string;
};

export function ZoomAccountForm({
    account,
    action,
    cancelLabel = 'Cancel',
    idPrefix,
    method,
    onError,
    onSuccess,
    resetOnSuccess = false,
    submitLabel,
}: ZoomAccountFormProps) {
    const clientSecretPlaceholder = account?.clientSecret
        ? undefined
        : account
          ? 'Leave blank to keep current secret'
          : 'Zoom client secret';
    const tokenSecretPlaceholder = account?.tokenSecret
        ? undefined
        : account
          ? 'Leave blank to keep current secret'
          : 'Zoom token secret';

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
                            defaultValue={account?.name}
                            placeholder="AveRose Main Room"
                            autoComplete="off"
                            aria-invalid={!!errors.name}
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${idPrefix}-account-id`}>
                            Account ID
                        </Label>
                        <Input
                            id={`${idPrefix}-account-id`}
                            name="account_id"
                            defaultValue={account?.accountId}
                            placeholder="Zoom account ID"
                            autoComplete="off"
                            aria-invalid={!!errors.account_id}
                        />
                        <InputError message={errors.account_id} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${idPrefix}-client-id`}>
                            Client ID
                        </Label>
                        <Input
                            id={`${idPrefix}-client-id`}
                            name="client_id"
                            defaultValue={account?.clientId}
                            placeholder="Zoom client ID"
                            autoComplete="off"
                            aria-invalid={!!errors.client_id}
                        />
                        <InputError message={errors.client_id} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${idPrefix}-client-secret`}>
                            Client Secret
                        </Label>
                        <PasswordInput
                            id={`${idPrefix}-client-secret`}
                            name="client_secret"
                            defaultValue={account?.clientSecret}
                            placeholder={clientSecretPlaceholder}
                            autoComplete="new-password"
                            aria-invalid={!!errors.client_secret}
                        />
                        <InputError message={errors.client_secret} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${idPrefix}-token-secret`}>
                            Token Secret
                        </Label>
                        <PasswordInput
                            id={`${idPrefix}-token-secret`}
                            name="token_secret"
                            defaultValue={account?.tokenSecret}
                            placeholder={tokenSecretPlaceholder}
                            autoComplete="new-password"
                            aria-invalid={!!errors.token_secret}
                        />
                        <InputError message={errors.token_secret} />
                    </div>
                    <DialogFooter className="pt-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                {cancelLabel}
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
