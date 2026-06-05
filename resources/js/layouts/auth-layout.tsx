import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import LoginLayoutTemplate from '@/layouts/auth/login-layout';

export default function AuthLayout({
    title = '',
    description = '',
    variant = 'simple',
    children,
}: {
    title?: string;
    description?: string;
    variant?: 'simple' | 'login';
    children: React.ReactNode;
}) {
    if (variant === 'login') {
        return <LoginLayoutTemplate>{children}</LoginLayoutTemplate>;
    }

    return (
        <AuthLayoutTemplate title={title} description={description}>
            {children}
        </AuthLayoutTemplate>
    );
}
