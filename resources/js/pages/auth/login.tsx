import { Form, Head } from '@inertiajs/react';
import { CheckCircle2, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { store as loginStore } from '@/routes/login';
import { request } from '@/routes/password';
import { store as registerStore } from '@/routes/register';

type Props = {
    status?: string;
    canResetPassword: boolean;
    passwordRules?: string;
};

type AuthMode = 'login' | 'signup';

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function EmailStatusIcon({
    email,
    hasError,
}: {
    email: string;
    hasError: boolean;
}) {
    const [checkedEmail, setCheckedEmail] = useState('');
    const isEmailValid = isValidEmail(email);
    const isChecking = isEmailValid && !hasError && checkedEmail !== email;

    useEffect(() => {
        if (!isEmailValid || hasError) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setCheckedEmail(email);
        }, 500);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [email, hasError, isEmailValid]);

    if (!isEmailValid || hasError) {
        return null;
    }

    return (
        <span className="pointer-events-none absolute top-1/2 right-4 flex size-5 -translate-y-1/2 items-center justify-center">
            {isChecking ? (
                <Spinner className="size-4 animate-in text-muted-foreground duration-200 fade-in-0 zoom-in-95" />
            ) : (
                <CheckCircle2 className="size-5 animate-in text-primary duration-300 fade-in-0 zoom-in-90" />
            )}
        </span>
    );
}

export default function Login({
    status,
    canResetPassword,
    passwordRules,
}: Props) {
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const isLogin = authMode === 'login';

    return (
        <>
            <Head title={isLogin ? 'Log in' : 'Register'} />

            <div className="space-y-8 transition-all duration-300 ease-out">
                <div
                    key={`heading-${authMode}`}
                    className="animate-in space-y-2 text-center duration-300 fade-in-0 slide-in-from-bottom-1"
                >
                    <h1 className="font-heading text-3xl font-medium">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {isLogin
                            ? 'Welcome Back, Please enter Your details'
                            : 'Enter your details to get started'}
                    </p>
                </div>

                <div className="relative grid grid-cols-2 rounded-2xl bg-muted p-1 shadow-inner">
                    <div
                        className={cn(
                            'absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-background shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                            !isLogin && 'translate-x-full',
                        )}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        className={cn(
                            'relative z-10 h-10 rounded-xl bg-transparent transition-colors duration-300 hover:bg-transparent',
                            isLogin
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                        onClick={() => setAuthMode('login')}
                    >
                        Sign In
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        className={cn(
                            'relative z-10 h-10 rounded-xl bg-transparent transition-colors duration-300 hover:bg-transparent',
                            isLogin
                                ? 'text-muted-foreground hover:text-foreground'
                                : 'text-foreground',
                        )}
                        onClick={() => setAuthMode('signup')}
                    >
                        Signup
                    </Button>
                </div>

                <div
                    key={authMode}
                    className="animate-in duration-300 fade-in-0 slide-in-from-bottom-2"
                >
                    {isLogin ? (
                        <div className="space-y-8">
                            {status && (
                                <Alert className="border-primary/20 bg-primary/10">
                                    <CheckCircle2 className="size-4 text-primary" />
                                    <AlertDescription className="text-foreground">
                                        {status}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <LoginForm canResetPassword={canResetPassword} />
                        </div>
                    ) : (
                        <SignupForm passwordRules={passwordRules} />
                    )}
                </div>

                <div className="pt-16 text-center text-xs leading-relaxed text-muted-foreground">
                    Join the millions of smart investors who trust us to manage
                    their finances. Log in to access your personalized
                    dashboard, track your portfolio performance, and make
                    informed investment decisions.
                </div>
            </div>
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
    variant: 'login',
};

function LoginForm({ canResetPassword }: { canResetPassword: boolean }) {
    const [email, setEmail] = useState('');

    return (
        <Form
            {...loginStore.form()}
            resetOnSuccess={['password']}
            className="space-y-6"
        >
            {({ processing, errors }) => (
                <>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="sr-only">
                                Email address
                            </Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="Email Address"
                                    className="pr-12 pl-11"
                                    aria-invalid={!!errors.email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                />
                                <EmailStatusIcon
                                    email={email}
                                    hasError={!!errors.email}
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="sr-only">
                                Password
                            </Label>
                            <div className="relative">
                                <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    className="pl-11"
                                    aria-invalid={!!errors.password}
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm text-muted-foreground"
                                >
                                    Remember me
                                </Label>
                            </div>

                            {canResetPassword && (
                                <TextLink
                                    href={request()}
                                    className="text-sm text-muted-foreground"
                                    tabIndex={5}
                                >
                                    Forgot?
                                </TextLink>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                        >
                            {processing && <Spinner />}
                            Continue
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

function SignupForm({ passwordRules }: { passwordRules?: string }) {
    const [email, setEmail] = useState('');

    return (
        <Form
            {...registerStore.form()}
            resetOnSuccess={['password', 'password_confirmation']}
            disableWhileProcessing
            className="space-y-6"
        >
            {({ processing, errors }) => (
                <>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="sr-only">
                                Name
                            </Label>
                            <div className="relative">
                                <UserRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full Name"
                                    className="pl-11"
                                    aria-invalid={!!errors.name}
                                />
                            </div>
                            <InputError message={errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signup-email" className="sr-only">
                                Email address
                            </Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="signup-email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="Email Address"
                                    className="pr-12 pl-11"
                                    aria-invalid={!!errors.email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                />
                                <EmailStatusIcon
                                    email={email}
                                    hasError={!!errors.email}
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="signup-password"
                                className="sr-only"
                            >
                                Password
                            </Label>
                            <div className="relative">
                                <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                                <PasswordInput
                                    id="signup-password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                    className="pl-11"
                                    aria-invalid={!!errors.password}
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="password_confirmation"
                                className="sr-only"
                            >
                                Confirm password
                            </Label>
                            <div className="relative">
                                <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm Password"
                                    passwordrules={passwordRules}
                                    className="pl-11"
                                    aria-invalid={
                                        !!errors.password_confirmation
                                    }
                                />
                            </div>
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            tabIndex={5}
                            data-test="register-user-button"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Create account
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}
