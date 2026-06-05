import { Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';

export default function LoginLayout({ children }: PropsWithChildren) {
    const { name } = usePage().props;

    return (
        <main className="min-h-svh bg-background text-foreground">
            <div className="grid min-h-svh overflow-hidden bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,0.98fr)]">
                <section className="flex min-h-svh flex-col bg-background px-6 py-10 sm:px-10 lg:px-16 xl:px-24">
                    <Link
                        href={home()}
                        className="flex w-fit items-center gap-3 text-lg font-medium"
                    >
                        <AppLogoIcon className="size-9 fill-current text-foreground" />
                        <span>{name}</span>
                    </Link>

                    <div className="flex flex-1 items-center justify-center py-12">
                        <div className="w-full max-w-[360px]">{children}</div>
                    </div>
                </section>

                <section className="relative hidden min-h-full overflow-hidden bg-muted lg:block">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_38%,var(--background),transparent_34%),linear-gradient(135deg,var(--muted),color-mix(in_oklch,var(--primary),var(--background)_70%))]" />
                    <div className="absolute inset-y-0 left-0 w-px bg-border" />

                    <div className="absolute top-[16%] right-[15%] h-24 w-1 rounded-full bg-background/35 blur-[1px]" />
                    <div className="absolute right-[23%] bottom-[8%] h-28 w-1 rounded-full bg-background/35 blur-[1px]" />
                    <div className="absolute bottom-[20%] left-[20%] h-20 w-1 rounded-full bg-background/30 blur-[1px]" />

                    <div className="absolute top-1/2 left-1/2 h-64 w-72 -translate-x-1/2 -translate-y-1/2">
                        <div className="absolute inset-x-10 bottom-2 h-12 rounded-full bg-primary/20 blur-2xl" />
                        <div className="absolute inset-0 [transform:perspective(900px)_rotateY(-18deg)_rotateX(8deg)] rounded-[2.25rem] bg-primary shadow-2xl shadow-primary/25">
                            <div className="absolute inset-y-0 right-0 w-16 rounded-r-[2.25rem] bg-primary-foreground/20" />
                            <div className="absolute inset-5 rounded-[1.65rem] bg-foreground/25 shadow-inner ring-1 ring-primary-foreground/25" />
                            <div className="absolute top-1/2 left-[34%] size-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground/80 shadow-lg ring-[10px] ring-foreground/20">
                                <div className="absolute inset-5 rounded-full border-[6px] border-foreground/40" />
                                <div className="absolute top-4 left-1/2 size-3 -translate-x-1/2 rounded-full bg-foreground/45" />
                                <div className="absolute top-1/2 right-4 size-3 -translate-y-1/2 rounded-full bg-foreground/45" />
                                <div className="absolute bottom-4 left-1/2 size-3 -translate-x-1/2 rounded-full bg-foreground/45" />
                                <div className="absolute top-1/2 left-4 size-3 -translate-y-1/2 rounded-full bg-foreground/45" />
                            </div>
                            <div className="absolute top-1/2 left-[58%] h-1.5 w-24 -translate-y-1/2 rounded-full bg-primary-foreground shadow-md" />
                            <div className="absolute top-[43%] left-[59%] h-16 w-1.5 origin-bottom rotate-[28deg] rounded-full bg-primary-foreground shadow-md" />
                            <div className="absolute top-[51%] left-[59%] h-16 w-1.5 origin-top -rotate-[34deg] rounded-full bg-primary-foreground shadow-md" />
                            <div className="absolute top-1/2 left-[58%] size-7 -translate-y-1/2 rounded-full bg-primary-foreground ring-4 ring-foreground/30" />
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
