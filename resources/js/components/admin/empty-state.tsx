import type { ReactNode } from 'react';
import { Empty, EmptyDescription } from '@/components/ui/empty';

type EmptyStateProps = {
    children: ReactNode;
};

export function EmptyState({ children }: EmptyStateProps) {
    return (
        <Empty>
            <EmptyDescription>{children}</EmptyDescription>
        </Empty>
    );
}
