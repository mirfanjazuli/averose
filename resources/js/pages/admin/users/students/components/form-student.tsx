import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type StudentFormUser = {
    email: string;
    name: string;
};

type FormStudentProps = {
    errors: Partial<Record<string, string>>;
    idPrefix: string;
    user?: StudentFormUser;
};

export function FormStudent({ errors, idPrefix, user }: FormStudentProps) {
    return (
        <div className="grid gap-4">
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
        </div>
    );
}
