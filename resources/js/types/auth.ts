export type User = {
    id: number;
    name: string;
    nickname?: string | null;
    email: string;
    permissions: string[];
    role: 'admin' | 'student' | 'mentor';
    roleName?: string | null;
    timezone: string;
    timezoneMode: 'auto' | 'manual';
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    createdAt: string;
    lastUsedAt: string | null;
};
/* @end-chisel-passkeys */

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
