import { useState } from 'react';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type InternalRoleOption = {
    id: string;
    label: string;
};

export type InternalFormUser = {
    email: string;
    name: string;
    roleId?: number | null;
};

type FormInternalProps = {
    errors: Partial<Record<string, string>>;
    idPrefix: string;
    roleOptions: InternalRoleOption[];
    user?: InternalFormUser;
};

export function FormInternal({
    errors,
    idPrefix,
    roleOptions,
    user,
}: FormInternalProps) {
    const [roleId, setRoleId] = useState(
        user?.roleId ? String(user.roleId) : 'super-admin',
    );

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2">
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

            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-role-id`}>Internal role</Label>
                <input
                    type="hidden"
                    name="role_id"
                    value={roleId === 'super-admin' ? '' : roleId}
                />
                <Select value={roleId} onValueChange={setRoleId}>
                    <SelectTrigger
                        id={`${idPrefix}-role-id`}
                        className="w-full"
                    >
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="super-admin">Super admin</SelectItem>
                        {roleOptions.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                                {role.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.role_id} />
            </div>
        </>
    );
}
