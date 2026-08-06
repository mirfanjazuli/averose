import { Clock3 } from 'lucide-react';
import { useUserTimezone } from '@/hooks/use-user-timezone';
import { formatTimezoneLabel, formatTimezoneName } from '@/lib/date-time';

export function TimezoneIndicator({
    compact = false,
    label = 'Zona waktu',
}: {
    compact?: boolean;
    label?: string;
}) {
    const timezone = useUserTimezone();
    const timezoneName = formatTimezoneName(new Date(), timezone);

    return (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />
            {compact
                ? timezoneName
                : `${label}: ${formatTimezoneLabel(timezone)}`}
        </p>
    );
}
