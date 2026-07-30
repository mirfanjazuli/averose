import { Badge } from '@/components/ui/badge';
import type { BadgeTone } from '@/lib/badge';
import {
    formatBadgeLabel,
    getBadgeProps,
    getStatusBadgeTone,
} from '@/lib/badge';

type StatusBadgeProps = {
    className?: string;
    label?: string;
    status: string;
    tone?: BadgeTone;
};

export function StatusBadge({
    className,
    label,
    status,
    tone,
}: StatusBadgeProps) {
    return (
        <Badge
            {...getBadgeProps(tone ?? getStatusBadgeTone(status), className)}
        >
            {label ?? formatBadgeLabel(status)}
        </Badge>
    );
}
