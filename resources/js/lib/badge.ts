import type { ComponentProps } from 'react';
import type { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type BadgeTone =
    | 'danger'
    | 'default'
    | 'muted'
    | 'outline'
    | 'primary'
    | 'success'
    | 'warning';

const badgeToneVariant: Record<
    BadgeTone,
    ComponentProps<typeof Badge>['variant']
> = {
    danger: 'destructive',
    default: 'default',
    muted: 'secondary',
    outline: 'outline',
    primary: 'default',
    success: 'default',
    warning: 'outline',
};

const badgeToneClassName: Record<BadgeTone, string> = {
    danger: '',
    default: '',
    muted: '',
    outline: '',
    primary:
        'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300',
    success:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
    warning:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
};

export function formatBadgeLabel(value: string | number) {
    if (typeof value === 'number') {
        return value;
    }

    return value
        .replace(/[_-]+/g, ' ')
        .trim()
        .split(/\s+/)
        .map((word) => {
            const normalizedWord = word.toLowerCase();

            return (
                normalizedWord.charAt(0).toUpperCase() + normalizedWord.slice(1)
            );
        })
        .join(' ');
}

export function getBadgeProps(tone: BadgeTone = 'default', className?: string) {
    return {
        className: cn(badgeToneClassName[tone], className),
        variant: badgeToneVariant[tone],
    };
}

export function getStatusBadgeTone(status: string): BadgeTone {
    const normalizedStatus = status.toLowerCase().replace(/[_-]+/g, ' ');

    if (
        ['active', 'approved', 'completed', 'public', 'ready'].includes(
            normalizedStatus,
        )
    ) {
        return 'success';
    }

    if (normalizedStatus === 'assigned') {
        return 'primary';
    }

    if (['private', 'rescheduled', 'warning'].includes(normalizedStatus)) {
        return 'warning';
    }

    if (
        [
            'canceled',
            'cancelled',
            'expired',
            'exhausted',
            'failed',
            'full',
            'rejected',
        ].includes(normalizedStatus)
    ) {
        return 'danger';
    }

    if (['draft', 'inactive', 'postponed', 'waiting'].includes(normalizedStatus)) {
        return 'muted';
    }

    return 'outline';
}
