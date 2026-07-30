import * as React from 'react';
import { cn } from '@/lib/utils';

function Empty({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="empty"
            className={cn(
                'flex min-h-40 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-6 text-center',
                className,
            )}
            {...props}
        />
    );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="empty-header"
            className={cn(
                'flex flex-col items-center gap-1.5 text-center',
                className,
            )}
            {...props}
        />
    );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="empty-title"
            className={cn('text-sm font-medium', className)}
            {...props}
        />
    );
}

function EmptyDescription({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="empty-description"
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    );
}

function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="empty-content"
            className={cn('flex items-center justify-center gap-2', className)}
            {...props}
        />
    );
}

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle };
