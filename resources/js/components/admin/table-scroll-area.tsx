import type { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type TableScrollAreaProps = {
    children: ReactNode;
    className?: string;
    minWidth?: string;
};

export function TableScrollArea({
    children,
    className,
    minWidth,
}: TableScrollAreaProps) {
    return (
        <div
            className={cn(
                'block w-full max-w-full min-w-0 overflow-hidden rounded-2xl border',
                className,
            )}
            style={{
                contain: 'inline-size',
            }}
        >
            <ScrollArea
                className="block w-full max-w-full min-w-0"
                orientation="horizontal"
                type="always"
            >
                <div
                    className="block max-w-none [&_[data-slot=table-container]]:w-full [&_[data-slot=table-container]]:overflow-visible"
                    style={{
                        minWidth: minWidth ?? '100%',
                        width: '100%',
                    }}
                >
                    {children}
                </div>
            </ScrollArea>
        </div>
    );
}
