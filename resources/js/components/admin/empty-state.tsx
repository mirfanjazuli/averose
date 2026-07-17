import type { ReactNode } from 'react';

type EmptyStateProps = {
    children: ReactNode;
};

export function EmptyState({ children }: EmptyStateProps) {
    return (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {children}
        </div>
    );
}
